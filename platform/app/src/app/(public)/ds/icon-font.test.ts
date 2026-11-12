import { readFileSync, readdirSync, statSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { CUSTOM_ICON_NAMES, ICON_FONT_HREF, ICON_NAMES } from "./icon-font"

// The icon font is a subset (ds/icon-font.ts). A name used in code but missing from ICON_NAMES would show
// as plain text instead of an icon, so this scans the public site for icon names written as literals.

const ROOT = path.resolve(__dirname, "..")

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f)
    if (statSync(p).isDirectory()) return files(p)
    return /\.tsx?$/.test(f) && !f.endsWith(".test.ts") ? [p] : []
  })
}

// <Icon name="x">, icon="x", trailingIcon="x", icon: "x", LEG_ICONS-style [/re/, "x"] pairs and the string
// literals inside icon props such as name={open ? "close" : "menu"}.
const PATTERNS = [
  /<Icon\s+name=["']([a-z0-9_]+)["']/g,
  /\b(?:icon|trailingIcon)=["']([a-z0-9_]+)["']/g,
  /\b(?:icon|Icon|ICON)\w*\s*[:=]\s*["']([a-z0-9_]+)["']/g,
  /\/[a-z]+, "([a-z0-9_]+)"\]/g,
  // a glyph written straight into the icon class, as in <span className="ds-icon">chevron_right</span>
  /className=["'][^"']*\bds-icon\b[^"']*["'][^>]*>\s*([a-z][a-z0-9_]+)\s*</g,
]
const PROP_EXPR = /(?:<Icon\s+name|\bicon|\btrailingIcon)=\{([^{}]*)\}/g
const ICON_MAPS = /(?:GOAL_ICONS|TRACK_ICONS|ICONS)\b[^=]*=\s*\{([^}]*)\}/g

function usedNames(): Set<string> {
  const used = new Set<string>()
  for (const f of files(ROOT)) {
    const src = readFileSync(f, "utf8")
    if (!/\bIcon\b|icon/.test(src)) continue
    for (const re of PATTERNS) for (const m of src.matchAll(re)) used.add(m[1])
    // literals compared in a condition (phase === "submitting" ? ...) are not icon names
    for (const m of src.matchAll(PROP_EXPR)) for (const s of m[1].matchAll(/(?<![=!]==\s*)["']([a-z][a-z0-9_]+)["']/g)) used.add(s[1])
    for (const m of src.matchAll(ICON_MAPS)) for (const s of m[1].matchAll(/:\s*["']([a-z][a-z0-9_]+)["']/g)) used.add(s[1])
  }
  return used
}

describe("icon font subset", () => {
  it("contains every icon name the public site uses", () => {
    const listed = new Set([...ICON_NAMES, ...CUSTOM_ICON_NAMES])
    const missing = [...usedNames()].filter((n) => !listed.has(n)).sort()
    expect(missing).toEqual([])
  })

  it("builds a sorted, de-duplicated icon_names list", () => {
    const list = new URL(ICON_FONT_HREF).searchParams.get("icon_names")!.split(",")
    expect(list).toEqual([...new Set(list)].sort())
    expect(list.length).toBe(new Set(ICON_NAMES).size)
  })
})
