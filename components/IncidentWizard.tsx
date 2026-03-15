'use client'

import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import { Incident, IncidentFile } from '@/lib/types'
import { normalizeIncidentFile } from '@/lib/incidentNormalization'
import JSZip from 'jszip'
import OverviewStep from '@/components/steps/OverviewStep'
import ArtifactsStep from '@/components/steps/ArtifactsStep'
import KnowledgeGraphStep from '@/components/steps/KnowledgeGraphStep'
import RelationsStep from '@/components/steps/RelationsStep'
import AnalysisStep from '@/components/steps/AnalysisStep'
import NarrativeValidationStep from '@/components/steps/NarrativeValidationStep'
import EditForm from '@/components/EditForm'
import {
  Eye, Pencil, Download,
  CheckCircle2, BookOpenText, AlertCircle, Upload, Files, LayoutGrid, Radar, Trash2,
} from 'lucide-react'

interface LoadedSource {
  id: string
  dbId: string
  name: string
  status: 'PENDING' | 'REVIEWED'
  data: IncidentFile
}

type ReviewFilter = 'pending' | 'reviewed' | 'all'

interface PendingSourcesResponse {
  sources: Array<{
    id: string
    name: string
    incidentCount: number
    status: 'PENDING' | 'REVIEWED'
    createdAt: string
    data: IncidentFile
  }>
}

interface UploadResponse {
  acceptedCount: number
  rejectedCount: number
  rejected: string[]
}

interface AggregateResponse {
  data: IncidentFile
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
  const [sources, setSources] = useState<LoadedSource[]>([])
  const [sourceIdx, setSourceIdx] = useState(0)
  const [activeIdx, setActiveIdx] = useState(0)
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>('pending')
  const [activeTab, setActiveTab] = useState<'overview' | 'narrative'>('overview')
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [saved, setSaved] = useState(false)
  const [uploadMessage, setUploadMessage] = useState('')
  const [approvedMap, setApprovedMap] = useState<Record<string, boolean>>({})
  const [isLoadingSources, setIsLoadingSources] = useState(true)
  const [isFinalizingFile, setIsFinalizingFile] = useState(false)
  const [isDeletingFile, setIsDeletingFile] = useState(false)

  const currentSource = sources[sourceIdx] ?? null
  const file = currentSource?.data ?? null
  const incident = file?.incidents[activeIdx]

  useEffect(() => {
    void loadSourcesByFilter(reviewFilter)
  }, [reviewFilter])

  const canRenderIncident = useMemo(() => {
    return Boolean(file && file.incidents.length > 0 && incident)
  }, [file, incident])

  const currentIncidentKey = `${currentSource?.id ?? 'none'}:${activeIdx}`
  const isCurrentApproved = approvedMap[currentIncidentKey] ?? false

  const sourceStats = useMemo(() => {
    const total = sources.length

    if (!file || !currentSource) {
      const pendingFiles = sources.filter((item) => item.status === 'PENDING').length
      const reviewedFiles = sources.filter((item) => item.status === 'REVIEWED').length
      return { total, pending: 0, pendingFiles, reviewedFiles }
    }

    let pending = 0

    file.incidents.forEach((_, idx) => {
      const key = `${currentSource.id}:${idx}`
      if (!approvedMap[key]) pending += 1
    })

    const pendingFiles = sources.filter((item) => item.status === 'PENDING').length
    const reviewedFiles = sources.filter((item) => item.status === 'REVIEWED').length

    return { total, pending, pendingFiles, reviewedFiles }
  }, [file, currentSource, approvedMap, sources])

  async function loadSourcesByFilter(filter: ReviewFilter) {
    setIsLoadingSources(true)

    try {
      const statusParam = filter === 'pending' ? 'PENDING' : filter === 'reviewed' ? 'REVIEWED' : 'ALL'
      const response = await fetch(`/api/incidents?status=${statusParam}`, { cache: 'no-store' })
      if (!response.ok) {
        throw new Error('No se pudo cargar la lista de incidentes.')
      }

      const payload = (await response.json()) as PendingSourcesResponse
      const nextSources: LoadedSource[] = payload.sources.map((item) => ({
        id: item.id,
        dbId: item.id,
        name: item.name,
        status: item.status,
        data: item.data,
      }))

      setSources(nextSources)
      setSourceIdx(0)
      setActiveIdx(0)
    } catch {
      setUploadMessage('No se pudieron cargar los incidentes desde la base de datos.')
      setSources([])
      setSourceIdx(0)
      setActiveIdx(0)
    } finally {
      setIsLoadingSources(false)
    }
  }

  function parseUploadedJson(raw: string): IncidentFile | null {
    try {
      const parsed = JSON.parse(raw) as unknown
      return normalizeIncidentFile(parsed)
    } catch {
      return null
    }
  }

  async function handleUploadFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files
    if (!files || files.length === 0) {
      return
    }

    const acceptedPayload: Array<{ name: string; data: IncidentFile }> = []
    const rejected: string[] = []

