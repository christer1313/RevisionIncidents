'use client'

import { Incident } from '@/lib/types'
import { Calendar, User, Building2, Tag, Globe } from 'lucide-react'
import { useState } from 'react'

interface Props {
  incident: Incident
  onIncidentChange?: (updated: Incident) => void
}

const countryFlag: Record<string, string> = {
  RUS: '🇷🇺', UKR: '🇺🇦', BRA: '🇧🇷', USA: '🇺🇸',
  GBR: '🇬🇧', DEU: '🇩🇪', FRA: '🇫🇷', POL: '🇵🇱',
}

function CountryBadge({ code }: { code: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
      <span>{countryFlag[code] ?? '🌐'}</span>
      {code}
    </span>
  )
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
          <button className="btn-secondary py-1" onClick={() => { setEditing(false); setDraft(value) }}>Cancelar</button>
          <button className="btn-primary py-1" onClick={() => { onSave(draft.trim()); setEditing(false) }}>Guardar</button>
        </div>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => { setDraft(value); setEditing(true) }}
      className="mt-2 w-full text-left rounded-lg p-2 -ml-2 hover:bg-indigo-50"
      title="Click para editar"
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
      {/* Incident ID + title */}
      <div className="card">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
            <Globe className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="badge bg-indigo-100 text-indigo-700 font-mono">{incident.incident_id}</span>
              <span className="badge bg-amber-100 text-amber-700">{incident.publication_date}</span>
            </div>
            <InlineEditableText
              label="Titulo"
              value={incident.title}
              onSave={onIncidentChange ? (value) => onIncidentChange({ ...incident, title: value }) : undefined}
            />
          </div>
        </div>
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

      {/* Meta row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card">
          <p className="label flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Author</p>
          <p className="field-value font-medium">{incident.author}</p>
        </div>
        <div className="card">
          <p className="label flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> Organization</p>
          <p className="field-value font-medium">{incident.organization}</p>
        </div>
        <div className="card">
          <p className="label flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Outlet Count</p>
          <p className="field-value font-medium">{incident.outlet_count}</p>
        </div>
      </div>

      {/* Tags */}
      <div className="card">
        <p className="label flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> Tags</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {incident.tags.map(tag => (
            <span key={tag} className="badge bg-violet-100 text-violet-700">{tag}</span>
          ))}
        </div>
      </div>

      {/* Countries overview */}
      <div className="card">
        <p className="label flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Geographic Scope</p>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-slate-400 mb-1.5">Origin</p>
            <div className="flex flex-wrap gap-1.5">
              {incident.location.origin_countries.map(c => <CountryBadge key={c} code={c} />)}
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1.5">Victim</p>
            <div className="flex flex-wrap gap-1.5">
              {incident.location.victim_countries.map(c => <CountryBadge key={c} code={c} />)}
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1.5">Target Audience</p>
            <div className="flex flex-wrap gap-1.5">
              {incident.location.target_audience_countries.map(c => <CountryBadge key={c} code={c} />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
