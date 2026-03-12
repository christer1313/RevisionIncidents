'use client'

import { KGObject } from '@/lib/types'
import { Cpu, Shield, Zap, Radio, User, Building2, Users, BookOpen, MapPin, CalendarDays } from 'lucide-react'

const OBJ_ICONS: Record<string, React.ElementType> = {
  'Incident': Cpu,
  'Threat Actor': Shield,
  'Attack Pattern': Zap,
  'Channel': Radio,
  'Persona': User,
  'Organization': Building2,
  'Community': Users,
  'Narrative': BookOpen,
  'Location': MapPin,
  'Event': CalendarDays,
}

const OBJ_COLORS: Record<string, { bg: string; border: string; icon: string; badge: string }> = {
  'Incident':       { bg: 'bg-indigo-50',  border: 'border-indigo-200', icon: 'text-indigo-600',  badge: 'bg-indigo-100 text-indigo-700' },
  'Threat Actor':   { bg: 'bg-red-50',     border: 'border-red-200',    icon: 'text-red-600',     badge: 'bg-red-100 text-red-700' },
  'Attack Pattern': { bg: 'bg-orange-50',  border: 'border-orange-200', icon: 'text-orange-600',  badge: 'bg-orange-100 text-orange-700' },
  'Channel':        { bg: 'bg-cyan-50',    border: 'border-cyan-200',   icon: 'text-cyan-600',    badge: 'bg-cyan-100 text-cyan-700' },
  'Persona':        { bg: 'bg-purple-50',  border: 'border-purple-200', icon: 'text-purple-600',  badge: 'bg-purple-100 text-purple-700' },
  'Organization':   { bg: 'bg-blue-50',    border: 'border-blue-200',   icon: 'text-blue-600',    badge: 'bg-blue-100 text-blue-700' },
  'Community':      { bg: 'bg-pink-50',    border: 'border-pink-200',   icon: 'text-pink-600',    badge: 'bg-pink-100 text-pink-700' },
  'Narrative':      { bg: 'bg-amber-50',   border: 'border-amber-200',  icon: 'text-amber-600',   badge: 'bg-amber-100 text-amber-700' },
  'Location':       { bg: 'bg-teal-50',    border: 'border-teal-200',   icon: 'text-teal-600',    badge: 'bg-teal-100 text-teal-700' },
  'Event':          { bg: 'bg-slate-50',   border: 'border-slate-200',  icon: 'text-slate-600',   badge: 'bg-slate-100 text-slate-700' },
}

const METHOD_BADGE: Record<string, string> = {
  explicit:  'bg-emerald-100 text-emerald-700',
  inferred:  'bg-yellow-100 text-yellow-700',
  generated: 'bg-violet-100 text-violet-700',
}

function ObjectCard({ obj }: { obj: KGObject }) {
  const colors = OBJ_COLORS[obj.obj_type] ?? OBJ_COLORS['Event']
  const Icon = OBJ_ICONS[obj.obj_type] ?? Cpu

  return (
    <div className={`rounded-xl border ${colors.border} ${colors.bg} p-4`}>
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 w-9 h-9 rounded-lg bg-white flex items-center justify-center shadow-sm`}>
          <Icon className={`w-5 h-5 ${colors.icon}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`badge ${colors.badge} font-semibold`}>{obj.obj_type}</span>
            <span className="text-xs font-mono text-slate-400">{obj.meta.id_data}</span>
            <span className={`badge ${METHOD_BADGE[obj.meta.extraction_method] ?? 'bg-slate-100 text-slate-600'}`}>
              {obj.meta.extraction_method}
            </span>
          </div>

          {/* Properties */}
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
            {Object.entries(obj.properties).map(([key, prop]) => (
              <div key={key}>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{key.replace(/_/g, ' ')}</span>
                  <span className={`badge text-[10px] py-0 ${METHOD_BADGE[prop.method] ?? 'bg-slate-100 text-slate-600'}`}>{prop.method}</span>
                </div>
                <p className="text-sm text-slate-700 mt-0.5">{prop.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

interface Props {
  objects: KGObject[]
}

export default function KnowledgeGraphStep({ objects }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-500">{objects.length} entities found</h3>
        <div className="flex flex-wrap gap-1.5">
          {['explicit', 'inferred', 'generated'].map(m => (
            <span key={m} className={`badge ${METHOD_BADGE[m]}`}>{m}</span>
          ))}
        </div>
      </div>
      {objects.map((obj, i) => <ObjectCard key={i} obj={obj} />)}
    </div>
  )
}
