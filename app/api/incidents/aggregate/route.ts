import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { normalizeIncidentFile } from '@/lib/incidentNormalization'
import { refreshIncidentAggregate } from '@/lib/incidentAggregate'
import { Incident, IncidentFile } from '@/lib/types'

const AGGREGATE_ID = 'ALL_INCIDENTS'

function emptyIncidentFile(): IncidentFile {
  return {
    count: 0,
    incident_ids: [],
    incidents: [],
  }
}

export async function GET() {
  const hasIncidentModel = 'incident' in prisma
  const hasAggregateModel = 'incidentAggregate' in prisma

  if (hasIncidentModel && hasAggregateModel) {
    await refreshIncidentAggregate()

    const row = await prisma.incidentAggregate.findUnique({
      where: { id: AGGREGATE_ID },
    })

    if (!row) {
      return NextResponse.json({ data: emptyIncidentFile() })
    }

    try {
      const parsed = JSON.parse(row.aggregatedJson) as IncidentFile
      return NextResponse.json({ data: parsed })
    } catch {
      return NextResponse.json({ data: emptyIncidentFile() })
    }
  }

  const uploads = await prisma.incidentUpload.findMany({
    orderBy: { createdAt: 'asc' },
  })

  const incidents: Incident[] = []

  for (const row of uploads) {
    try {
      const parsed = JSON.parse(row.reviewedJson || row.originalJson) as unknown
      const normalized = normalizeIncidentFile(parsed)
      if (normalized) {
        incidents.push(...normalized.incidents)
      }
    } catch {
      continue
    }
  }

  const data: IncidentFile = {
    count: incidents.length,
    incident_ids: incidents.map((item) => item.incident_id).filter(Boolean),
    incidents,
  }

  return NextResponse.json({ data })
}
