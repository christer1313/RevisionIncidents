'use client'

import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import { Incident, IncidentFile } from '@/lib/types'
import { normalizeIncidentFile } from '@/lib/incidentNormalization'
import JSZip from 'jszip'
import OverviewStep from '@/components/steps/OverviewStep'
import NarrativeValidationStep from '@/components/steps/NarrativeValidationStep'
import EditForm from '@/components/EditForm'
import {
  Eye, Pencil, Download,
  CheckCircle2, BookOpenText, AlertCircle, Upload, Trash2,
} from 'lucide-react'

interface LoadedSource {
  id: string
  dbId: string
  name: string
  status: 'PENDING' | 'REVIEWED' | 'DOUBT'
  data: IncidentFile
}

type ReviewFilter = 'pending' | 'reviewed' | 'doubt' | 'all'

interface PendingSourcesResponse {
  sources: Array<{
    id: string
    name: string
    incidentCount: number
    status: 'PENDING' | 'REVIEWED' | 'DOUBT'
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

function statusLabel(status?: LoadedSource['status']) {
  if (status === 'REVIEWED') return 'Reviewed'
  if (status === 'DOUBT') return 'Doubt'
  return 'Pending'
}

function statusClasses(status?: LoadedSource['status']) {
  if (status === 'REVIEWED') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }

  if (status === 'DOUBT') {
    return 'border-amber-200 bg-amber-50 text-amber-700'
  }

  return 'border-rose-200 bg-rose-50 text-rose-700'
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
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>('all')
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [validatedFieldsByIncident, setValidatedFieldsByIncident] = useState<Record<string, Record<string, boolean>>>({})
  const [saved, setSaved] = useState(false)
  const [isSavingEdits, setIsSavingEdits] = useState(false)
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
  const currentValidatedFields = validatedFieldsByIncident[currentIncidentKey] ?? {}

  const sourceStats = useMemo(() => {
    const total = sources.length

    if (!file || !currentSource) {
      const pendingFiles = sources.filter((item) => item.status === 'PENDING').length
      const reviewedFiles = sources.filter((item) => item.status === 'REVIEWED').length
      const doubtFiles = sources.filter((item) => item.status === 'DOUBT').length
      return { total, pending: 0, pendingFiles, reviewedFiles, doubtFiles }
    }

    let pending = 0

    file.incidents.forEach((_, idx) => {
      const key = `${currentSource.id}:${idx}`
      if (!approvedMap[key]) pending += 1
    })

    const pendingFiles = sources.filter((item) => item.status === 'PENDING').length
    const reviewedFiles = sources.filter((item) => item.status === 'REVIEWED').length
    const doubtFiles = sources.filter((item) => item.status === 'DOUBT').length

    return { total, pending, pendingFiles, reviewedFiles, doubtFiles }
  }, [file, currentSource, approvedMap, sources])

  async function loadSourcesByFilter(filter: ReviewFilter) {
    setIsLoadingSources(true)

    try {
      const statusParam =
        filter === 'pending'
          ? 'PENDING'
          : filter === 'reviewed'
            ? 'REVIEWED'
            : filter === 'doubt'
              ? 'DOUBT'
              : 'ALL'
      const response = await fetch(`/api/incidents?status=${statusParam}`, { cache: 'no-store' })
      if (!response.ok) {
        throw new Error('Failed to load incidents.')
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
      setUploadMessage('Could not load incidents from local JSON storage.')
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
          throw new Error('Failed to save incidents to local storage.')
        }

        const payload = (await response.json()) as UploadResponse
        acceptedCount = payload.acceptedCount
        rejectedCount += payload.rejectedCount

        await loadSourcesByFilter(reviewFilter)
        setMode('view')
        setSaved(false)
      } catch {
        setUploadMessage('There was a problem saving the files to local storage.')
        event.target.value = ''
        return
      }
    }

    if (acceptedCount > 0 && rejectedCount === 0) {
      setUploadMessage(`${acceptedCount} file(s) loaded successfully into local storage.`)
    } else if (acceptedCount > 0 && rejectedCount > 0) {
        setUploadMessage(`${acceptedCount} file(s) loaded and ${rejectedCount} rejected.`)
    } else {
      setUploadMessage('Could not load files. Check the JSON format.')
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

  async function handleSave() {
    if (!currentSource) return

    setIsSavingEdits(true)

    try {
      const response = await fetch(`/api/incidents/${currentSource.dbId}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewedData: currentSource.data, status: 'KEEP' }),
      })

      if (!response.ok) {
        throw new Error('Could not save incident edits.')
      }

      setSaved(true)
      setMode('view')
      setUploadMessage('Changes saved. They will be visible when you reopen this incident.')
    } catch {
      setUploadMessage('Could not save changes for this incident.')
    } finally {
      setIsSavingEdits(false)
    }
  }

  function handleSourceChange(nextIdx: number) {
    setSourceIdx(nextIdx)
    setActiveIdx(0)
    setMode('view')
    setSaved(false)
    setUploadMessage('')
  }

  function handleApproveCurrentIncident() {
    setApprovedMap((prev) => ({ ...prev, [currentIncidentKey]: true }))
  }

  function handleValidatedFieldsChangeForCurrent(fields: Record<string, boolean>) {
    setValidatedFieldsByIncident((prev) => ({
      ...prev,
      [currentIncidentKey]: fields,
    }))
  }

  async function handleDownloadAggregate() {
    try {
      const response = await fetch('/api/incidents/aggregate', { cache: 'no-store' })

      if (!response.ok) {
        throw new Error('Could not get aggregate JSON.')
      }

      const payload = (await response.json()) as AggregateResponse
      downloadNamedJSON(payload.data, 'incidents_aggregate.json')
    } catch {
      setUploadMessage('Could not download the aggregate JSON.')
    }
  }

  async function handleDownloadReviewedAggregate() {
    try {
      const response = await fetch('/api/incidents/aggregate?status=REVIEWED', { cache: 'no-store' })

      if (!response.ok) {
        throw new Error('Could not get reviewed incidents JSON.')
      }

      const payload = (await response.json()) as AggregateResponse
      const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
      downloadNamedJSON(payload.data, `incident_review_${ts}.json`)
    } catch {
      setUploadMessage('Could not download the reviewed incidents JSON.')
    }
  }

  async function handleFinalizeCurrentFile() {
    if (!currentSource) return

    setIsFinalizingFile(true)

    try {
      const response = await fetch(`/api/incidents/${currentSource.dbId}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewedData: currentSource.data, status: 'REVIEWED' }),
      })

      if (!response.ok) {
        throw new Error('Could not mark the file as reviewed.')
      }

      if (reviewFilter === 'pending') {
        setReviewFilter('all')
      } else {
        await loadSourcesByFilter(reviewFilter)
      }
      setMode('view')
      setSaved(false)
      setUploadMessage('Incident marked as reviewed and saved to local storage.')
    } catch {
      setUploadMessage('Could not finalize the review of this file.')
    } finally {
      setIsFinalizingFile(false)
    }
  }

  async function handleMarkCurrentFileAsDoubt() {
    if (!currentSource) return

    setIsFinalizingFile(true)

    try {
      const response = await fetch(`/api/incidents/${currentSource.dbId}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewedData: currentSource.data, status: 'DOUBT' }),
      })

      if (!response.ok) {
        throw new Error('Could not mark the file as doubt.')
      }

      if (reviewFilter === 'pending') {
        setReviewFilter('all')
      } else {
        await loadSourcesByFilter(reviewFilter)
      }
      setMode('view')
      setSaved(false)
      setUploadMessage('Incident marked as doubt and saved to the database.')
    } catch {
      setUploadMessage('Could not mark this file as doubt.')
    } finally {
      setIsFinalizingFile(false)
    }
  }

  async function handleDeleteCurrentFile() {
    if (!currentSource || isDeletingFile) return

    const confirmed = window.confirm(
      `"${currentSource.name}" will be deleted from local storage. This action cannot be undone.`
    )

    if (!confirmed) return

    setIsDeletingFile(true)

    try {
      const response = await fetch(`/api/incidents/${currentSource.dbId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Could not delete the file.')
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
      setSaved(false)
      setUploadMessage('Incident deleted from local storage.')
    } catch {
      setUploadMessage('Could not delete the selected file.')
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
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Misinformation Reviewer</h1>
              </div>
              <p className="mt-1 text-sm text-slate-500">Journalistic assistance tool for LLM data validation</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="review-stat">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Incidents</p>
                <p className="text-3xl font-bold text-slate-800">{sourceStats.total}</p>
              </div>
              <div className="review-stat border-rose-200 bg-rose-50">
                <p className="text-[11px] font-bold uppercase tracking-wider text-rose-500">Pending</p>
                <p className="text-3xl font-bold text-rose-600">{sourceStats.pendingFiles}</p>
              </div>
              <div className="review-stat border-emerald-200 bg-emerald-50">
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Reviewed</p>
                <p className="text-3xl font-bold text-emerald-600">{sourceStats.reviewedFiles}</p>
              </div>
              <div className="review-stat border-amber-200 bg-amber-50">
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Doubt</p>
                <p className="text-3xl font-bold text-amber-600">{sourceStats.doubtFiles}</p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-4 lg:flex-row lg:items-center lg:justify-end">

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
                  disabled={!canRenderIncident || isSavingEdits}
                >
                  <Pencil className="w-4 h-4" /> Edit
                </button>
              ) : (
                <button
                  className="btn-primary bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleSave}
                  disabled={!canRenderIncident || isSavingEdits || isFinalizingFile || isDeletingFile}
                >
                  <CheckCircle2 className="w-4 h-4" /> {isSavingEdits ? 'Saving...' : 'Save'}
                </button>
              )}
              <button className="btn-secondary" onClick={handleDownloadReviewedAggregate}>
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export reviewed</span>
              </button>
              <button className="btn-secondary" onClick={handleDownloadAggregate}>
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Aggregate JSON</span>
              </button>
              <button
                className="btn-primary bg-rose-600 hover:bg-rose-700"
                onClick={handleFinalizeCurrentFile}
                disabled={!canRenderIncident || isFinalizingFile || isDeletingFile || currentSource?.status === 'REVIEWED'}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {isFinalizingFile ? 'Saving...' : currentSource?.status === 'REVIEWED' ? 'Already reviewed' : 'Finalize review'}
                </span>
              </button>
              <button
                className="btn-secondary border-amber-200 text-amber-700 hover:bg-amber-50"
                onClick={handleMarkCurrentFileAsDoubt}
                disabled={!canRenderIncident || isFinalizingFile || isDeletingFile || currentSource?.status === 'DOUBT'}
              >
                <AlertCircle className="w-4 h-4" />
                <span>{isFinalizingFile ? 'Saving...' : currentSource?.status === 'DOUBT' ? 'Already doubt' : 'Mark as doubt'}</span>
              </button>
              <button
                className="btn-secondary border-rose-200 text-rose-700 hover:bg-rose-50"
                onClick={handleDeleteCurrentFile}
                disabled={!currentSource || isDeletingFile || isFinalizingFile}
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeletingFile ? 'Deleting...' : 'Delete file'}</span>
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className={`inline-flex items-center rounded-full border px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${statusClasses(currentSource?.status)}`}>
                {statusLabel(currentSource?.status)}
              </span>
              <label htmlFor="review-filter" className="text-xs text-slate-500 font-semibold uppercase tracking-wide">
                Show
              </label>
              <select
                id="review-filter"
                className="input-base py-1.5"
                value={reviewFilter}
                onChange={(e) => setReviewFilter(e.target.value as ReviewFilter)}
              >
                <option value="pending">Pending</option>
                <option value="reviewed">Reviewed</option>
                <option value="doubt">Doubt</option>
                <option value="all">All</option>
              </select>

              <label htmlFor="source-select" className="text-xs text-slate-500 font-semibold uppercase tracking-wide">
                Incident
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
                    {(source.data.incidents[0]?.title || source.name)} [{source.status}]
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto md:ml-auto">
              <label className="btn-secondary cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>Upload JSON</span>
                <input
                  type="file"
                  accept="application/json,.json,application/zip,.zip"
                  multiple
                  className="hidden"
                  onChange={handleUploadFiles}
                />
              </label>
              <span className="text-xs text-slate-500">Accepts JSON files or ZIP with JSON (IncidentFile or Incident[])</span>
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
              <p className="text-sm text-slate-700">Loading incidents...</p>
            </div>
          )}

          {!isLoadingSources && !canRenderIncident && (
            <div className="card">
              <p className="text-sm text-slate-700">
                {reviewFilter === 'pending' && 'No pending incidents to review.'}
                {reviewFilter === 'reviewed' && 'No reviewed incidents to show.'}
                {reviewFilter === 'doubt' && 'No incidents marked as doubt to show.'}
                {reviewFilter === 'all' && 'No incidents loaded.'}
              </p>
            </div>
          )}

          {mode === 'view' && canRenderIncident && incident && (
            <>
              <div className="sticky top-0 z-20 bg-slate-100 py-3">
                <NarrativeValidationStep
                  renderMode="sticky-bar"
                  incident={incident}
                  approved={isCurrentApproved}
                  onApprove={handleApproveCurrentIncident}
                  onIncidentChange={handleIncidentChange}
                  validatedFields={currentValidatedFields}
                  onValidatedFieldsChange={handleValidatedFieldsChangeForCurrent}
                />
              </div>
              <div className="space-y-5">
                <OverviewStep incident={incident} onIncidentChange={handleIncidentChange} />
                <NarrativeValidationStep
                  renderMode="details"
                  incident={incident}
                  approved={isCurrentApproved}
                  onApprove={handleApproveCurrentIncident}
                  onIncidentChange={handleIncidentChange}
                  validatedFields={currentValidatedFields}
                  onValidatedFieldsChange={handleValidatedFieldsChangeForCurrent}
                />
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
                <button className="btn-secondary" onClick={() => setMode('view')}>Cancel</button>
                <div className="flex gap-3">
                  <button
                    className="btn-primary bg-emerald-600 hover:bg-emerald-700"
                    onClick={handleSave}
                    disabled={isSavingEdits || isFinalizingFile || isDeletingFile}
                  >
                    <CheckCircle2 className="w-4 h-4" /> {isSavingEdits ? 'Saving...' : 'Save and Return'}
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
