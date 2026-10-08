---
name: create-constitution
description: Writes the governing documents of a Spec-Driven Development project - specs/brief.md, specs/tech-design.md, specs/roadmap.md, specs/conventions.md and the project sections of AGENTS.md. Use when starting a project, when the brief is still a template, or when the user asks to write or revise the brief, the tech design, the roadmap or "the constitution". Works for any technology.
---

# create-constitution

Turns an idea, or an existing codebase, into the documents every later session starts
from. No product code is written. There are four owner checkpoints; stop at each one.

Work through the phases in order. If a document is already filled in, read it, say so,
and continue from the first one that is still a template. To revise a finished brief,
see "Revising the brief" at the end.

**Owner decision** means any choice that changes what a user sees or what the product
is for, and that the brief does not already settle. Agents list these; the owner makes them.

## Phase 1 — Brief

1. Read what exists: `specs/brief.md`, `README.md`, any text the owner gave, and the
   code if there is any.
2. If the owner's name for the product differs from the name in the document titles,
   ask which is right and fix every heading that carries it.
3. Find what is missing for the brief's sections: problem, users, what it must do,
   non-goals, constraints, success criteria. Ask the owner for all the missing pieces in
   one batch of at most five questions.
4. Write `specs/brief.md` following its template:
   - Requirements are numbered `R1…`, one line each, in the user's language.
   - No technology choices unless the owner states them as constraints.
   - Non-goals name anything a reader might assume is included.
   - Success criteria are observable: a time, a number, a behaviour.
   - Never invent an answer. A question the owner has not answered goes under Open
     questions, and the section it belongs to says "not stated".
   - Add the first line under Revisions: `- <YYYY-MM-DD>: first version.`

**Checkpoint 1:** show the brief and its open questions. Wait for the owner's approval
or corrections.

## Phase 2 — Stack and sources of truth

1. Establish the stack. Inspect the repo first (manifests, lock files, project files);
   ask the owner only for what cannot be read from it.
2. Establish where platform facts can be verified: official documentation, a
   documentation server (MCP) the agent can query, the installed runtime itself (a
   one-line experiment is evidence), and the existing codebase. Where the platform's
   behaviour can only be known from its source, as with a host product or framework
   that is not installed locally, propose adding that source to the workspace.
3. Fill these sections of `specs/conventions.md`: Stack, Sources of truth for platform
   facts, Tests, User-facing documentation, Secrets and configuration, Git. Write `none`
   where a section does not apply. Leave Project layout and Code for Phase 6: they
   depend on the design.
   In Tests, write the naming pattern for this stack on the "Pattern for this stack"
   line and delete the example table.
4. The merge policy and the documentation location are the owner's to choose. If the
   owner has not said, pick a default, mark it "(default, confirm)" and raise it at
   Checkpoint 2.

## Phase 3 — Tech design

Write `specs/tech-design.md` following its template.

1. One numbered section per brief requirement, `## N. <Rn name>`, each with:
   - **N.1 What the platform already provides.** Research the sources of truth. Cite a
     source path, a documentation URL or a measurement for every point.
   - **N.2 Gaps.** What cannot be covered without new code.
   - **N.3 Decision.** How the requirement is met, in plain language, no code.
   - **Built by:** `not yet`.
2. Decisions that serve no single requirement (the entry point, packaging, storage,
   configuration) go in section `0. Foundations`, in the same three parts. Delete the
   section if there are none.
3. Ground rules:
   - Exhaust what the platform and the existing code provide before proposing anything
     new. Where the platform covers a requirement, say so and do not propose an alternative.
   - Where new code is needed, keep it thin: extend before you replace.
   - Thin is the goal, not a religion. Do not bend the platform into something
     complicated to avoid a small, clear piece of new code.
   - Do not guess. If you could not verify a claim, write that and what you looked for.
   - For an existing codebase, N.1 also covers what the code already does, and
     **Built by** says `existing`.
