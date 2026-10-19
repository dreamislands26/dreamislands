// Map coordinates for property locations (properties.island). The database has no coordinates, so the
// catalogue map uses this table; a location missing here simply gets no pin.
export const PLACE_COORDS: Record<string, [number, number]> = {
  "Koh Samui": [9.512, 100.013],
  "Koh Phangan": [9.731, 100.013],
  "Bintan": [1.06, 104.47],
  "Bali": [-8.507, 115.263],
  "Mile, Yunnan": [24.408, 103.442],
  "Xishuangbanna, Yunnan": [22.008, 100.797],
  "Pu'er, Yunnan": [22.825, 100.966],
  "Sanya, Hainan": [18.252, 109.512],
  "Xi'an": [34.341, 108.94],
  "Beijing": [39.904, 116.407],
  "Shanghai": [31.23, 121.474],
  "Wudang Mountain": [32.4, 111.004],
  "Guangzhou": [23.129, 113.264],
  "Chengdu": [30.572, 104.066],
  "Huizhou, Guangdong": [23.111, 114.416],
  "Penang": [5.416, 100.333],
  "Langkawi": [6.35, 99.8],
  "Cebu": [10.316, 123.885],
  "Boracay": [11.967, 121.925],
  "Phu Quoc": [10.289, 103.984],
  "Singapore": [1.352, 103.82],
  "Sentosa": [1.249, 103.83],
}

/** "Koh Samui, Thailand" -> coordinates of the longest matching place name. */
export function coordsFor(location: string): { key: string; at: [number, number] } | null {
  let best: string | null = null
  for (const k of Object.keys(PLACE_COORDS)) if (location.startsWith(k) && (!best || k.length > best.length)) best = k
  return best ? { key: best, at: PLACE_COORDS[best] } : null
}
