"use client"
// Automatic translation of the public site into Chinese and Indonesian (Oleg 07.11.2026), until specialists
// write the real one. Pages render in English; on /zh and /id this swaps visible text, placeholders, labels,
// alt texts and the title from a dictionary (src/messages/auto/<locale>.json: English → translation). Numbers
// inside a string are matched by a template ("Up to # guests"), so counts and prices need one entry.
// New content (client navigation, sheets, re-renders) is translated as it appears, before it is painted.
// Elements with translate="no" are left alone. The page is hidden until the first pass (layout CSS, with a
// no-JS fallback), so English does not flash.
import { useEffect } from "react"
import { useLocale } from "@/lib/i18n-client"

type Dict = Record<string, string>
const ATTRS = ["placeholder", "aria-label", "alt", "title"] as const
const SKIP = "script,style,noscript,code,pre,textarea,[translate=no],nextjs-portal,.ds-icon,.material-symbols-rounded"

const WD = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const MONTH = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
const DATE = {
  zh: { wd: ["周一", "周二", "周三", "周四", "周五", "周六", "周日"], mon: (m: number) => `${m + 1}月`, month: (m: number) => `${m + 1}月` },
  id: { wd: ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"], mon: (m: number) => ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"][m], month: (m: number) => ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"][m] },
} as const

/** Dates built in code ("Nov 16 to 21", "Mon to Sat", "Mon, Nov 16", "November 2026") */
function dateRule(locale: "zh" | "id", key: string): string | null {
  const L = DATE[locale], w = (x: string) => L.wd[WD.indexOf(x)], m = (x: string) => MON.indexOf(x)
  let r: RegExpMatchArray | null
  if ((r = key.match(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) to (Mon|Tue|Wed|Thu|Fri|Sat|Sun)$/))) return locale === "zh" ? `${w(r[1])}至${w(r[2])}` : `${w(r[1])} sampai ${w(r[2])}`
  if ((r = key.match(/^([A-Z][a-z]{2}) (\d{1,2}) to (\d{1,2})$/)) && m(r[1]) >= 0) return locale === "zh" ? `${L.mon(m(r[1]))}${r[2]}日至${r[3]}日` : `${r[2]}–${r[3]} ${L.mon(m(r[1]))}`
  if ((r = key.match(/^([A-Z][a-z]{2}) (\d{1,2}) to ([A-Z][a-z]{2}) (\d{1,2})$/)) && m(r[1]) >= 0 && m(r[3]) >= 0) return locale === "zh" ? `${L.mon(m(r[1]))}${r[2]}日至${L.mon(m(r[3]))}${r[4]}日` : `${r[2]} ${L.mon(m(r[1]))} – ${r[4]} ${L.mon(m(r[3]))}`
  if ((r = key.match(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), ([A-Z][a-z]{2}) (\d{1,2})$/)) && m(r[2]) >= 0) return locale === "zh" ? `${L.mon(m(r[2]))}${r[3]}日 ${w(r[1])}` : `${w(r[1])}, ${r[3]} ${L.mon(m(r[2]))}`
  if ((r = key.match(/^([A-Z][a-z]{2}) (\d{1,2})$/)) && m(r[1]) >= 0) return locale === "zh" ? `${L.mon(m(r[1]))}${r[2]}日` : `${r[2]} ${L.mon(m(r[1]))}`
  if ((r = key.match(/^([A-Z][a-z]+) (\d{4})$/)) && MONTH.indexOf(r[1]) >= 0) return locale === "zh" ? `${r[2]}年${L.month(MONTH.indexOf(r[1]))}` : `${L.month(MONTH.indexOf(r[1]))} ${r[2]}`
  return null
}

