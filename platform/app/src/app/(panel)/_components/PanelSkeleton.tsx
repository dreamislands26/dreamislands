"use client"

import { PlusOutlined } from "@ant-design/icons"
import { Button, Card, Col, Row, Skeleton, Space, Table, Typography } from "antd"
import { usePathname } from "next/navigation"
import s from "./panelSkeleton.module.css"

const { Text, Title } = Typography

// List pages: their fixed subtitle, button and table columns, so the page looks as it will and only
// the numbers and rows load. Kept in step with the views by hand; a page missing here gets the
// general layout below.
type ListPage = { title?: string; sub?: string; button?: string; columns: string[] }
const LISTS: Record<string, ListPage> = {
  "/admin/bookings": { sub: "Click a row to edit · stays from inquiry to completion", button: "Booking", columns: ["Guest", "Program", "Dates", "Amount", "WBS", "Status"] },
  "/admin/programs": { sub: "RESET, REBUILD and TRANSFORM tiers across four cohorts", button: "Program", columns: ["Program", "Cohort", "Tier", "Properties", "Status"] },
  "/admin/properties": { sub: "Parent venues and clinical sub-units across SEA", button: "Property", columns: ["Property", "Location", "Cohorts", "Status", "Actions"] },
  "/admin/services": { sub: "À-la-carte catalog (massage, IV, beauty, mind). DIT commission 15% by default.", button: "Service", columns: ["Service", "Category", "Price (THB)", "Price (USD)", "Commission", "Status"] },
  "/admin/accommodations": { sub: "Room and villa pricing per property", button: "Add room rate", columns: ["Property", "Room", "Cap.", "Pool", "Price / night", "Per person", "Sort", "Status"] },
  "/admin/pricing-gaps": { title: "Pricing gaps", sub: "Active programs with no live Stripe checkout — either no bookable variant, or a variant missing its Basic THB price. Checkout activates automatically the moment a program gets an active variant with a valid duration and Basic THB price — no separate toggle.", columns: ["Program", "Property", "Country", "Existing duration", "Missing duration", "Missing THB price", "Partner contact / owner", "Last updated"] },
  "/admin/users": { sub: "Intake leads from Cura (WhatsApp/LINE AI), WBS form and direct entries", columns: ["Stage", "Next action", "Goal", "Program", "Property", "Travel dates"] },
  "/partner/guests": { sub: "Guests with bookings on your properties", columns: ["Stage", "Next action", "Goal", "Program", "Property", "Travel dates"] },
  "/partner/properties": { sub: "Your venues on the Dream Islands platform", button: "Add Object", columns: ["Property", "Location", "Rooms", "Programs", "Specialists", "Status"] },
}

const ROWS = Array.from({ length: 8 }, (_, i) => ({ key: i }))
const cell = () => <Skeleton.Input size="small" block className={s.cell} />

/** A list page: title with the count, its subtitle and button, the table with its columns. */
function ListLayout({ page }: { page: ListPage }) {
  return (
    <Space orientation="vertical" size={20} style={{ width: "100%" }}>
      <Row align="middle" justify="space-between" wrap>
        <div>
          {page.title ? <Title level={4} style={{ margin: 0 }}>{page.title}</Title> : <Skeleton.Input size="large" className={s.title} />}
          {page.sub ? <div><Text type="secondary">{page.sub}</Text></div> : <Skeleton.Input size="small" className={s.sub} />}
        </div>
        {page.button && <Button type="primary" icon={<PlusOutlined />} tabIndex={-1}>{page.button}</Button>}
      </Row>
      <Card variant="borderless" styles={{ body: { padding: 0 } }}>
        <Table
          rowKey="key"
          pagination={false}
          dataSource={ROWS}
          columns={page.columns.map((title, i) => ({ key: i, title, render: cell }))}
        />
      </Card>
    </Space>
  )
}

/** Overview, insights and detail pages: a title, a row of stat cards, a block of content. */
function GeneralLayout() {
  return (
    <>
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
    </>
  )
}

/** Loading screen for admin and partner pages. The menu and the header with the section name stay. */
export default function PanelSkeleton() {
  const page = LISTS[usePathname()]
  return (
    <div className={s.screen} role="status" aria-busy="true" aria-label="Loading" inert>
      {page ? <ListLayout page={page} /> : <GeneralLayout />}
    </div>
  )
}
