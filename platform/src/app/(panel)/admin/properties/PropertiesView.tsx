"use client"

import {
  ArrowRightOutlined,
  EditOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons"
import {
  Alert,
  App,
  Button,
  Card,
  Empty,
  Form,
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
import PropertyFormFields, { CohortTags, type PropertyFormValues } from "./PropertyFormFields"

const { Text, Title } = Typography

export type PropertyRow = {
  id: string
  name: string
  slug: string
  parent_id: string | null
  parent_name?: string | null
  island: string | null
  country: string | null
  cohort_tags: number[] | null
  performance_subtype_ids?: number[] | null
  certified: boolean
  active: boolean
  contact_wa: string | null
  description: string | null
  created_at: string
}

type FormValues = PropertyFormValues

export default function PropertiesView({
  rows,
  parentOptions,
  errorMessage,
}: {
  rows: PropertyRow[]
  parentOptions: Array<{ id: string; name: string }>
  errorMessage: string | null
}) {
  const router = useRouter()
  const { message } = App.useApp()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<PropertyRow | null>(null)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm<FormValues>()

  function openCreate() {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ active: true, certified: false })
    setOpen(true)
  }

  function openEdit(p: PropertyRow) {
    setEditing(p)
    form.setFieldsValue({
      name: p.name,
      slug: p.slug,
      parent_id: p.parent_id ?? undefined,
      island: p.island ?? undefined,
      country: p.country ?? undefined,
      cohort_tags: p.cohort_tags ?? [],
      performance_subtype_ids: p.performance_subtype_ids ?? [],
      certified: p.certified,
      active: p.active,
      contact_wa: p.contact_wa ?? undefined,
      description: p.description ?? undefined,
    })
    setOpen(true)
  }

  async function onSubmit(values: FormValues) {
    setSaving(true)
    try {
      const body = {
        ...values,
        parent_id: values.parent_id || null,
      }
      const url = editing ? `/api/properties/${editing.id}` : "/api/properties"
      const method = editing ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        message.error(json.error ?? "Save failed")
        return
      }
      message.success(editing ? "Property updated" : "Property created")
      setOpen(false)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  const columns: ColumnsType<PropertyRow> = [
    {
      title: "Property",
      key: "name",
      render: (_v, p) => (
        <div>
          <Link href={`/admin/properties/${p.id}`}>
            <Text strong>{p.name}</Text>
          </Link>
          {p.parent_name && (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                ↳ inside {p.parent_name}
              </Text>
            </div>
          )}
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
    {
      title: "Cohorts",
      dataIndex: "cohort_tags",
      key: "cohort_tags",
      render: (tags: number[] | null, p) => <CohortTags ids={tags} subtypeIds={p.performance_subtype_ids} />,
    },
    {
      title: "Status",
      key: "status",
      render: (_v, p) => (
        <Space size={4}>
          {p.active ? <Tag color="green">active</Tag> : <Tag>inactive</Tag>}
          {p.certified && (
            <Tag color="blue" icon={<SafetyCertificateOutlined />}>
              verified
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 170,
      render: (_v, p) => (
        <Space size={4}>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(p)}>
            Edit
          </Button>
          <Link href={`/admin/properties/${p.id}`}>
            <Button size="small" icon={<ArrowRightOutlined />}>
              Open
            </Button>
          </Link>
        </Space>
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
          <Text type="secondary">Parent venues and clinical sub-units across SEA</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Property
        </Button>
      </Row>

      {errorMessage && <Alert type="error" message={`DB error: ${errorMessage}`} showIcon />}

      <Card variant="borderless" styles={{ body: { padding: 0 } }}>
        <Table<PropertyRow>
          rowKey="id"
          columns={columns}
          dataSource={rows}
          pagination={false}
          onRow={(r) => rowNav(() => router.push(`/admin/properties/${r.id}`))}
          locale={{ emptyText: <Empty description="No properties yet" /> }}
        />
      </Card>

      <Modal
        title={editing ? `Edit ${editing.name}` : "New property"}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        okText={editing ? "Save" : "Create"}
        confirmLoading={saving}
        destroyOnHidden
      >
        <Form<FormValues> form={form} layout="vertical" onFinish={onSubmit}>
          <PropertyFormFields parentOptions={parentOptions} excludeParentId={editing?.id} />
        </Form>
      </Modal>
    </Space>
  )
}
