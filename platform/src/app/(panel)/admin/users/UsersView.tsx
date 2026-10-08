"use client"

import { SettingOutlined } from "@ant-design/icons"
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  Dropdown,
  Empty,
  Input,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd"
import type { ColumnsType } from "antd/es/table"
import { useRouter, useSearchParams } from "next/navigation"
import { useMemo, useState } from "react"
import { rowNav } from "../../_components/rowNav"
import {
  computeKpis,
  STAGE_COLOR,
  STAGE_LABEL,
  type DbBooking,
  type GuestRow,
  type Stage,
} from "@/lib/guest-metrics"

const { Text, Title } = Typography

export type { GuestRow as UserRow }

export type ProgramOption = { id: string; name: string; cohort: number | null; tier: string | null }
export type PropertyOption = { id: string; name: string; slug: string }

const MONO: React.CSSProperties = { fontFamily: "ui-monospace, monospace", fontWeight: 600 }
const DASH = <Text type="secondary">—</Text>

const TONE_COLOR: Record<string, string> = { urgent: "red", due: "gold", idle: "default" }

function FilterLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text
      type="secondary"
      style={{ fontSize: 11, letterSpacing: 0.3, display: "block", marginBottom: 2 }}
    >
      {children}
    </Text>
  )
}

function wbsColor(score: number | null): string {
  if (score == null) return "#9aa6a1"
  if (score >= 70) return "#0F6E56"
  if (score >= 50) return "#b3781b"
  return "#a8362b"
}

