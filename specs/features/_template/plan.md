# F<NN> — <Feature name> · Plan

> Authority: `specs/tech-design.md` §<N>.3. Principles <P…> apply.
> Constraints: <e.g. "no new data store", "extension points only">

## Stages

<!-- Small steps that each leave the product working. Each stage names the files or
     components it touches and the acceptance criteria it turns green. Repo housekeeping
     that serves no requirement (commands table, ignore rules) is listed as such. -->

### S1 — <name>

- **Builds:** <components and files, with paths>
- **Tests first:** <AC-01, AC-02 as failing tests>
- **Done when:** <those tests pass and nothing that passed before fails>

### S2 — <name>

- **Builds:** <…>
- **Tests first:** <…>
- **Done when:** <…>

## Platform facts checked

<!-- Facts this plan relies on that tech-design.md did not already prove, each with its
     evidence. finalise-feature moves them into the tech design. "None." if none. -->

## Manual setup

<!-- Anything a person must configure by hand before the feature works. "None." if none. -->

## Dependencies

<!-- Features that must be merged first, or "None." -->

## Divergence log

<!-- Filled during implementation, as it happens. One bullet per difference between
     this plan and what was built:
     - **S<n>:** <what the plan said> was built as <what was built> because <reason>.
     When implementation ends without any, write "None. Built as planned." -->
