"use client"

import {
  ArrowLeftOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons"
import {
  Alert,
  App,
  Button,
  Card,
  Descriptions,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  Typography,
} from "antd"
import type { ColumnsType } from "antd/es/table"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import PropertyFormFields, {
  CohortTags,
  useCohortOptions,
  type PropertyFormValues,
} from "../PropertyFormFields"
import UsersView from "../../users/UsersView"
import type { DbBooking, GuestRow } from "@/lib/guest-metrics"
import type { PropertyRow } from "../PropertiesView"

const { Text, Title } = Typography
const { TextArea } = Input

export type RoomRow = {
  id: string
  room_type: string
  capacity: number
  has_pool: boolean
  price_thb_per_night: number
  description: string | null
  active: boolean
  sort_order: number | null
}

export type ProgramLinkRow = {
  id: string
  name: string
  slug: string | null
  cohort: number | null
  tier: string | null
  duration_days: number | null
  price_usd: number | null
  active: boolean
}

export type SpecialistRow = {
  id: string
  name: string
  role: string | null
  cohort_focus: number[] | null
  active: boolean
}

export type CanEdit = {
  overview: boolean
  rooms: boolean
  programs: boolean
  specialists: boolean
}

export default function PropertyDetailView({
  property,
  rooms,
  programs,
  attachablePrograms,
  specialists,
  guests,
  guestBookings,
  guestBasePath,
  parentOptions,
  backHref,
  backLabel,
  canEdit,
  errorMessage,
}: {
  property: PropertyRow
  rooms: RoomRow[]
  programs: ProgramLinkRow[]
  attachablePrograms: ProgramLinkRow[]
  specialists: SpecialistRow[]
  guests: GuestRow[]
  guestBookings: DbBooking[]
  guestBasePath: string
  parentOptions: Array<{ id: string; name: string }>
  backHref: string
  backLabel: string
  canEdit: CanEdit
  errorMessage: string | null
}) {
  const router = useRouter()
  const { message, modal } = App.useApp()
  const [tab, setTab] = useState("overview")

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
        <Title level={3} style={{ margin: 0, fontWeight: 600 }}>
          {property.name}
        </Title>
        <Space size={6} wrap style={{ marginTop: 4 }}>
          <Text code style={{ fontSize: 11 }}>
            {property.slug}
          </Text>
          <Text type="secondary">
            {property.island ?? "—"}
            {property.country ? `, ${property.country}` : ""}
          </Text>
          {property.active ? <Tag color="green">active</Tag> : <Tag>inactive</Tag>}
          {property.certified && (
            <Tag color="blue" icon={<SafetyCertificateOutlined />}>
              verified
            </Tag>
          )}
        </Space>
      </div>

      {errorMessage && <Alert type="error" message={`DB error: ${errorMessage}`} showIcon />}

      <Tabs
        activeKey={tab}
        onChange={setTab}
        items={[
          {
            key: "overview",
            label: "Overview",
            children: (
              <Card variant="borderless">
                <OverviewTab
                  property={property}
                  parentOptions={parentOptions}
                  canEdit={canEdit.overview}
                />
              </Card>
            ),
          },
          {
            key: "guests",
            label: `Guests (${guests.length})`,
            children: (
              <UsersView
                rows={guests}
                bookings={guestBookings}
                programOptions={[]}
                propertyOptions={[]}
                activeFilters={{ program: null, property: null }}
                errorMessage={null}
                basePath={guestBasePath}
                role={canEdit.overview ? "admin" : "partner"}
                embedded
              />
            ),
          },
          {
            key: "rooms",
            label: `Rooms (${rooms.length})`,
            children: (
              <Card variant="borderless" styles={{ body: { padding: 0 } }}>
                <RoomsTab
                  propertyId={property.id}
                  rooms={rooms}
                  canEdit={canEdit.rooms}
                  onDone={() => router.refresh()}
                  message={message}
                  modal={modal}
                />
              </Card>
            ),
          },
          {
            key: "programs",
            label: `Programs (${programs.length})`,
            children: (
              <Card variant="borderless" styles={{ body: { padding: 0 } }}>
                <ProgramsTab
                  propertyId={property.id}
                  programs={programs}
                  attachable={attachablePrograms}
                  canEdit={canEdit.programs}
                  onDone={() => router.refresh()}
                  message={message}
                />
              </Card>
            ),
          },
          {
            key: "specialists",
            label: `Specialists (${specialists.length})`,
            children: (
              <Card variant="borderless" styles={{ body: { padding: 0 } }}>
                <SpecialistsTab
                  propertyId={property.id}
                  specialists={specialists}
                  canEdit={canEdit.specialists}
                  onDone={() => router.refresh()}
                  message={message}
                />
              </Card>
            ),
          },
        ]}
      />
    </Space>
  )
}

