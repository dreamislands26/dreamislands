"use client"

import { Alert, Card, Col, Empty, Input, Row, Space, Table, Tag, Tooltip, Typography } from "antd"
import type { ColumnsType } from "antd/es/table"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import type { InsightGuestRow, Insights, Stage } from "@/lib/partner-insights"

const { Text, Title, Paragraph } = Typography

type Badge = "live" | "agg" | "empty" | "future"

const BADGE: Record<Badge, { color: string; dot: string; label: string }> = {
  live: { color: "green", dot: "#3f7a56", label: "Live data" },
  agg: { color: "purple", dot: "#6555c7", label: "Aggregate pattern" },
  empty: { color: "default", dot: "#9aa6a1", label: "Not yet collected" },
  future: { color: "gold", dot: "#a06a2a", label: "Future integration" },
}

const STAGE_META: Record<Stage, { label: string; color: string }> = {
  inquiry: { label: "Inquiry", color: "#bfc8c4" },
  confirmed: { label: "Confirmed", color: "#d9a441" },
  active: { label: "Active", color: "#4a7fd6" },
  completed: { label: "Completed", color: "#1D9E75" },
  cancelled: { label: "Cancelled", color: "#d0574b" },
}

const STATUS_TAG: Record<string, string> = {
  inquiry: "default",
  confirmed: "gold",
  active: "blue",
  completed: "green",
  cancelled: "volcano",
}

function Pill({ kind, text }: { kind: Badge; text?: string }) {
  return (
    <Tag color={BADGE[kind].color} style={{ marginInlineEnd: 0, fontWeight: 500 }}>
      {text ?? (kind === "live" ? "Live" : BADGE[kind].label)}
    </Tag>
  )
}

function PanelTitle({ title, badge, badgeText }: { title: string; badge: Badge; badgeText?: string }) {
  return (
    <Space size={8}>
      <Text strong>{title}</Text>
      <Pill kind={badge} text={badgeText} />
    </Space>
  )
}

function Kpi({ title, badge, value, sub }: { title: string; badge: Badge; value: string; sub: string }) {
  return (
    <Card variant="borderless" style={{ height: "100%" }}>
      <Space size={8} wrap style={{ marginBottom: 6 }}>
        <Text type="secondary" style={{ fontSize: 12, letterSpacing: 0.3 }}>
          {title.toUpperCase()}
        </Text>
        <Pill kind={badge} />
      </Space>
      <div style={{ fontSize: 28, fontWeight: 600, color: badge === "empty" ? "#9aa6a1" : "#10221c", lineHeight: 1.3 }}>
        {value}
      </div>
      <Text type="secondary" style={{ fontSize: 12 }}>
        {sub}
      </Text>
    </Card>
  )
}

