import { createFileRoute } from "@tanstack/react-router";

const SYSTEM_PROMPT = `You are a Game Master's co-pilot for tabletop RPG sessions with young players (ages 8-14). The GM will describe an unexpected player choice or situation they need help with. Respond with age-appropriate, imaginative, and safe suggestions.

You MUST respond with valid JSON in exactly this shape:
{
  "read_of_the_moment": "A short paragraph interpreting what's happening at the table and what the players seem to want.",
  "story_outcomes": [
    { "title": "Short outcome title", "description": "1-3 sentence description of what could happen in the fiction." }
  ],
  "narration": "A short piece of narration the GM can read aloud to the table.",
  "consequence": "A single consequence that matters later in the session or campaign.",
  "safety_notes": "Brief notes on tone, themes, or content sensitivity for the given age range."
}

Rules:
- Provide 2 or 3 story_outcomes.
- Keep language warm, vivid, and age-appropriate for the specified age range.
- Avoid graphic violence, romance, or scary content beyond age norms.
- Honor the setting.
- Return ONLY the JSON, no markdown fences, no prose outside JSON.`;

interface Body {
  situation?: string;
  ageRange?: string;
  setting?: string;
}

export const Route = createFileRoute("/api/generate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as Body;
        const situation = (body.situation || "").trim();
        if (!situation) {
          return new Response("Situation is required", { status: 400 });
        }
        const ageRange = body.ageRange || "9-12";
        const setting = body.setting || "Ancient Greek myth";

        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const userMsg = `Age range: ${ageRange}\nSetting: ${setting}\n\nWhat just happened / what I need help with:\n${situation}\n\nReturn JSON as specified.`;

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
        const content = data.choices?.[0]?.message?.content ?? "{}";
        let parsed: unknown;
        try {
          parsed = JSON.parse(content);
        } catch {
          return new Response("Model returned invalid JSON", { status: 502 });
        }
        return Response.json(parsed);
      },
    },
  },
});
