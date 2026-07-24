# Final Submission Checklist

Everything that can be built is built. This is the run-through to finish and
send. Do the LIVE VERIFY first — nothing else matters if the app doesn't run.

---

## 1. LIVE VERIFY (do this first, do not skip)

The app has been type-checked, tested, and builds cleanly — but the AI pipeline
only runs when `LOVABLE_API_KEY` is present, which happens in Lovable, not
locally. So you must confirm it live:

- [ ] In Lovable, pull the latest from GitHub (or confirm auto-sync ran).
- [ ] Open the preview. Confirm the boar scenario is pre-loaded.
- [ ] Click **Get suggestions**. Confirm you get 2–3 outcomes, narration, a
      consequence, and the green "Safety reviewed" banner. **This is the make-or-break moment.**
- [ ] Click **Roll again** — confirm a fresh set comes back.
- [ ] Type in the **Steer the vibe** box (e.g. "make it sillier") and regenerate.
- [ ] Click **Use this** on an outcome → confirm it appears in the Session Log.
- [ ] In the Session Log, click **Call back now** → confirm a resurfacing
      narration appears.
- [ ] Click **Revise** on an outcome, add a note, **Regenerate** → confirm it updates.
- [ ] Toggle sound + music in the header; confirm they work and persist on reload.
- [ ] Try one edge case: paste something silly/mildly inappropriate and confirm
      the safety banner reacts sensibly (or at least that nothing broken shows).

**If Get suggestions errors or returns raw text:** that's the only bug that
matters. Check the Lovable AI gateway is enabled and the model name
(`openai/gpt-5.5`) is valid on the account. Fix before anything else.

## 2. PUBLISH + ACCESS

- [ ] Publish in Lovable.
- [ ] Set **Website Access to public** (default is often restricted — a private
      link = a reviewer who can't open it = a rejected submission).
- [ ] Open the published URL in an **incognito window** to confirm a stranger
      can load it with no login.
- [ ] Paste that URL into `README.md` (replace `_[Lovable link]_`) and into the
      email below.

## 3. RECORD THE DEMO (optional but high-leverage)

- [ ] Follow `docs/DEMO_SCRIPT.md`. Keep it under 90s. Only record once the live
      verify passes. Upload to Loom/Drive, set link sharing to anyone-with-link.

## 4. PARTNER EMAIL (item 6)

- [ ] Pick ONE real local org (a specific public library branch is the easiest
      strong choice). See `docs/PARTNER_EMAIL.md`.
- [ ] Fill the brackets with a TRUE specific reason for reaching out.

## 5. SEND

- [ ] Use the email below. Attach/link all 7 items. Send to ash@codespeaklabs.com
      before EOD Thursday.

---

## The submission email to Ash (fill the brackets)

**To:** ash@codespeaklabs.com
**Subject:** Quest Craft AI Intern Exercise — [YOUR NAME]

Hi Ash,

Thanks for the fun exercise — the live-gameplay-support angle was the part I
found most interesting, so that's what I built toward. Here's my submission.

**1. Prototype (live):** https://quest-craft-copilot-kaitchen.lovable.app
[**Optional — 90-sec walkthrough:** [LOOM URL]]
Repo: https://github.com/kcitlyn/questforge-aid

**2. Example input & 3. Example output:** in `docs/DELIVERABLES.md` (the demo
uses your Stormbristle Boar scenario verbatim). You can also just click "Sell the
sacred boar (demo)" in the app.

**4. Prompt / system instructions:** `docs/SYSTEM_PROMPT_JSON.md` (schema +
rationale); the live prompt is `src/lib/gm-copilot-prompt.server.ts`. My design
notes are in `docs/PROMPT_RESEARCH.md`.

**5. Guardrails:** three I'd highlight —
  - an **independent second-model safety review** of every response before it's
    shown, that fails safe if it can't run;
  - **human-in-the-loop enforced in the output itself** — every response is
    accept / revise / ignore, never fixed canon;
  - **age-appropriate reframing** (mature player ideas moved offscreen rather
    than refused), plus cultural respect for the mythology.
  Full write-up in `docs/DELIVERABLES.md`; I also wrote a small test suite for
  the input/output hardening (`npm test`).

**6. Partner outreach email:** in `docs/PARTNER_EMAIL.md` (addressed to
[ORG NAME], a real local [library/club] near me).

**7. Reflection:** in `docs/DELIVERABLES.md` — short version: with more time I'd
test with real GMs, persist the Session Log across weeks so callbacks span a
whole program, and build an eval suite so prompt changes are measured, not
eyeballed.

The thing I most wanted to get right is Quest Craft's real adoption barrier —
confidence, not interest — so the whole tool is built to make a nervous first-
time facilitator feel safe improvising, while keeping them fully in control.

Happy to walk through any of it live. Thanks for your time!

Best,
[YOUR NAME]
[phone / email]
