"use client"

import {
  ArrowLeftOutlined,
  CalendarOutlined,
  DollarOutlined,
  EditOutlined,
  HistoryOutlined,
  LineChartOutlined,
  MailOutlined,
  NodeIndexOutlined,
  PhoneOutlined,
  SolutionOutlined,
  TeamOutlined,
  WarningOutlined,
} from "@ant-design/icons"
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Row,
  Space,
  Collapse,
  Table,
  Tag,
  Timeline,
  Tooltip,
  Typography,
} from "antd"
import type { ColumnsType } from "antd/es/table"
import { useRouter } from "next/navigation"
import { useState } from "react"
import GuestEditModal from "./GuestEditModal"
import WbsDailyRail from "./WbsDailyRail"
import { STAGE_COLOR, STAGE_LABEL } from "@/lib/guest-metrics"
import type {
  GuestProfile,
  ProfileAssessment,
  ProfileBooking,
  SpecialistTouch,
} from "@/lib/guest-queries"

const { Text, Title, Paragraph } = Typography

const MONO: React.CSSProperties = { fontFamily: "ui-monospace, monospace", fontWeight: 600 }
const DASH = <Text type="secondary">—</Text>
const TONE_COLOR: Record<string, string> = { urgent: "red", due: "gold", idle: "default" }

const STATUS_COLOR: Record<string, string> = {
  inquiry: "gold",
  confirmed: "blue",
  active: "green",
  completed: "purple",
  cancelled: "red",
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

function fmtDate(v: string | null): string {
  if (!v) return "—"
  const d = new Date(v)
  return `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

function fmtShort(v: string | null): string {
  if (!v) return "—"
  const d = new Date(v)
  return `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`
}

function fmtDateTime(v: string | null): string {
  if (!v) return "—"
  const d = new Date(v)
  const hh = String(d.getHours()).padStart(2, "0")
  const mm = String(d.getMinutes()).padStart(2, "0")
  return `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}, ${hh}:${mm}`
}

function money(amount: number | null, currency: string): string {
  if (amount == null) return "—"
  const sign = currency === "thb" ? "฿" : "$"
  return `${sign}${Math.round(amount).toLocaleString("en-US")}`
}

/* ─── Small visual pieces ──────────────────────────────────── */

function CardTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Space size={8}>
      <span style={{ color: "#1D9E75", display: "inline-flex" }}>{icon}</span>
      {children}
    </Space>
  )
}

function Stat({
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
    <Card variant="borderless" styles={{ body: { padding: "14px 18px" } }} style={{ height: "100%" }}>
      <Text
        type="secondary"
        style={{ fontSize: 11, letterSpacing: 0.6, textTransform: "uppercase" }}
      >
        {label}
      </Text>
      <div
        style={{
          fontSize: 24,
          fontWeight: 600,
          lineHeight: 1.3,
          color,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {value}
      </div>
      <Text
        type="secondary"
        style={{
          fontSize: 12,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          display: "block",
        }}
      >
        {hint ?? " "}
      </Text>
    </Card>
  )
}

/** Daily WBS rail as a small chart: 0..100 scale, gridlines, day axis. */
function Sparkline({ points }: { points: Array<{ day_no: number; score: number | null }> }) {
  const filled = points.filter((p) => p.score != null) as Array<{ day_no: number; score: number }>
  if (filled.length < 2) {
    return (
      <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 12 }}>
        Not enough daily readings to chart yet.
      </Text>
    )
  }

  const W = 520
  const H = 260
  const padL = 34
  const padR = 14
  const padT = 14
  const padB = 30
  const plotW = W - padL - padR
  const plotH = H - padT - padB

  const minDay = filled[0].day_no
  const maxDay = filled[filled.length - 1].day_no
  const span = Math.max(1, maxDay - minDay)

  const x = (day: number) => padL + ((day - minDay) / span) * plotW
  const y = (score: number) => padT + (1 - score / 100) * plotH

  const coords = filled.map((p) => ({ x: x(p.day_no), y: y(p.score), ...p }))
  const line = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ")
  const area = `${line} L${coords[coords.length - 1].x.toFixed(1)},${(padT + plotH).toFixed(1)} L${coords[0].x.toFixed(1)},${(padT + plotH).toFixed(1)} Z`
  const last = coords[coords.length - 1]

  const yTicks = [0, 25, 50, 75, 100]
  const dayTicks = Array.from(new Set([minDay, Math.round((minDay + maxDay) / 2), maxDay]))

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${W} ${H}`}
      style={{ display: "block", marginTop: 10, width: "100%", maxWidth: W }}
      role="img"
      aria-label="Daily wellbeing score trend"
    >
      <defs>
        <linearGradient id="wbsFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1D9E75" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#1D9E75" stopOpacity="0" />
        </linearGradient>
      </defs>

      {yTicks.map((t) => (
        <g key={t}>
          <line x1={padL} y1={y(t)} x2={W - padR} y2={y(t)} stroke="#EDF2F0" strokeWidth={1} />
          <text x={padL - 6} y={y(t) + 3.5} textAnchor="end" fontSize={11} fill="#9aa6a1">
            {t}
          </text>
        </g>
      ))}

      {/* 70 is the Reset threshold the score colours key off */}
      <line
        x1={padL}
        y1={y(70)}
        x2={W - padR}
        y2={y(70)}
        stroke="#B8DFD0"
        strokeWidth={1}
        strokeDasharray="4 3"
      />

      <line x1={padL} y1={padT} x2={padL} y2={padT + plotH} stroke="#DDE5E2" strokeWidth={1} />
      <line
        x1={padL}
        y1={padT + plotH}
        x2={W - padR}
        y2={padT + plotH}
        stroke="#DDE5E2"
        strokeWidth={1}
      />

      <path d={area} fill="url(#wbsFill)" />
      <path
        d={line}
        fill="none"
        stroke="#1D9E75"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {coords.map((c) => (
        <circle key={c.day_no} cx={c.x} cy={c.y} r={2.5} fill="#fff" stroke="#1D9E75" strokeWidth={1.5} />
      ))}
      <circle cx={last.x} cy={last.y} r={4.5} fill="#1D9E75" />
      <text x={last.x} y={last.y - 9} textAnchor="middle" fontSize={12} fontWeight={600} fill="#0F6E56">
        {last.score}
      </text>

      {/* edge labels hug the axis ends so they can't spill outside the viewBox */}
      {dayTicks.map((d) => (
        <g key={d}>
          <line x1={x(d)} y1={padT + plotH} x2={x(d)} y2={padT + plotH + 4} stroke="#DDE5E2" />
          <text
            x={x(d)}
            y={H - 8}
            textAnchor={d === minDay ? "start" : d === maxDay ? "end" : "middle"}
            fontSize={11}
            fill="#9aa6a1"
          >
            Day {d}
          </text>
        </g>
      ))}
    </svg>
  )
}