function makeLookup(dict: Dict, locale: "zh" | "id") {
  const keys = Object.keys(dict)
  const one = (key: string): string | null => {
    const hit = dict[key]
    if (hit) return hit
    // Dates go through the rules first: crawled date keys ("Nov # to #") would keep the English month
    const date = dateRule(locale, key)
    if (date) return date
    // Template: numbers become "#" and are put back in order
    const nums = key.match(/\d[\d,.]*/g)
    if (nums) {
      const tpl = dict[key.replace(/\d[\d,.]*/g, "#")]
      if (tpl) { let i = 0; return tpl.replace(/#/g, () => nums[i++] ?? "#") }
    }
    return null
  }
  return (raw: string): string | null => {
    const key = raw.replace(/\s+/g, " ").trim()
    if (!key || !/[A-Za-z]/.test(key)) return null
    const direct = one(key)
    if (direct) return direct
    // "Before you book." when only "Before you book" is in the dictionary
    if (key.endsWith(".") && !key.endsWith("..")) {
      const t = one(key.slice(0, -1))
      if (t) return t + (locale === "zh" ? "。" : ".")
    }
    // "Reserve Nov 16 to 21": a translated word plus a date
    const sp = key.match(/^(Reserve|Request) (.+)$/)
    if (sp) { const a = dict[sp[1]], b = one(sp[2]); if (a && b) return `${a} ${b}` }
    // Text cut with an ellipsis in code: the full sentence's translation, cut to the same share
    const cut = key.match(/^(.{12,}?)\s*(…|\.\.\.)$/)
    if (cut) {
      const nums = cut[1].match(/\d[\d,.]*/g) ?? []
      const pre = cut[1].replace(/\d[\d,.]*/g, "#")
      const full = keys.find((k) => k.startsWith(pre) && k.length > pre.length)
      if (full) {
        let i = 0
        const t = dict[full].replace(/#/g, () => nums[i++] ?? "#")
        return t.slice(0, Math.max(8, Math.round((t.length * pre.length) / full.length))) + "…"
      }
    }
    return null
  }
}

export default function AutoTranslate() {
  const locale = useLocale()
  useEffect(() => {
    if (locale === "en") return
    let stop = false
    let mo: MutationObserver | null = null
    const root = document.querySelector<HTMLElement>(".ds-root")
    const reveal = () => root?.removeAttribute("data-autotr")
    import(`@/messages/auto/${locale}.json`).then((mod) => {
      if (stop) return
      const lookup = makeLookup(mod.default as Dict, locale)
      // What we wrote ourselves: never translate our own output again (an Indonesian
      // translation can look like an English key and loop through the observer)
      const mine = new WeakMap<Node, string>()
      const mineAttr = new WeakMap<Element, Record<string, string>>()
      const setText = (n: Node, v: string) => { mine.set(n, v); n.nodeValue = v }
      const textNode = (n: Text) => {
        const p = n.parentElement
        if (!p || p.closest(SKIP)) return
        const v = n.nodeValue ?? ""
        if (mine.get(n) === v) return
        const tr = lookup(v)
        if (tr && tr !== v.trim()) setText(n, v.replace(/^(\s*)[\s\S]*?(\s*)$/, (_, a, b) => a + tr + b))
      }
      const element = (el: Element) => {
        if (el.closest(SKIP)) return
        const done = mineAttr.get(el) ?? {}
        for (const a of ATTRS) {
          const v = el.getAttribute(a)
          if (!v || done[a] === v) continue
          const tr = lookup(v)
          if (tr && tr !== v) { done[a] = tr; mineAttr.set(el, done); el.setAttribute(a, tr) }
        }
      }
      // "Before you <span class=display-italic>book</span>." is one sentence split across
      // nodes: translate it whole into the first text node and empty the rest (DS v2 renders
      // the italic span upright, so nothing visible is lost).
      const joined = (scope: Element) => {
        const spans = [...(scope.matches(".display-italic") ? [scope] : []), ...scope.querySelectorAll(".display-italic")]
        for (const span of spans) {
          const p = span.parentElement
          if (!p || p.closest(SKIP) || p.querySelector(":scope > :not(.display-italic):not(br)")) continue
          const whole = p.textContent ?? ""
          if (mine.get(p) === whole) continue
          const tr = lookup(whole)
          if (!tr) continue
          mine.set(p, tr)
          const w = document.createTreeWalker(p, NodeFilter.SHOW_TEXT)
          let t: Node | null
          let first = true
          while ((t = w.nextNode())) { setText(t, first ? tr : ""); first = false }
        }
      }
      const walk = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) return textNode(node as Text)
        if (node.nodeType !== Node.ELEMENT_NODE) return
        const el = node as Element
        if (el.closest(SKIP)) return
        joined(el)
        element(el)
        el.querySelectorAll(ATTRS.map((a) => `[${a}]`).join(",")).forEach(element)
        const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
        let t: Node | null
        while ((t = w.nextNode())) textNode(t as Text)
      }
      let titleSet = ""
      const title = () => {
        const v = document.title
        if (v === titleSet) return
        const tr = lookup(v)
        if (tr && tr !== v) { titleSet = tr; document.title = tr }
      }
      walk(document.body)
      title()
      reveal()
      mo = new MutationObserver((list) => {
        for (const m of list) {
          if (m.type === "characterData") textNode(m.target as Text)
          else if (m.type === "attributes") element(m.target as Element)
          else m.addedNodes.forEach(walk)
        }
        title()
      })
      mo.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: [...ATTRS] })
      const head = document.querySelector("title")
      if (head) mo.observe(head, { childList: true, characterData: true, subtree: true })
    }).catch(reveal)
    return () => { stop = true; mo?.disconnect() }
  }, [locale])
  return null
}
