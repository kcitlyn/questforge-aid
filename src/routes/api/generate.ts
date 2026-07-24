import { createFileRoute } from "@tanstack/react-router";
import { SYSTEM_PROMPT } from "@/lib/gm-copilot-prompt.server";
import { reviewOutput } from "@/lib/safety-review.server";
import { rateLimit } from "@/lib/rate-limit.server";

interface Body {
  situation?: string;
  ageRange?: string;
  setting?: string;
}

export const Route = createFileRoute("/api/generate")({
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
        const situation = (body.situation || "").trim();
        if (!situation) {
          return new Response("Situation is required", { status: 400 });
        }
        // Guard against payload abuse (OWASP LLM04: Model Denial of Service).
        if (situation.length > 2000) {
          return new Response("Input too long (max 2000 chars)", { status: 400 });
        }
        // Allowlist ageRange — it's forwarded to the model and the reviewer.
        const ageRange = ["8-10", "9-12", "11-14"].includes(body.ageRange || "")
          ? (body.ageRange as string)
          : "9-12";
        const setting = (body.setting || "Ancient Greek myth").slice(0, 100);

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
          // Don't forward raw gateway errors (may leak internals).
          return new Response("Something went wrong generating suggestions. Please try again.", { status: 502 });
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
