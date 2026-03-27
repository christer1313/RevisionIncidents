import { randomUUID } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import JSZip from 'jszip'
import { normalizeIncidentFile } from '@/lib/incidentNormalization'
import { incidentData } from '@/lib/incidentData'
import { Incident, IncidentFile } from '@/lib/types'

export type IncidentStatus = 'PENDING' | 'REVIEWED' | 'DOUBT'
export type StatusFilter = IncidentStatus | 'ALL'

interface StoredIncidentRecord {
  id: string
  incidentId: string
  sourceFile: string
  baseData: IncidentFile
  createdAt: string
}

interface StatusEntry {
  incidentId: string
  updatedAt: string
  data: IncidentFile
}

interface StatusFile {
  version: 1
  incidents: StatusEntry[]
}

interface InMemoryStore {
  loaded: boolean
  byId: Map<string, StoredIncidentRecord>
  orderedIds: string[]
}

const ZIP_PATH = path.join(process.cwd(), 'jsons.zip')
const FALLBACK_JSON_PATH = path.join(process.cwd(), 'incidents_2026-01-03.json')
const REVIEWED_PATH = path.join(process.cwd(), 'reviewed.json')
const DOUBT_PATH = path.join(process.cwd(), 'doubt.json')

const runtimeUploads = new Map<string, StoredIncidentRecord>()
const runtimeDeleted = new Set<string>()

const inMemory: InMemoryStore = {
  loaded: false,
  byId: new Map(),
  orderedIds: [],
}

function emptyIncidentFile(): IncidentFile {
  return {
    count: 0,
    incident_ids: [],
    incidents: [],
  }
}

function buildSingleIncidentFile(incident: Incident, sourceFile?: string): IncidentFile {
  return {
    count: 1,
    incident_ids: [incident.incident_id].filter(Boolean),
    incidents: [
      {
        ...incident,
        source_file: incident.source_file || sourceFile || incident.source_file,
      },
    ],
  }
}

async function loadIncidentsFromJsonFile(jsonPath: string): Promise<Incident[]> {
  const raw = await readFile(jsonPath, 'utf-8')
  const parsed = JSON.parse(raw) as unknown
  const normalized = normalizeIncidentFile(parsed)
  return normalized?.incidents ?? []
}

async function loadIncidentsFromZipFile(zipPath: string): Promise<Array<{ sourceName: string; incident: Incident }>> {
  const buffer = await readFile(zipPath)
  const zip = await JSZip.loadAsync(buffer)
  const entries: Array<{ sourceName: string; incident: Incident }> = []

  for (const entry of Object.values(zip.files)) {
    if (entry.dir || !entry.name.toLowerCase().endsWith('.json')) {
      continue
    }

    try {
      const raw = await entry.async('string')
      const parsed = JSON.parse(raw) as unknown
      const normalized = normalizeIncidentFile(parsed)

      if (!normalized?.incidents?.length) {
        continue
      }

      for (const incident of normalized.incidents) {
        if (!incident.incident_id) {
          continue
        }

        entries.push({
          sourceName: entry.name,
          incident: {
            ...incident,
            source_file: incident.source_file || entry.name,
          },
        })
      }
    } catch {
      continue
    }
  }

  return entries
}

function normalizeStatusFile(input: unknown): StatusFile {
  if (!input || typeof input !== 'object') {
    return { version: 1, incidents: [] }
  }

  const obj = input as { incidents?: unknown }
  const incidents = Array.isArray(obj.incidents) ? obj.incidents : []

  const normalized = incidents
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
    .map((item) => {
      const incidentId = typeof item.incidentId === 'string' ? item.incidentId : ''
      const data = normalizeIncidentFile(item.data)

      if (!incidentId || !data) {
        return null
      }

      return {
        incidentId,
        updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : new Date().toISOString(),
        data,
      }
    })
    .filter((item): item is StatusEntry => item !== null)

  return {
    version: 1,
    incidents: normalized,
  }
}

async function readStatusFile(filePath: string): Promise<StatusFile> {
  try {
    const raw = await readFile(filePath, 'utf-8')
    const parsed = JSON.parse(raw) as unknown
    return normalizeStatusFile(parsed)
  } catch {
    return { version: 1, incidents: [] }
  }
}