4. **Principles and invariants:** up to seven rules that must always hold (security,
   data, cost, performance, the owner's non-negotiables). Each names the check that
   will enforce it. Where that check is a test that does not exist yet, write
   `test, to be added`; the first feature that touches the principle writes it.
5. **System at a glance:** one diagram and a paragraph.
6. **Key design decisions:** up to twelve choices a newcomer must know, one sentence
   each. Leave the section out when it would only repeat the N.3 sections.
7. While designing, collect every user-visible behaviour the design had to choose and
   the brief does not state (formats, limits, defaults, error behaviour). These are
   owner decisions.

## Phase 4 — Critique with fresh eyes

The session that wrote the design is anchored on it. Have it attacked by one that is not.

1. Start a subagent with no memory of this conversation. If the tool has no subagents,
   give the owner the prompt below to run in a new session.

   ```
   Read specs/brief.md and specs/tech-design.md. Critique the tech design; do not be
   polite about it. Look for:
   1. Requirements in the brief that the design does not address.
   2. New code proposed where the platform or the existing code already does the job.
   3. Over-engineered solutions where a simpler approach would work.
   4. Decisions without evidence.
   5. Hallucinations: for every claim that the platform provides something, verify it
      against the sources of truth listed in specs/conventions.md. If it does not exist,
      or does not work the way the design says, call it out.
   For each issue: what is wrong, what would be better, and the evidence. Do not
   summarise what the design does well. List issues worst first.
   ```

2. Fix every confirmed issue in `specs/tech-design.md`. Repeat until a run finds
   nothing new, at most three rounds.

**Checkpoint 2:** show the owner:
- the key design decisions,
- what the critique changed,
- every behaviour beyond the brief, as a list of owner decisions,
- the stack, merge policy and documentation location.

Wait for approval. Write each answer where it belongs: a new or changed requirement in
the brief (with a Revisions line), otherwise the `N.3` decision it settles. Decisions
still open go to "Owner decisions pending" in the roadmap as `D1…`.

## Phase 5 — Roadmap

Start from the finished documents, not from the conversation that produced them.

1. Write `specs/roadmap.md`: an ordered table of features where each builds on those
   above it and none depends on a later one.
2. Feature 01 is the thinnest slice that runs end to end through the real entry point,
   even if it does almost nothing. Later features widen it.
3. Each row: number, name, what it delivers to the user, status `planned`, how it is
   built in one sentence with a link to the `N.3` decision, and an observable done-check.
   One sentence per cell.
4. Have as many rows as there are slices worth a full spec, test and docs cycle. A
   feature may cover several requirements. A small product may have one to three rows;
   a larger one rarely needs more than ten to start.
5. Ideas beyond the brief go to the Backlog table without a number.
6. Set **Next free feature number** to the first number no row uses.

**Checkpoint 3:** show the roadmap. Wait for approval.

## Phase 6 — Project entry points

1. Fill Project layout and Code in `specs/conventions.md` from the design.
2. Fill the Commands table in `AGENTS.md`:
   - a command that works now: write it, after running it once;
   - a command that cannot run until code exists: write the intended command followed
     by `(not yet: <reason>)`;
   - a step this stack does not have: write `none`.
   For "Test: one feature", write the pattern with `NN` standing for the feature number.
3. Add the stack's build output, dependency and cache folders to `.gitignore`.
4. Replace the "What this project is" paragraph in `AGENTS.md` with 2–4 sentences taken
   from the brief. Keep `AGENTS.md` under 100 lines.
5. Fill the first paragraph and Getting started section of `README.md`.
6. Commit on the main branch, or through a pull request if that is the merge policy:
   `docs: constitution — brief, tech design, roadmap, conventions`.

**Checkpoint 4:** report what was written and that the next step is
`create-feature-spec` for feature 01.

## Revising the brief

When the owner changes what the product is for after the first version:

1. Edit `specs/brief.md` and add a dated line under Revisions: what changed and why.
   A removed requirement keeps its number; mark it removed, never renumber.
2. Redo the tech-design sections the change touches (Phase 3 rules), and add a row to
   the Decision log for each decision it replaces.
3. Run `replan-roadmap`.

## Rules

- Never write product code in this skill.
- Never skip a checkpoint, even when the owner seems to have decided everything already.
- Keep every document a newcomer could read in one sitting. Long evidence goes under the
  section that needs it, not into the roadmap or `AGENTS.md`.
