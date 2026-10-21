# Content Agent API v1

Status: draft for implementation
Pilot: China / EN first
Publishing: human approval required

## Purpose

Content Agent turns the Dream Islands content plan into grounded, brand-consistent publication candidates. It is not a free-form post generator.

Canonical sequence:

`Brand -> Need -> Intelligence -> Destination -> Programme -> Conversion`

The agent should move from general Dream Islands narrative to specific product only when the content-plan stage requires it. A programme must not become the default explanation of Dream Islands.

## Runtime loop

`Content Plan -> Strategy -> Supabase Retrieval -> Content Brief -> Story -> Visual Brief -> Renderer -> Fact Critic -> Visual Critic -> Human Approval -> Publisher -> Performance`

Performance and WS aggregate signals feed the next Strategy run.

## Sources of truth

1. Content Plan: narrative sequence, business priority, cadence and channel intent.
2. Wellness Score: focus, dimensions and funnel stage.
3. Supabase: programmes, properties, destinations, evidence, approved media and Content OS state.
4. Dream Islands Design System: brand tokens and component constraints.
5. Dream Islands Social system: composition grammar for social formats.
6. Creative benchmarks: art-direction reference only; never identity tokens.

## Input contract

The orchestrator MUST provide a structured input containing:

- `plan_item`: id, sequence, layer, objective, channel, format, locale, market, due_at.
- `ws_context`: focus, dimensions, stage, CTA.
- `retrieval`: entities, facts, evidence, approved media.
- `brand_rules_version`.
- `visual_rules_version`.
- `constraints`: medical boundary, prohibited claims, required review level.

Allowed `plan_item.layer` values in v1:

- `brand`
- `need`
- `intelligence`
- `destination`
- `programme`
- `conversion`

## Retrieval gate

Generation MUST fail closed if required grounding for the requested layer is missing.

Every factual claim must be traceable to a retrieved fact/evidence item and retain one of:

- `confirmed`
- `hypothesis`
- `missing`

Only `confirmed` facts may be written as factual claims. `hypothesis` may be used only as an explicit editorial hypothesis where the content type allows it. `missing` must never be silently completed by the model.

Programme/product content requires the programme, linked property/destination where relevant, duration, inclusions/price where mentioned, medical level, evidence and approved media to be retrieved first.

Medical and medical-wellness boundaries remain authoritative. Medical content always requires human approval.

## Output contract

The model returns structured JSON conforming to `content-agent-output.schema.json`.

The output contains:

- content-plan identity and sequence
- content brief
- story architecture
- slides/scenes
- caption
- asset selections
- visual instructions expressed as allowed design-system primitives
- factual claim references
- CTA
- QA result
- publication recommendation

The model MUST NOT output arbitrary CSS, arbitrary fonts, arbitrary brand colors, invented logos, or a free-form final layout. Final brand composition belongs to the deterministic renderer.

## Story rules

A content item should answer one primary question. Carousels should normally progress:

`Hook -> Problem/Need -> Insight -> Match/Discovery -> Evidence/Specifics -> CTA`

Not every item must contain a programme. Programme-level content is valid only at the `programme` layer or when explicitly required by the content plan.

## Visual system boundary

The agent selects from approved primitives; it does not invent the design system.

Renderer inputs may include:

- approved layout family
- typography role (`display`, `headline`, `body`, `label`, `cta`)
- approved color token
- image role and crop intent
- alignment/grid primitive
- chip/tag primitive
- series marker
- CTA component
- logo placement primitive

Photography is narrative evidence, not generic decoration. Supplier/real media must never be replaced by generated imagery when the slide represents a real property, programme or experience. AI-generated imagery, if allowed, must be explicitly classified as editorial/concept imagery and cannot imply that a depicted scene is the actual supplier/location.

## Critics / gates

### Fact Critic

Reject if:
- a claim lacks a source reference;
- a hypothesis is presented as confirmed;
- duration, inclusion, price, treatment or medical claim is invented;
- a supplier/property identity is ambiguous;
- required evidence is missing.

### Narrative Critic

Reject if:
- a programme is used as the explanation of Dream Islands at an earlier narrative layer;
- the item breaks the content-plan sequence without an explicit override;
- the CTA is inconsistent with WS stage.

### Visual Critic

Reject if:
- non-approved brand tokens/components are requested;
- the composition behaves like a generic hotel/programme catalogue when the layer is brand/need/intelligence;
- photography is decorative rather than supporting the story;
- hierarchy, safe areas or social-format constraints fail;
- generated imagery could be mistaken for real supplier imagery.

## Publishing

v1 requires human approval after all critics pass.

`draft -> qa -> approved -> published`

The publisher must not receive a candidate that has failed Fact, Narrative or Visual QA.

## Measurement

Publication records should preserve `plan_item_id`, brief/variant ids, channel publication id and campaign/UTM identity so performance can resolve toward:

`content -> WS assessment -> journey_search -> journey_match -> lead -> booking -> gross margin`

North-star business metric: attributable gross margin per content unit.

## API boundary

Recommended application boundary:

`POST /api/content-agent/generate`

The endpoint should:

1. load the plan item;
2. retrieve grounding from Supabase;
3. validate the retrieval gate;
4. call the model with strict structured output;
5. run critics;
6. persist brief + variant + QA metadata;
7. return a renderer-ready candidate.

Publication is a separate action and is never an implicit side effect of generation.
