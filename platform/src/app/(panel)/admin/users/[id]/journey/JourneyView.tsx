"use client"

import { Alert, Button, Card, Col, Row, Space, Typography } from "antd"
import type { GuestCabinet } from "@/lib/guest-cabinet"
import JourneyCard from "./JourneyCard"
import { formatDay } from "@/lib/stay-format"

const { Text, Title, Paragraph } = Typography

function Trend({ points }: { points: GuestCabinet["points"] }) {
  const W = 320
  const H = 140
  const pad = 14
  if (points.length < 2) {
    return (
      <div
        style={{
          height: 130,
          borderRadius: 12,
          background: "#f6f8f7",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
          textAlign: "center",
        }}
      >
        <Text type="secondary" style={{ fontSize: 13 }}>
          Your trend appears after the next check-in — before, during or after a journey.
        </Text>
      </div>
    )
  }
  const scores = points.map((p) => p.score)
  const lo = Math.max(0, Math.min(...scores) - 10)
  const hi = Math.min(100, Math.max(...scores) + 10)
  const span = Math.max(1, hi - lo)
  const xy = points.map((p, i) => [
    pad + (i * (W - pad * 2)) / (points.length - 1),
    pad + ((hi - p.score) * (H - pad * 2)) / span,
  ])
  const line = xy.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ")
  const [lx, ly] = xy[xy.length - 1]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 130 }} preserveAspectRatio="none" role="img"
      aria-label={`WS trend from ${scores[0]} to ${scores[scores.length - 1]}`}>
      <polyline points={line} fill="none" stroke="#E1F5EE" strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={line} fill="none" stroke="#1D9E75" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lx} cy={ly} r={6} fill="#10221c" />
    </svg>
  )
}

export default function JourneyView({
  cabinet,
  whatsappUrl,
  programsUrl,
}: {
  cabinet: GuestCabinet
  whatsappUrl: string
  programsUrl: string
}) {
  const { baseline, current, baselineDate, points, current_journey } = cabinet
  const delta = baseline != null && current != null ? current - baseline : null
  const hasTrend = points.length > 1

  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <div>
        <Text type="secondary" style={{ fontSize: 12, letterSpacing: 0.3 }}>
          DREAM ISLANDS — WELLNESS INTELLIGENCE
        </Text>
        <Title level={3} style={{ margin: 0, fontWeight: 600 }}>
          My Wellness Journey
        </Title>
      </div>

      <Card variant="borderless">
        <Row gutter={[40, 24]} align="middle">
          <Col xs={24} md={13}>
            {current == null ? (
              <Paragraph type="secondary" style={{ margin: 0 }}>
                We don&apos;t have a score for you yet.
              </Paragraph>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "baseline", gap: 18 }}>
                  {hasTrend && (
                    <>
                      <span style={{ fontSize: 22, color: "#9aa6a1" }}>{baseline}</span>
                      <span style={{ fontSize: 20, color: "#9aa6a1" }}>→</span>
                    </>
                  )}
                  <span style={{ fontSize: 60, fontWeight: 700, lineHeight: 1, color: "#10221c" }}>{current}</span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, marginTop: 8, color: delta != null && delta < 0 ? "#b3781b" : "#0F6E56" }}>
                  {hasTrend && delta != null
                    ? `${delta > 0 ? "+" : delta < 0 ? "−" : "±"}${Math.abs(delta)} since your baseline intake`
                    : `Your baseline intake${baselineDate ? ` · ${formatDay(baselineDate)}` : ""}`}
                </div>
              </>
            )}
            <Paragraph type="secondary" style={{ fontSize: 14, marginTop: 10, marginBottom: 0, maxWidth: "34ch", lineHeight: 1.5 }}>
              Calculated from your sleep, energy, stress and movement check-ins before, during and after each journey.
            </Paragraph>
          </Col>
          <Col xs={24} md={11}>
            <Trend points={points} />
          </Col>
        </Row>
      </Card>

      <Card variant="borderless" title={<Text strong>Current program</Text>}>
        {current_journey ? (
          <JourneyCard journey={current_journey} />
        ) : (
          <Alert
            type="info"
            showIcon
            message="No program yet"
            description={
              <Space direction="vertical" size={8}>
                <span>Pick a program that matches your score, or ask us to put one together for you.</span>
                <Space wrap>
                  <Button type="primary" href={programsUrl} target="_blank">
                    Browse programs
                  </Button>
                  <Button href={whatsappUrl} target="_blank">
                    Message us on WhatsApp
                  </Button>
                </Space>
              </Space>
            }
          />
        )}
      </Card>
    </Space>
  )
}
