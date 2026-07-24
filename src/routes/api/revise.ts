import { createFileRoute } from "@tanstack/react-router";

const SYSTEM_PROMPT = `You revise a single Game Master story outcome for a tabletop RPG with young players (ages 8-14). The GM will give you the original situation, the outcome they want revised, and their revision notes. Produce ONE improved outcome.

Respond ONLY as JSON in this exact shape (no markdown):
{
  "tone": "playful | intrigue | high-stakes",
  "text": "1-3 sentences describing what happens in the fiction",
  "consequence_later": "a consequence that matters later"
}

Keep it age-appropriate, warm, vivid, and true to the setting.`;

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
        const body = (await request.json()) as Body;
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const userMsg = `Age range: ${body.ageRange || "9-12"}
Setting: ${body.setting || "Ancient Greek myth"}

Original situation:
${body.situation || ""}

Outcome to revise:
Tone: ${body.originalOutcome?.tone || ""}
Text: ${body.originalOutcome?.text || ""}
Consequence later: ${body.originalOutcome?.consequence_later || ""}

GM's revision notes:
${body.revisionNotes || "(make it better)"}

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
          const text = await res.text();
          return new Response(text || "AI gateway error", { status: res.status });
        }
        const data = (await res.json()) as {
          choices?: { message?: { content?: string } }[];
        };
        const content = data.choices?.[0]?.message?.content ?? "";
        return Response.json({ raw: content });
      },
    },
  },
});
