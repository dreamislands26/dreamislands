"use client"
// Favorites live in localStorage until there is a backend for them.
// Kept small: a list of { kind, id } plus the card data needed to render Saved.
import { useSyncExternalStore } from "react"

export type SavedItem = {
  kind: "program" | "place"
  id: string
  title: string
  href: string
  image: string | null
  meta?: string
  price?: string
}

const KEY = "di_saved_v1"
const EVENT = "di-saved-change"

function read(): SavedItem[] {
  try {
    const raw = window.localStorage.getItem(KEY)
    const list = raw ? (JSON.parse(raw) as SavedItem[]) : []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

let cache: SavedItem[] | null = null
function snapshot(): SavedItem[] {
  if (cache === null) cache = read()
  return cache
}
const EMPTY: SavedItem[] = []

function write(list: SavedItem[]) {
  cache = list
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    // private mode: keep the in-memory copy for this visit
  }
  window.dispatchEvent(new Event(EVENT))
}

function subscribe(cb: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null
      cb()
    }
  }
  window.addEventListener(EVENT, cb)
  window.addEventListener("storage", onStorage)
  return () => {
    window.removeEventListener(EVENT, cb)
    window.removeEventListener("storage", onStorage)
  }
}

export function useSaved(): SavedItem[] {
  return useSyncExternalStore(subscribe, snapshot, () => EMPTY)
}

export function isSaved(list: SavedItem[], kind: SavedItem["kind"], id: string) {
  return list.some((x) => x.kind === kind && x.id === id)
}

/** Returns true when the item is saved after the toggle. */
export function toggleSaved(item: SavedItem): boolean {
  const list = snapshot()
  const exists = isSaved(list, item.kind, item.id)
  write(exists ? list.filter((x) => !(x.kind === item.kind && x.id === item.id)) : [item, ...list])
  return !exists
}
