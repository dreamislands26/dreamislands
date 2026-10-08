"use client"

import { Alert, Card, Space, Table, Tag, Typography } from "antd"
import type { ColumnsType } from "antd/es/table"
import Link from "next/link"

const { Title, Text } = Typography

export type PricingGapRow = {
  id: string
  name: string
  slug: string | null
  properties: Array<{ id: string; name: string; country: string | null; island: string | null }>
  existingDurationDays: number | null
  missingDuration: boolean
  variantCount: number
  gapType: "no_variant" | "unpriced_variant"
  partners: Array<{ name: string | null; email: string | null }>
  lastUpdated: string
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
}

export default function PricingGapsView({ rows }: { rows: PricingGapRow[] }) {
  const columns: ColumnsType<PricingGapRow> = [
    {
      title: "Program",
      dataIndex: "name",
      render: (name: string, row) => (
        <Link href={`/admin/programs/${row.id}/edit?tab=variants`}>{name}</Link>
      ),
    },
    {
      title: "Property",
      key: "property",
      render: (_v, row) =>
        row.properties.length ? (
          row.properties.map((p) => p.name).join(", ")
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: "Country",
      key: "country",
      render: (_v, row) => {
        const countries = Array.from(new Set(row.properties.map((p) => p.country).filter(Boolean)))
        return countries.length ? countries.join(", ") : <Text type="secondary">—</Text>
      },
    },
    {
      title: "Existing duration",
      key: "duration",
      width: 130,
      render: (_v, row) =>
        row.existingDurationDays != null ? (
          `${row.existingDurationDays}D`
        ) : (
          <Text type="danger">missing</Text>
        ),
    },
    {
      title: "Missing duration",
      key: "missingDuration",
      width: 130,
      render: (_v, row) => (row.missingDuration ? <Tag color="red">yes</Tag> : <Tag>no</Tag>),
    },
    {
      title: "Missing THB price",
      key: "missingThb",
      width: 140,
      render: (_v, row) => (
        <Tag color="red">{row.gapType === "no_variant" ? "no variant" : "yes"}</Tag>
      ),
    },
    {
      title: "Partner contact / owner",
      key: "partner",
      render: (_v, row) =>
        row.partners.length ? (
          row.partners.map((p) => p.name ?? p.email ?? "—").join(", ")
        ) : (
          <Text type="secondary">unassigned</Text>
        ),
    },
    {
      title: "Last updated",
      key: "lastUpdated",
      width: 120,
      render: (_v, row) => fmtDate(row.lastUpdated),
    },
  ]

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <div>
        <Title level={4} style={{ margin: 0 }}>
          Pricing gaps
        </Title>
        <Text type="secondary">
          Active programs with no live Stripe checkout — either no bookable variant, or a variant
          missing its Basic THB price. Checkout activates automatically the moment a program gets
          an active variant with a valid duration and Basic THB price — no separate toggle.
        </Text>
      </div>

      <Alert
        type="info"
        showIcon
        message={`${rows.length} program${rows.length === 1 ? "" : "s"} currently unpriced`}
        description={
          '"Last updated" reflects the most recent variant record (or the program record, if it has no variants) — there is no separate price-change audit log yet.'
        }
      />

      <Card variant="borderless">
        <Table<PricingGapRow>
          rowKey="id"
          columns={columns}
          dataSource={rows}
          pagination={{ pageSize: 20 }}
          size="small"
        />
      </Card>
    </Space>
  )
}
