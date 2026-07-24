import { createFileRoute } from "@tanstack/react-router";
import { SYSTEM_PROMPT } from "@/lib/gm-copilot-prompt.server";
import { reviewOutput } from "@/lib/safety-review.server";
import { rateLimit } from "@/lib/rate-limit.server";
import { sanitizeInput, validateSuggestions } from "@/lib/validate.server";

interface Body {
  situation?: string;
  ageRange?: string;
  setting?: string;
  direction?: string;
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
        // Guard against payload abuse (OWASP LLM04) and hidden-character
        // injection: strip control/zero-width chars, cap length.
        if ((body.situation || "").length > 2000) {
          return new Response("Input too long (max 2000 chars)", { status: 400 });
        }
        const situation = sanitizeInput(body.situation || "", 2000);
        if (!situation) {
          return new Response("Situation is required", { status: 400 });
        }
        // Allowlist ageRange — it's forwarded to the model and the reviewer.
        const ageRange = ["8-10", "9-12", "11-14"].includes(body.ageRange || "")
          ? (body.ageRange as string)
          : "9-12";
        const setting = sanitizeInput(body.setting || "Ancient Greek myth", 100) || "Ancient Greek myth";
        // Optional free-text steer ("make it sillier", "bring back the aunt").
        // Sanitized + capped like any other input; the system prompt treats it
        // as story material and the Layer-2 review still vets the result, so it
        // can't be used to steer past the age/safety guardrails.
        const direction = sanitizeInput(body.direction || "", 300);

        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const directionLine = direction
          ? `\n\nGM's requested direction/vibe for these suggestions: ${direction}`
          : "";
        const userMsg = `Age range: ${ageRange}\nSetting: ${setting}\n\nWhat just happened / what I need help with:\n${situation}${directionLine}\n\nReturn JSON as specified.`;

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

        // Schema-validate the model's output SERVER-SIDE: unknown fields are
        // dropped, lengths capped, enums coerced (OWASP LLM02). The client
        // only ever receives a vetted shape or a plain-text fallback.
        const validated = validateSuggestions(content);

        // Layer 2: independent safety review of the generated output, run
        // server-side so nothing unreviewed ever reaches the browser.
        const safety = await reviewOutput(content, apiKey, ageRange);

        return Response.json({
          raw: validated ? JSON.stringify(validated) : content,
          safety,
        });
      },
    },
  },
});
