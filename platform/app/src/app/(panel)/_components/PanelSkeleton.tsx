"use client"

import { Card, Col, Row, Skeleton } from "antd"
import s from "./panelSkeleton.module.css"

/** Loading screen for admin and partner pages: title, a row of stat cards, a table. The menu stays. */
export default function PanelSkeleton() {
  return (
    <div className={s.screen} role="status" aria-busy="true" aria-label="Loading">
      <Skeleton.Input size="large" style={{ width: 240, marginBottom: 24 }} />
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {[0, 1, 2, 3].map((i) => (
          <Col key={i} xs={12} lg={6}>
            <Card>
              <Skeleton title={false} paragraph={{ rows: 2, width: ["50%", "80%"] }} />
            </Card>
          </Col>
        ))}
      </Row>
      <Card>
        <Skeleton title={false} paragraph={{ rows: 7 }} />
      </Card>
    </div>
  )
}
