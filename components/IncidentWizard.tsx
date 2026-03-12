'use client'

import { useState } from 'react'
import { Incident, IncidentFile } from '@/lib/types'
import { incidentData } from '@/lib/incidentData'
import OverviewStep from '@/components/steps/OverviewStep'
import ArtifactsStep from '@/components/steps/ArtifactsStep'
import KnowledgeGraphStep from '@/components/steps/KnowledgeGraphStep'
import RelationsStep from '@/components/steps/RelationsStep'
import AnalysisStep from '@/components/steps/AnalysisStep'
import EditForm from '@/components/EditForm'
import {
  Eye, Pencil, Download, ChevronLeft, ChevronRight,
  CheckCircle2, FileJson2, AlertCircle,
} from 'lucide-react'

const STEPS = [
  { id: 1, label: 'Overview' },
  { id: 2, label: 'Sources' },
  { id: 3, label: 'Entities' },
  { id: 4, label: 'Relations' },
  { id: 5, label: 'Analysis' },
]

function downloadJSON(data: IncidentFile) {
  const str = JSON.stringify(data, null, 2)
  const blob = new Blob([str], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `incidents_revised_${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export default function IncidentWizard() {
  const [file, setFile] = useState<IncidentFile>(incidentData)
  const [activeIdx, setActiveIdx] = useState(0) // which incident
  const [step, setStep] = useState(1)
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [saved, setSaved] = useState(false)

  const incident = file.incidents[activeIdx]

  function handleIncidentChange(updated: Incident) {
    const incidents = [...file.incidents]
    incidents[activeIdx] = updated
    setFile({ ...file, incidents })
    setSaved(false)
  }

  function handleSave() {
    setSaved(true)
    setMode('view')
  }

  const isFirst = step === 1
  const isLast = step === STEPS.length

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Top Header ── */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo / title */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
                <FileJson2 className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">Incident Revision Tool</p>
                <p className="text-xs text-slate-400 font-mono truncate">{incident.incident_id}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {saved && (
                <span className="hidden sm:inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Saved
                </span>
              )}
              {mode === 'view' ? (
                <button className="btn-primary" onClick={() => { setMode('edit'); setSaved(false) }}>
                  <Pencil className="w-4 h-4" /> Edit
                </button>
              ) : (
                <button className="btn-primary bg-emerald-600 hover:bg-emerald-700" onClick={handleSave}>
                  <CheckCircle2 className="w-4 h-4" /> Save
                </button>
              )}
              <button
                className="btn-secondary"
                onClick={() => downloadJSON(file)}
                title="Download revised JSON"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export JSON</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Mode Banner ── */}
      {mode === 'edit' && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <p className="text-xs text-amber-700">Edit mode — all changes are local until you click <strong>Save</strong></p>
            <button className="ml-auto text-xs text-slate-500 hover:text-slate-700 underline" onClick={() => setMode('view')}>Cancel</button>
          </div>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── VIEW MODE: Stepper Wizard ── */}
        {mode === 'view' && (
          <>
            {/* Step navigator */}
            <div className="mb-6">
              <nav className="flex items-center gap-1 overflow-x-auto pb-1">
                {STEPS.map((s, i) => {
                  const isDone = step > s.id
                  const isActive = step === s.id
                  return (
                    <button
                      key={s.id}
                      onClick={() => setStep(s.id)}
                      className={`step-pill flex-shrink-0 ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                          : isDone
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : 'bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        isActive ? 'bg-white text-indigo-600' : isDone ? 'bg-emerald-200 text-emerald-700' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {isDone ? '✓' : s.id}
                      </span>
                      {s.label}
                    </button>
                  )
                })}
              </nav>

              {/* Progress bar */}
              <div className="mt-3 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all"
                  style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
                />
              </div>
            </div>

            {/* Step content */}
            <div className="min-h-[400px]">
              {step === 1 && <OverviewStep incident={incident} />}
              {step === 2 && <ArtifactsStep incident={incident} />}
              {step === 3 && <KnowledgeGraphStep objects={incident.knowledge_graph.objects} />}
              {step === 4 && <RelationsStep relations={incident.knowledge_graph.relations} />}
              {step === 5 && <AnalysisStep incident={incident} />}
            </div>

            {/* Prev / Next */}
            <div className="mt-8 flex items-center justify-between">
              <button
                className="btn-secondary"
                onClick={() => setStep(v => Math.max(1, v - 1))}
                disabled={isFirst}
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              {isLast ? (
                <button className="btn-primary" onClick={() => downloadJSON(file)}>
                  <Download className="w-4 h-4" /> Export JSON
                </button>
              ) : (
                <button
                  className="btn-primary"
                  onClick={() => setStep(v => Math.min(STEPS.length, v + 1))}
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </>
        )}

        {/* ── EDIT MODE ── */}
        {mode === 'edit' && (
          <>
            <div className="flex items-center gap-2 mb-6">
              <Eye className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-500">Editing all fields — collapse sections you don&apos;t need to change.</span>
            </div>
            <EditForm incident={incident} onChange={handleIncidentChange} />
            <div className="mt-8 flex items-center justify-between">
              <button className="btn-secondary" onClick={() => setMode('view')}>Cancel</button>
              <div className="flex gap-3">
                <button className="btn-primary bg-emerald-600 hover:bg-emerald-700" onClick={handleSave}>
                  <CheckCircle2 className="w-4 h-4" /> Save &amp; Return to View
                </button>
                <button className="btn-secondary" onClick={() => downloadJSON(file)}>
                  <Download className="w-4 h-4" /> Export JSON
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