function SubScoreBar({ label, value }: { label: string; value: number | null }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
        <Text type="secondary">{label}</Text>
        <span style={{ ...MONO, fontSize: 12, color: wbsColor(value) }}>{value ?? "—"}</span>
      </div>
      <div style={{ height: 6, background: "#eef3f1", borderRadius: 3, marginTop: 3 }}>
        <div
          style={{
            width: `${Math.max(0, Math.min(100, value ?? 0))}%`,
            height: "100%",
            borderRadius: 3,
            background: wbsColor(value),
          }}
        />
      </div>
    </div>
  )
}

/* ─── Profile ──────────────────────────────────────────────── */

export default function GuestProfileView({
  profile,
  backHref,
  backLabel,
  canEdit,
}: {
  profile: GuestProfile
  backHref: string
  backLabel: string
  canEdit: boolean
}) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const { row } = profile

  const latestAssessment: ProfileAssessment | undefined = profile.assessments[0]
  const openFlags = profile.flags.filter((f) => f.review_status !== "cleared")

  const bookingColumns: ColumnsType<ProfileBooking> = [
    {
      title: "Program",
      key: "program",
      width: 300,
      render: (_v, b) => (
        <div>
          <Text strong style={{ fontSize: 13 }}>
            {b.program_name ?? "—"}
          </Text>
          {b.property_names.length > 0 && (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {b.property_names.join(", ")}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Amount",
      key: "amount",
      width: 110,
      align: "right",
      render: (_v, b) => (
        <span style={{ ...MONO, fontSize: 13, color: b.amount ? "#0F6E56" : undefined }}>
          {money(b.amount, b.currency)}
        </span>
      ),
    },
    {
      title: "Status",
      key: "status",
      width: 110,
      render: (_v, b) =>
        b.status ? <Tag color={STATUS_COLOR[b.status]}>{b.status}</Tag> : DASH,
    },
    {
      title: "Dates",
      key: "dates",
      width: 190,
      render: (_v, b) =>
        b.arrival || b.departure ? (
          <Text style={{ fontSize: 12 }}>
            {fmtDate(b.arrival)} → {fmtDate(b.departure)}
          </Text>
        ) : (
          DASH
        ),
    },
    {
      title: "Pax",
      dataIndex: "pax",
      key: "pax",
      width: 60,
      render: (v: number | null) => v ?? DASH,
    },
    { key: "spacer", title: "", render: () => null },
  ]

  const specialistColumns: ColumnsType<SpecialistTouch> = [
    {
      title: "Specialist",
      key: "name",
      render: (_v, t) => (
        <div>
          <Text strong style={{ fontSize: 13 }}>
            {t.name}
          </Text>
          {t.specialist_role && (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {t.specialist_role}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Role on stay",
      key: "booking_role",
      width: 140,
      render: (_v, t) => (t.booking_role ? <Tag>{t.booking_role}</Tag> : DASH),
    },
    {
      title: "Program",
      key: "program",
      render: (_v, t) => <Text style={{ fontSize: 13 }}>{t.program_name ?? "—"}</Text>,
    },
    {
      title: "Stay",
      key: "stay",
      width: 190,
      render: (_v, t) =>
        t.arrival || t.departure ? (
          <Text style={{ fontSize: 12 }}>
            {fmtDate(t.arrival)} → {fmtDate(t.departure)}
          </Text>
        ) : (
          DASH
        ),
    },
    {
      title: "Status",
      key: "status",
      width: 110,
      render: (_v, t) => (t.status ? <Tag color={STATUS_COLOR[t.status]}>{t.status}</Tag> : DASH),
    },
    {
      title: "Assigned",
      key: "assigned",
      width: 150,
      render: (_v, t) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {fmtDateTime(t.assigned_at)}
        </Text>
      ),
    },
  ]

  const assessmentColumns: ColumnsType<ProfileAssessment> = [
    {
      title: "Completed",
      key: "completed_at",
      width: 150,
      render: (_v, a) => (
        <Text style={{ fontSize: 12 }}>{fmtDateTime(a.completed_at)}</Text>
      ),
    },
    {
      title: "Score",
      key: "score",
      width: 80,
      render: (_v, a) =>
        a.score != null ? <span style={{ ...MONO, color: wbsColor(a.score) }}>{a.score}</span> : DASH,
    },
    {
      title: "Focus",
      dataIndex: "focus",
      key: "focus",
      render: (v: string | null) => v ?? DASH,
    },
    {
      title: "Moment",
      key: "moment",
      width: 140,
      render: (_v, a) => a.moment_label ?? a.intent ?? DASH,
    },
    {
      title: "Source",
      dataIndex: "source",
      key: "source",
      width: 110,
      render: (v: string | null) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {v ?? "—"}
        </Text>
      ),
    },
  ]

  // Every dated fact we hold about this guest, newest first.
  const timelineItems = [
    { at: row.created_at, color: "gray", text: `Record created · ${row.technical}` },
    ...profile.assessments.map((a) => ({
      at: a.completed_at,
      color: "blue",
      text: `Assessment${a.score != null ? ` · score ${a.score}` : ""}${a.focus ? ` · ${a.focus}` : ""}`,
    })),
    ...profile.bookings.flatMap((b) => {
      const label = b.program_name ?? "Booking"
      return [
        { at: b.created_at, color: "gold", text: `Inquiry · ${label}` },
        { at: b.confirmed_at, color: "blue", text: `Confirmed · ${label}` },
        { at: b.started_at, color: "green", text: `Stay started · ${label}` },
        { at: b.completed_at, color: "purple", text: `Stay completed · ${label}` },
        { at: b.cancelled_at, color: "red", text: `Cancelled · ${label}` },
      ]
    }),
    ...profile.events.map((e) => ({
      at: e.occurred_at,
      color: "gray",
      text: `${e.event_name}${e.value != null ? ` · ${e.value} ${e.currency ?? ""}` : ""}`,
    })),
    ...profile.touches.map((t) => ({
      at: t.started_at,
      color: "gray",
      text: `Session · ${t.traffic_channel ?? "unknown channel"}${t.landing_page ? ` · ${t.landing_page}` : ""}`,
    })),
  ]
    .filter((i): i is { at: string; color: string; text: string } => !!i.at)
    .sort((a, b) => b.at.localeCompare(a.at))

  return (
    <Space direction="vertical" size={20} style={{ width: "100%" }}>
      <div>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push(backHref)}
          style={{ marginBottom: 8, paddingLeft: 0 }}
        >
          {backLabel}
        </Button>

        <Row align="middle" justify="space-between" gutter={[12, 12]}>
          <Col>
            <Title level={3} style={{ margin: 0, fontWeight: 600 }}>
              {row.name ?? "Unnamed guest"}
            </Title>
            <Space size={8} wrap style={{ marginTop: 6 }}>
              <Tag color={STAGE_COLOR[row.stage]} style={{ margin: 0 }}>
                {STAGE_LABEL[row.stage]}
              </Tag>
              <Tag color={TONE_COLOR[row.next_action.tone]} style={{ margin: 0 }}>
                {row.next_action.label}
              </Tag>
              {row.email && (
                <Text type="secondary" style={{ fontSize: 13 }}>
                  <MailOutlined /> {row.email}
                </Text>
              )}
              {row.whatsapp && (
                <Text type="secondary" style={{ fontSize: 13 }}>
                  <PhoneOutlined /> {row.whatsapp}
                </Text>
              )}
              {row.country && <Text type="secondary" style={{ fontSize: 13 }}>{row.country}</Text>}
            </Space>
          </Col>
          {canEdit && (
            <Col>
              <Space wrap>
                <Button onClick={() => router.push(`/admin/users/${row.id}/journey`)}>
                  View guest profile
                </Button>
                <Button icon={<EditOutlined />} onClick={() => setEditing(true)}>
                  Edit guest
                </Button>
              </Space>
            </Col>
          )}
        </Row>
      </div>

      {openFlags.length > 0 && (
        <Alert
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          message={`${openFlags.length} open medical flag${openFlags.length === 1 ? "" : "s"}`}
          description={
            <Space size={6} wrap>
              {openFlags.map((f) => (
                <Tag key={f.id} color="volcano">
                  {f.flag}
                  {f.sla_due_at ? ` · due ${fmtDate(f.sla_due_at)}` : ""}
                </Tag>
              ))}
            </Space>
          }
        />
      )}

      {/* Revenue first, matching the guest list and the property Guests tab. */}
      <Row gutter={[12, 12]}>
        <Col xs={12} md={8} xl={5}>
          <Stat
            label="Lifetime GMV"
            value={
              row.gmv_usd === 0 && row.gmv_thb === 0 ? (
                "—"
              ) : (
                <Space size={8} wrap>
                  {row.gmv_usd > 0 && <span>${Math.round(row.gmv_usd).toLocaleString("en-US")}</span>}
                  {row.gmv_thb > 0 && (
                    <span style={{ color: "#6b7a74" }}>
                      ฿{Math.round(row.gmv_thb).toLocaleString("en-US")}
                    </span>
                  )}
                </Space>
              )
            }
            hint="excludes cancelled"
          />
        </Col>
        <Col xs={12} md={8} xl={3}>
          <Stat
            label="Bookings"
            value={row.booking_count}
            hint={row.arrival ? `next ${fmtShort(row.arrival)}` : "no dates"}
          />
        </Col>
        <Col xs={12} md={8} xl={3}>
          <Stat
            label="Current WS"
            value={row.ws_current ?? "—"}
            hint={row.ws_baseline != null ? `baseline ${row.ws_baseline}` : "no baseline"}
            color={wbsColor(row.ws_current)}
          />
        </Col>
        <Col xs={12} md={8} xl={4}>
          <Stat
            label="Outcome ΔWS"
            value={row.delta_ws == null ? "—" : `${row.delta_ws > 0 ? "+" : ""}${row.delta_ws}`}
            hint={row.pre_wbs != null ? `${row.pre_wbs} → ${row.post_wbs ?? "—"}` : "no pre/post pair"}
            color={row.delta_ws == null ? undefined : deltaColor(row.delta_ws)}
          />
        </Col>
        <Col xs={12} md={8} xl={4}>
          <Stat
            label="Goal"
            value={<span style={{ fontSize: 16 }}>{row.goal ?? "—"}</span>}
            hint="latest focus"
          />
        </Col>
        <Col xs={12} md={8} xl={5}>
          <Stat
            label="Market"
            value={<span style={{ fontSize: 16 }}>{row.market ?? "—"}</span>}
            hint={profile.language ? `lang ${profile.language}` : " "}
          />
        </Col>
      </Row>

      <Card
        variant="borderless"
        title={
          <Space size={8}>
            <DollarOutlined style={{ color: "#0F6E56" }} />
            <span style={{ color: "#0F6E56", fontWeight: 600 }}>Bookings</span>
          </Space>
        }
        style={{
          border: "2px solid #1D9E75",
          borderRadius: 10,
          // the table body has square corners and would paint over the radius
          overflow: "hidden",
          boxShadow: "0 2px 12px rgba(29,158,117,0.14)",
        }}
        styles={{
          body: { padding: 0 },
          header: {
            background: "#E1F5EE",
            borderBottom: "1px solid #B8DFD0",
            color: "#0F6E56",
            minHeight: 48,
          },
        }}
      >
        <Table<ProfileBooking>
          rowKey="id"
          columns={bookingColumns}
          dataSource={profile.bookings}
          pagination={false}
          size="small"
          scroll={{ x: "max-content" }}
          locale={{
            emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No bookings yet" />,
          }}
        />
      </Card>

      <Row gutter={[12, 12]}>
        <Col xs={24} lg={15}>
          <Card
            variant="borderless"
            title={<CardTitle icon={<LineChartOutlined />}>Wellbeing trajectory</CardTitle>}
            extra={
              <Text type="secondary" style={{ fontSize: 12 }}>
                {profile.daily.filter((d) => d.score != null).length} daily readings
              </Text>
            }
          >
            <Row gutter={[24, 16]}>
              <Col xs={24} md={12}>
                <Text type="secondary" style={{ fontSize: 11, letterSpacing: 0.5 }}>
                  BASELINE → PRE → POST
                </Text>
                <div style={{ ...MONO, fontSize: 22, marginTop: 4 }}>
                  <span style={{ color: wbsColor(row.ws_baseline) }}>{row.ws_baseline ?? "—"}</span>
                  <span style={{ color: "#c8d4cf", margin: "0 8px" }}>→</span>
                  <span style={{ color: wbsColor(row.pre_wbs) }}>{row.pre_wbs ?? "—"}</span>
                  <span style={{ color: "#c8d4cf", margin: "0 8px" }}>→</span>
                  <span style={{ color: wbsColor(row.post_wbs) }}>{row.post_wbs ?? "—"}</span>
                </div>
                <Sparkline points={profile.daily} />
              </Col>

              <Col xs={24} md={12}>
                <Text type="secondary" style={{ fontSize: 11, letterSpacing: 0.5 }}>
                  SUB-SCORES · LATEST ASSESSMENT
                </Text>
                <div style={{ marginTop: 8 }}>
                  {latestAssessment ? (
                    <>
                      <SubScoreBar label="Body" value={latestAssessment.sub_body} />
                      <SubScoreBar label="Recovery" value={latestAssessment.sub_recovery} />
                      <SubScoreBar label="Metabolic" value={latestAssessment.sub_metabolic} />
                      <SubScoreBar label="Mind" value={latestAssessment.sub_mind} />
                      <SubScoreBar label="Risk" value={latestAssessment.sub_risk} />
                    </>
                  ) : (
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      No assessment recorded — sub-scores appear once the guest completes one.
                    </Text>
                  )}
                </div>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} lg={9}>
          <Card
            variant="borderless"
            title={<CardTitle icon={<NodeIndexOutlined />}>Attribution</CardTitle>}
            style={{ height: "100%" }}
          >
            <Descriptions column={1} size="small" colon={false}>
              <Descriptions.Item label="Distribution">
                <Tag>{row.distribution}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Partner">
                {row.partner_names.length > 0 ? row.partner_names.join(", ") : "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Acquisition">
                <Tag>{row.acquisition}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Campaign">
                {profile.touches[0]?.utm_campaign ?? "—"}
              </Descriptions.Item>
              <Descriptions.Item label="First touch">
                {profile.touches.length > 0
                  ? `${profile.touches[profile.touches.length - 1].traffic_channel ?? "unknown"} · ${fmtDate(profile.touches[profile.touches.length - 1].started_at)}`
                  : "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Tech source">
                <Text type="secondary">{row.technical}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Created">{fmtDate(row.created_at)}</Descriptions.Item>
              <Descriptions.Item label="Last activity">
                {fmtDateTime(row.last_activity)}
              </Descriptions.Item>
            </Descriptions>
            {profile.touches.length === 0 && (
              <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 0 }}>
                No analytics sessions recorded — acquisition and distribution are inferred from the
                record&apos;s technical source.
              </Paragraph>
            )}
          </Card>
        </Col>
      </Row>

      <Collapse
        items={[
          {
            key: "specialists",
            label: (
              <CardTitle icon={<TeamOutlined />}>
                {`Specialist history (${profile.specialistTouches.length})`}
              </CardTitle>
            ),
            children: (
              <Table<SpecialistTouch>
                rowKey="key"
                columns={specialistColumns}
                dataSource={profile.specialistTouches}
                pagination={false}
                size="small"
                scroll={{ x: "max-content" }}
                locale={{
                  emptyText: (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No specialists assigned yet" />
                  ),
                }}
              />
            ),
          },
        ]}
      />

      <Card
        variant="borderless"
        title={<CardTitle icon={<CalendarOutlined />}>Daily WBS rail</CardTitle>}
      >
        <Tooltip title={canEdit ? undefined : "Read-only for partners"}>
          <div style={{ overflowX: "auto" }}>
            <WbsDailyRail userId={row.id} editable={canEdit} />
          </div>
        </Tooltip>
      </Card>

      <Row gutter={[12, 12]}>
        <Col xs={24} lg={14}>
          <Card
            variant="borderless"
            title={<CardTitle icon={<SolutionOutlined />}>Assessments</CardTitle>}
            styles={{ body: { padding: 0 } }}
            style={{ height: "100%" }}
          >
            <Table<ProfileAssessment>
              rowKey="id"
              columns={assessmentColumns}
              dataSource={profile.assessments}
              pagination={false}
              size="small"
              scroll={{ x: "max-content" }}
              locale={{
                emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No assessments" />,
              }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card
            variant="borderless"
            title={<CardTitle icon={<HistoryOutlined />}>Journey timeline</CardTitle>}
            style={{ height: "100%" }}
          >
            {timelineItems.length > 0 ? (
              <Timeline
                items={timelineItems.map((i, idx) => ({
                  key: idx,
                  color: i.color,
                  content: (
                    <div>
                      <Text style={{ fontSize: 13 }}>{i.text}</Text>
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {fmtDateTime(i.at)}
                        </Text>
                      </div>
                    </div>
                  ),
                }))}
              />
            ) : (
              <Empty description="Nothing recorded yet" />
            )}
          </Card>
        </Col>
      </Row>

      {canEdit && (
        <GuestEditModal
          userId={editing ? row.id : null}
          onClose={() => setEditing(false)}
          onSaved={() => router.refresh()}
          role="admin"
        />
      )}
    </Space>
  )
}
