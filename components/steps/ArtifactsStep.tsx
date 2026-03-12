'use client'

import { Incident } from '@/lib/types'
import { Link, Search, Archive, Languages } from 'lucide-react'

interface Props {
  incident: Incident
}

export default function ArtifactsStep({ incident }: Props) {
  return (
    <div className="space-y-6">
      {/* Artifacts */}
      <div className="card">
        <p className="label flex items-center gap-1.5"><Link className="w-3.5 h-3.5" /> Sources &amp; Artifacts</p>
        <div className="mt-4 space-y-3">
          {incident.artifacts.map((art, i) => (
            <div key={i} className="rounded-lg border border-slate-200 bg-slate-50 p-4 flex flex-col gap-2">
              <div className="font-medium text-sm text-slate-800">{art.name}</div>
              <div className="flex flex-col sm:flex-row gap-3 text-xs">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Search className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="font-medium text-slate-600 mr-1">Search URL:</span>
                  {art.search_url
                    ? <span className="font-mono break-all text-indigo-600">{art.search_url}</span>
                    : <span className="italic text-slate-400">—</span>}
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Archive className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="font-medium text-slate-600 mr-1">Archive URL:</span>
                  {art.archive_url
                    ? <span className="font-mono break-all text-indigo-600">{art.archive_url}</span>
                    : <span className="italic text-slate-400">Not archived</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Languages */}
      <div className="card">
        <p className="label flex items-center gap-1.5"><Languages className="w-3.5 h-3.5" /> Languages</p>
        <div className="mt-2">
          {incident.languages.length > 0
            ? <div className="flex flex-wrap gap-2 mt-2">
                {incident.languages.map(l => (
                  <span key={l} className="badge bg-teal-100 text-teal-700">{l}</span>
                ))}
              </div>
            : <p className="text-sm text-slate-400 mt-1 italic">No languages specified</p>
          }
        </div>
      </div>

      {/* Countries / Regions */}
      <div className="card">
        <p className="label">Countries &amp; Regions</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {incident.countries_regions.map(c => (
            <span key={c} className="badge bg-sky-100 text-sky-700">{c}</span>
          ))}
        </div>
      </div>

      {/* Source file */}
      <div className="card">
        <p className="label">Source File</p>
        <p className="mt-1 text-sm font-mono text-slate-600 break-all">{incident.source_file}</p>
      </div>
    </div>
  )
}