async function writeStatusFile(filePath: string, data: StatusFile) {
  await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

async function buildRecordsFromSources() {
  const byIncidentId = new Map<string, StoredIncidentRecord>()
  const now = new Date().toISOString()

  try {
    const zipEntries = await loadIncidentsFromZipFile(ZIP_PATH)

    for (const entry of zipEntries) {
      const incidentId = entry.incident.incident_id

      if (!incidentId || byIncidentId.has(incidentId)) {
        continue
      }

      byIncidentId.set(incidentId, {
        id: incidentId,
        incidentId,
        sourceFile: entry.sourceName,
        baseData: buildSingleIncidentFile(entry.incident, entry.sourceName),
        createdAt: now,
      })
    }

    if (byIncidentId.size > 0) {
      return byIncidentId
    }
  } catch {
    // Fallbacks below.
  }

  try {
    const jsonIncidents = await loadIncidentsFromJsonFile(FALLBACK_JSON_PATH)
    if (jsonIncidents.length > 0) {
      for (const incident of jsonIncidents) {
        if (!incident.incident_id || byIncidentId.has(incident.incident_id)) {
          continue
        }

        byIncidentId.set(incident.incident_id, {
          id: incident.incident_id,
          incidentId: incident.incident_id,
          sourceFile: incident.source_file || 'incidents_2026-01-03.json',
          baseData: buildSingleIncidentFile(incident, incident.source_file || 'incidents_2026-01-03.json'),
          createdAt: now,
        })
      }

      return byIncidentId
    }
  } catch {
    // Fallback below.
  }

  for (const incident of incidentData.incidents) {
    if (!incident.incident_id || byIncidentId.has(incident.incident_id)) {
      continue
    }

    byIncidentId.set(incident.incident_id, {
      id: incident.incident_id,
      incidentId: incident.incident_id,
      sourceFile: incident.source_file || 'embedded.incidents.json',
      baseData: buildSingleIncidentFile(incident, incident.source_file || 'embedded.incidents.json'),
      createdAt: now,
    })
  }

  return byIncidentId
}

async function ensureInMemoryStore() {
  if (inMemory.loaded) {
    return
  }

  const baseRecords = await buildRecordsFromSources()

  inMemory.byId = baseRecords
  inMemory.orderedIds = Array.from(baseRecords.keys()).sort()
  inMemory.loaded = true
}

function mergeRuntimeRecords() {
  const merged = new Map(inMemory.byId)

  runtimeUploads.forEach((record, incidentId) => {
    merged.set(incidentId, record)
  })

  return merged
}

async function getStatuses() {
  const reviewed = await readStatusFile(REVIEWED_PATH)
  const doubt = await readStatusFile(DOUBT_PATH)

  const reviewedMap = new Map(reviewed.incidents.map((entry) => [entry.incidentId, entry]))
  const doubtMap = new Map(doubt.incidents.map((entry) => [entry.incidentId, entry]))

  return {
    reviewed,
    doubt,
    reviewedMap,
    doubtMap,
  }
}

export async function seedIncidentsIfEmpty() {
  await ensureInMemoryStore()
}

export async function listIncidentSources(status: StatusFilter) {
  await ensureInMemoryStore()
  const records = mergeRuntimeRecords()
  const { reviewedMap, doubtMap } = await getStatuses()

  const sourceRows = Array.from(records.values()).map((record) => {
    if (runtimeDeleted.has(record.incidentId)) {
      return null
    }

    const doubt = doubtMap.get(record.incidentId)
    const reviewed = reviewedMap.get(record.incidentId)
    const resolvedStatus: IncidentStatus = doubt ? 'DOUBT' : reviewed ? 'REVIEWED' : 'PENDING'
    const resolvedData = doubt?.data ?? reviewed?.data ?? record.baseData

    return {
      id: record.id,
      name: record.sourceFile || `${record.incidentId}.json`,
      incidentCount: resolvedData.incidents.length,
      status: resolvedStatus,
      createdAt: record.createdAt,
      data: resolvedData,
    }
  })

  const filtered =
    (status === 'ALL' ? sourceRows : sourceRows.filter((record) => record?.status === status))
      .filter((record): record is NonNullable<typeof record> => record !== null)

  return filtered
    .slice()
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export async function upsertIncidentsFromFiles(files: Array<{ name: string; data: unknown }>) {
  await ensureInMemoryStore()

  let acceptedCount = 0
  const rejected: string[] = []

  const existing = mergeRuntimeRecords()

  for (const entry of files) {
    if (!entry || typeof entry.name !== 'string') {
      rejected.push('unknown')
      continue
    }

    const normalized = normalizeIncidentFile(entry.data)
    if (!normalized) {
      rejected.push(entry.name)
      continue
    }

    for (const incident of normalized.incidents) {
      if (!incident.incident_id) {
        rejected.push(`${entry.name} (sin incident_id)`)
        continue
      }

      if (!existing.has(incident.incident_id)) {
        const record: StoredIncidentRecord = {
          id: incident.incident_id || randomUUID(),
          incidentId: incident.incident_id,
          sourceFile: entry.name,
          baseData: buildSingleIncidentFile(incident, entry.name),
          createdAt: new Date().toISOString(),
        }
        runtimeUploads.set(incident.incident_id, record)
        existing.set(incident.incident_id, record)
      }

      runtimeDeleted.delete(incident.incident_id)

      acceptedCount += 1
    }
  }

  return {
    acceptedCount,
    skippedCount: 0,
    rejected,
  }
}

export async function updateIncidentReview(id: string, reviewedData: unknown, status: 'REVIEWED' | 'DOUBT') {
  await ensureInMemoryStore()
  const records = mergeRuntimeRecords()
  const target = records.get(id)

  if (!target) {
    return { ok: false as const, error: 'NOT_FOUND' as const }
  }

  const normalized = normalizeIncidentFile(reviewedData)

  if (!normalized) {
    return { ok: false as const, error: 'INVALID_PAYLOAD' as const }
  }

  const now = new Date().toISOString()
  const { reviewed, doubt } = await getStatuses()
  const nextEntry: StatusEntry = {
    incidentId: target.incidentId,
    updatedAt: now,
    data: normalized,
  }

  const nextReviewedEntries = reviewed.incidents.filter((entry) => entry.incidentId !== target.incidentId)
  const nextDoubtEntries = doubt.incidents.filter((entry) => entry.incidentId !== target.incidentId)

  if (status === 'REVIEWED') {
    nextReviewedEntries.push(nextEntry)
  } else {
    nextDoubtEntries.push(nextEntry)
  }

  await writeStatusFile(REVIEWED_PATH, { version: 1, incidents: nextReviewedEntries })
  await writeStatusFile(DOUBT_PATH, { version: 1, incidents: nextDoubtEntries })

  return { ok: true as const }
}

export async function deleteIncidentById(id: string) {
  await ensureInMemoryStore()
  const records = mergeRuntimeRecords()
  const target = records.get(id)

  if (!target) {
    return false
  }

  runtimeUploads.delete(target.incidentId)
  runtimeDeleted.add(target.incidentId)

  const { reviewed, doubt } = await getStatuses()
  const nextReviewed = reviewed.incidents.filter((entry) => entry.incidentId !== target.incidentId)
  const nextDoubt = doubt.incidents.filter((entry) => entry.incidentId !== target.incidentId)

  await writeStatusFile(REVIEWED_PATH, { version: 1, incidents: nextReviewed })
  await writeStatusFile(DOUBT_PATH, { version: 1, incidents: nextDoubt })

  return true
}

export async function getAggregate(status?: 'REVIEWED' | 'DOUBT'): Promise<IncidentFile> {
  await ensureInMemoryStore()
  const records = mergeRuntimeRecords()
  const { reviewedMap, doubtMap } = await getStatuses()

  const incidents = Array.from(records.values()).flatMap((record) => {
    if (runtimeDeleted.has(record.incidentId)) {
      return []
    }

    const reviewed = reviewedMap.get(record.incidentId)
    const doubt = doubtMap.get(record.incidentId)

    if (status === 'REVIEWED') {
      return reviewed?.data.incidents ?? []
    }

    if (status === 'DOUBT') {
      return doubt?.data.incidents ?? []
    }

    return doubt?.data.incidents ?? reviewed?.data.incidents ?? record.baseData.incidents
  })

  if (incidents.length === 0) {
    return emptyIncidentFile()
  }

  return {
    count: incidents.length,
    incident_ids: incidents.map((item) => item.incident_id).filter(Boolean),
    incidents,
  }
}