import { createFileRoute } from "@tanstack/react-router";
import { SYSTEM_PROMPT } from "@/lib/gm-copilot-prompt.server";
import { reviewOutput } from "@/lib/safety-review.server";

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
        const content = data.choices?.[0]?.message?.content ?? "";

        // Layer 2: independent safety review of the generated output, run
        // server-side so nothing unreviewed ever reaches the browser.
        const safety = await reviewOutput(content, apiKey, ageRange);

        // Return the raw content so the client can attempt parsing and gracefully
        // fall back to showing it as text if the model returned non-JSON.
        return Response.json({ raw: content, safety });
      },
    },
  },
});
