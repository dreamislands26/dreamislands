# F<NN> — <Feature name> · Acceptance

> Each criterion names its proof: an automated test, or a manual check someone can
> repeat. The feature is done when every row of the Results table is `pass` and the
> Verification section is filled in.

## Shared preconditions

<!-- State every scenario starts from. Leave out if each scenario states its own. -->

## AC-01 — <scenario name>

**Covers:** FR-1 · **Proof:** `<test name>`

<!-- Covers names at least one FR, or a principle from tech-design.md (P1) when the
     criterion is the check that enforces it. -->

**Given** <initial state>,\
**When** <action>,\
**Then:**
- <specific, checkable assertion>
- <specific, checkable assertion>

## AC-02 — <scenario name, end to end>

**Covers:** FR-1, FR-2 · **Proof:** `<test name>` or manual: <steps>

<!-- At least one criterion must enter through the real entry point a user or caller
     uses (a screen action, a command, a route, a scheduled job), not by calling an
     internal function directly. This is the one that proves the feature is wired in.
     It should also be the roadmap row's "Done when" check. -->

**Given** <initial state>,\
**When** <the user or caller acts through the real entry point>,\
**Then:**
- <what they observe>

## Results

<!-- Filled by implement-feature. Values: pending, pass, fail, not run.
     Note says anything a reader must know, e.g. "manual, checked by <who> on <date>". -->

| AC | Result | Note |
|---|---|---|
| AC-01 | pending | |
| AC-02 | pending | |

## Verification

<!-- Filled by implement-feature at the end.
     **Wiring:** each thing this feature added for others to use → what calls it in the
     running product (tests do not count).
     **End to end:** what was run through the real entry point, and what was observed. -->
