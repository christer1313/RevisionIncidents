import { NextResponse } from 'next/server'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import JSZip from 'jszip'
import { prisma } from '@/lib/prisma'
import { normalizeIncidentFile } from '@/lib/incidentNormalization'
import { refreshIncidentAggregate } from '@/lib/incidentAggregate'
import { incidentData } from '@/lib/incidentData'
import { Incident, IncidentFile } from '@/lib/types'

type StatusFilter = 'PENDING' | 'REVIEWED' | 'ALL'

function buildWhereByStatus(status: StatusFilter) {
  if (status === 'ALL') {
    return {}
  }

  return { status }
}

async function loadIncidentsFromZipFile(zipPath: string): Promise<Incident[]> {
  const buffer = await readFile(zipPath)
  const zip = await JSZip.loadAsync(buffer)
  const incidents: Incident[] = []

  for (const entry of Object.values(zip.files)) {
    if (entry.dir || !entry.name.toLowerCase().endsWith('.json')) {
      continue
    }

    try {
      const raw = await entry.async('string')
      const parsed = JSON.parse(raw) as unknown
      const normalized = normalizeIncidentFile(parsed)

      if (normalized?.incidents?.length) {
        incidents.push(...normalized.incidents)
      }
    } catch {
      continue
    }
  }

  return incidents
}

async function loadIncidentsFromJsonFile(jsonPath: string): Promise<Incident[]> {
  const raw = await readFile(jsonPath, 'utf-8')
  const parsed = JSON.parse(raw) as unknown
  const normalized = normalizeIncidentFile(parsed)
  return normalized?.incidents ?? []
}

async function loadBootstrapIncidents(): Promise<Incident[]> {
  const cwd = process.cwd()
  const zipPath = path.join(cwd, 'jsons.zip')
  const jsonPath = path.join(cwd, 'incidents_2026-01-03.json')

  const sources: Array<{ sourceName: string; incidents: Incident[] }> = []

  try {
    const zipIncidents = await loadIncidentsFromZipFile(zipPath)
    if (zipIncidents.length > 0) {
      sources.push({ sourceName: 'jsons.zip', incidents: zipIncidents })
    }
  } catch {
    // Ignore missing or invalid zip and try other sources.
  }

  try {
    const jsonIncidents = await loadIncidentsFromJsonFile(jsonPath)
    if (jsonIncidents.length > 0) {
      sources.push({ sourceName: 'incidents_2026-01-03.json', incidents: jsonIncidents })
    }
  } catch {
    // Ignore missing or invalid json and fallback to embedded sample.
  }

  if (sources.length === 0) {
    return incidentData.incidents
  }

  const deduped = new Map<string, { sourceName: string; incident: Incident }>()

  for (const source of sources) {
    for (const incident of source.incidents) {
      if (!incident.incident_id || deduped.has(incident.incident_id)) {
        continue
      }

      deduped.set(incident.incident_id, { sourceName: source.sourceName, incident })
    }
  }

  return Array.from(deduped.values()).map((item) => {
    const incident = item.incident
    return {
      ...incident,
      source_file: incident.source_file || item.sourceName,
    }
  })
}

async function seedIncidentsIfEmpty() {
  const existingRows = await prisma.incident.findMany({
    select: { incidentId: true, sourceFile: true },
  })
  const existingCount = existingRows.length

  const hasOnlyBootstrapRow =
    existingCount === 1 && existingRows[0]?.sourceFile === 'incidents_2026-01-03.json'

  if (existingCount > 0 && !hasOnlyBootstrapRow) {
    return
  }

  const bootstrapIncidents = await loadBootstrapIncidents()
  const recordsToCreate: Array<{
    incidentId: string
    sourceFile: string
    originalJson: string
  }> = []

  for (const incident of bootstrapIncidents) {
    if (!incident.incident_id) {
      continue
    }

    recordsToCreate.push({
      incidentId: incident.incident_id,
      sourceFile: incident.source_file || 'incidents_2026-01-03.json',
      originalJson: JSON.stringify(incident),
    })
  }

  if (recordsToCreate.length > 0) {
    await prisma.incident.createMany({
      data: recordsToCreate,
      skipDuplicates: true,
    })
  }

  await refreshIncidentAggregate()
}

export async function GET(request: Request) {
  await seedIncidentsIfEmpty()

  const { searchParams } = new URL(request.url)
  const statusParam = searchParams.get('status')?.toUpperCase()
  const status: StatusFilter =
    statusParam === 'REVIEWED' || statusParam === 'ALL' ? statusParam : 'PENDING'

  const rows = await prisma.incident.findMany({
    where: buildWhereByStatus(status),
    orderBy: { createdAt: 'asc' },
  })

  const sources = rows
    .map((row) => {
      try {
        const incident = JSON.parse(row.originalJson) as Incident
        const data: IncidentFile = {
          count: 1,
          incident_ids: [incident.incident_id].filter(Boolean),
          incidents: [incident],
        }

        return {
          id: row.id,
          name: row.sourceFile || `${row.incidentId}.json`,
          incidentCount: data.incidents.length,
          status: row.status,
          createdAt: row.createdAt.toISOString(),
          data,
        }
      } catch {
        return null
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)

  return NextResponse.json({ sources })
}

export async function POST(request: Request) {
  let body: { files: Array<{ name: string; data: unknown }> }

  try {
    body = (await request.json()) as { files: Array<{ name: string; data: unknown }> }
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  if (!body || !Array.isArray(body.files) || body.files.length === 0) {
    return NextResponse.json({ error: 'files is required and must be a non-empty array.' }, { status: 400 })
  }

  let acceptedCount = 0
  let skippedCount = 0
  const rejected: string[] = []

  for (const entry of body.files) {
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

      await prisma.incident.upsert({
        where: { incidentId: incident.incident_id },
        create: {
          incidentId: incident.incident_id,
          sourceFile: entry.name,
          originalJson: JSON.stringify(incident),
        },
        update: {},
      })

      acceptedCount++
    }
  }

  await refreshIncidentAggregate()

  return NextResponse.json({ acceptedCount, skippedCount, rejectedCount: rejected.length, rejected })
}
