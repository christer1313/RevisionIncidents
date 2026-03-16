'use client'

import { Incident } from '@/lib/types'
import { useState } from 'react'

interface Props {
  incident: Incident
  onIncidentChange?: (updated: Incident) => void
}

function InlineEditableText({
  label,
  value,
  multiline,
  onSave,
}: {
  label: string
  value: string
  multiline?: boolean
  onSave?: (value: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  if (!onSave) {
    return multiline
      ? <p className="mt-2 text-sm text-slate-700 leading-relaxed">{value}</p>
      : <h2 className="mt-2 text-lg font-semibold text-slate-900 leading-snug">{value}</h2>
  }

  if (editing) {
    return (
      <div className="mt-2 space-y-2">
        {multiline ? (
          <textarea className="textarea-base bg-white" rows={4} value={draft} onChange={(e) => setDraft(e.target.value)} />
        ) : (
          <input className="input-base bg-white" value={draft} onChange={(e) => setDraft(e.target.value)} />
        )}
        <div className="flex justify-end gap-2">
          <button className="btn-secondary py-1" onClick={() => { setEditing(false); setDraft(value) }}>Cancel</button>
          <button className="btn-primary py-1" onClick={() => { onSave(draft.trim()); setEditing(false) }}>Save</button>
        </div>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => { setDraft(value); setEditing(true) }}
      className="mt-2 w-full text-left rounded-lg p-2 -ml-2 hover:bg-indigo-50"
      title="Click to edit"
    >
      <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wide">{label}</p>
      {multiline
        ? <p className="mt-1 text-sm text-slate-700 leading-relaxed">{value}</p>
        : <h2 className="mt-1 text-lg font-semibold text-slate-900 leading-snug">{value}</h2>}
    </button>
  )
}

export default function OverviewStep({ incident, onIncidentChange }: Props) {
  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="card">
        <p className="label">Title</p>
        <InlineEditableText
          label="Titulo"
          value={incident.title}
          onSave={onIncidentChange ? (value) => onIncidentChange({ ...incident, title: value }) : undefined}
        />
      </div>

      {/* Summary */}
      <div className="card">
        <p className="label">Summary</p>
        <InlineEditableText
          label="Resumen"
          value={incident.summary}
          multiline
          onSave={onIncidentChange ? (value) => onIncidentChange({ ...incident, summary: value }) : undefined}
        />
      </div>

      {/* Original claim */}
      <div className="card">
        <p className="label">Original Claim</p>
        <InlineEditableText
          label="Original Claim"
          value={incident.summary_euvsdisinfo}
          multiline
          onSave={onIncidentChange ? (value) => onIncidentChange({ ...incident, summary_euvsdisinfo: value }) : undefined}
        />
      </div>

      {/* Fact-check response */}
      <div className="card">
        <p className="label">Fact-check Response</p>
        <InlineEditableText
          label="Fact-check Response"
          value={incident.response}
          multiline
          onSave={onIncidentChange ? (value) => onIncidentChange({ ...incident, response: value }) : undefined}
        />
      </div>
    </div>
  )
}
