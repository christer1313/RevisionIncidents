'use client'

import { Incident } from '@/lib/types'
import { Calendar, User, Building2, Tag, Globe } from 'lucide-react'

interface Props {
  incident: Incident
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

export default function OverviewStep({ incident }: Props) {
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
            <h2 className="mt-2 text-lg font-semibold text-slate-900 leading-snug">{incident.title}</h2>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="card">
        <p className="label">Summary</p>
        <p className="mt-2 text-sm text-slate-700 leading-relaxed">{incident.summary}</p>
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
