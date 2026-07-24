# Design & Tradeoffs — GM Co-Pilot

A short record of *why* this is built the way it is.

## The problem I chose to solve
Quest Craft's deck names the real adoption barrier: **confidence, not interest.**
New facilitators — educators with no TTRPG background — freeze when players go
off-script. I built the one feature that hits that moment directly: **live
support for an unexpected player choice.** Depth on the hardest, highest-value
moment beats breadth across easy ones.

## Key design decisions

**1. Structured (JSON) output, not free text.**
The model returns a fixed JSON shape the UI renders into cards. Tradeoff: slightly
more brittle (needs a fallback parser) in exchange for consistency, so a stressed
GM always finds the same sections in the same place mid-session. A raw-text
fallback prevents a crash if the model breaks format.

**2. Human-in-the-loop as a *mechanic*, not a sentence.**
Every suggestion has **Accept / Revise / Ignore**. Accepting a consequence writes
it to a **Session Log** so it can actually "matter later." This turns Quest
Craft's #1 stated principle into something you can click, not just read.

**3. Two-layer safety** (see `SAFETY_PASS.md`).
Generation is layer 1; an independent safety-review model call is layer 2. It
fails *safe* (softens/withholds, never fails open) and still returns control to
the GM. This is the core of the AI-engineering work here.

**4. Tone-diverse outcomes.**
The prompt forces 2–3 outcomes with *different* tones (playful / mystery /
high-stakes) so the GM gets genuine options, not one idea reworded.

**5. Age + setting controls.**
Proves the tool generalizes toward the deck's "250+ adventures across grade
levels, subjects, and cultures" without me over-building extra features.

## What I deliberately left OUT (and why)
- **Auth / database:** not needed for a prototype; in-memory session state is
  enough and keeps the demo instantly usable with no login (the reviewer can just
  open the link).
- **Fancy UI:** the packet says polish isn't scored; I spent that budget on
  prompt + safety instead.
- **Multiple features:** breadth would thin the depth on the one that matters.

## What I'd measure next
- % of suggestions **accepted vs. revised vs. ignored** (are they actually useful?)
- safety-reviewer **flag rate** and false-positive rate
- time-to-first-suggestion (must stay live-usable)
- GM-reported confidence before/after (ties to the deck's core metric)

## Model choice
Using Lovable's built-in AI for the prototype (zero-setup, key handled
server-side, free tier sufficient). For production I'd evaluate a top model like
**Claude Sonnet** for the generation pass and a smaller/cheaper model for the
safety pass, to balance quality against the doubled call cost.
