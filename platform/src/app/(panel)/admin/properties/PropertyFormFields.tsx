"use client"

import { Form, Input, Row, Select, Space, Switch, Tag } from "antd"
import { createContext, useContext } from "react"
import type { CohortCatalog } from "@/lib/cohorts"

const { TextArea } = Input

// Cohorts come from the `tracks` table; the admin pages load them and provide
// them here so the property form, tag lists and specialists tab all match the DB.
const LEGACY_CATALOG: CohortCatalog = {
  cohorts: [
    { id: 1, code: "reset", label: "Reset", is_public: true },
    { id: 2, code: "performance", label: "Performance", is_public: true },
    { id: 3, code: "mind", label: "Mind", is_public: true },
    { id: 4, code: "immersion", label: "Immersion", is_public: true },
  ],
  performanceSubtypes: [],
  performanceId: 2,
}

const CohortCatalogContext = createContext<CohortCatalog>(LEGACY_CATALOG)

export function CohortCatalogProvider({ catalog, children }: { catalog: CohortCatalog; children: React.ReactNode }) {
  return <CohortCatalogContext.Provider value={catalog}>{children}</CohortCatalogContext.Provider>
}

export function useCohortOptions() {
  const catalog = useContext(CohortCatalogContext)
  return catalog.cohorts.map((c) => ({
    value: c.id,
    label: `${c.id} · ${c.label}${c.is_public ? "" : " (internal)"}`,
  }))
}

const TAG_STYLE = { background: "#E1F5EE", color: "#0F6E56", border: "none" }

/** Cohort chips (+ Performance subcategories) as shown in tables and read-only views. */
export function CohortTags({ ids, subtypeIds }: { ids: number[] | null | undefined; subtypeIds?: number[] | null }) {
  const catalog = useContext(CohortCatalogContext)
  const byId = new Map(catalog.cohorts.map((c) => [c.id, c.label]))
  const subById = new Map(catalog.performanceSubtypes.map((s) => [s.id, s.label]))
  if (!ids || ids.length === 0) return <>—</>
  return (
    <Space size={4} wrap>
      {ids.map((c) => (
        <Tag key={c} style={TAG_STYLE}>
          {byId.get(c) ?? `C${c}`}
        </Tag>
      ))}
      {(subtypeIds ?? []).map((sid) => (
        <Tag key={`s${sid}`} style={{ ...TAG_STYLE, background: "#F1F8F5" }}>
          {subById.get(sid) ?? `sub ${sid}`}
        </Tag>
      ))}
    </Space>
  )
}

export type PropertyFormValues = {
  name: string
  slug: string
  parent_id?: string | null
  island?: string
  country?: string
  cohort_tags?: number[]
  performance_subtype_ids?: number[]
  certified?: boolean
  active?: boolean
  contact_wa?: string
  description?: string
}

// Shared between the quick-edit modal in the properties table and the Overview
// tab of the property detail page, so the two cannot drift apart.
export default function PropertyFormFields({
  parentOptions,
  excludeParentId,
}: {
  parentOptions: Array<{ id: string; name: string }>
  excludeParentId?: string
}) {
  const catalog = useContext(CohortCatalogContext)
  const cohortOptions = useCohortOptions()
  return (
    <>
      <Form.Item name="name" label="Name" rules={[{ required: true, message: "Name required" }]}>
        <Input autoComplete="off" placeholder="Tanya Samui — Core" />
      </Form.Item>
      <Form.Item
        name="slug"
        label="Slug"
        rules={[
          { required: true, message: "Slug required" },
          { pattern: /^[a-z0-9-]+$/, message: "Lowercase letters, digits, hyphens" },
        ]}
      >
        <Input autoComplete="off" placeholder="tanya-core" />
      </Form.Item>
      <Form.Item name="parent_id" label="Parent property (optional)">
        <Select
          allowClear
          placeholder="No parent (top-level)"
          options={parentOptions
            .filter((p) => p.id !== excludeParentId)
            .map((p) => ({ value: p.id, label: p.name }))}
        />
      </Form.Item>
      <Row gutter={12}>
        <Form.Item name="island" label="Island" style={{ flex: 1, marginRight: 12 }}>
          <Input autoComplete="off" />
        </Form.Item>
        <Form.Item name="country" label="Country" style={{ flex: 1 }}>
          <Input autoComplete="off" />
        </Form.Item>
      </Row>
      <Form.Item name="cohort_tags" label="Cohort focus">
        <Select mode="multiple" options={cohortOptions} placeholder="Pick cohorts" optionFilterProp="label" />
      </Form.Item>
      {catalog.performanceSubtypes.length > 0 && (
        <Form.Item noStyle shouldUpdate={(a, b) => a.cohort_tags !== b.cohort_tags}>
          {({ getFieldValue }) =>
            (getFieldValue("cohort_tags") ?? []).includes(catalog.performanceId) ? (
              <Form.Item
                name="performance_subtype_ids"
                label="Performance subcategories"
                tooltip="Which kinds of Performance programs this property can host."
              >
                <Select
                  mode="multiple"
                  placeholder="Pick subcategories"
                  options={catalog.performanceSubtypes.map((s) => ({ value: s.id, label: s.label }))}
                />
              </Form.Item>
            ) : null
          }
        </Form.Item>
      )}
      <Row gutter={12}>
        <Form.Item name="certified" label="Verified Partner" valuePropName="checked" style={{ marginRight: 24 }}>
          <Switch />
        </Form.Item>
        <Form.Item name="active" label="Active" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Row>
      <Form.Item name="contact_wa" label="WhatsApp number (with country code)">
        <Input autoComplete="off" placeholder="+66800000000" />
      </Form.Item>
      <Form.Item name="description" label="Description">
        <TextArea rows={3} />
      </Form.Item>
    </>
  )
}
