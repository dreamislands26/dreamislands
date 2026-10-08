import type { MouseEvent } from "react"

const INTERACTIVE = "a,button,input,textarea,select,label,.ant-switch,.ant-select,.ant-checkbox,.ant-dropdown-trigger"

/**
 * Makes a whole table row a click target. Clicks that landed on the row's own
 * controls (edit/delete buttons, inline switches, the name link) are left alone
 * so they keep their original behaviour.
 */
export function rowNav(onNavigate: () => void) {
  return {
    style: { cursor: "pointer" } as const,
    onClick: (e: MouseEvent<HTMLElement>) => {
      if ((e.target as HTMLElement).closest(INTERACTIVE)) return
      onNavigate()
    },
  }
}
