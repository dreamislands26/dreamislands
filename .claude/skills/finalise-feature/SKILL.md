---
name: finalise-feature
description: Closes out an implemented feature - checks every acceptance criterion is proven, writes user-facing docs, brings the tech design up to date, adds the changelog entry, sets the roadmap status, commits and merges. Use after implementation is verified, when the user asks to finalise, close, wrap up, document or merge a feature.
---

# finalise-feature

Six steps to close a feature branch. The first is a gate: if it fails, stop there.

## 1. Gate

1. Read `specs/features/NN-slug/acceptance.md`. Every row of the Results table must be
   `pass`. For automated proofs, confirm the named test exists by
   searching the tests for its name, and run the full suite from the Commands table in
   `AGENTS.md`.
2. Confirm traceability still holds: every FR has an AC, every AC has a proof that exists.
3. Read the Verification section: nothing is listed as not wired, and the end-to-end
   run is recorded. If the section is empty, the feature is not verified.

If anything is missing, do not finalise as `done`. Either go back to `implement-feature`,
or, if the owner chooses to merge anyway, the status will be `partial` and will say
exactly what is missing.

## 2. User-facing docs

Update the documentation at the location named in `specs/conventions.md` (create the
file if this is the first feature).

- Write for the person using the product, in plain language, with no internal names.
- Describe only what is built now, never what the roadmap promises.
- Cover: what the feature does, any one-time setup, how to use it step by step, and the
  rules or errors a user can hit.
- Check every instruction against the running product or the code. A step that names a
  button, command or field that does not exist is a blocker.
- If the tool supports subagents, have one with fresh context read the new section as a
  first-time user and report unclear or wrong steps. Fix what it finds.
- Refresh the Getting started section of `README.md` if the Commands table changed.

## 3. Bring the tech design up to date

`specs/tech-design.md` states what is built and what is decided. After this step it
must be true for this feature.

1. Read the Divergence log and "Platform facts checked" in `plan.md`, and compare the
   code with the sections the plan cites.
2. Set the **Built by** line of each section this feature implemented, adding `F{NN}`.
3. Where the code differs from the `N.3 Decision` text, rewrite the text in place so it
   states what is actually built. Do not append history to the section.
4. If a decision was reversed or replaced, add one row to the Decision log: date, the new
   decision, what it replaces, why, and the feature number.
5. Correct any platform claim in `N.1` or `N.2` that proved false, and add the facts this
   feature newly verified, each with its evidence.
6. In Principles and invariants, replace any "to be added" in **Enforced by** with the
   real name of the test this feature wrote. If the feature introduced a rule that must
   always hold, add it with its enforcing test.

## 4. Changelog

Add an entry at the top of `CHANGELOG.md`, below the header:

```markdown
## YYYY-MM-DD — F{NN}: <Feature name>

<One or two sentences saying what a user can now do. No internal names.>
```

## 5. Roadmap

Set the feature's status in `specs/roadmap.md` to `done`, or to
`partial: <exactly what is missing>`. Do not change any other row here.

## 6. Commit and merge

1. Stage everything and commit on the feature branch:

   ```
   git add -A
   git commit -m "feat: F{NN} <Feature name> — <what was built, one line>"
   ```

2. Merge the way `specs/conventions.md` says. Never merge with a failing suite.
   - **Pull request:** push the branch and open the pull request; do not merge it
     yourself. The `done` status travels with the branch and becomes true on merge.
   - **Direct merge:**

     ```
     git checkout <main branch>
     git merge --no-ff spec/NN-slug
     ```

     Run the full suite once more on the main branch, then delete the feature branch.
3. Tell the owner what shipped, in the changelog's words, and that `replan-roadmap` is
   the next step before the next feature.
