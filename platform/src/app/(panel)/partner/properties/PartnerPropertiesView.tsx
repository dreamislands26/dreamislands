"use client"

import {
  CheckCircleOutlined,
  MailOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  WhatsAppOutlined,
} from "@ant-design/icons"
import {
  Alert,
  App,
  Button,
  Card,
  Empty,
  Form,
  Input,
  Modal,
  Row,
  Space,
  Table,
  Tag,
  Typography,
} from "antd"
import type { ColumnsType } from "antd/es/table"
import { rowNav } from "../../_components/rowNav"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { DIT_EMAIL, DIT_WHATSAPP_URL } from "@/lib/contact"

const { Text, Title } = Typography
const { TextArea } = Input

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

// Fixed format on purpose: the runtime default locale differs between the
// server render and the browser, which breaks hydration.
function fmtDay(v: string): string {
  const d = new Date(v)
  return `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

export type PartnerPropertyRow = {
  id: string
  name: string
  slug: string
  island: string | null
  country: string | null
  certified: boolean
  active: boolean
  rooms_count: number
  programs_count: number
  specialists_count: number
}

export type PropertyRequestRow = {
  id: string
  property_name: string
  island: string | null
  country: string | null
  status: "pending" | "in_review" | "approved" | "rejected"
  admin_note: string | null
  created_at: string
}

type RequestFormValues = {
  property_name: string
  island?: string
  country?: string
  description?: string
  contact_name?: string
  contact_phone?: string
}

const statusTag: Record<PropertyRequestRow["status"], { color?: string; label: string }> = {
  pending: { color: "orange", label: "sent to DI team" },
  in_review: { color: "blue", label: "in review" },
  approved: { color: "green", label: "approved" },
  rejected: { label: "rejected" },
}

export default function PartnerPropertiesView({
  rows,
  requests,
  errorMessage,
}: {
  rows: PartnerPropertyRow[]
  requests: PropertyRequestRow[]
  errorMessage: string | null
}) {
  const router = useRouter()
  const { message } = App.useApp()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm<RequestFormValues>()

  async function onSubmit(values: RequestFormValues) {
    setSaving(true)
    try {
      const res = await fetch("/api/property-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        message.error(json.error ?? "Could not submit the request")
        return
      }
      message.success("Request submitted — we've emailed you a copy")
      setOpen(false)
      form.resetFields()
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  const columns: ColumnsType<PartnerPropertyRow> = [
    {
      title: "Property",
      key: "name",
      render: (_v, p) => (
        <div>
          <Link href={`/partner/properties/${p.id}`}>
            <Text strong>{p.name}</Text>
          </Link>
          <div>
            <Text code style={{ fontSize: 11 }}>
              {p.slug}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "Location",
      key: "loc",
      render: (_v, p) => (
        <Text type="secondary">
          {p.island ?? "—"}
          {p.country ? `, ${p.country}` : ""}
        </Text>
      ),
    },
    { title: "Rooms", dataIndex: "rooms_count", key: "rooms", width: 90 },
    { title: "Programs", dataIndex: "programs_count", key: "programs", width: 100 },
    { title: "Specialists", dataIndex: "specialists_count", key: "specialists", width: 110 },
    {
      title: "Status",
      key: "status",
      width: 160,
      render: (_v, p) => (
        <Space size={4}>
          {p.active ? <Tag color="green">active</Tag> : <Tag>inactive</Tag>}
          {p.certified && (
            <Tag color="blue" icon={<SafetyCertificateOutlined />}>
              certified
            </Tag>
          )}
        </Space>
      ),
    },
  ]

  const requestColumns: ColumnsType<PropertyRequestRow> = [
    {
      title: "Property",
      key: "name",
      render: (_v, r) => (
        <div>
          <Text strong>{r.property_name}</Text>
          {r.admin_note && (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {r.admin_note}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Location",
      key: "loc",
      render: (_v, r) => (
        <Text type="secondary">
          {r.island ?? "—"}
          {r.country ? `, ${r.country}` : ""}
        </Text>
      ),
    },
    {
      title: "Submitted",
      dataIndex: "created_at",
      key: "created_at",
      width: 140,
      render: (v: string) => (
        <Text type="secondary">{fmtDay(v)}</Text>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 160,
      render: (v: PropertyRequestRow["status"]) => (
        <Tag color={statusTag[v].color}>{statusTag[v].label}</Tag>
      ),
    },
  ]

  return (
    <Space direction="vertical" size={20} style={{ width: "100%" }}>
      <Row align="middle" justify="space-between" wrap>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            {rows.length} {rows.length === 1 ? "property" : "properties"}
          </Title>
          <Text type="secondary">Your venues on the Dream Islands platform</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
          Add Object
        </Button>
      </Row>

      {errorMessage && <Alert type="error" message={`DB error: ${errorMessage}`} showIcon />}

      <Card variant="borderless" styles={{ body: { padding: 0 } }}>
        <Table<PartnerPropertyRow>
          rowKey="id"
          columns={columns}
          dataSource={rows}
          pagination={false}
          onRow={(r) => rowNav(() => router.push(`/partner/properties/${r.id}`))}
          locale={{ emptyText: <Empty description="No properties linked to your account yet" /> }}
        />
      </Card>

      {requests.length > 0 && (
        <Card
          variant="borderless"
          title={<Text strong>Requested objects</Text>}
          styles={{ body: { padding: 0 } }}
        >
          <Table<PropertyRequestRow>
            rowKey="id"
            columns={requestColumns}
            dataSource={requests}
            pagination={false}
            size="middle"
          />
        </Card>
      )}

      <Modal
        title="Add a new object"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        okText="Request object addition"
        confirmLoading={saving}
        destroyOnHidden
        width={560}
      >
        <Alert
          type="info"
          showIcon
          icon={<CheckCircleOutlined />}
          message="Your request is recorded, not just emailed"
          description="It's saved in the platform the moment you submit, and you'll see it below with its status until the object is live. We also email you a copy. Typical response: 1 business day."
          style={{ marginBottom: 20 }}
        />

        <Form<RequestFormValues> form={form} layout="vertical" onFinish={onSubmit}>
          <Form.Item
            name="property_name"
            label="Object name"
            rules={[{ required: true, message: "Name required" }]}
          >
            <Input autoComplete="off" placeholder="Tanya Samui — North Villa" />
          </Form.Item>
          <Row gutter={12}>
            <Form.Item name="island" label="Island" style={{ flex: 1, marginRight: 12 }}>
              <Input autoComplete="off" />
            </Form.Item>
            <Form.Item name="country" label="Country" style={{ flex: 1 }}>
              <Input autoComplete="off" />
            </Form.Item>
          </Row>
          <Form.Item name="description" label="What is it?">
            <TextArea rows={3} placeholder="Rooms, programs, what makes it different" />
          </Form.Item>
          <Row gutter={12}>
            <Form.Item name="contact_name" label="Contact person" style={{ flex: 1, marginRight: 12 }}>
              <Input autoComplete="off" />
            </Form.Item>
            <Form.Item name="contact_phone" label="Contact phone" style={{ flex: 1 }}>
              <Input autoComplete="off" placeholder="+66800000000" />
            </Form.Item>
          </Row>
        </Form>

        <div
          style={{
            border: "1px solid #eef1ef",
            borderRadius: 8,
            padding: "12px 14px",
            background: "#fafcfb",
          }}
        >
          <Text strong style={{ fontSize: 13 }}>
            Prefer to talk it through?
          </Text>
          <div style={{ marginTop: 8 }}>
            <Space size={16} wrap>
              <a href={DIT_WHATSAPP_URL} target="_blank" rel="noreferrer">
                <Space size={6}>
                  <WhatsAppOutlined />
                  WhatsApp
                </Space>
              </a>
              <a href={`mailto:${DIT_EMAIL}`}>
                <Space size={6}>
                  <MailOutlined />
                  {DIT_EMAIL}
                </Space>
              </a>
            </Space>
          </div>
        </div>
      </Modal>
    </Space>
  )
}
