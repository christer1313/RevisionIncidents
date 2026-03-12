'use client'

import { ChangeEvent, useMemo, useState } from 'react'
import { Incident, IncidentFile } from '@/lib/types'
import { incidentData } from '@/lib/incidentData'
import OverviewStep from '@/components/steps/OverviewStep'
import ArtifactsStep from '@/components/steps/ArtifactsStep'
import KnowledgeGraphStep from '@/components/steps/KnowledgeGraphStep'
import RelationsStep from '@/components/steps/RelationsStep'
import AnalysisStep from '@/components/steps/AnalysisStep'
import NarrativeValidationStep from '@/components/steps/NarrativeValidationStep'
import EditForm from '@/components/EditForm'
import {
  Eye, Pencil, Download,
  CheckCircle2, BookOpenText, AlertCircle, Upload, Files, LayoutGrid, Radar,
} from 'lucide-react'

interface LoadedSource {
  id: string
  name: string
  data: IncidentFile
}

function normalizeIncidentFile(input: unknown): IncidentFile | null {
  if (Array.isArray(input)) {
    const incidents = input as Incident[]
    return {
      count: incidents.length,
      incident_ids: incidents.map((item) => item.incident_id).filter(Boolean),
      incidents,
    }
  }

  if (!input || typeof input !== 'object') {
    return null
  }

  const obj = input as Partial<IncidentFile> & Partial<Incident>

  if (Array.isArray(obj.incidents)) {
    const incidents = obj.incidents as Incident[]
    return {
      count: typeof obj.count === 'number' ? obj.count : incidents.length,
      incident_ids: Array.isArray(obj.incident_ids)
        ? obj.incident_ids
        : incidents.map((item) => item.incident_id).filter(Boolean),
      incidents,
    }
  }

  if (typeof obj.incident_id === 'string') {
    const incident = obj as Incident
    return {
      count: 1,
      incident_ids: [incident.incident_id],
      incidents: [incident],
    }
  }

  return null
}