    for (const fileToRead of Array.from(files)) {
      const isZipFile = fileToRead.name.toLowerCase().endsWith('.zip') || fileToRead.type === 'application/zip'

      if (!isZipFile) {
        const raw = await fileToRead.text()
        const normalized = parseUploadedJson(raw)

        if (!normalized || !Array.isArray(normalized.incidents)) {
          rejected.push(fileToRead.name)
          continue
        }

        acceptedPayload.push({
          name: fileToRead.name,
          data: normalized,
        })
        continue
      }

      try {
        const zipRaw = await fileToRead.arrayBuffer()
        const zip = await JSZip.loadAsync(zipRaw)
        const jsonEntries = Object.values(zip.files).filter(
          (entry) => !entry.dir && entry.name.toLowerCase().endsWith('.json')
        )

        if (jsonEntries.length === 0) {
          rejected.push(fileToRead.name)
          continue
        }

        let acceptedInZip = 0

        for (const entry of jsonEntries) {
          const raw = await entry.async('string')
          const normalized = parseUploadedJson(raw)

          if (!normalized || !Array.isArray(normalized.incidents)) {
            rejected.push(`${fileToRead.name}/${entry.name}`)
            continue
          }

          acceptedPayload.push({
            name: `${fileToRead.name}/${entry.name}`,
            data: normalized,
          })
          acceptedInZip += 1
        }

        if (acceptedInZip === 0) {
          rejected.push(fileToRead.name)
        }
      } catch {
        rejected.push(fileToRead.name)
      }
    }

    let acceptedCount = 0
    let rejectedCount = rejected.length

