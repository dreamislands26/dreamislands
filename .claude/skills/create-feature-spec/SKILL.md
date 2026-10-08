---
name: create-feature-spec
description: Creates the branch and the three spec documents (requirements.md, plan.md, acceptance.md) for the next planned feature in the Spec-Driven Development loop. Use when starting a new feature, or when the user asks to create a spec, write requirements, plan a feature or begin a feature branch. Writes no product code.
---

# create-feature-spec

Creates `specs/features/NN-slug/` with its three documents on branch `spec/NN-slug`,
then stops for owner approval. No product code and no tests are written here.

## 1. Identify the feature

Read `specs/roadmap.md` on the main branch and list the feature branches
(`git branch --list 'spec/*'`). Take the feature the user named, or else the first row
with status `planned` that has no `spec/NN-…` branch yet. Note its number, name,
"Approach" and "Done when" cells.

If the user asks for something that has no roadmap row, add the row first: use **Next
free feature number**, then increase that number by one, and commit both on the main
branch as `docs: roadmap add F{NN}` (through a pull request if that is the merge
policy). If the request does not fit the brief, say so and ask before adding it.

## 2. Create the branch

Start from the main branch with a clean working tree (pull first if there is a remote).

```
git checkout -b spec/NN-slug
```

`NN` is the zero-padded feature number. The slug is the feature name in lowercase with
hyphens: drop articles and conjunctions and keep at most three words.

## 3. Read the sources

- `specs/brief.md` — intent and constraints
- `specs/tech-design.md` — the principles, and the sections this feature touches
- `specs/roadmap.md` — this feature's row and the rows it depends on
- `specs/conventions.md` — layout, test naming, sources of truth
- The code this feature will touch, and the `plan.md` divergence logs of the features it
  builds on

If the plan depends on a platform fact that the tech design does not already prove,
verify it against the sources of truth before relying on it, and record it with its
evidence under "Platform facts checked" in `plan.md`.

## 4. Write the three documents

Copy `specs/features/_template/` to `specs/features/NN-slug/` and fill each file.

**requirements.md** — what, never how
- Purpose in one or two sentences.
- `FR-1…` in the user's language. The product's public interface (commands, routes,
  screen names, status codes) may be named; code, file paths and internal identifiers
  may not.
- The Out of scope table lists everything a reader might assume is included, where it
  is handled instead, and what a user sees until then.
- Unresolved choices go under Open questions as owner decisions. Do not resolve them yourself.

**plan.md** — how
- The line under the title cites the governing `tech-design.md` section and the principles that apply.
- Stages `S1…`, each small enough to leave the product working, each naming the files
  or components it touches and the criteria it turns green.
- Platform facts checked, manual setup, dependencies. Leave the Divergence log empty.
- If the plan needs to break a principle or contradict the tech design, stop and raise
  it as an owner decision.

**acceptance.md** — proof
- `AC-01…`, each with **Covers** and **Proof**.
  - Covers names at least one FR. A criterion that exists to enforce a principle
    covers that principle instead (`Covers: P2`).
  - Proof is the name the test will have, using the pattern from `conventions.md`, or
    `manual:` plus repeatable steps.
- Given / When / Then; "Then" is a list of specific assertions, not prose.
- Cover the main path and the important failure or edge case of each requirement.
- At least one criterion enters through the real entry point a user or caller uses,
  and restates the roadmap row's "Done when" check.
- For each principle this feature touches whose "Enforced by" cell still says the test
  is to be added, add the criterion that enforces it.
- If this feature changes behaviour an earlier feature's criterion asserts, say so in
  the plan and name the criterion that will be marked superseded.
- Prefer an automated proof. Use a manual one only where automation is not possible
  (hardware, a third-party screen, a store review), and say why.
- Fill the Results table with every criterion as `pending`.

## 5. Check traceability

Before showing anything, verify and fix:

- Every FR is covered by at least one AC.
- Every AC covers at least one FR or principle and names a proof.
- Every stage in the plan names the criteria it serves, and every AC is served by a stage.
- Nothing in the plan is outside the requirements, apart from housekeeping listed as such.

## 6. Record and stop

1. Set the feature's roadmap status to `specced`. The change lives on the feature
   branch until the feature merges.
2. Commit on the feature branch: `spec: F{NN} <Feature name>`.
3. Show the owner a short summary: the requirements, what is out of scope, the stages,
   the open questions. Ask for approval and for an answer to each open question.
4. On approval:
   - write each answer into the FR and AC it affects, and set Open questions to `None.`;
   - in the line under the title of `requirements.md`, replace `Approval: pending` with
     `Approval: <owner>, <YYYY-MM-DD>`;
   - commit: `spec: F{NN} approved`.

Do not start implementing. The next step is `implement-feature`.
