# specs/

Everything an agent or a new teammate needs to continue the work without a briefing.

```
specs/
  brief.md          why: problem, users, numbered requirements, non-goals, constraints
  tech-design.md    how: principles, architecture, one decision section per requirement
  roadmap.md        when: ordered feature queue, status, owner decisions, backlog
  conventions.md    rules for this stack: code, tests, naming, secrets, git
  features/
    _template/      copied by create-feature-spec; do not edit per feature
    NN-slug/        requirements.md, plan.md, acceptance.md for feature NN
```

## Who changes what

| File | Changes when | Changed by |
|---|---|---|
| `brief.md` | The owner changes what the product is for; a dated line goes under Revisions | `create-constitution` (first version and revisions), on the owner's word only |
| `tech-design.md` | Written once, then updated when a feature is finalised or a decision is replaced; always rewritten in place | `create-constitution`, `finalise-feature`, `replan-roadmap` |
| `roadmap.md` | A feature changes status; after every merge | All skills |
| `conventions.md` | Filled at the start; later when the team agrees a new rule | `create-constitution`, then the team |
| `features/NN-slug/` | While feature NN is in the loop; frozen after finalise, with the two exceptions below | Feature skills |

## Identifiers

| ID | Meaning | Lives in |
|---|---|---|
| `R1…` | A requirement of the product | `brief.md`; `tech-design.md` section N covers RN |
| `P1…` | A principle or invariant | `tech-design.md` |
| `D1…` | An owner decision still pending | `roadmap.md` |
| `F01…` | A feature: roadmap row (written `#01` there), folder `features/01-slug/`, branch `spec/01-slug` | `roadmap.md` |
| `FR-1…` | A functional requirement of one feature | `features/NN-slug/requirements.md` |
| `AC-01…` | An acceptance criterion; names its proof | `features/NN-slug/acceptance.md` |
| `S1…` | A stage of one feature's plan | `features/NN-slug/plan.md` |

A feature number is never reused. Tests and commits carry it (`F07`, `AC-03`), so a
search for the number finds the spec, the code, the tests and the history.

## Changing a finished feature

A finished feature's folder is a record. Two things may still change in it.

**A bug fix.** Behaviour the feature already promised is broken.

1. Work on `fix/NN-short-name`, or on the main branch if `conventions.md` says direct merge.
2. Append the next `AC-…` to that feature's `acceptance.md`, covering an existing FR.
   If no existing FR fits, it is not a bug: it is new behaviour and needs a feature.
3. Write its test, see it fail, fix the code, set the Results row.
4. Correct `tech-design.md` and the user docs if their text is now wrong.
5. Add a changelog entry `## YYYY-MM-DD — F{NN} fix: <what a user notices>`.
6. Commit `fix: F{NN} <summary> (AC-…)`.

**A later feature changes the behaviour.** The new feature's spec says so, the old
criterion is marked `superseded by F{NN} AC-…` in its Results note, and its test is
updated or removed in the new feature's branch.

## Size limits

`AGENTS.md`, `brief.md`, `roadmap.md` and the principles in `tech-design.md` are read
every session. Keep roadmap cells to one sentence and move detail into the feature
folder. History belongs in feature folders and the changelog, not in the documents read
every time.

## Folders to add only when you need them

| Folder | Add it when |
|---|---|
| `specs/research/` | A question needs investigation before any feature can be specced (market, protocol, licensing). One file per question, ending in the owner decisions it needs. |
| `specs/releases/` | Several features ship together behind a gate (a store submission, a migration, a customer go-live). One file per release. |
| `spikes/` (repo root) | You must measure the real platform before designing: throwaway probe scripts plus their recorded results. Findings are written back into `tech-design.md` with the evidence. |
| `archive/` (repo root) | Working code is taken out of scope. Move it with a README saying why, what was worth keeping, and how to restore it; mark the roadmap rows `dropped`. |
