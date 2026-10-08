# Dream Islands Travel — Conventions

> The stack-specific half of the process. The loop and the document shapes are the same
> in every project; this file is where a project says how they apply to its technology.
> Filled by `create-constitution`. Changed when the team agrees a new rule.
> Write `none` where a section does not apply.

## Stack

<!-- Languages, frameworks, runtime versions, package manager, target platform. -->

## Sources of truth for platform facts

<!-- Where agents verify what the platform provides before proposing new code:
     official documentation, documentation servers (MCP), the installed runtime (a
     one-line experiment counts as a measurement), vendored or submodule source, and the
     existing codebase. One line each, with the path or URL. -->

| Source | Where | Use it for |
|---|---|---|

## Project layout

<!-- Top-level folders and what belongs in each. -->

## Code

<!-- Style, structure and error-handling rules that are specific to this stack.
     Link to longer rule files instead of pasting them. -->

## Tests

- **Framework and location:** <e.g. test runner, folder>
- **Naming:** every test that proves an acceptance criterion carries the feature number
  and the criterion number in its own name, so one search for `F07 AC-03` (in this
  stack's spelling) finds exactly that test.
  Pattern for this stack: `<fill in>`

  | Stack | Example pattern |
  |---|---|
  | Python (pytest or unittest) | `test_f07_ac03_refuses_overlapping_booking` |
  | JavaScript / TypeScript | `it('F07 AC-03 refuses an overlapping booking')` |
  | Swift / XCTest | `test_F07_AC03_refusesOverlappingBooking` |
  | AL (Business Central) | `procedure F07_AC03_RefusesOverlappingBooking()` |
  | C# / Java | `F07_AC03_RefusesOverlappingBooking` |

- **Tests first:** acceptance criteria become failing tests before production code.
- **End to end:** each feature has at least one test, or one named manual check, that
  enters through the real entry point a user or caller uses.
- **Isolation:** tests create their own data and never touch real data or real secrets.
- **Coverage expectation:** <fill in, or "none">

## User-facing documentation

- **Location:** `docs/user-guide.md` <!-- or the README, or built-in help: say which -->
- **Voice:** plain language for the user of the product; describes only what is built.

## Secrets and configuration

- Secrets never enter git. If the stack uses env files, a tracked `.env.example` carries
  names only.
- <where secrets live at run time and who can change them, or "none: this project has no secrets">

## Git

- **Branches:** `spec/NN-slug` per feature, `fix/NN-short-name` for a defect in a
  finished feature, `docs/<topic>` for documents-only changes when the merge policy is
  pull request. All are cut from the main branch.
- **Commits:** `spec: F{NN} …` for the three documents; `wip: F{NN} …` while
  implementing (after each green stage and after verification); `feat: F{NN} …` when
  the feature is finalised; `fix: F{NN} …` for a defect in a finished feature; `docs:`
  and `chore:` for the rest.
- **Merge:** <pull request with review | direct merge to main>. Never merge with a
  failing suite. The same policy applies to documents-only commits.