function downloadNamedJSON(data: IncidentFile, fileName: string) {
  const str = JSON.stringify(data, null, 2)
  const blob = new Blob([str], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
}

export default function IncidentWizard() {
  const [sources, setSources] = useState<LoadedSource[]>([
    {
      id: 'default-source',
      name: 'incidents_2026-01-03.json',
      data: incidentData,
    },
  ])
  const [sourceIdx, setSourceIdx] = useState(0)
  const [activeIdx, setActiveIdx] = useState(0) // which incident
  const [activeTab, setActiveTab] = useState<'overview' | 'narrative'>('overview')
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [saved, setSaved] = useState(false)
  const [uploadMessage, setUploadMessage] = useState('')
  const [approvedMap, setApprovedMap] = useState<Record<string, boolean>>({})

  const currentSource = sources[sourceIdx]
  const file = currentSource.data
  const incident = file.incidents[activeIdx]

  const canRenderIncident = useMemo(() => {
    return file.incidents.length > 0 && Boolean(incident)
  }, [file.incidents.length, incident])

  const currentIncidentKey = `${currentSource.id}:${activeIdx}`

  const isCurrentApproved = approvedMap[currentIncidentKey] ?? false

  const sourceStats = useMemo(() => {
    const total = file.incidents.length
    let pending = 0
    file.incidents.forEach((_, idx) => {
      const key = `${currentSource.id}:${idx}`
      if (!approvedMap[key]) pending += 1
    })
    return { total, pending }
  }, [file.incidents, currentSource.id, approvedMap])

  async function handleUploadFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files
    if (!files || files.length === 0) {
      return
    }

    const accepted: LoadedSource[] = []
    const rejected: string[] = []

    for (const fileToRead of Array.from(files)) {
      try {
        const raw = await fileToRead.text()
        const parsed = JSON.parse(raw) as unknown
        const normalized = normalizeIncidentFile(parsed)

        if (!normalized || !Array.isArray(normalized.incidents)) {
          rejected.push(fileToRead.name)
          continue
        }

        accepted.push({
          id: crypto.randomUUID(),
          name: fileToRead.name,
          data: normalized,
        })
      } catch {
        rejected.push(fileToRead.name)
      }
    }

    if (accepted.length > 0) {
      setSources((prev) => [...prev, ...accepted])
      setSourceIdx(sources.length)
      setActiveIdx(0)
      setMode('view')
      setActiveTab('overview')
      setSaved(false)
    }

    if (accepted.length > 0 && rejected.length === 0) {
      setUploadMessage(`${accepted.length} archivo(s) cargado(s) correctamente.`)
    } else if (accepted.length > 0 && rejected.length > 0) {
      setUploadMessage(`${accepted.length} archivo(s) cargado(s) y ${rejected.length} rechazado(s).`)
    } else {
      setUploadMessage(`No se pudieron cargar archivos. Revisa el formato JSON.`)
    }

    event.target.value = ''
  }

  function handleIncidentChange(updated: Incident) {
    const incidents = [...currentSource.data.incidents]
    incidents[activeIdx] = updated

    const nextSource: LoadedSource = {
      ...currentSource,
      data: {
        ...currentSource.data,
        incidents,
        count: incidents.length,
        incident_ids: incidents.map((item) => item.incident_id),
      },
    }

    setSources((prev) => prev.map((item, idx) => (idx === sourceIdx ? nextSource : item)))
    setSaved(false)
  }

  function handleSave() {
    setSaved(true)
    setMode('view')
  }

  function handleSourceChange(nextIdx: number) {
    setSourceIdx(nextIdx)
    setActiveIdx(0)
    setMode('view')
    setActiveTab('overview')
    setSaved(false)
    setUploadMessage('')
  }

  function handleApproveCurrentIncident() {
    setApprovedMap((prev) => ({ ...prev, [currentIncidentKey]: true }))
  }

  function handleExportCurrentFile() {
    const base = currentSource.name.replace(/\.json$/i, '')
    downloadNamedJSON(currentSource.data, `${base}_revised.json`)
  }

  function handleExportAllFiles() {
    for (const source of sources) {
      const base = source.name.replace(/\.json$/i, '')
      downloadNamedJSON(source.data, `${base}_revised.json`)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <main className="review-shell">
        <section className="review-top">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-indigo-600">
                <BookOpenText className="h-6 w-6" />
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Revisor de Desinformacion</h1>
              </div>
              <p className="mt-1 text-sm text-slate-500">Herramienta de asistencia periodistica para validacion de datos LLM</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="review-stat">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total</p>
                <p className="text-3xl font-bold text-slate-800">{sourceStats.total}</p>
              </div>
              <div className="review-stat border-rose-200 bg-rose-50">
                <p className="text-[11px] font-bold uppercase tracking-wider text-rose-500">Pendientes</p>
                <p className="text-3xl font-bold text-rose-600">{sourceStats.pending}</p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className={`review-tab ${activeTab === 'overview' ? 'review-tab-active' : 'review-tab-inactive'}`}
                onClick={() => setActiveTab('overview')}
              >
                <LayoutGrid className="h-4 w-4" /> Vista General
              </button>
              <button
                type="button"
                className={`review-tab ${activeTab === 'narrative' ? 'review-tab-active' : 'review-tab-inactive'}`}
                onClick={() => setActiveTab('narrative')}
              >
                <Radar className="h-4 w-4" /> Revision de Narrativas
                <span className="badge bg-rose-100 text-rose-600">{sourceStats.pending}</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {saved && (
                <span className="hidden sm:inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Saved
                </span>
              )}
              {mode === 'view' ? (
                <button
                  className="btn-primary"
                  onClick={() => { setMode('edit'); setSaved(false) }}
                  disabled={!canRenderIncident}
                >
                  <Pencil className="w-4 h-4" /> Editar
                </button>
              ) : (
                <button className="btn-primary bg-emerald-600 hover:bg-emerald-700" onClick={handleSave}>
                  <CheckCircle2 className="w-4 h-4" /> Guardar
                </button>
              )}
              <button
                className="btn-secondary"
                onClick={handleExportCurrentFile}
                title="Download revised JSON"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Exportar Archivo</span>
              </button>
              <button className="btn-secondary" onClick={handleExportAllFiles}>
                <Files className="w-4 h-4" />
                <span className="hidden sm:inline">Exportar Todo</span>
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 w-full md:w-auto">
            <label htmlFor="source-select" className="text-xs text-slate-500 font-semibold uppercase tracking-wide">
              Archivo
            </label>
            <select
              id="source-select"
              className="input-base py-1.5"
              value={sourceIdx}
              onChange={(e) => handleSourceChange(Number(e.target.value))}
            >
              {sources.map((source, idx) => (
                <option key={source.id} value={idx}>
                  {source.name} ({source.data.incidents.length})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto md:ml-auto">
            <label className="btn-secondary cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>Subir JSON</span>
              <input
                type="file"
                accept="application/json,.json"
                multiple
                className="hidden"
                onChange={handleUploadFiles}
              />
            </label>
            <span className="text-xs text-slate-500">Acepta archivos con estructura IncidentFile o Incident[]</span>
          </div>
          </div>
          {uploadMessage && (
            <p className="mt-2 text-xs text-slate-600">{uploadMessage}</p>
          )}
        </section>

        {/* ── Mode Banner ── */}
        {mode === 'edit' && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="px-4 py-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <p className="text-xs text-amber-700">Edit mode — all changes are local until you click <strong>Save</strong></p>
              <button className="ml-auto text-xs text-slate-500 hover:text-slate-700 underline" onClick={() => setMode('view')}>Cancel</button>
            </div>
          </div>
        )}

      <section className="pt-4">
        {canRenderIncident && file.incidents.length > 1 && (
          <div className="mb-5 flex items-center gap-2">
            <label htmlFor="incident-select" className="text-xs text-slate-500 font-semibold uppercase tracking-wide">
              Incidente
            </label>
            <select
              id="incident-select"
              className="input-base py-1.5"
              value={activeIdx}
              onChange={(e) => {
                setActiveIdx(Number(e.target.value))
                setMode('view')
                setActiveTab('overview')
                setSaved(false)
              }}
            >
              {file.incidents.map((item, idx) => (
                <option key={item.incident_id || idx} value={idx}>
                  {item.incident_id || `Incident ${idx + 1}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {!canRenderIncident && (
          <div className="card">
            <p className="text-sm text-slate-700">
              Este archivo no contiene incidentes para revisar. Sube otro JSON o selecciona otro archivo cargado.
            </p>
          </div>
        )}

        {/* ── VIEW MODE ── */}
        {mode === 'view' && canRenderIncident && (
          <>
            {activeTab === 'overview' ? (
              <div className="space-y-5">
                <OverviewStep incident={incident} />
                <ArtifactsStep incident={incident} />
                <KnowledgeGraphStep objects={incident.knowledge_graph.objects.filter((obj) => obj.obj_type !== 'Narrative')} />
                <RelationsStep relations={incident.knowledge_graph.relations} />
                <AnalysisStep incident={incident} />
              </div>
            ) : (
              <NarrativeValidationStep
                incident={incident}
                approved={isCurrentApproved}
                onApprove={handleApproveCurrentIncident}
              />
            )}

            <div className="mt-8 flex justify-end">
              <button className="btn-primary" onClick={handleExportCurrentFile}>
                <Download className="w-4 h-4" /> Exportar JSON
              </button>
            </div>
          </>
        )}

        {/* ── EDIT MODE ── */}
        {mode === 'edit' && canRenderIncident && (
          <>
            <div className="flex items-center gap-2 mb-6">
              <Eye className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-500">Editing all fields — collapse sections you don&apos;t need to change.</span>
            </div>
            <EditForm incident={incident} onChange={handleIncidentChange} />
            <div className="mt-8 flex items-center justify-between">
              <button className="btn-secondary" onClick={() => setMode('view')}>Cancelar</button>
              <div className="flex gap-3">
                <button className="btn-primary bg-emerald-600 hover:bg-emerald-700" onClick={handleSave}>
                  <CheckCircle2 className="w-4 h-4" /> Guardar y Volver
                </button>
                <button className="btn-secondary" onClick={handleExportCurrentFile}>
                  <Download className="w-4 h-4" /> Exportar JSON
                </button>
              </div>
            </div>
          </>
        )}
      </section>
      </main>
    </div>
  )
}
