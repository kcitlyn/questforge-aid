import { createFileRoute } from "@tanstack/react-router";

// "Callback" — resurface a consequence the GM accepted earlier in the session.
// This is what makes "a consequence that matters later" a live feature: one
// click on a Session Log entry produces a short narration that brings that
// thread back into the current scene.

const SYSTEM_PROMPT = `You help a Game Master running a live tabletop RPG for young players (ages 8-14) bring back an earlier story thread. The GM gives you a consequence they accepted earlier in the session and (optionally) the current situation. Write a SHORT resurfacing moment.

Respond ONLY as JSON in this exact shape (no markdown):
{
  "narration": "2-3 sentences the GM can read aloud that weave the earlier consequence into the present scene",
  "delivery_hint": "one short parenthetical on how to deliver it, under 12 words",
  "hook": "one sentence: where this could lead next"
}

Rules: keep it age-appropriate and bloodless, honor whatever the players chose earlier (never punish creativity), match the established setting, use no real personal names, and keep it warm and adventurous.`;

interface Body {
  entryText?: string;
  consequence?: string;
  situation?: string;
  ageRange?: string;
  setting?: string;
}

export const Route = createFileRoute("/api/callback")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as Body;
        const consequence = (body.consequence || body.entryText || "").trim();
        if (!consequence) {
          return new Response("A saved consequence is required", { status: 400 });
        }
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const userMsg = `Age range: ${body.ageRange || "9-12"}
Setting: ${body.setting || "Ancient Greek myth"}

Earlier in this session the GM accepted this outcome:
${body.entryText || "(not provided)"}

With this consequence to pay off later:
${consequence}

Current situation (may be empty):
${body.situation || "(not provided)"}

Bring the consequence back into the story now. Return JSON as specified.`;

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
