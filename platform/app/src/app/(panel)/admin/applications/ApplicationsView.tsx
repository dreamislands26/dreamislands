"use client"

import { CheckCircleFilled, ClockCircleFilled, CloseCircleFilled } from "@ant-design/icons"
import {
  Alert,
  App,
  Card,
  Descriptions,
  Drawer,
  Empty,
  List,
  Progress,
  Select,
  Space,
  Steps,
  Table,
  Tag,
  Timeline,
  Typography,
} from "antd"
import type { ColumnsType } from "antd/es/table"
import { useRouter } from "next/navigation"
import { useState } from "react"
import type { PartnerApplication } from "@/lib/partner-applications"
import { COHORT_NAMES, OFFERINGS, SOURCES, STAGES, type Stage } from "@/lib/partner-application-options"

const { Text, Title, Paragraph } = Typography

const STAGE_COLOR: Record<Stage, string> = {
  new: "blue",
  qualify: "gold",
  structure: "purple",
  verify: "orange",
  live: "green",
  declined: "default",
}
const PATH = STAGES.filter((s) => s.key !== "declined")
const stageLabel = (k: Stage) => STAGES.find((s) => s.key === k)?.label ?? k
const offeringLabel = (k: string) => OFFERINGS.find((o) => o.key === k)?.label ?? k
const date = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })

const CHECK_ICON = {
  ok: <CheckCircleFilled style={{ color: "#52c41a" }} />,
  review: <ClockCircleFilled style={{ color: "#faad14" }} />,
  missing: <CloseCircleFilled style={{ color: "#d9d9d9" }} />,
}

