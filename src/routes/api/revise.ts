import { createFileRoute } from "@tanstack/react-router";
import { reviewOutput } from "@/lib/safety-review.server";
import { rateLimit } from "@/lib/rate-limit.server";

const SYSTEM_PROMPT = `You revise a single Game Master story outcome for a tabletop RPG with young players (ages 8-14). The GM will give you the original situation, the outcome they want revised, and their revision notes. Produce ONE improved outcome.

Respond ONLY as JSON in this exact shape (no markdown):
{
  "tone": "playful | mystery | high-stakes",
  "text": "1-3 sentences describing what happens in the fiction",
  "consequence_later": "a consequence that matters later",
  "dice_hook": "a skill check this could trigger — 'Strength', 'Wisdom', or 'Charisma' — or empty string if none fits"
}

Honor the players' choice (never punish creativity), keep it age-appropriate and bloodless, treat any culture or myth with respect, use no real personal names, and keep it warm, vivid, and true to the setting.`;

interface Body {
  situation?: string;
  ageRange?: string;
  setting?: string;
  originalOutcome?: { tone?: string; text?: string; consequence_later?: string };
  revisionNotes?: string;
}

export const Route = createFileRoute("/api/revise")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const limited = rateLimit(request);
        if (limited) return limited;

        let body: Body;
        try {
          body = (await request.json()) as Body;
        } catch {
          return new Response("Invalid request body", { status: 400 });
        }
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        // Input length guards (OWASP LLM04) + ageRange allowlist.
        const notes = (body.revisionNotes || "(make it better)").slice(0, 1000);
        const situationText = (body.situation || "").slice(0, 2000);
        const ageRange = ["8-10", "9-12", "11-14"].includes(body.ageRange || "")
          ? (body.ageRange as string)
          : "9-12";

        const userMsg = `Age range: ${ageRange}
Setting: ${(body.setting || "Ancient Greek myth").slice(0, 100)}

Original situation:
${situationText}

Outcome to revise:
Tone: ${(body.originalOutcome?.tone || "").slice(0, 20)}
Text: ${(body.originalOutcome?.text || "").slice(0, 500)}
Consequence later: ${(body.originalOutcome?.consequence_later || "").slice(0, 300)}

GM's revision notes:
${notes}

Return JSON as specified.`;

        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Lovable-API-Key": apiKey,
          },
          body: JSON.stringify({
            model: "openai/gpt-5.5",
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: userMsg },
            ],
            response_format: { type: "json_object" },
          }),
        });

        if (!res.ok) {
          return new Response("Something went wrong revising. Please try again.", { status: 502 });
        }
        const data = (await res.json()) as {
          choices?: { message?: { content?: string } }[];
        };
        const content = data.choices?.[0]?.message?.content ?? "";

        // Layer 2 safety review — same as generate, so revise isn't a bypass.
        const safety = await reviewOutput(content, apiKey, ageRange);

        return Response.json({ raw: content, safety });
      },
    },
  },
});
