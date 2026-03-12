'use client'

import { Incident } from '@/lib/types'
import { FileText, MessageSquare } from 'lucide-react'

interface Props {
  incident: Incident
}

export default function AnalysisStep({ incident }: Props) {
  return (
    <div className="space-y-6">
      {/* EUvsDisinfo Summary */}
      <div className="card border-l-4 border-l-amber-400">
        <p className="label flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Original Claim (EUvsDisinfo)</p>
        <p className="mt-2 text-sm text-slate-700 leading-relaxed italic">&ldquo;{incident.summary_euvsdisinfo}&rdquo;</p>
      </div>

      {/* Response / Debunk */}
      <div className="card border-l-4 border-l-emerald-400">
        <p className="label flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" /> Fact-Check Response</p>
        <p className="mt-2 text-sm text-slate-700 leading-relaxed">{incident.response}</p>
      </div>
    </div>
  )
}
