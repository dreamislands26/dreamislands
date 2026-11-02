"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import s from "./clp.module.css";

/* ---------- analytics ---------- */

type Params = Record<string, string | number | undefined>;

function trafficSource(): string {
  if (typeof window === "undefined") return "";
  const u = new URLSearchParams(window.location.search);
  const utm = u.get("utm_source");
  if (utm) return utm;
  try {
    const ref = document.referrer ? new URL(document.referrer).hostname : "";
    return ref && !ref.endsWith("dreamislands.org") ? ref : "direct";
  } catch {
    return "direct";
  }
}

export function track(event: string, params: Params = {}) {
  if (typeof window === "undefined") return;
  const payload = { property: "clp_phuket", locale: "en", traffic_source: trafficSource(), ...params };
  const w = window as unknown as { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({ event, ...payload });
  if (typeof w.gtag === "function") w.gtag("event", event, payload);
}

export function Track({ event, params }: { event: string; params?: Params }) {
  useEffect(() => {
    track(event, params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

/* ---------- shared intent (matcher -> form) ---------- */

type Intent = { goal?: string; programme?: string };
const KEY = "clp_intent";
const EVT = "clp-intent";

let current: Intent | null = null;
const EMPTY: Intent = {};

function readIntent(): Intent {
  if (current) return current;
  try {
    const raw = sessionStorage.getItem(KEY);
    current = raw ? (JSON.parse(raw) as Intent) : EMPTY;
  } catch {
    current = EMPTY;
  }
  return current;
}

function setIntent(i: Intent) {
  current = i;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(i));
  } catch {}
  window.dispatchEvent(new Event(EVT));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVT, cb);
  return () => window.removeEventListener(EVT, cb);
}

function useIntent(): Intent {
  return useSyncExternalStore(subscribe, readIntent, () => EMPTY);
}

export function TrackedLink({
  href, className, event, params, goal, children,
}: { href: string; className?: string; event: string; params?: Params; goal?: string; children: ReactNode }) {
  return (
    <a
      href={href}
      className={className}
      onClick={() => {
        track(event, params);
        if (goal) setIntent({ goal });
      }}
    >
      {children}
    </a>
  );
}

/* ---------- matcher ---------- */

type Option = { label: string; slug: string; name: string; duration: string; price: string; href: string };

const GOAL_BY_SLUG: Record<string, string> = {
  "clp-phuket-health-diagnostics": "Preventive health",
  "clp-phuket-reverse-aging": "Longevity",
  "clp-phuket-essence-of-vitality": "Energy & performance",
  "clp-phuket-life-reset": "Stress & recovery",
  "clp-phuket-master-detox": "Nutrition / metabolic health",
  "clp-phuket-discover-longevity": "Longevity",
};

export function Matcher({ options }: { options: Option[] }) {
  const [sel, setSel] = useState<Option | "unsure" | null>(null);
  const started = useRef(false);

  const pick = (o: Option | "unsure") => {
    if (!started.current) {
      track("programme_matcher_start", { page_section: "matcher" });
      started.current = true;
    }
    setSel(o);
    if (o === "unsure") {
      track("clp_program_select", { goal: "Not sure", page_section: "matcher" });
      setIntent({ goal: "Not sure" });
    } else {
      const goal = GOAL_BY_SLUG[o.slug] || "Not sure";
      track("clp_program_select", { programme: o.slug, goal, page_section: "matcher" });
      track("programme_recommendation_view", { programme: o.slug, goal });
      setIntent({ goal, programme: o.slug });
    }
  };

  return (
    <div>
      <div className={s.tiles} role="radiogroup" aria-label="Your main reason">
        {options.map((o) => (
          <button
            key={o.slug}
            type="button"
            role="radio"
            aria-checked={sel !== "unsure" && sel?.slug === o.slug}
            className={`${s.tile} ${sel !== "unsure" && sel?.slug === o.slug ? s.tileOn : ""}`}
            onClick={() => pick(o)}
          >
            {o.label}
          </button>
        ))}
        <button
          type="button"
          role="radio"
          aria-checked={sel === "unsure"}
          className={`${s.tile} ${sel === "unsure" ? s.tileOn : ""}`}
          onClick={() => pick("unsure")}
        >
          I&apos;m not sure
        </button>
      </div>

      <div className={s.reco} aria-live="polite">
        {sel && sel !== "unsure" && (
          <>
            <p className={s.eyebrow}>Recommended starting point</p>
            <p className={s.recoName}>{sel.name}</p>
            <p className={s.small}>{sel.duration} · from {sel.price.replace(/^CHF/, "CHF")}</p>
            <div className={s.ctaRow}>
              <a href={sel.href} className={s.btnGhost} onClick={() => track("clp_program_view", { programme: sel.slug, page_section: "matcher" })}>
                View programme
              </a>
              <a href="#enquire" className={s.btnPrimary} onClick={() => track("clp_programme_guidance_click", { programme: sel.slug, page_section: "matcher", cta_type: "guidance" })}>
                Get programme guidance
              </a>
            </div>
          </>
        )}
        {sel === "unsure" && (
          <>
            <p className={s.recoName}>Our concierge will help you choose</p>
            <p className={s.small}>Tell us what you want to improve and how much time you have. A person replies, not a bot.</p>
            <div className={s.ctaRow}>
              <a href="#enquire" className={s.btnPrimary} onClick={() => track("clp_programme_guidance_click", { page_section: "matcher", cta_type: "concierge" })}>
                Ask Dream Islands
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- lead form ---------- */

const GOALS = ["Preventive health", "Longevity", "Energy & performance", "Stress & recovery", "Nutrition / metabolic health", "Not sure"];
const TIME = ["2 to 3 days", "About a week", "Flexible"];

export function LeadForm({ programs, ctaLabel }: { programs: { slug: string; name: string }[]; ctaLabel: string }) {
  const intent = useIntent();
  const [goalPick, setGoal] = useState<string | null>(null);
  const [programmePick, setProgramme] = useState<string | null>(null);
  const goal = goalPick ?? intent.goal ?? "";
  const programme = programmePick ?? intent.programme ?? "";
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const started = useRef(false);

  const onStart = () => {
    if (!started.current) {
      started.current = true;
      track("clp_lead_form_start", { page_section: "final_form" });
    }
  };

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (f.get("website")) return; // honeypot
    setState("sending");
    const u = new URLSearchParams(window.location.search);
    const body = {
      name: f.get("name"),
      contact: f.get("contact"),
      country: f.get("country"),
      dates: f.get("dates"),
      time: f.get("time"),
      goal,
      programme,
      notes: f.get("notes"),
      consent: f.get("consent") === "on",
      recommended_program: intent.programme || null,
      utm_source: u.get("utm_source"),
      utm_medium: u.get("utm_medium"),
      utm_campaign: u.get("utm_campaign"),
      traffic_source: trafficSource(),
      page: window.location.pathname,
    };
    try {
      const r = await fetch("/api/clp-lead", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!r.ok) throw new Error(String(r.status));
      setState("done");
      track("clp_lead_submit", { programme: programme || undefined, goal: goal || undefined, page_section: "final_form" });
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className={s.form}>
        <p className={s.recoName}>Thank you. Your request is with us.</p>
        <p className={s.body}>A Dream Islands coordinator will reply with programme guidance and current availability.</p>
        <p className={s.small}>Remain at your disposal, Dream Islands</p>
      </div>
    );
  }

  return (
    <form className={s.form} onSubmit={submit} onFocus={onStart}>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className={s.hp} aria-hidden="true" />
      <label className={s.field}>
        <span>Name *</span>
        <input name="name" required autoComplete="name" />
      </label>
      <label className={s.field}>
        <span>Email or WhatsApp *</span>
        <input name="contact" required autoComplete="email" />
      </label>
      <div className={s.fieldRow}>
        <label className={s.field}>
          <span>Country</span>
          <input name="country" autoComplete="country-name" />
        </label>
        <label className={s.field}>
          <span>Preferred dates</span>
          <input name="dates" placeholder="e.g. early December" />
        </label>
      </div>
      <fieldset className={s.fieldset}>
        <legend>How much time do you have?</legend>
        <div className={s.pills}>
          {TIME.map((t) => (
            <label key={t} className={s.pill}>
              <input type="radio" name="time" value={t} />
              <span>{t}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className={s.fieldset}>
        <legend>What is your main objective?</legend>
        <div className={s.pills}>
          {GOALS.map((g) => (
            <label key={g} className={s.pill}>
              <input type="radio" name="goal" value={g} checked={goal === g} onChange={() => setGoal(g)} />
              <span>{g}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className={s.field}>
        <span>Preferred programme (optional)</span>
        <select value={programme} onChange={(e) => setProgramme(e.target.value)}>
          <option value="">Not sure yet</option>
          {programs.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
        </select>
      </label>
      <label className={s.field}>
        <span>Anything we should know? (optional)</span>
        <textarea name="notes" rows={3} placeholder="Travel plans, who is coming, questions. Please do not send medical records here." />
      </label>
      <label className={s.consent}>
        <input type="checkbox" name="consent" required />
        <span>I agree that Dream Islands may contact me about this request and process the details I provide for that purpose.</span>
      </label>
      <button type="submit" className={s.btnPrimary} disabled={state === "sending"}>
        {state === "sending" ? "Sending" : ctaLabel}
      </button>
      {state === "error" && <p className={s.error}>Something went wrong. Please try again or message us on WhatsApp.</p>}
      <p className={s.fine}>No obligation · Availability subject to confirmation</p>
      <a
        href="https://wa.me/message/HOF2AFIBDYY5J1"
        className={s.textLink}
        target="_blank"
        rel="noopener"
        onClick={() => track("clp_whatsapp_click", { page_section: "final_form" })}
      >
        Prefer WhatsApp? Message a coordinator →
      </a>
    </form>
  );
}

/* ---------- sticky CTA ---------- */

export function StickyCta({ name, from, label }: { name: string; from: string; label: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const hero = document.getElementById("top");
    const form = document.getElementById("enquire");
    let heroOut = false;
    let formIn = false;
    const update = () => setShow(heroOut && !formIn);
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === hero) heroOut = !e.isIntersecting;
        if (e.target === form) formIn = e.isIntersecting;
      }
      update();
    });
    if (hero) io.observe(hero);
    if (form) io.observe(form);
    return () => io.disconnect();
  }, []);
  return (
    <div className={`${s.sticky} ${show ? s.stickyOn : ""}`} aria-hidden={!show}>
      <span className={s.stickyName}>{name}</span>
      <span className={s.stickyPrice}>From {from}</span>
      <a
        href="#enquire"
        className={s.btnPrimary}
        tabIndex={show ? 0 : -1}
        onClick={() => track("clp_request_dates_click", { page_section: "sticky", cta_type: "sticky" })}
      >
        {label}
      </a>
    </div>
  );
}
