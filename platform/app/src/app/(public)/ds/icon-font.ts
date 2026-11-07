// Material Symbols Rounded, Light (300), loaded from Google Fonts as a SUBSET: only the glyphs listed here
// are downloaded (~66 KB instead of the full 1.4 MB font).
//
// Adding an icon? Put its exact Material Symbols name in ICON_NAMES (any order) or it renders as plain text.
// `npx vitest run` (icon-font.test.ts) fails when the code uses an icon name that is missing here.
export const ICON_NAMES = [
  "account_balance", "add", "apartment", "api", "arrow_back", "arrow_forward", "article", "assessment",
  "badge", "battery_alert", "beach_access", "bed", "bedtime", "biotech", "block", "bolt", "bookmark",
  "calendar_add_on", "calendar_month", "category", "chat", "check", "check_circle", "close", "cloud_done",
  "code", "concierge", "confirmation_number", "contact_phone", "credit_card_off", "dashboard", "description",
  "details", "devices", "directions_boat", "directions_bus", "directions_car", "directions_run",
  "directions_walk", "do_not_disturb_on", "done", "draft", "eco", "edit_note", "email", "energy", "error",
  "event", "event_available", "expand_more", "eyebrow", "face_retouching_natural", "fact_check", "favorite",
  "female", "fitness_center", "flight", "flight_land", "forest", "forum", "function", "grid_view", "group",
  "healing", "heart_broken", "help", "height", "home_health", "host", "http", "info", "input", "insights",
  "ios_share", "key", "landscape", "list", "local_florist", "location_on", "lock", "login", "logout", "male",
  "mark_chat_read", "massage", "medical_information", "medical_services", "menu", "mobile", "monitor_weight",
  "monitoring", "note", "notes", "nutrition", "outbound", "paid", "payment", "payments", "pending", "person",
  "photo", "place", "pool", "post", "priority", "psychology", "psychology_alt", "public", "radio",
  "radio_button_unchecked", "relax", "remove", "resize", "reviews", "rocket_launch", "save", "score",
  "script", "search", "self_improvement", "send", "signature", "sleep", "source", "spa", "sports_martial_arts",
  "sprint", "star", "start", "step", "steps", "stethoscope", "storage", "support_agent", "surfing", "tab",
  "tablet", "tag", "temple_buddhist", "train", "translate", "travel_explore", "tune", "update", "verified",
  "view_agenda", "visibility", "weekend", "weight", "width",
]

/** Glyphs Material Symbols lacks, drawn as SVG on its 24 grid (ds/ui.tsx CUSTOM_ICONS). Not in the font. */
export const CUSTOM_ICON_NAMES = ["dit_apple", "dit_bed_single", "dit_bed_twin", "dit_bed_double", "dit_rooms", "dit_villa"]

const AXES = "opsz,wght,FILL,GRAD@20..48,300,0..1,0"

/** Stylesheet URL. Google wants the names sorted and comma-separated. */
export const ICON_FONT_HREF =
  `https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:${AXES}` +
  `&icon_names=${[...new Set(ICON_NAMES)].sort().join(",")}&display=block`