/* ─── Overview ─────────────────────────────────────────────── */

function OverviewTab({
  property,
  parentOptions,
  canEdit,
}: {
  property: PropertyRow
  parentOptions: Array<{ id: string; name: string }>
  canEdit: boolean
}) {
  const router = useRouter()
  const { message } = App.useApp()
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm<PropertyFormValues>()

  if (!canEdit) {
    return (
      <Descriptions column={1} size="middle">
        <Descriptions.Item label="Name">{property.name}</Descriptions.Item>
        <Descriptions.Item label="Slug">{property.slug}</Descriptions.Item>
        <Descriptions.Item label="Island">{property.island ?? "—"}</Descriptions.Item>
        <Descriptions.Item label="Country">{property.country ?? "—"}</Descriptions.Item>
        <Descriptions.Item label="Cohort focus">
          <CohortTags ids={property.cohort_tags} subtypeIds={property.performance_subtype_ids} />
        </Descriptions.Item>
        <Descriptions.Item label="WhatsApp">{property.contact_wa ?? "—"}</Descriptions.Item>
        <Descriptions.Item label="Description">{property.description ?? "—"}</Descriptions.Item>
      </Descriptions>
    )
  }

  async function onSubmit(values: PropertyFormValues) {
    setSaving(true)
    try {
      const res = await fetch(`/api/properties/${property.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, parent_id: values.parent_id || null }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        message.error(json.error ?? "Save failed")
        return
      }
      message.success("Property updated")
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Form<PropertyFormValues>
      form={form}
      layout="vertical"
      onFinish={onSubmit}
      initialValues={{
        name: property.name,
        slug: property.slug,
        parent_id: property.parent_id ?? undefined,
        island: property.island ?? undefined,
        country: property.country ?? undefined,
        cohort_tags: property.cohort_tags ?? [],
        performance_subtype_ids: property.performance_subtype_ids ?? [],
        certified: property.certified,
        active: property.active,
        contact_wa: property.contact_wa ?? undefined,
        description: property.description ?? undefined,
      }}
      style={{ maxWidth: 560 }}
    >
      <PropertyFormFields parentOptions={parentOptions} excludeParentId={property.id} />
      <Button type="primary" htmlType="submit" loading={saving}>
        Save changes
      </Button>
    </Form>
  )
}

/* ─── Rooms ────────────────────────────────────────────────── */

type RoomFormValues = {
  room_type: string
  capacity: number
  price_thb_per_night: number
  has_pool?: boolean
  active?: boolean
  description?: string
}

function RoomsTab({
  propertyId,
  rooms,
  canEdit,
  onDone,
  message,
  modal,
}: {
  propertyId: string
  rooms: RoomRow[]
  canEdit: boolean
  onDone: () => void
  message: ReturnType<typeof App.useApp>["message"]
  modal: ReturnType<typeof App.useApp>["modal"]
}) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<RoomRow | null>(null)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm<RoomFormValues>()

  function openCreate() {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ active: true, has_pool: false, capacity: 2 })
    setOpen(true)
  }

  function openEdit(r: RoomRow) {
    setEditing(r)
    form.setFieldsValue({
      room_type: r.room_type,
      capacity: r.capacity,
      price_thb_per_night: r.price_thb_per_night,
      has_pool: r.has_pool,
      active: r.active,
      description: r.description ?? undefined,
    })
    setOpen(true)
  }

  async function onSubmit(values: RoomFormValues) {
    setSaving(true)
    try {
      // property_id is immutable after create, matching the accommodations admin page
      const body = editing ? values : { ...values, property_id: propertyId }
      const url = editing ? `/api/accommodations/${editing.id}` : "/api/accommodations"
      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        message.error(json.error ?? "Save failed")
        return
      }
      message.success(editing ? "Room updated" : "Room added")
      setOpen(false)
      onDone()
    } finally {
      setSaving(false)
    }
  }

  function confirmDelete(r: RoomRow) {
    modal.confirm({
      title: `Deactivate ${r.room_type}?`,
      content: "The room stays in history but is hidden from active listings.",
      okText: "Deactivate",
      okButtonProps: { danger: true },
      onOk: async () => {
        const res = await fetch(`/api/accommodations/${r.id}`, { method: "DELETE" })
        const json = await res.json()
        if (!res.ok || !json.success) {
          message.error(json.error ?? "Delete failed")
          return
        }
        message.success("Room deactivated")
        onDone()
      },
    })
  }

  const columns: ColumnsType<RoomRow> = [
    {
      title: "Room",
      key: "room",
      render: (_v, r) => (
        <div>
          <Text strong>{r.room_type}</Text>
          {r.description && (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {r.description}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    { title: "Capacity", dataIndex: "capacity", key: "capacity", width: 100 },
    {
      title: "Pool",
      dataIndex: "has_pool",
      key: "has_pool",
      width: 80,
      render: (v: boolean) => (v ? <Tag color="blue">pool</Tag> : <Text type="secondary">—</Text>),
    },
    {
      title: "Price / night",
      dataIndex: "price_thb_per_night",
      key: "price",
      width: 130,
      render: (v: number) => <Text>{v.toLocaleString()} ฿</Text>,
    },
    {
      title: "Status",
      dataIndex: "active",
      key: "active",
      width: 100,
      render: (v: boolean) => (v ? <Tag color="green">active</Tag> : <Tag>inactive</Tag>),
    },
    ...(canEdit
      ? [
          {
            title: "Actions",
            key: "actions",
            width: 150,
            render: (_v: unknown, r: RoomRow) => (
              <Space size={4}>
                <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>
                  Edit
                </Button>
                <Button size="small" danger icon={<DeleteOutlined />} onClick={() => confirmDelete(r)} />
              </Space>
            ),
          } as ColumnsType<RoomRow>[number],
        ]
      : []),
  ]

  return (
    <>
      {canEdit && (
        <div style={{ padding: "12px 16px", textAlign: "right" }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Add room
          </Button>
        </div>
      )}
      <Table<RoomRow>
        rowKey="id"
        columns={columns}
        dataSource={rooms}
        pagination={false}
        locale={{ emptyText: <Empty description="No rooms yet" /> }}
      />
      <Modal
        title={editing ? `Edit ${editing.room_type}` : "New room"}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        okText={editing ? "Save" : "Create"}
        confirmLoading={saving}
        destroyOnHidden
      >
        <Form<RoomFormValues> form={form} layout="vertical" onFinish={onSubmit}>
          <Form.Item name="room_type" label="Room type" rules={[{ required: true, message: "Required" }]}>
            <Input autoComplete="off" placeholder="Classic Villa" />
          </Form.Item>
          <Form.Item
            name="capacity"
            label="Capacity"
            rules={[{ required: true, message: "Required" }]}
          >
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            name="price_thb_per_night"
            label="Price per night (THB)"
            rules={[{ required: true, message: "Required" }]}
          >
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="has_pool" label="Private pool" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="active" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

/* ─── Programs ─────────────────────────────────────────────── */

function ProgramsTab({
  propertyId,
  programs,
  attachable,
  canEdit,
  onDone,
  message,
}: {
  propertyId: string
  programs: ProgramLinkRow[]
  attachable: ProgramLinkRow[]
  canEdit: boolean
  onDone: () => void
  message: ReturnType<typeof App.useApp>["message"]
}) {
  const [attaching, setAttaching] = useState<string | undefined>(undefined)
  const [busy, setBusy] = useState(false)

  const linkedIds = new Set(programs.map((p) => p.id))
  const options = attachable
    .filter((p) => !linkedIds.has(p.id))
    .map((p) => ({ value: p.id, label: p.name }))

  async function attach() {
    if (!attaching) return
    setBusy(true)
    try {
      const res = await fetch(`/api/properties/${propertyId}/programs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ program_id: attaching }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        message.error(json.error ?? "Attach failed")
        return
      }
      message.success("Program attached")
      setAttaching(undefined)
      onDone()
    } finally {
      setBusy(false)
    }
  }

  async function detach(programId: string) {
    const res = await fetch(
      `/api/properties/${propertyId}/programs?program_id=${programId}`,
      { method: "DELETE" },
    )
    const json = await res.json()
    if (!res.ok || !json.success) {
      message.error(json.error ?? "Detach failed")
      return
    }
    message.success("Program detached")
    onDone()
  }

  const columns: ColumnsType<ProgramLinkRow> = [
    {
      title: "Program",
      key: "name",
      render: (_v, p) =>
        canEdit ? (
          <Link href={`/admin/programs/${p.id}/edit`}>
            <Text strong>{p.name}</Text>
          </Link>
        ) : (
          <Text strong>{p.name}</Text>
        ),
    },
    {
      title: "Cohort",
      dataIndex: "cohort",
      key: "cohort",
      width: 100,
      render: (v: number | null) =>
        v ? (
          <Tag style={{ background: "#E1F5EE", color: "#0F6E56", border: "none" }}>C{v}</Tag>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    { title: "Tier", dataIndex: "tier", key: "tier", width: 110 },
    {
      title: "Duration",
      dataIndex: "duration_days",
      key: "duration",
      width: 100,
      render: (v: number | null) => (v ? `${v} days` : "—"),
    },
    {
      title: "Status",
      dataIndex: "active",
      key: "active",
      width: 100,
      render: (v: boolean) => (v ? <Tag color="green">active</Tag> : <Tag>inactive</Tag>),
    },
    ...(canEdit
      ? [
          {
            title: "Actions",
            key: "actions",
            width: 110,
            render: (_v: unknown, p: ProgramLinkRow) => (
              <Button size="small" danger onClick={() => detach(p.id)}>
                Detach
              </Button>
            ),
          } as ColumnsType<ProgramLinkRow>[number],
        ]
      : []),
  ]

  return (
    <>
      {canEdit && (
        <div style={{ padding: "12px 16px", display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Select
            style={{ minWidth: 260 }}
            placeholder="Attach an existing program"
            options={options}
            value={attaching}
            onChange={setAttaching}
            showSearch
            optionFilterProp="label"
            allowClear
          />
          <Button type="primary" icon={<PlusOutlined />} disabled={!attaching} loading={busy} onClick={attach}>
            Attach
          </Button>
        </div>
      )}
      <Table<ProgramLinkRow>
        rowKey="id"
        columns={columns}
        dataSource={programs}
        pagination={false}
        locale={{ emptyText: <Empty description="No programs linked to this property" /> }}
      />
    </>
  )
}

/* ─── Specialists ──────────────────────────────────────────── */

type SpecialistFormValues = {
  name: string
  role?: string
  cohort_focus?: number[]
  active?: boolean
}

function SpecialistsTab({
  propertyId,
  specialists,
  canEdit,
  onDone,
  message,
}: {
  propertyId: string
  specialists: SpecialistRow[]
  canEdit: boolean
  onDone: () => void
  message: ReturnType<typeof App.useApp>["message"]
}) {
  const cohortOptions = useCohortOptions()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<SpecialistRow | null>(null)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm<SpecialistFormValues>()

  function openCreate() {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ active: true })
    setOpen(true)
  }

  function openEdit(s: SpecialistRow) {
    setEditing(s)
    form.setFieldsValue({
      name: s.name,
      role: s.role ?? undefined,
      cohort_focus: s.cohort_focus ?? [],
      active: s.active,
    })
    setOpen(true)
  }

  async function onSubmit(values: SpecialistFormValues) {
    setSaving(true)
    try {
      // property_id is sent explicitly: a partner may now have several properties,
      // so the server can no longer infer which one this specialist belongs to.
      const body = editing ? values : { ...values, property_id: propertyId }
      const url = editing ? `/api/specialists/${editing.id}` : "/api/specialists"
      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        message.error(json.error ?? "Save failed")
        return
      }
      message.success(editing ? "Specialist updated" : "Specialist added")
      setOpen(false)
      onDone()
    } finally {
      setSaving(false)
    }
  }

  const columns: ColumnsType<SpecialistRow> = [
    {
      title: "Name",
      key: "name",
      render: (_v, s) => (
        <div>
          <Text strong>{s.name}</Text>
          {s.role && (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {s.role}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Cohort focus",
      dataIndex: "cohort_focus",
      key: "cohort_focus",
      render: (tags: number[] | null) => <CohortTags ids={tags} />,
    },
    {
      title: "Status",
      dataIndex: "active",
      key: "active",
      width: 100,
      render: (v: boolean) => (v ? <Tag color="green">active</Tag> : <Tag>inactive</Tag>),
    },
    ...(canEdit
      ? [
          {
            title: "Actions",
            key: "actions",
            width: 100,
            render: (_v: unknown, s: SpecialistRow) => (
              <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(s)}>
                Edit
              </Button>
            ),
          } as ColumnsType<SpecialistRow>[number],
        ]
      : []),
  ]

  return (
    <>
      {canEdit && (
        <div style={{ padding: "12px 16px", textAlign: "right" }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Add specialist
          </Button>
        </div>
      )}
      <Table<SpecialistRow>
        rowKey="id"
        columns={columns}
        dataSource={specialists}
        pagination={false}
        locale={{ emptyText: <Empty description="No specialists at this property" /> }}
      />
      <Modal
        title={editing ? `Edit ${editing.name}` : "New specialist"}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        okText={editing ? "Save" : "Create"}
        confirmLoading={saving}
        destroyOnHidden
      >
        <Form<SpecialistFormValues> form={form} layout="vertical" onFinish={onSubmit}>
          <Form.Item name="name" label="Name" rules={[{ required: true, message: "Name required" }]}>
            <Input autoComplete="off" />
          </Form.Item>
          <Form.Item name="role" label="Role / specialty">
            <Input autoComplete="off" placeholder="Physiotherapist" />
          </Form.Item>
          <Form.Item name="cohort_focus" label="Cohort focus">
            <Select mode="multiple" options={cohortOptions} placeholder="Pick cohorts" optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="active" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
