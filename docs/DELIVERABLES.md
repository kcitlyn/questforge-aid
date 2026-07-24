# Quest Craft GM Co-Pilot — Deliverables

Covers items 2–7 of the exercise. Item 1 is the live prototype link; item 6
(partner email) lives in `PARTNER_EMAIL.md`.

**Where this fits Quest Craft:** The deck defines three AI Co-Pilot pillars —
Quest development, GM preparation/training, and **Live gameplay support**. This
prototype targets the third and hardest one: the moment a GM is stuck at a live
table. It intentionally mirrors the deck's own canonical example (players selling
the sacred boar → wealth, but hunters begin targeting sacred creatures and
Artemis grows suspicious), and shows how the tool goes further — structured
outcomes, ready-to-say narration, a later payoff, an explicit accept/revise/ignore
control step, and safety notes. It's aimed squarely at the deck's stated adoption
barrier: **confidence, not interest.**

---

## 2. Example input (the required demo scenario, verbatim)

> "The students defeated the Stormbristle Boar. Instead of accepting Artemis'
> blessing or treating the boar as sacred, they want to sell the tusks at the
> market, divide up the meat, and keep the profits. I need 2–3 possible story
> outcomes that respect their choice, create an interesting consequence, and keep
> the quest moving for ages 9–12."

---

## 3. Example output (what the prototype returns)

**Safety reviewed** — an independent second model pass checks every response
before it's shown (see `SAFETY_PASS.md`); a serious flag holds the content back
until the GM chooses to reveal it.

**Why these suggestions (co-pilot's thinking):** The players want to treat the
boar as loot, not a sacred trophy — I'll honor the enterprise and let the world
react in interesting ways, keeping the Poseidon quest alive.

**Read of the moment:** The players want to treat the boar as loot, not a sacred
trophy — enterprising heroes making a very human call.

**You could ask the players:** "What are you hoping the money gets you?"

**Story outcomes** *(each card has Use this / Revise / Ignore buttons; each
carries its own "matters later" hook)*
1. *(Playful — Charisma check)* The market loves the storm-charged tusks and a
   merchant pays well — but the coins crackle with static and give little shocks.
   Word spreads that these heroes deal in "lively" goods, and buyers start
   seeking them out.
   — *Later:* those buyers come looking for more "lively" goods.
2. *(Mystery — Wisdom check)* Their new wealth draws attention: other hunters,
   hearing the tusks sold for a fortune, begin tracking sacred creatures across
   the forest. Artemis grows wary of the heroes — and a soft-spoken servant of
   Hades takes an interest in them.
   — *Later:* the servant of Hades resurfaces with an offer.
3. *(High-stakes)* Selling a creature sacred to Artemis stirs the goddess. She
   doesn't punish them — she *tests* them: game grows scarce on the roads, and
   the heroes must show respect for the wild another way to earn her favor.
   — *Later:* Artemis's test comes due before they can leave the region.

**Narration you could say aloud:** "The tusks fetch a fine price — merchants
haggle eagerly over the lightning-veined ivory. But as the coins drop into your
palms, a distant thunder rolls, and you feel unseen eyes watching from the
treeline. The hunt, it seems, remembers."

**Delivery hint:** *(cheerful market bustle, then slow down for the thunder)*

**A consequence that matters later:** beyond each outcome's own hook (above), the
heroes still need to weaken Poseidon's curse — and they've now spent the favor
they came here to earn, so they'll need a new path (back to Clio, or through the
Priest of Hades). Accepting any outcome writes its hook to the Session Log, where
one click weaves it back into a later scene.

**You're in control:** These are options — accept, mix, or ignore any of them.
You can also just ask the players, "What are you hoping the money gets you?" and
build from their answer.

**Safety notes:** Keep the meat/butchery offscreen — focus on the market and the
coins, not gutting the animal. Artemis responds with a *challenge*, not cruelty,
so player agency stays intact.

*(~170 words — short enough to glance at mid-session.)*

---

## 4. Prompt / system instructions

See `SYSTEM_PROMPT_JSON.md` (schema + rationale); the authoritative prompt lives
in `src/lib/gm-copilot-prompt.server.ts`. Key design choices to mention:
- **Fixed output order** so a stressed GM always knows where to look.
- **Tone variety across outcomes** (playful / mystery / high-stakes) so the GM
  gets a real choice, not three flavors of the same idea.
- **Every response ends with an "accept / revise / ignore" reminder + a question
  the GM can ask players** — the human-in-the-loop principle, enforced in the
  output itself, not just claimed.
- **Hard word cap (~180 words)** because the tool is used live.

---

## 5. Safety & quality guardrails

1. **Age-appropriateness (8–14).** The system prompt bans gore, graphic violence,
   and frightening imagery, and instructs the model to *reframe* mature player
   ideas (like butchering the boar) into lighter, offscreen framing instead of
   refusing. In the demo, the sale happens "offscreen" at the market.
2. **Human-in-the-loop & student agency.** The AI never declares canon and never
   punishes players for creativity. Every response ends with an explicit
   accept/revise/ignore reminder plus a question the GM can ask the table. The UI
   also labels all output as "Suggestions." This directly answers the packet's
   most-repeated principle.
3. **Cultural sensitivity.** Explicit instruction to treat Greek myth — and any
   real culture or religion — respectfully: no stereotypes, no invented "rituals,"
   keep gods in the source material's kid-friendly register. Prevents
   "culturally careless mythology content."

Two more that matter: **privacy** — the prompt forbids requesting or echoing
student names/PII; and **concision** — a hard length cap keeps it usable live.

---

## 7. Reflection (3–5 sentences)

With more time, I'd **test with 2–3 real GMs** to tune length, vocabulary, and
which suggestions actually get used live — the accept/revise/ignore buttons are
already instrumented conceptually for that, so the next step is logging those
choices as feedback. I'd **persist the Session Log across sessions** so a
consequence accepted in week 1 can resurface in week 3, closing the loop on
"a consequence that matters later" across a real multi-week program. I'd build an
**evaluation suite** — a set of tricky scenarios with pass/fail criteria (the
seeds are in `SAFETY_TEST_CASES.md`) — so prompt changes can be tested instead of
eyeballed, and I'd expand the **few-shot example library across genres and
cultures** so the tool generalizes beyond Greek mythology toward Quest Craft's
250+-quest vision. Finally, I'd run the safety reviewer only when the generator
self-flags uncertainty, cutting latency and cost roughly in half without losing
the fail-safe.
