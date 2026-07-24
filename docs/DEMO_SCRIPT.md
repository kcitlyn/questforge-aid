# Loom Demo — Teleprompter Script (~2 min)

**Optional, but high-leverage.** Not one of the 7 required deliverables — it's an
extra that makes your safety architecture *visible* and signals you know AI
systems. Do it if you want to stand out; skip guilt-free if time is tight.

> **Read the bold lines out loud.** The *(italics)* are actions — what to click,
> not what to say. Every technical claim below is backed by real code in this
> repo, so you can defend any of it in a follow-up.

---

## BEFORE YOU HIT RECORD (setup — 2 min)

1. Open your **live URL** in a clean browser window (no other tabs visible):
   `https://quest-craft-copilot-kaitchen.lovable.app`
2. **Turn your sound ON** (so the reviewer hears the UI audio) but keep it low.
3. Confirm the **Session Log is empty** and the **boar scenario is pre-loaded**
   (it's the default — you should see it in the big text box).
4. **CRITICAL:** click **Get suggestions** ONCE before recording to confirm real
   outcomes come back. If it errors, stop and fix — don't record a broken demo.
   Then reload so the log is clean again.
5. In Loom: click **New recording** → choose **Screen + optionally your cam
   bubble** → pick the browser window → **Start**.

---

## THE SCRIPT

### [0:00–0:12] Frame it as a systems problem
*(You're on the app's main screen, boar scenario visible.)*

> **"This is Quest Craft Co-Pilot. The hard moment for a new Game Master isn't
> prep — it's when kids do something totally unplanned mid-game and everyone's
> looking at them. I built a tool for that moment. But the interesting part is
> *how* it's built to be safe with a youth audience — so that's what I'll focus
> on."**

### [0:12–0:30] Run it live + name the output contract
> **"Here's Quest Craft's own example — the kids beat the sacred boar and want to
> sell it for profit instead of honoring the goddess. I'll hit Get Suggestions…"**

*(Click **Get suggestions**. While it loads, keep talking:)*

> **"Rather than free text, the model returns a structured JSON contract —
> reasoning, three tone-varied outcomes, read-aloud narration, a later
> consequence, and safety notes. Structured output means the UI is deterministic:
> a stressed facilitator always finds the same thing in the same place."**

*(Results appear. Briefly point at the three outcome cards and the narration box.)*

### [0:30–0:52] Safety as architecture, not a prompt
> **"The piece I care about most is safety. I treat both the user's input AND the
> model's output as untrusted. Guardrails in the system prompt are layer one — but
> a prompt is the layer that fails silently. So every response goes through a
> second, independent model call that judges it against a child-safety rubric
> before the facilitator ever sees it — separate context, so it catches things
> the generator rationalized past."**

*(Point at the green "Safety reviewed" banner at the top of the results.)*

> **"That green banner means the independent review passed."**

### [0:52–1:12] The fail-safe / gating — the money shot
> **"And it's fail-safe by design. If that review flags something serious, the
> content is withheld — the facilitator gets an explicit choice to reveal it or
> regenerate, so a human always makes the call. And if the safety check can't even
> *run* — a network or parse error — it doesn't fail open and pretend the content
> is fine. It tells the facilitator to use their judgment. I never want the system
> claiming 'reviewed and safe' when it didn't actually review."**

### [1:12–1:30] The hardening you don't have time to show
> **"Under the hood it's the boring-but-important stuff too: server-side input
> sanitization against prompt injection and zero-width-character smuggling; output
> schema validation, so a manipulated model can't attach arbitrary fields; rate
> limiting; and a regression test suite around all of it. The API key never
> touches the client."**

### [1:30–1:50] ONE interactive beat — pick A or B, do it live

**Option A — steer the vibe** *(click into the "Steer the vibe" box, type as you talk:)*
> **"The facilitator can also steer it in plain language — say, 'make it sillier,
> and the merchant is secretly a god in disguise' — and regenerate."**
*(Type that, click Roll again / regenerate, let the new result appear.)*

**Option B — the Session Log payoff** *(click **Use this** on one outcome:)*
> **"When they accept an outcome, it goes to the Session Log —"**
*(then in the Session Log, click **Call back now**:)*
> **"— and one click later, the tool weaves that thread back into the scene.
> That's 'a consequence that matters later' as an actual feature, not just a line
> in the output."**

### [1:50–2:05] Close on judgment, not features
> **"The whole thing targets Quest Craft's real adoption barrier — confidence, not
> interest. It's fast enough for live use, it's age-aware, and the human is always
> in control. Everything's in the repo — the prompt, the safety architecture, and
> the tests. Thanks for watching."**

*(Stop the recording.)*

---

## THE SENIOR-SOUNDING ASIDE (optional, only if it flows)
If you have a spare beat and want to signal production thinking, add this anywhere
natural — it's already true of your design:

> **"In production I'd move the safety judge to a separate, cheaper model and add
> an eval set, so prompt changes are measured, not eyeballed."**

---

## VOCABULARY THAT SIGNALS YOU KNOW AI INFRA
Each maps to something real in your code — use naturally, don't force all of them:
- "structured output contract" / "deterministic UI" (the JSON schema)
- "treat model output as untrusted" (server-side validation, enum coercion)
- "independent second-pass review" / "LLM-as-judge" (Layer 2)
- "fail-safe, not fail-open" (the error path)
- "severity gating" (major flag → withheld behind human override)
- "prompt injection / zero-width smuggling" (the sanitizer)
- "human-in-the-loop, enforced in the output" (accept / revise / ignore)
- "regression / eval suite" (the 45 tests)

## DON'T TORPEDO YOURSELF
- **Every claim here is backed by real code** — don't add claims beyond it. One
  overclaim an experienced reviewer can check does more damage than a modest demo.
- **Say "I designed the safety architecture," not "I built the infrastructure."**
  Lovable scaffolded the stack; the safety design and hardening are genuinely
  yours. That's honest AND impressive — and it survives an interview follow-up.
- **Narrate decisions, not the UI.** Say *why* two layers, *why* fail-safe — never
  "here's a button."
- **~2 minutes is fine** given the depth. Don't rush to 90s and sound frantic;
  don't ramble past ~2:15.

---

## AFTER RECORDING
1. In Loom, set link sharing to **"anyone with the link."**
2. Copy the link.
3. Paste it into the submission email (in `SUBMISSION_CHECKLIST.md`, the
   "Optional — 90-sec walkthrough" line) — or tell me the link and I'll add it.
