'use client'

import { KGRelation } from '@/lib/types'
import { ArrowRight } from 'lucide-react'

interface Props {
  relations: KGRelation[]
}

const REL_COLORS: Record<string, string> = {
  'attributed-to':     'bg-red-100 text-red-700',
  'uses Attack Pattern': 'bg-orange-100 text-orange-700',
  'uses Channel':      'bg-cyan-100 text-cyan-700',
  'uses Narrative':    'bg-amber-100 text-amber-700',
  'targets Persona':   'bg-purple-100 text-purple-700',
  'targets Organization': 'bg-blue-100 text-blue-700',
  'targets Event':     'bg-slate-100 text-slate-700',
  'operated-by':       'bg-rose-100 text-rose-700',
  'affiliated-with':   'bg-violet-100 text-violet-700',
  'located-at':        'bg-teal-100 text-teal-700',
  'manifests-in':      'bg-green-100 text-green-700',
}

export default function RelationsStep({ relations }: Props) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">{relations.length} relationships mapped in this incident</p>
      <div className="space-y-3">
        {relations.map((rel, i) => {
          const badgeCls = REL_COLORS[rel.relationship_type] ?? 'bg-slate-100 text-slate-700'
          return (
            <div key={i} className="card flex flex-col sm:flex-row sm:items-center gap-3">
              {/* Source */}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400 mb-0.5">Source</p>
                <p className="font-mono text-xs text-slate-700 break-all">{rel.source_id}</p>
              </div>

              {/* Arrow + type */}
              <div className="flex sm:flex-col items-center gap-1.5 sm:gap-1">
                <ArrowRight className="w-4 h-4 text-slate-300 sm:rotate-90 hidden sm:block" />
                <span className={`badge ${badgeCls} text-center`}>{rel.relationship_type}</span>
                <ArrowRight className="w-4 h-4 text-slate-300 sm:rotate-90 hidden sm:block" />
              </div>

              {/* Target */}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400 mb-0.5">Target</p>
                <p className="font-mono text-xs text-slate-700 break-all">{rel.target_id}</p>
              </div>

              {/* Reasoning */}
              <div className="flex-[2] bg-slate-50 rounded-lg p-2 border border-slate-100">
                <p className="text-xs text-slate-400 mb-0.5">Reasoning</p>
                <p className="text-xs text-slate-600">{rel.meta.reasoning}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