    if (acceptedPayload.length > 0) {
      try {
        const response = await fetch('/api/incidents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ files: acceptedPayload }),
        })

        if (!response.ok) {
          throw new Error('No se pudo guardar en la base de datos.')
        }

        const payload = (await response.json()) as UploadResponse
        acceptedCount = payload.acceptedCount
        rejectedCount += payload.rejectedCount

        await loadSourcesByFilter(reviewFilter)
        setMode('view')
        setActiveTab('overview')
        setSaved(false)
      } catch {
        setUploadMessage('Hubo un problema guardando los archivos en la base de datos.')
        event.target.value = ''
        return
      }
    }

    if (acceptedCount > 0 && rejectedCount === 0) {
      setUploadMessage(`${acceptedCount} archivo(s) cargado(s) correctamente en la base de datos.`)
    } else if (acceptedCount > 0 && rejectedCount > 0) {
      setUploadMessage(`${acceptedCount} archivo(s) cargado(s) y ${rejectedCount} rechazado(s).`)
    } else {
      setUploadMessage('No se pudieron cargar archivos. Revisa el formato JSON.')
    }

    event.target.value = ''
  }

  function handleIncidentChange(updated: Incident) {
    if (!currentSource || !file) return

    const incidents = [...file.incidents]
    incidents[activeIdx] = updated

    const nextSource: LoadedSource = {
      ...currentSource,
      data: {
        ...file,
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
    if (!currentSource) return

    const base = currentSource.name.replace(/\.json$/i, '')
    downloadNamedJSON(currentSource.data, `${base}_revised.json`)
  }

  function handleExportAllFiles() {
    for (const source of sources) {
      const base = source.name.replace(/\.json$/i, '')
      downloadNamedJSON(source.data, `${base}_revised.json`)
    }
  }

  async function handleDownloadAggregate() {
    try {
      const response = await fetch('/api/incidents/aggregate', { cache: 'no-store' })

      if (!response.ok) {
        throw new Error('No se pudo obtener el JSON agregado.')
      }

      const payload = (await response.json()) as AggregateResponse
      downloadNamedJSON(payload.data, 'incidents_aggregate.json')
    } catch {
      setUploadMessage('No se pudo descargar el JSON agregado.')
    }
  }

  async function handleFinalizeCurrentFile() {
    if (!currentSource) return

    setIsFinalizingFile(true)

    try {
      const response = await fetch(`/api/incidents/${currentSource.dbId}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewedData: currentSource.data }),
      })

      if (!response.ok) {
        throw new Error('No se pudo marcar el archivo como revisado.')
      }

      await loadSourcesByFilter(reviewFilter)
      setMode('view')
      setActiveTab('overview')
      setSaved(false)
      setUploadMessage('Incidente marcado como revisado y guardado en la base de datos.')
    } catch {
      setUploadMessage('No se pudo cerrar la revision de este archivo.')
    } finally {
      setIsFinalizingFile(false)
    }
  }

  async function handleDeleteCurrentFile() {
    if (!currentSource || isDeletingFile) return

    const confirmed = window.confirm(
      `Se eliminara "${currentSource.name}" de la base de datos. Esta accion no se puede deshacer.`
    )

    if (!confirmed) return

    setIsDeletingFile(true)

    try {
      const response = await fetch(`/api/incidents/${currentSource.dbId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('No se pudo eliminar el archivo.')
      }

      setSources((prev) => {
        const next = prev.filter((item) => item.dbId !== currentSource.dbId)

        if (next.length === 0) {
          setSourceIdx(0)
          setActiveIdx(0)
        } else {
          setSourceIdx((prevIdx) => Math.min(prevIdx, next.length - 1))
          setActiveIdx(0)
        }

        return next
      })

      setMode('view')
      setActiveTab('overview')
      setSaved(false)
      setUploadMessage('Incidente eliminado de la base de datos.')
    } catch {
      setUploadMessage('No se pudo eliminar el archivo seleccionado.')
    } finally {
      setIsDeletingFile(false)
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
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total incidentes</p>
                <p className="text-3xl font-bold text-slate-800">{sourceStats.total}</p>
              </div>
              <div className="review-stat border-rose-200 bg-rose-50">
                <p className="text-[11px] font-bold uppercase tracking-wider text-rose-500">Pendientes</p>
                <p className="text-3xl font-bold text-rose-600">{sourceStats.pendingFiles}</p>
              </div>
              <div className="review-stat border-emerald-200 bg-emerald-50">
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Revisados</p>
                <p className="text-3xl font-bold text-emerald-600">{sourceStats.reviewedFiles}</p>
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
                disabled={!canRenderIncident}
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Exportar Archivo</span>
              </button>
              <button className="btn-secondary" onClick={handleExportAllFiles} disabled={sources.length === 0}>
                <Files className="w-4 h-4" />
                <span className="hidden sm:inline">Exportar Todo</span>
              </button>
              <button className="btn-secondary" onClick={handleDownloadAggregate}>
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">JSON agregado</span>
              </button>
              <button
                className="btn-primary bg-rose-600 hover:bg-rose-700"
                onClick={handleFinalizeCurrentFile}
                disabled={!canRenderIncident || isFinalizingFile || isDeletingFile || currentSource?.status === 'REVIEWED'}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {isFinalizingFile ? 'Guardando...' : currentSource?.status === 'REVIEWED' ? 'Ya revisado' : 'Finalizar revision'}
                </span>
              </button>
              <button
                className="btn-secondary border-rose-200 text-rose-700 hover:bg-rose-50"
                onClick={handleDeleteCurrentFile}
                disabled={!currentSource || isDeletingFile || isFinalizingFile}
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeletingFile ? 'Eliminando...' : 'Eliminar archivo'}</span>
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <label htmlFor="review-filter" className="text-xs text-slate-500 font-semibold uppercase tracking-wide">
                Mostrar
              </label>
              <select
                id="review-filter"
                className="input-base py-1.5"
                value={reviewFilter}
                onChange={(e) => setReviewFilter(e.target.value as ReviewFilter)}
              >
                <option value="pending">Pendientes</option>
                <option value="reviewed">Revisados</option>
                <option value="all">Todos</option>
              </select>

              <label htmlFor="source-select" className="text-xs text-slate-500 font-semibold uppercase tracking-wide">
                Incidente
              </label>
              <select
                id="source-select"
                className="input-base py-1.5"
                value={sourceIdx}
                onChange={(e) => handleSourceChange(Number(e.target.value))}
                disabled={sources.length === 0}
              >
                {sources.map((source, idx) => (
                  <option key={source.id} value={idx}>
                    {(source.data.incident_ids[0] || source.name)} [{source.status === 'REVIEWED' ? 'REVISADO' : 'PENDIENTE'}]
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
                  accept="application/json,.json,application/zip,.zip"
                  multiple
                  className="hidden"
                  onChange={handleUploadFiles}
                />
              </label>
              <span className="text-xs text-slate-500">Acepta JSON sueltos o ZIP con JSON (IncidentFile o Incident[])</span>
            </div>
          </div>
          {uploadMessage && (
            <p className="mt-2 text-xs text-slate-600">{uploadMessage}</p>
          )}
        </section>

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
          {isLoadingSources && (
            <div className="card">
              <p className="text-sm text-slate-700">Cargando incidentes...</p>
            </div>
          )}

          {!isLoadingSources && !canRenderIncident && (
            <div className="card">
              <p className="text-sm text-slate-700">
                {reviewFilter === 'pending' && 'No hay incidentes pendientes de revision.'}
                {reviewFilter === 'reviewed' && 'No hay incidentes revisados para mostrar.'}
                {reviewFilter === 'all' && 'No hay incidentes cargados para mostrar.'}
              </p>
            </div>
          )}

          {mode === 'view' && canRenderIncident && incident && (
            <>
              {activeTab === 'overview' ? (
                <div className="space-y-5">
                  <OverviewStep incident={incident} onIncidentChange={handleIncidentChange} />
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
                  onIncidentChange={handleIncidentChange}
                />
              )}

              <div className="mt-8 flex justify-end">
                <button className="btn-primary" onClick={handleExportCurrentFile}>
                  <Download className="w-4 h-4" /> Exportar JSON
                </button>
              </div>
            </>
          )}

          {mode === 'edit' && canRenderIncident && incident && (
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