export default function ApplicationsView({ enabled, rows }: { enabled: boolean; rows: PartnerApplication[] }) {
  const router = useRouter()
  const { message } = App.useApp()
  const [openId, setOpenId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const open = rows.find((r) => r.id === openId) ?? null

  async function move(id: string, stage: Stage) {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/partner-applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || "Could not save")
      message.success(`Moved to ${stageLabel(stage)}`)
      router.refresh()
    } catch (e) {
      message.error(e instanceof Error ? e.message : "Could not save")
    } finally {
      setSaving(false)
    }
  }

  const columns: ColumnsType<PartnerApplication> = [
    {
      title: "Property",
      render: (_, r) => (
        <Space direction="vertical" size={0}>
          <Text strong>{r.property.name}</Text>
          <Text type="secondary">{[r.property.type, [r.property.city, r.property.country].filter(Boolean).join(", ")].filter(Boolean).join(" · ")}</Text>
        </Space>
      ),
    },
    {
      title: "Tracks",
      render: (_, r) => r.profile.cohorts.length ? r.profile.cohorts.map((c) => <Tag key={c}>{COHORT_NAMES[c]}</Tag>) : <Text type="secondary">—</Text>,
    },
    { title: "Programmes", align: "right", render: (_, r) => r.programs.length },
    { title: "Practitioners", align: "right", render: (_, r) => r.practitioners.length },
    {
      title: "Profile",
      width: 140,
      sorter: (a, b) => a.profile.completeness - b.profile.completeness,
      render: (_, r) => <Progress percent={r.profile.completeness} size="small" />,
    },
    {
      title: "Stage",
      filters: STAGES.map((s) => ({ text: s.label, value: s.key })),
      onFilter: (v, r) => r.crm.stage === v,
      render: (_, r) => <Tag color={STAGE_COLOR[r.crm.stage]}>{stageLabel(r.crm.stage)}</Tag>,
    },
    { title: "Received", render: (_, r) => <Text type="secondary">{date(r.createdAt)}</Text> },
  ]

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <div>
        <Title level={3} style={{ margin: 0 }}>Partner applications</Title>
        <Text type="secondary">Each application from /partners/apply opens a CRM record and a primary partner profile.</Text>
      </div>
      {!enabled ? (
        <Alert type="info" showIcon message="Local test" description="Partner applications are stored in a local file and are off on this server. Set PARTNER_APPLICATIONS_STORE=file to try them." />
      ) : (
        <>
          <Alert type="warning" showIcon message="Local test: records live in .data/partner-applications.json on this machine, not in the database." />
          <Card styles={{ body: { padding: 0 } }}>
            <Table
              rowKey="id"
              columns={columns}
              dataSource={rows}
              pagination={false}
              locale={{ emptyText: <Empty description="No applications yet" /> }}
              onRow={(r) => ({ onClick: () => setOpenId(r.id), style: { cursor: "pointer" } })}
            />
          </Card>
        </>
      )}

      <Drawer open={!!open} onClose={() => setOpenId(null)} width={640} title={open?.property.name}>
        {open && (
          <Space direction="vertical" size={24} style={{ width: "100%" }}>
            <Card size="small" title="CRM">
              <Space direction="vertical" size={16} style={{ width: "100%" }}>
                {open.crm.stage === "declined" ? (
                  <Tag color="default">Declined</Tag>
                ) : (
                  <Steps size="small" progressDot labelPlacement="vertical" current={PATH.findIndex((s) => s.key === open.crm.stage)} items={PATH.map((s) => ({ title: s.label }))} />
                )}
                <Space wrap>
                  <Text type="secondary">Move to</Text>
                  <Select
                    style={{ width: 220 }}
                    value={open.crm.stage}
                    loading={saving}
                    options={STAGES.map((s) => ({ value: s.key, label: s.label }))}
                    onChange={(v) => move(open.id, v)}
                  />
                  <Text type="secondary">Owner: {open.crm.owner ?? "not assigned"}</Text>
                </Space>
                <Timeline
                  items={[...open.crm.history].reverse().map((h) => ({
                    color: STAGE_COLOR[h.stage],
                    children: <><Text>{stageLabel(h.stage)}</Text> <Text type="secondary">· {date(h.at)} · {h.by}</Text></>,
                  }))}
                />
              </Space>
            </Card>

            <Card size="small" title="Primary profile" extra={<Space size={8}><Text type="secondary">Filled in</Text><Progress percent={open.profile.completeness} size="small" style={{ width: 140, margin: 0 }} /></Space>}>
              <Descriptions column={1} size="small" items={[
                { label: "Type", children: open.property.type || "—" },
                { label: "Location", children: [open.property.city, open.property.country].filter(Boolean).join(", ") },
                { label: "Website", children: open.property.website ? <a href={open.property.website} target="_blank" rel="noreferrer">{open.property.website}</a> : "—" },
                { label: "Offering", children: open.offerings.length ? open.offerings.map((k) => <Tag key={k}>{offeringLabel(k)}</Tag>) : "—" },
                { label: "Tracks", children: open.profile.cohorts.length ? open.profile.cohorts.map((c) => <Tag key={c} color="green">{COHORT_NAMES[c]}</Tag>) : "—" },
                { label: "Medical", children: open.profile.medical ? <Tag color="red">Needs medical review</Tag> : "No" },
                { label: "Source", children: SOURCES.find((s) => s.key === open.source)?.label ?? "—" },
              ]} />
            </Card>

            <Card size="small" title="Qualification checks">
              <List
                size="small"
                dataSource={open.profile.checks}
                renderItem={(c) => (
                  <List.Item>
                    <Space>{CHECK_ICON[c.status]}<Text>{c.label}</Text>{c.note && <Text type="secondary">· {c.note}</Text>}</Space>
                  </List.Item>
                )}
              />
            </Card>

            <Card size="small" title={`Programmes (${open.programs.length})`}>
              {open.programs.length ? (
                <List size="small" dataSource={open.programs} renderItem={(p) => (
                  <List.Item extra={p.priceFrom ? <Text>from ${p.priceFrom.toLocaleString("en-US")}</Text> : <Text type="secondary">no price</Text>}>
                    <Space>{p.name}{p.nights && <Text type="secondary">{p.nights} nights</Text>}</Space>
                  </List.Item>
                )} />
              ) : <Text type="secondary">None listed</Text>}
            </Card>

            <Card size="small" title={`Practitioners (${open.practitioners.length})`}>
              {open.practitioners.length ? (
                <List size="small" dataSource={open.practitioners} renderItem={(p) => (
                  <List.Item><Space>{p.name}{p.specialty && <Text type="secondary">{p.specialty}</Text>}</Space></List.Item>
                )} />
              ) : <Text type="secondary">None listed</Text>}
            </Card>

            <Card size="small" title="Contact">
              <Paragraph style={{ margin: 0 }}>
                <Text strong>{open.contact.name}</Text>{open.contact.role && <Text type="secondary"> · {open.contact.role}</Text>}<br />
                <a href={`mailto:${open.contact.email}`}>{open.contact.email}</a>
                {open.contact.phone && <><br /><Text>{open.contact.phone}</Text></>}
              </Paragraph>
            </Card>
          </Space>
        )}
      </Drawer>
    </Space>
  )
}
