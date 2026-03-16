'use client'

import { Incident } from '@/lib/types'
import { AlertTriangle, CheckCircle2, Circle, ShieldCheck } from 'lucide-react'
import { useMemo, useState } from 'react'

interface Props {
  incident: Incident
  approved: boolean
  onApprove: () => void
  onIncidentChange: (updated: Incident) => void
  validatedFields?: Record<string, boolean>
  onValidatedFieldsChange?: (fields: Record<string, boolean>) => void
  renderMode?: 'all' | 'sticky-bar' | 'details'
}

function EditableField({
  label,
  value,
  multiline,
  options,
  placeholder,
  onSave,
}: {
  label: string
  value: string
  multiline?: boolean
  options?: string[]
  placeholder?: string
  onSave: (value: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  function startEdit() {
    setDraft(value)
    setEditing(true)
  }

  function cancelEdit() {
    setDraft(value)
    setEditing(false)
  }

  function saveEdit() {
    onSave(draft.trim())
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="field-box space-y-2">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
        {options ? (
          <select className="input-base bg-white" value={draft} onChange={(e) => setDraft(e.target.value)}>
            {options.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        ) : multiline ? (
          <textarea
            className="textarea-base bg-white"
            rows={3}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={placeholder}
          />
        ) : (
          <input
            className="input-base bg-white"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={placeholder}
          />
        )}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary py-1" onClick={cancelEdit}>Cancel</button>
          <button type="button" className="btn-primary py-1" onClick={saveEdit}>Save</button>
        </div>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={startEdit}
      className="field-box w-full text-left transition hover:border-indigo-300 hover:bg-indigo-50/40"
      title="Click to edit"
    >
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-sm text-slate-800 whitespace-pre-wrap">
        {value || <span className="italic text-slate-400">{placeholder || 'No value'}</span>}
      </p>
      <p className="mt-2 text-xs text-indigo-600 font-semibold">Click to edit</p>
    </button>
  )
}

function ValidateToggle({
  label,
  value,
  validated,
  options,
  onValidate,
  onSave,
}: {
  label: string
  value: string
  validated: boolean
  options?: string[]
  onValidate: () => void
  onSave: (value: string) => void
}) {
  return (
    <div className="field-box space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
        <button type="button" className="validate-btn" onClick={onValidate}>
          {validated ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Circle className="w-3.5 h-3.5" />}
          {validated ? 'Validated' : 'Validate'}
        </button>
      </div>
      <EditableField
        label={label}
        value={value}
        options={options}
        onSave={onSave}
        placeholder="Fill in field"
      />
    </div>
  )
}

export default function NarrativeValidationStep({
  incident,
  approved,
  onApprove,
  onIncidentChange,
  validatedFields: externalFields,
  onValidatedFieldsChange,
  renderMode = 'all',
}: Props) {
  const narrative = useMemo(
    () => incident.knowledge_graph.objects.find((obj) => obj.obj_type === 'Narrative'),
    [incident]
  )

  const [internalFields, setInternalFields] = useState<Record<string, boolean>>({})
  const validatedFields = externalFields ?? internalFields

  function toggleField(key: string) {
    const next = { ...validatedFields, [key]: !validatedFields[key] }
    if (externalFields !== undefined) {
      onValidatedFieldsChange?.(next)
    } else {
      setInternalFields(next)
    }
  }

  const p = narrative?.properties ?? {}
  const description = p.Description?.value || ''
  const activeSubject = p.Active_Subject?.value || ''
  const activeSentiment = p.Active_Subject_Sentiment?.value || ''
  const passiveSubject = p.Passive_Subject?.value || ''
  const passiveSentiment = p.Passive_Subject_Sentiment?.value || ''
  const objectOfValue = p.Object_of_Value?.value || ''
  const goal = p.Goal?.value || ''
  const greimas = p.Greimas_Structure?.value || ''

  const total = 4
  const done = [
    validatedFields.active,
    validatedFields.activeModalization,
    validatedFields.passive,
    validatedFields.passiveModalization,
  ].filter(Boolean).length

  function updateNarrativeProperty(propertyName: string, value: string) {
    const objects = incident.knowledge_graph.objects.map((obj) => {
      if (obj.obj_type !== 'Narrative') return obj

      const current = obj.properties[propertyName]
      return {
        ...obj,
        properties: {
          ...obj.properties,
          [propertyName]: {
            value,
            method: current?.method || 'inferred',
            reasoning: current?.reasoning || 'Updated inline during narrative validation.',
          },
        },
      }
    })

    onIncidentChange({ ...incident, knowledge_graph: { ...incident.knowledge_graph, objects } })
  }

  if (!narrative) {
    if (renderMode === 'sticky-bar' || renderMode === 'details') return null
    return (
      <div className="card">
        <p className="text-sm text-slate-600">No Narrative entity found in this incident.</p>
      </div>
    )
  }

  // ── Sticky bar: validation toggles + approve button ───────────────────────
  if (renderMode === 'sticky-bar') {
    return (
      <div className="card shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <p className="text-xs font-bold uppercase tracking-wider text-rose-600">Pending Validation</p>
            <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
              {done}/{total} validated
            </span>
          </div>
          <button
            type="button"
            onClick={onApprove}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
          >
            <ShieldCheck className="w-4 h-4" />
            {approved ? 'Already Marked as Reviewed' : 'Approve and Mark as Reviewed'}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <ValidateToggle
            label="Active Actor"
            value={activeSubject}
            validated={!!validatedFields.active}
            onValidate={() => toggleField('active')}
            onSave={(value) => updateNarrativeProperty('Active_Subject', value)}
          />
          <ValidateToggle
            label="Active Actor Sentiment"
            value={activeSentiment}
            options={['Positive', 'Neutral', 'Negative']}
            validated={!!validatedFields.activeModalization}
            onValidate={() => toggleField('activeModalization')}
            onSave={(value) => updateNarrativeProperty('Active_Subject_Sentiment', value)}
          />
          <ValidateToggle
            label="Passive Actor / Victim"
            value={passiveSubject}
            validated={!!validatedFields.passive}
            onValidate={() => toggleField('passive')}
            onSave={(value) => updateNarrativeProperty('Passive_Subject', value)}
          />
          <ValidateToggle
            label="Passive Actor Sentiment"
            value={passiveSentiment}
            options={['Positive', 'Neutral', 'Negative']}
            validated={!!validatedFields.passiveModalization}
            onValidate={() => toggleField('passiveModalization')}
            onSave={(value) => updateNarrativeProperty('Passive_Subject_Sentiment', value)}
          />
        </div>
      </div>
    )
  }

  // ── Details: description, greimas, object of value, goal ──────────────────
  if (renderMode === 'details') {
    return (
      <div className="card space-y-4">
        <div className="flex items-center gap-2 text-slate-600 border-b border-slate-100 pb-3">
          <AlertTriangle className="w-4 h-4 text-rose-500" />
          <p className="text-sm font-semibold uppercase tracking-wide">Narrative Details</p>
        </div>
        <EditableField
          label="Description"
          value={description}
          multiline
          onSave={(value) => updateNarrativeProperty('Description', value)}
          placeholder="Narrative description"
        />
        <EditableField
          label="Canonical Structure (Greimas)"
          value={greimas}
          multiline
          onSave={(value) => updateNarrativeProperty('Greimas_Structure', value)}
          placeholder="Greimas structure"
        />
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <EditableField
            label="Object of Value"
            value={objectOfValue}
            onSave={(value) => updateNarrativeProperty('Object_of_Value', value)}
            placeholder="Fill in field"
          />
          <EditableField
            label="Goal"
            value={goal}
            onSave={(value) => updateNarrativeProperty('Goal', value)}
            placeholder="Fill in field"
          />
        </div>
      </div>
    )
  }

  // ── All (default): original combined view ─────────────────────────────────
  return (
    <div className="space-y-5">
      <section className="pending-block">
        <div className="flex flex-col gap-4 border-b border-rose-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-rose-600">Pending Validation</p>
          <button
            type="button"
            onClick={onApprove}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
          >
            <ShieldCheck className="w-4 h-4" />
            {approved ? 'Already Marked as Reviewed' : 'Approve and Mark as Reviewed'}
          </button>
        </div>

        <div className="px-5 py-4">
          <div className="mb-4 flex items-center gap-2 text-slate-600">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <p className="text-sm font-semibold uppercase tracking-wide">Narrative breakdown to validate (1)</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-slate-700">Narrative</p>
              <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                Progress {done}/{total}
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
                <ValidateToggle
                  label="Active Actor"
                  value={activeSubject}
                  validated={!!validatedFields.active}
                  onValidate={() => toggleField('active')}
                  onSave={(value) => updateNarrativeProperty('Active_Subject', value)}
                />
                <ValidateToggle
                  label="Active Actor Sentiment"
                  value={activeSentiment}
                  options={['Positive', 'Neutral', 'Negative']}
                  validated={!!validatedFields.activeModalization}
                  onValidate={() => toggleField('activeModalization')}
                  onSave={(value) => updateNarrativeProperty('Active_Subject_Sentiment', value)}
                />
                <ValidateToggle
                  label="Passive Actor / Victim"
                  value={passiveSubject}
                  validated={!!validatedFields.passive}
                  onValidate={() => toggleField('passive')}
                  onSave={(value) => updateNarrativeProperty('Passive_Subject', value)}
                />
                <ValidateToggle
                  label="Passive Actor Sentiment"
                  value={passiveSentiment}
                  options={['Positive', 'Neutral', 'Negative']}
                  validated={!!validatedFields.passiveModalization}
                  onValidate={() => toggleField('passiveModalization')}
                  onSave={(value) => updateNarrativeProperty('Passive_Subject_Sentiment', value)}
                />
              </div>

              <EditableField
                label="Description"
                value={description}
                multiline
                onSave={(value) => updateNarrativeProperty('Description', value)}
                placeholder="Narrative description"
              />

              <div className="field-box">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Canonical Structure (Greimas)</p>
                <EditableField
                  label="Canonical Structure (Greimas)"
                  value={greimas}
                  multiline
                  onSave={(value) => updateNarrativeProperty('Greimas_Structure', value)}
                  placeholder="Greimas structure"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                <EditableField
                  label="Object of Value"
                  value={objectOfValue}
                  onSave={(value) => updateNarrativeProperty('Object_of_Value', value)}
                  placeholder="Fill in field"
                />
                <EditableField
                  label="Goal"
                  value={goal}
                  onSave={(value) => updateNarrativeProperty('Goal', value)}
                  placeholder="Fill in field"
                />
                <div className="hidden lg:block" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
