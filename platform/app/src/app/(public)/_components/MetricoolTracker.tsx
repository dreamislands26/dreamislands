"use client"
import { useEffect } from "react"

const HASH = "3797300fe58607950b9df134f69c634"
type BeWindow = Window & { beTracker?: { t: (o: { hash: string }) => void } }

function analyticsGranted() {
  try {
    const c = JSON.parse(localStorage.getItem("di_consent") || "null")
    return c?.analytics_storage === "granted"
  } catch {
    return false
  }
}

/** Metricool web tracker, loaded only after the visitor grants analytics consent. */
export default function MetricoolTracker() {
  useEffect(() => {
    let loaded = false
    const load = () => {
      if (loaded) return
      loaded = true
      const sc = document.createElement("script")
      sc.src = "https://tracker.metricool.com/resources/be.js"
      sc.async = true
      sc.onload = () => (window as BeWindow).beTracker?.t({ hash: HASH })
      document.head.appendChild(sc)
    }
    if (analyticsGranted()) {
      load()
      return
    }
    const id = window.setInterval(() => {
      if (analyticsGranted()) {
        window.clearInterval(id)
        load()
      }
    }, 1500)
    return () => window.clearInterval(id)
  }, [])
  return null
}
