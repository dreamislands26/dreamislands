"use client"

import { CheckCircleFilled, ClockCircleOutlined } from "@ant-design/icons"
import { Col, Row, Tag, Typography } from "antd"
import type { CabinetJourney } from "@/lib/guest-cabinet"
import { formatStay } from "@/lib/stay-format"

const { Text, Title } = Typography

export const STATUS_COLOR: Record<string, string> = {
  inquiry: "default",
  confirmed: "geekblue",
  active: "green",
  completed: "purple",
  cancelled: "volcano",
}

/** Body of the "Current program" panel — also reused in the Programs list. */
export default function JourneyCard({ journey, showTag }: { journey: CabinetJourney; showTag?: boolean }) {
  const done = journey.status === "completed"
  const meta = [
    journey.property_name,
    journey.duration_days ? `${journey.duration_days} days` : null,
    formatStay(journey.arrival, journey.departure),
    journey.status_label,
  ].filter(Boolean)

  return (
    <div>
      <Title level={5} style={{ margin: "0 0 4px", fontSize: 17 }}>
        {journey.program_name}
        {journey.location ? ` — ${journey.location}` : ""}
        {showTag && (
          <Tag color={STATUS_COLOR[journey.status] ?? "default"} style={{ marginLeft: 8, verticalAlign: 2 }}>
            {journey.status}
          </Tag>
        )}
      </Title>
      <Text type="secondary" style={{ fontSize: 13.5 }}>
        {meta.join(" · ")}
      </Text>

      {journey.goals.length > 0 && (
        <Row gutter={[24, 10]} style={{ marginTop: 14 }}>
          {journey.goals.map((g) => (
            <Col xs={24} sm={12} key={g}>
              {done ? (
                <CheckCircleFilled style={{ color: "#1D9E75", marginRight: 8 }} />
              ) : (
                <ClockCircleOutlined style={{ color: "#9aa6a1", marginRight: 8 }} />
              )}
              <Text>{g}</Text>
            </Col>
          ))}
        </Row>
      )}
    </div>
  )
}