function UpliftBars({ items }: { items: Insights["performance"] }) {
  if (!items.length) return <Empty description="No bookings with both a pre and a post score yet" />
  const max = Math.max(...items.map((i) => i.delta), 1)
  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 16, height: 220, minWidth: items.length * 76 }}>
        {items.map((i) => (
          <div key={i.program_id} style={{ flex: 1, minWidth: 60, height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
            <Tooltip title={`${i.name} · WS delta: ${i.delta > 0 ? "+" : ""}${i.delta} · n = ${i.n}`}>
              <div style={{ textAlign: "center", fontSize: 12, fontWeight: 600, color: "#0F6E56", marginBottom: 4 }}>
                {i.delta > 0 ? "+" : ""}
                {i.delta}
              </div>
              <div
                style={{
                  height: `${Math.max(4, (Math.max(0, i.delta) / max) * 150)}px`,
                  background: "#1D9E75",
                  borderRadius: "6px 6px 0 0",
                }}
              />
            </Tooltip>
            <div style={{ fontSize: 11, color: "#5b6b65", marginTop: 8, lineHeight: 1.25, height: 40, overflow: "hidden", textAlign: "center" }}>
              {i.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Donut({ stages }: { stages: Insights["stages"] }) {
  const total = Object.values(stages).reduce((s, n) => s + n, 0)
  let offset = 0
  const order = Object.keys(STAGE_META) as Stage[]
  return (
    <Row gutter={[32, 16]} align="middle">
      <Col flex="180px">
        <svg width={180} height={180} viewBox="0 0 42 42" style={{ transform: "rotate(-90deg)" }} role="img"
          aria-label="Bookings by stage">
          <circle cx={21} cy={21} r={15.9} fill="transparent" stroke="#eef1ef" strokeWidth={7} />
          {total > 0 &&
            order.map((s) => {
              const pct = (stages[s] / total) * 100
              const el = (
                <circle key={s} cx={21} cy={21} r={15.9} fill="transparent" stroke={STAGE_META[s].color}
                  strokeWidth={7} strokeDasharray={`${pct} ${100 - pct}`} strokeDashoffset={-offset} />
              )
              offset += pct
              return el
            })}
        </svg>
      </Col>
      <Col flex="auto">
        <Space direction="vertical" size={8}>
          {order.map((s) => (
            <Space key={s} size={10}>
              <span style={{ display: "inline-block", width: 12, height: 12, borderRadius: 3, background: STAGE_META[s].color }} />
              <Text>
                {STAGE_META[s].label} — {stages[s]}
              </Text>
            </Space>
          ))}
        </Space>
      </Col>
    </Row>
  )
}

export default function InsightsView({
  data,
  scopeLabel,
  guestBasePath,
  noScope,
}: {
  data: Insights
  scopeLabel: string
  guestBasePath: string
  noScope?: boolean
}) {
  const router = useRouter()
  const [query, setQuery] = useState("")

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return data.guests
    return data.guests.filter((g) => `${g.guest} ${g.program} ${g.status}`.toLowerCase().includes(q))
  }, [data.guests, query])

  const byStr = (k: keyof InsightGuestRow) => (a: InsightGuestRow, b: InsightGuestRow) =>
    String(a[k] ?? "").localeCompare(String(b[k] ?? ""))
  const byNum = (k: "pre" | "post") => (a: InsightGuestRow, b: InsightGuestRow) => (a[k] ?? -1) - (b[k] ?? -1)
  const dash = (v: number | null) => (v == null ? <Text type="secondary">–</Text> : v)

  const columns: ColumnsType<InsightGuestRow> = [
    { title: "Guest", dataIndex: "guest", key: "guest", sorter: byStr("guest"), render: (v: string) => <Text strong>{v}</Text> },
    { title: "Program", dataIndex: "program", key: "program", sorter: byStr("program") },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      sorter: byStr("status"),
      render: (v: string) => <Tag color={STATUS_TAG[v] ?? "default"}>{v}</Tag>,
    },
    { title: "Arrival", dataIndex: "arrival", key: "arrival", sorter: byStr("arrival"), defaultSortOrder: "descend", render: (v: string | null) => v ?? "—" },
    { title: "Pre", dataIndex: "pre", key: "pre", sorter: byNum("pre"), align: "right", width: 80, render: dash },
    { title: "Post", dataIndex: "post", key: "post", sorter: byNum("post"), align: "right", width: 80, render: dash },
  ]

  // Fixed format: locale-dependent time (20:46 vs 08:46 PM) breaks hydration between server and browser.
  const checked = `${data.checkedAt.slice(11, 16)} UTC`
  const performanceDim = data.dimensions.find((d) => d.key === "sub_performance")

  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <div>
        <Text type="secondary" style={{ fontSize: 12, letterSpacing: 0.3 }}>
          DREAM ISLANDS — WELLNESS INTELLIGENCE
        </Text>
        <Title level={3} style={{ margin: 0, fontWeight: 600 }}>
          Program &amp; Guest Insights
        </Title>
        <Text type="secondary">{scopeLabel}</Text>
      </div>

      {noScope && (
        <Alert
          type="warning"
          showIcon
          message="No property linked"
          description="Until an admin links a property to your account, this view will be empty."
        />
      )}

      <Space size={[18, 8]} wrap style={{ fontSize: 13 }}>
        {(Object.keys(BADGE) as Badge[]).map((k) => (
          <Space key={k} size={6}>
            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 4, background: BADGE[k].dot }} />
            <Text type="secondary">{BADGE[k].label}</Text>
          </Space>
        ))}
        <Text type="secondary" style={{ borderLeft: "1px solid #eef1ef", paddingLeft: 18 }}>
          Live-checked at {checked}: {data.totalBookings} {data.totalBookings === 1 ? "booking" : "bookings"} in Supabase.
        </Text>
      </Space>

      <Row gutter={[16, 16]}>
        <Col xs={12} lg={6}>
          <Kpi title="Guests in pipeline" badge="live" value={String(data.pipeline)} sub="across all stages" />
        </Col>
        <Col xs={12} lg={6}>
          <Kpi
            title="Avg WS uplift"
            badge="live"
            value={data.avgUplift == null ? "—" : `${data.avgUplift > 0 ? "+" : ""}${data.avgUplift.toFixed(1)}`}
            sub={`n = ${data.upliftN} bookings with pre/post score`}
          />
        </Col>
        <Col xs={12} lg={6}>
          <Kpi title="Completed programs" badge="live" value={String(data.completed)} sub={`of ${data.pipeline} tracked bookings`} />
        </Col>
        <Col xs={12} lg={6}>
          <Kpi title="30/60/90-day follow-up" badge="empty" value={String(data.followUps)} sub="longitudinal layer in build" />
        </Col>
      </Row>

      <Card variant="borderless" title={<PanelTitle title="WS uplift per completed booking" badge="live" />}>
        <UpliftBars items={data.performance} />
      </Card>

      <Card variant="borderless" title={<PanelTitle title="Pipeline by stage" badge="live" />}>
        <Donut stages={data.stages} />
      </Card>

      <Card variant="borderless" title={<PanelTitle title="Guests" badge="live" />}>
        <Text type="secondary" style={{ fontSize: 12.5, display: "block", marginBottom: 12 }}>
          {scopeLabel}
        </Text>
        <Input.Search
          allowClear
          placeholder="Type a keyword…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ maxWidth: 320, marginBottom: 12 }}
        />
        <Table
          rowKey="booking_id"
          columns={columns}
          dataSource={rows}
          size="middle"
          scroll={{ x: 640 }}
          pagination={{
            pageSize: 8,
            showSizeChanger: false,
            showTotal: (total, [from, to]) => `Showing ${from} to ${to} of ${total} results`,
          }}
          onRow={(r) => ({
            onClick: () => r.guest_id && router.push(`${guestBasePath}/${r.guest_id}`),
            style: { cursor: r.guest_id ? "pointer" : "default" },
          })}
          locale={{ emptyText: "No guests yet" }}
        />
      </Card>

      <Card variant="borderless" title={<PanelTitle title="Program performance" badge="live" badgeText="n shown per program" />}>
        {data.performance.length === 0 ? (
          <Empty description="No program has a pre and a post score yet" />
        ) : (
          <Row gutter={[16, 16]}>
            {data.performance.map((p) => (
              <Col xs={24} sm={12} lg={8} key={p.program_id}>
                <Card size="small" style={{ background: "#fafbfa", height: "100%" }}>
                  <Text strong style={{ display: "block", marginBottom: 6 }}>
                    {p.name}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    Avg WS change{" "}
                    <Text strong style={{ color: "#0F6E56" }}>
                      {p.delta > 0 ? "+" : ""}
                      {p.delta}
                    </Text>{" "}
                    · n = {p.n}
                  </Text>
                  <div style={{ marginTop: 8 }}>
                    <Tag color="green">Guest-reported improvement</Tag>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
        <Paragraph type="secondary" style={{ fontSize: 12, marginTop: 14, marginBottom: 0 }}>
          Wording deliberately avoids &ldquo;treatment effectiveness&rdquo; / &ldquo;clinically proven&rdquo; — these are
          guest-reported WS changes, with the number of bookings shown for each program.
        </Paragraph>
      </Card>

      <Card variant="borderless" title={<PanelTitle title="Wellness dimensions" badge="agg" />}>
        <Space direction="vertical" size={0} style={{ width: "100%", maxWidth: 420 }}>
          {data.dimensions.map((d) => (
            <div
              key={d.key}
              style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid #eef1ef" }}
            >
              <Text type={d.value == null ? "secondary" : undefined}>{d.label}</Text>
              {d.value == null ? <Text type="secondary">not yet collected</Text> : <Text strong>{d.value.toFixed(1)}</Text>}
            </div>
          ))}
        </Space>
        <Paragraph type="secondary" style={{ fontSize: 12, marginTop: 14, marginBottom: 0 }}>
          Population pattern across {data.assessmentCount} current{" "}
          {data.assessmentCount === 1 ? "assessment" : "assessments"} — not one guest&apos;s data.
          {performanceDim?.value == null ? " Performance isn't part of the current assessment yet." : ""}
        </Paragraph>
      </Card>

      <Card variant="borderless" title={<PanelTitle title="30/60/90-day outcomes" badge="empty" badgeText="Empty" />}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No follow-up data collected yet. Check-ins 30, 60 and 90 days after the journey are the longitudinal layer in build — shown here as empty, not hidden."
        />
      </Card>

      <Text type="secondary" style={{ fontSize: 12, lineHeight: 1.6, display: "block" }}>
        Built on Dream Islands live data (Supabase). WS trend, uplift figures, program/outcome mappings and pipeline
        counts are real records, re-checked on every open. The dimension pattern is a real aggregate across{" "}
        {data.assessmentCount} current assessments, labeled as a population pattern, not one guest&apos;s data.
        30/60/90-day outcomes and connected health sources are not collected yet — shown as honest empty states rather
        than filled with placeholder numbers.
      </Text>
    </Space>
  )
}
