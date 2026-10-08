---
name: implement-feature
description: Implements an approved feature spec test-first - turns every acceptance criterion into a failing test, builds the plan stage by stage, logs divergences, and verifies the feature is reachable through the product's real entry point. Use when the user asks to implement, build or code a feature that already has an approved spec in specs/features/NN-slug/.
---

# implement-feature

Builds one approved feature. Tests come first, the plan is followed stage by stage, and
nothing is called done until it is proven and reachable.

## 0. Preconditions

- You are on branch `spec/NN-slug` and `specs/features/NN-slug/` has all three documents.
- The line under the title of `requirements.md` carries an approval. If it says
  `Approval: pending`, stop and ask.
- The Commands table in `AGENTS.md` has the commands you need. Where one is `_tbd_` or
  marked `(not yet: …)`, make it work as part of this feature and then remove the marker.

Read the three documents, the tech-design sections the plan cites, and
`specs/conventions.md`. Set the roadmap status to `in progress`.

## 1. Tests first

Work one stage at a time: write the tests for stage S1, make them pass, then S2.

For each acceptance criterion of the stage whose proof is automated:

1. Write the test with exactly the name given in **Proof**. It must carry the feature
   and criterion numbers as `conventions.md` prescribes.
2. Assert what the criterion's "Then" list says, each item specifically. "No error" is
   not an assertion.
3. Tests create their own data. They never read real data or real secrets.

Run the stage's tests and see each one fail because the behaviour is missing.

- In stacks where a test cannot even load until the code under test exists (a missing
  module, a compile error), add the smallest stub first: an empty module, or a function
  that only raises "not implemented". The test must then fail on its assertion.
- A guard, invariant or boundary test can pass before any code exists ("no third-party
  imports", "exactly 1000 characters is accepted"). Prove it bites: break the rule once,
  see the test fail, restore, and say so in the Results note.
- Any other new test that passes before its code exists proves nothing. Fix the test.

## 2. Implement, stage by stage

For each stage in `plan.md`:

1. Write the least code that turns this stage's tests green, following `conventions.md`.
2. Run the feature's tests, then the full suite. The stage is done when its tests pass
   and nothing that passed before fails.
3. Refactor with the tests green.
4. Commit: `wip: F{NN} S{n} <what the stage built>`.

## 3. Log divergences as they happen

The moment the code has to differ from the plan, add a bullet to the Divergence log in
`plan.md`:

```
- **S<n>:** <what the plan said> was built as <what was built> because <reason>.
```

- A divergence in *how* is logged and work continues.
- A divergence in *what* (a requirement cannot be met as written, a criterion is wrong,
  a principle would be broken) is an owner decision: stop, explain, wait. Then update
  `requirements.md` or `acceptance.md` before the code.
- A platform fact that turned out false is written into the log with the evidence. It
  will correct `tech-design.md` at finalise.

If implementation ends with no divergence, write `None. Built as planned.`

## 4. Verify

1. Run from the Commands table: build, the full test suite, lint (skip any that is `none`).
   All clean.
2. **Manual proofs.** For each criterion marked `manual:`, perform the steps yourself if
   you can drive the product. Otherwise give the owner the exact steps and wait for the
   result.
3. **Wiring check.** For everything this feature added that others are meant to use (a
   function, a route, a command, a page, a job, an event handler), name what calls it in
   the running product. Tests do not count as callers. Anything with no caller is either
   wired in now or recorded as not wired.
4. **End to end.** Run the end-to-end criterion through the real entry point and observe
   the result.
5. If an earlier feature's criterion is superseded by this one, mark its Results note
   `superseded by F{NN} AC-…` and update or remove its test.

## 5. Record and report

1. Fill the Results table in `acceptance.md`: `pass`, `fail` or `not run` for each
   criterion. Never write `pass` for something you did not see pass.
2. Fill the Verification section of `acceptance.md`: the wiring list (each new thing →
   its caller) and what the end-to-end run showed.
3. Commit: `wip: F{NN} verified`.
4. Tell the owner: the results, the divergences logged, and anything not wired, not run
   or left open.

Apart from the status set in step 0, do not touch the roadmap, changelog or tech design
here. The next step is `finalise-feature`.