function deltaColor(d: number): string {
  return d > 0 ? "#0F6E56" : d < 0 ? "#a8362b" : "#9aa6a1"
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

function shortDate(v: string | null): string {
  if (!v) return "—"
  const d = new Date(v)
  return `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`
}

function relativeDays(v: string | null): string {
  if (!v) return "—"
  const d = Math.round((Date.now() - new Date(v).getTime()) / 86_400_000)
  if (d <= 0) return "today"
  if (d === 1) return "yesterday"
  if (d < 30) return `${d}d ago`
  if (d < 365) return `${Math.round(d / 30)}mo ago`
  return `${Math.round(d / 365)}y ago`
}

function money(usd: number, thb: number): React.ReactNode {
  if (usd === 0 && thb === 0) return DASH
  return (
    <span style={{ ...MONO, fontSize: 12 }}>
      {usd > 0 && <div>${Math.round(usd).toLocaleString("en-US")}</div>}
      {thb > 0 && <div style={{ color: "#6b7a74" }}>฿{Math.round(thb).toLocaleString("en-US")}</div>}
    </span>
  )
}

/* ─── Column set ───────────────────────────────────────────── */

type ColKey =
  | "created"
  | "last_activity"
  | "market"
  | "ws"
  | "goal"
  | "program"
  | "property"
  | "travel"
  | "stage"
  | "distribution"
  | "acquisition"
  | "technical"
  | "partner"
  | "gmv"
  | "delta"
  | "next_action"

const COL_LABEL: Record<ColKey, string> = {
  created: "Created",
  last_activity: "Last activity",
  market: "Market",
  ws: "WS",
  goal: "Goal",
  program: "Program",
  property: "Property",
  travel: "Travel dates",
  stage: "Journey stage",
  distribution: "Distribution",
  acquisition: "Acquisition",
  technical: "Tech source",
  partner: "Partner",
  gmv: "GMV",
  delta: "Outcome ΔWS",
  next_action: "Next action",
}

// Day-to-day operational set. The rest stay one click away in the column picker
// rather than turning the table back into a full data dump.
// Sized to fit a 1440px viewport next to the nav without clipping. Everything
// else is one click away in the column picker.
const DEFAULT_COLS: ColKey[] = [
  "stage",
  "gmv",
  "next_action",
  "travel",
  "program",
  "delta",
]

const ALL_COLS: ColKey[] = [
  "stage",
  "gmv",
  "next_action",
  "travel",
  "program",
  "property",
  "partner",
  "distribution",
  "ws",
  "delta",
  "goal",
  "market",
  "acquisition",
  "technical",
  "created",
  "last_activity",
]

/* ─── KPI header ───────────────────────────────────────────── */

function Kpi({
  label,
  value,
  hint,
  color,
}: {
  label: string
  value: React.ReactNode
  hint?: React.ReactNode
  color?: string
}) {
  return (
    <Card
      variant="borderless"
      styles={{ body: { padding: "14px 18px" } }}
      style={{ height: "100%" }}
    >
      <Text
        type="secondary"
        style={{ fontSize: 11, letterSpacing: 0.6, textTransform: "uppercase" }}
      >
        {label}
      </Text>
      <div style={{ fontSize: 26, fontWeight: 600, lineHeight: 1.25, color: color ?? undefined }}>
        {value}
      </div>
      <Text type="secondary" style={{ fontSize: 12 }}>
        {hint ?? " "}
      </Text>
    </Card>
  )
}

function KpiHeader({ rows, bookings }: { rows: GuestRow[]; bookings: DbBooking[] }) {
  const k = useMemo(() => computeKpis(rows, bookings), [rows, bookings])

  // Revenue first, then the funnel that produces it, then outcome quality.
  return (
    <Row gutter={[12, 12]}>
      <Col xs={24} md={12} xl={6}>
        <Kpi
          label="GMV 30d"
          value={
            k.gmvUsd30 === 0 && k.gmvThb30 === 0 ? (
              "—"
            ) : (
              <Space size={10} wrap>
                {k.gmvUsd30 > 0 && <span>${Math.round(k.gmvUsd30).toLocaleString("en-US")}</span>}
                {k.gmvThb30 > 0 && (
                  <span style={{ color: "#6b7a74" }}>
                    ฿{Math.round(k.gmvThb30).toLocaleString("en-US")}
                  </span>
                )}
              </Space>
            )
          }
          hint={`${k.bookings30} booking${k.bookings30 === 1 ? "" : "s"} · no FX conversion`}
        />
      </Col>
      <Col xs={12} md={8} xl={5}>
        <Kpi
          label="Conversion"
          value={k.conversionPct == null ? "—" : `${k.conversionPct}%`}
          hint={`${k.conversionFrom} of ${k.conversionTo} live past inquiry`}
        />
      </Col>
      <Col xs={12} md={8} xl={4}>
        <Kpi label="Active now" value={k.activeNow} hint="in stay today" />
      </Col>
      <Col xs={12} md={8} xl={4}>
        <Kpi
          label="Guests"
          value={k.total}
          hint={k.addedLast30 > 0 ? `+${k.addedLast30} in 30d` : "no new in 30d"}
        />
      </Col>
      <Col xs={12} md={12} xl={5}>
        <Kpi
          label="Avg ΔWS"
          value={k.avgDelta == null ? "—" : `${k.avgDelta > 0 ? "+" : ""}${k.avgDelta}`}
          hint={k.deltaSample > 0 ? `n=${k.deltaSample} pre/post pairs` : "no pre/post pairs yet"}
          color={k.avgDelta == null ? undefined : deltaColor(k.avgDelta)}
        />
      </Col>
    </Row>
  )
}

/* ─── List ─────────────────────────────────────────────────── */

export default function UsersView({
  rows,
  bookings,
  programOptions,
  propertyOptions,
  activeFilters,
  errorMessage,
  basePath = "/admin/users",
  role = "admin",
  title,
  embedded = false,
}: {
  rows: GuestRow[]
  bookings: DbBooking[]
  programOptions: ProgramOption[]
  propertyOptions: PropertyOption[]
  activeFilters: { program: string | null; property: string | null }
  errorMessage: string | null
  basePath?: string
  role?: "admin" | "partner"
  title?: string
  /** Rendered inside a property page: the row set is already scoped, so the
   *  page heading and the program/property pickers are dropped. */
  embedded?: boolean
}) {
  const router = useRouter()
  const search = useSearchParams()

  const [query, setQuery] = useState("")
  const [stage, setStage] = useState<Stage | null>(null)
  const [acquisition, setAcquisition] = useState<string | null>(null)
  const [distribution, setDistribution] = useState<string | null>(null)
  const [technical, setTechnical] = useState<string | null>(null)
  const [cols, setCols] = useState<ColKey[]>(DEFAULT_COLS)

  function setUrlFilter(key: "program" | "property", value: string | null) {
    const params = new URLSearchParams(search.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`${basePath}${params.toString() ? `?${params.toString()}` : ""}`)
  }

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((r) => {
      if (stage && r.stage !== stage) return false
      if (acquisition && r.acquisition !== acquisition) return false
      if (distribution && r.distribution !== distribution) return false
      if (technical && r.technical !== technical) return false
      if (q) {
        const hay =
          `${r.name ?? ""} ${r.email ?? ""} ${r.whatsapp ?? ""} ${r.country ?? ""}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [rows, query, stage, acquisition, distribution, technical])

  const optionsFor = (key: "acquisition" | "distribution" | "technical") =>
    Array.from(new Set(rows.map((r) => r[key])))
      .sort()
      .map((v) => ({ value: v, label: v }))

  const allColumns: Record<ColKey, ColumnsType<GuestRow>[number]> = {
    stage: {
      title: "Stage",
      key: "stage",
      width: 100,
      sorter: (a, b) => a.stage.localeCompare(b.stage),
      render: (_v, r) => <Tag color={STAGE_COLOR[r.stage]}>{STAGE_LABEL[r.stage]}</Tag>,
    },
    next_action: {
      title: "Next action",
      key: "next_action",
      width: 158,
      render: (_v, r) => <Tag color={TONE_COLOR[r.next_action.tone]}>{r.next_action.label}</Tag>,
    },
    ws: {
      title: (
        <Tooltip title="Current wellbeing score — latest daily reading, else post-stay, else baseline">
          WS
        </Tooltip>
      ),
      key: "ws",
      width: 80,
      sorter: (a, b) => (a.ws_current ?? -1) - (b.ws_current ?? -1),
      render: (_v, r) =>
        r.ws_current != null ? (
          <span style={{ ...MONO, color: wbsColor(r.ws_current) }}>{r.ws_current}</span>
        ) : (
          DASH
        ),
    },
    delta: {
      title: <Tooltip title="Outcome ΔWS — pre-stay to post-stay">ΔWS</Tooltip>,
      key: "delta",
      width: 140,
      sorter: (a, b) => (a.delta_ws ?? -999) - (b.delta_ws ?? -999),
      render: (_v, r) => {
        if (r.pre_wbs == null && r.post_wbs == null) return DASH
        return (
          <span style={MONO}>
            <span style={{ color: wbsColor(r.pre_wbs) }}>{r.pre_wbs ?? "—"}</span>
            <span style={{ color: "#9aa6a1", margin: "0 4px" }}>→</span>
            <span style={{ color: wbsColor(r.post_wbs) }}>{r.post_wbs ?? "—"}</span>
            {r.delta_ws != null && (
              <span style={{ color: deltaColor(r.delta_ws), marginLeft: 8 }}>
                ({r.delta_ws > 0 ? "+" : ""}
                {r.delta_ws})
              </span>
            )}
          </span>
        )
      },
    },
    goal: {
      title: "Goal",
      key: "goal",
      width: 150,
      render: (_v, r) => (r.goal ? <Text style={{ fontSize: 13 }}>{r.goal}</Text> : DASH),
    },
    program: {
      title: "Program",
      key: "program",
      render: (_v, r) =>
        r.program_names.length > 0 ? (
          <Text style={{ fontSize: 13 }}>{r.program_names.join(", ")}</Text>
        ) : (
          DASH
        ),
    },
    property: {
      title: "Property",
      key: "property",
      render: (_v, r) =>
        r.property_names.length > 0 ? (
          <Text type="secondary" style={{ fontSize: 13 }}>
            {r.property_names.join(", ")}
          </Text>
        ) : (
          DASH
        ),
    },
    travel: {
      title: "Travel dates",
      key: "travel",
      width: 162,
      sorter: (a, b) => (a.arrival ?? "").localeCompare(b.arrival ?? ""),
      render: (_v, r) =>
        r.arrival || r.departure ? (
          <Text style={{ fontSize: 12, whiteSpace: "nowrap" }}>
            {shortDate(r.arrival)} → {shortDate(r.departure)}
          </Text>
        ) : (
          DASH
        ),
    },
    partner: {
      title: "Partner",
      key: "partner",
      width: 150,
      render: (_v, r) =>
        r.partner_names.length > 0 ? (
          <Text style={{ fontSize: 13 }}>{r.partner_names.join(", ")}</Text>
        ) : (
          DASH
        ),
    },
    gmv: {
      title: "GMV",
      key: "gmv",
      width: 104,
      sorter: (a, b) => a.gmv_usd - b.gmv_usd || a.gmv_thb - b.gmv_thb,
      render: (_v, r) => money(r.gmv_usd, r.gmv_thb),
    },
    market: {
      title: "Market",
      key: "market",
      width: 110,
      render: (_v, r) => (r.market ? <Text type="secondary">{r.market}</Text> : DASH),
    },
    distribution: {
      title: "Distribution",
      key: "distribution",
      width: 125,
      render: (_v, r) => <Tag>{r.distribution}</Tag>,
    },
    acquisition: {
      title: "Acquisition",
      key: "acquisition",
      width: 125,
      render: (_v, r) => <Tag>{r.acquisition}</Tag>,
    },
    technical: {
      title: "Tech source",
      key: "technical",
      width: 120,
      render: (_v, r) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {r.technical}
        </Text>
      ),
    },
    created: {
      title: "Created",
      key: "created",
      width: 115,
      sorter: (a, b) => a.created_at.localeCompare(b.created_at),
      render: (_v, r) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {shortDate(r.created_at)}
        </Text>
      ),
    },
    last_activity: {
      title: "Last activity",
      key: "last_activity",
      width: 125,
      defaultSortOrder: "descend",
      sorter: (a, b) => (a.last_activity ?? "").localeCompare(b.last_activity ?? ""),
      render: (_v, r) => (
        <Tooltip title={relativeDays(r.last_activity)}>
          <Text type="secondary" style={{ fontSize: 12, whiteSpace: "nowrap" }}>
            {shortDate(r.last_activity)}
          </Text>
        </Tooltip>
      ),
    },
  }

  const columns: ColumnsType<GuestRow> = [
    {
      title: "Guest",
      key: "name",
      fixed: "left",
      width: 235,
      render: (_v, r) => (
        <div>
          <Text strong>{r.name ?? "—"}</Text>
          {r.email && (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {r.email}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    ...ALL_COLS.filter((c) => cols.includes(c)).map((c) => allColumns[c]),
  ]

  return (
    <Space direction="vertical" size={20} style={{ width: "100%" }}>
      {!embedded && (
        <div>
          <Title level={4} style={{ margin: 0 }}>
            {title ?? `${rows.length} ${rows.length === 1 ? "guest" : "guests"}`}
          </Title>
          <Text type="secondary">
            {role === "partner"
              ? "Guests with bookings on your properties"
              : "Intake leads from Cura (WhatsApp/LINE AI), WBS form and direct entries"}
          </Text>
        </div>
      )}

      {errorMessage && <Alert type="error" message={`DB error: ${errorMessage}`} showIcon />}

      <KpiHeader rows={visible} bookings={bookings} />

      <Card variant="borderless">
        {/* One line on wide screens; each control keeps a usable minimum and
            wraps only when the viewport can no longer hold the row. */}
        <Row gutter={[12, 12]} align="bottom" wrap>
          <Col flex="1 1 190px">
            <FilterLabel>SEARCH</FilterLabel>
            <Input
              allowClear
              placeholder="Name, email, phone"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </Col>
          {!embedded && (
            <Col flex="1 1 150px">
              <FilterLabel>PROGRAM</FilterLabel>
              <Select
                allowClear
                placeholder="Any"
                value={activeFilters.program ?? undefined}
                onChange={(v) => setUrlFilter("program", v ?? null)}
                showSearch
                optionFilterProp="label"
                style={{ width: "100%" }}
                options={programOptions.map((p) => ({ value: p.id, label: p.name }))}
              />
            </Col>
          )}
          {role !== "partner" && !embedded && (
            <Col flex="1 1 150px">
              <FilterLabel>PROPERTY</FilterLabel>
              <Select
                allowClear
                placeholder="Any"
                value={activeFilters.property ?? undefined}
                onChange={(v) => setUrlFilter("property", v ?? null)}
                showSearch
                optionFilterProp="label"
                style={{ width: "100%" }}
                options={propertyOptions.map((p) => ({ value: p.id, label: p.name }))}
              />
            </Col>
          )}
          <Col flex="1 1 130px">
            <FilterLabel>STAGE</FilterLabel>
            <Select
              allowClear
              placeholder="Any"
              value={stage ?? undefined}
              onChange={(v) => setStage(v ?? null)}
              style={{ width: "100%" }}
              options={(Object.keys(STAGE_LABEL) as Stage[]).map((s) => ({
                value: s,
                label: STAGE_LABEL[s],
              }))}
            />
          </Col>
          <Col flex="1 1 130px">
            <FilterLabel>ACQUISITION</FilterLabel>
            <Select
              allowClear
              placeholder="Any"
              value={acquisition ?? undefined}
              onChange={(v) => setAcquisition(v ?? null)}
              style={{ width: "100%" }}
              options={optionsFor("acquisition")}
            />
          </Col>
          <Col flex="1 1 130px">
            <FilterLabel>DISTRIBUTION</FilterLabel>
            <Select
              allowClear
              placeholder="Any"
              value={distribution ?? undefined}
              onChange={(v) => setDistribution(v ?? null)}
              style={{ width: "100%" }}
              options={optionsFor("distribution")}
            />
          </Col>
          <Col flex="1 1 130px">
            <FilterLabel>TECH SOURCE</FilterLabel>
            <Select
              allowClear
              placeholder="Any"
              value={technical ?? undefined}
              onChange={(v) => setTechnical(v ?? null)}
              style={{ width: "100%" }}
              options={optionsFor("technical")}
            />
          </Col>
          <Col flex="0 0 auto">
            <Dropdown
              trigger={["click"]}
              menu={{ items: [] }}
              popupRender={() => (
                <Card styles={{ body: { padding: 12 } }}>
                  <Checkbox.Group
                    value={cols}
                    onChange={(v) => setCols(v as ColKey[])}
                    style={{ display: "flex", flexDirection: "column", gap: 6 }}
                    options={ALL_COLS.map((c) => ({ value: c, label: COL_LABEL[c] }))}
                  />
                </Card>
              )}
            >
              <Tooltip title={`Columns (${cols.length} of ${ALL_COLS.length})`}>
                <Button icon={<SettingOutlined />} aria-label="Choose columns" />
              </Tooltip>
            </Dropdown>
          </Col>
        </Row>
      </Card>

      <Card variant="borderless" styles={{ body: { padding: 0 } }}>
        <Table<GuestRow>
          rowKey="id"
          columns={columns}
          dataSource={visible}
          pagination={visible.length > 50 ? { pageSize: 50, showSizeChanger: false } : false}
          scroll={{ x: "max-content" }}
          onRow={(r) => rowNav(() => router.push(`${basePath}/${r.id}`))}
          locale={{ emptyText: <Empty description="No guests match the filters" /> }}
        />
      </Card>
    </Space>
  )
}
