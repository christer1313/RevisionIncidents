import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { normalizeIncidentFile } from '@/lib/incidentNormalization'
import { refreshIncidentAggregate } from '@/lib/incidentAggregate'
import { Incident, IncidentFile } from '@/lib/types'

type StatusFilter = 'PENDING' | 'REVIEWED' | 'ALL'

function buildWhereByStatus(status: StatusFilter) {
  if (status === 'ALL') {
    return {}
  }

  return { status }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const statusParam = searchParams.get('status')?.toUpperCase()
  const status: StatusFilter =
    statusParam === 'REVIEWED' || statusParam === 'ALL' ? statusParam : 'PENDING'

  const hasIncidentModel = 'incident' in prisma

  if (hasIncidentModel) {
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

  const rows = await prisma.incidentUpload.findMany({
    where: buildWhereByStatus(status),
    orderBy: { createdAt: 'asc' },
  })

  const sources = rows
    .map((row) => {
      try {
        const parsed = JSON.parse(row.originalJson) as unknown
        const data = normalizeIncidentFile(parsed)

        if (!data) return null

        return {
          id: row.id,
          name: row.fileName,
          incidentCount: row.incidentCount,
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
  const hasIncidentModel = 'incident' in prisma

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

      if (hasIncidentModel) {
        await prisma.incident.upsert({
          where: { incidentId: incident.incident_id },
          create: {
            incidentId: incident.incident_id,
            sourceFile: entry.name,
            originalJson: JSON.stringify(incident),
          },
          update: {},
        })
      } else {
        await prisma.incidentUpload.create({
          data: {
            fileName: entry.name,
            incidentCount: normalized.incidents.length,
            originalJson: JSON.stringify(normalized),
          },
        })
      }

      acceptedCount++

      if (!hasIncidentModel) {
        break
      }
    }
  }

  if (hasIncidentModel) {
    await refreshIncidentAggregate()
  }

  return NextResponse.json({ acceptedCount, skippedCount, rejectedCount: rejected.length, rejected })
}
