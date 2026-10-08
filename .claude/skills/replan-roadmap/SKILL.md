---
name: replan-roadmap
description: Reviews specs/roadmap.md after a feature merges and proposes a revised queue - merging features that are too small, splitting ones that are too big, reordering, and correcting plans in light of what was learned. Use after finalising a feature, before starting the next spec, or when the user asks to replan, regroup or reprioritise the roadmap.
---

# replan-roadmap

The roadmap written before any code existed was a first draft. After each merge you
know more. This skill proposes changes and writes them only after the owner agrees.

Run it on the main branch, in a fresh session if possible, so the roadmap is read as a
document rather than remembered as a conversation.

## 1. Read

- `specs/roadmap.md`, `specs/brief.md`, `specs/tech-design.md`
- The Divergence log in the `plan.md` of the feature that just merged
- `CHANGELOG.md`, to see what actually shipped
- `git branch --list 'spec/*'`: features in flight on their own branches are not
  replanned here; leave their rows alone

## 2. Review the rows that are not done

Ask of each `planned`, `blocked` or `partial` row:

- **Too small?** Would its spec, tests and docs be a few lines each? Merge it into an
  open neighbour. If no open neighbour fits, keep it as it is.
- **Too big?** Would it take more than a few sessions, or mix unrelated concerns? Split it.
- **Still true?** Did the last feature change what its "Approach" cell says, or make
  the feature unnecessary?
- **In the right place?** Does anything above it depend on it?
- **Still wanted?** Does it still serve the brief?
- **Waiting on something?** If it is a choice, make sure it is in Owner decisions
  pending. The row stays `planned` until it is next in the queue and cannot start; then
  it becomes `blocked: <on what or whom>`. A blocked row whose blocker has cleared goes
  back to `planned`.

Also check the table itself: a cell longer than one sentence is trimmed and its detail
moved to the feature folder; a pending decision that has been answered is removed and
its answer written into the document it affects; a `done` row that is really incomplete
is a status problem to raise with the owner, not to fix silently.

## 3. Propose

Present the changes before writing anything:

| Change | Rows | Why |
|---|---|---|
| merge / split / reorder / rewrite / drop | #NN, #NN | <one sentence> |

Rules:
- Never change a `done` row, and never reuse or renumber a feature number. A merged
  feature keeps the lowest number. Each of the others gets the status
  `dropped <date>: superseded by #NN`.
- A row dropped for any other reason gets `dropped <date>: <reason>`.
- A new feature takes **Next free feature number**, which is then increased.
- Do not merge features with genuinely different concerns just to shorten the table.
- Backlog items get a number only when they move into the queue.

## 4. Write and commit

After the owner approves:

1. Update `specs/roadmap.md`.
2. If a replan changes a decision, update `specs/tech-design.md` in place and add a row
   to its Decision log.
3. Commit, following the merge policy in `specs/conventions.md`:
   `docs: replan roadmap after F{NN}`.
