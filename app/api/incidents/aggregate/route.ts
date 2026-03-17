import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { refreshIncidentAggregate } from '@/lib/incidentAggregate'
import { normalizeIncidentFile } from '@/lib/incidentNormalization'
import { IncidentFile } from '@/lib/types'

const AGGREGATE_ID = 'ALL_INCIDENTS'

function emptyIncidentFile(): IncidentFile {
  return {
    count: 0,
    incident_ids: [],
    incidents: [],
  }
}

function buildIncidentFileFromRows(rows: Array<{ reviewedJson: string | null; originalJson: string }>): IncidentFile {
  const incidents = rows.flatMap((row) => {
    const payloads = [row.reviewedJson, row.originalJson].filter(Boolean) as string[]

    for (const payload of payloads) {
      try {
        const parsed = JSON.parse(payload) as unknown
        const normalized = normalizeIncidentFile(parsed)

        if (normalized?.incidents?.length) {
          return normalized.incidents
        }
      } catch {
        continue
      }
    }

    return []
  })

  return {
    count: incidents.length,
    incident_ids: incidents.map((item) => item.incident_id).filter(Boolean),
    incidents,
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const statusParam = searchParams.get('status')?.toUpperCase()

  if (statusParam === 'REVIEWED' || statusParam === 'DOUBT') {
    const rows = await prisma.incident.findMany({
      where: { status: statusParam },
      orderBy: { createdAt: 'asc' },
      select: {
        reviewedJson: true,
        originalJson: true,
      },
    })

    return NextResponse.json({ data: buildIncidentFileFromRows(rows) })
  }

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
