import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const LAYERS = new Set(["brand", "need", "intelligence", "destination", "programme", "conversion"]);

type GenerateRequest = {
  plan_item: {
    id: string;
    sequence: number;
    layer: string;
    objective: string;
    channel: string;
    format: string;
    locale: string;
    market: string;
  };
  ws_context?: {
    focus?: string | null;
    dimensions?: string[];
    stage?: "awareness" | "assessment" | "consideration" | "conversion" | "medical" | null;
    cta?: string | null;
  };
  retrieval: {
    facts: Array<{ id: string; text: string; status: "confirmed" | "hypothesis" | "missing"; source_ref?: string | null }>;
    assets?: Array<{ asset_id: string; source: "supabase" | "supplier" | "brand" | "generated_editorial"; reality: "real" | "editorial_concept"; url?: string }>;
  };
  brand_rules_version: string;
  visual_rules_version: string;
  constraints?: string[];
};

function validate(input: GenerateRequest) {
  if (!input?.plan_item?.id || !LAYERS.has(input.plan_item.layer)) return "invalid plan_item";
  if (!input.brand_rules_version || !input.visual_rules_version) return "brand/visual rules version required";
  if (!Array.isArray(input.retrieval?.facts)) return "retrieval.facts required";
  const ungrounded = input.retrieval.facts.some((f) => f.status === "confirmed" && !f.source_ref);
  if (ungrounded) return "confirmed facts require source_ref";
  if (input.plan_item.layer === "programme" && !input.retrieval.facts.some((f) => f.status === "confirmed")) {
    return "programme layer requires confirmed grounding";
  }
  return null;
}

function extractOutputText(payload: any): string {
  if (typeof payload?.output_text === "string") return payload.output_text;
  const parts = Array.isArray(payload?.output) ? payload.output : [];
  for (const item of parts) {
    for (const c of item?.content ?? []) {
      if (typeof c?.text === "string") return c.text;
    }
  }
  return "";
}

export async function POST(req: NextRequest) {
  const secret = process.env.CONTENT_AGENT_API_SECRET;
  if (secret && req.headers.get("x-content-agent-secret") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const input = (await req.json()) as GenerateRequest;
  const validationError = validate(input);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 503 });

  const system = `You are Dream Islands Content Agent v1. Follow the content sequence Brand -> Need -> Intelligence -> Destination -> Programme -> Conversion. Use only supplied retrieval facts. Never turn hypothesis or missing data into fact. Do not invent programme details, medical claims, prices, inclusions, supplier identities, or brand tokens. Programme is not the explanation of Dream Islands at earlier narrative layers. Return JSON only. Human review is required. Visual instructions must reference approved primitives rather than arbitrary CSS, fonts, colors, or logos.`;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.CONTENT_AGENT_MODEL || "gpt-5.6",
      instructions: system,
      input: JSON.stringify(input),
      text: {
        format: {
          type: "json_object",
        },
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    return NextResponse.json({ error: "model_request_failed", detail }, { status: 502 });
  }

  const payload = await response.json();
  const text = extractOutputText(payload);
  if (!text) return NextResponse.json({ error: "empty_model_output" }, { status: 502 });

  let candidate: unknown;
  try {
    candidate = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "invalid_model_json", raw: text }, { status: 502 });
  }

  return NextResponse.json({
    candidate,
    gate: "human_review",
    persisted: false,
    rendered: false,
    published: false,
  });
}
