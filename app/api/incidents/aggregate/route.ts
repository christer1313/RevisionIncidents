import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { refreshIncidentAggregate } from '@/lib/incidentAggregate'
import { IncidentFile } from '@/lib/types'

const AGGREGATE_ID = 'ALL_INCIDENTS'

function emptyIncidentFile(): IncidentFile {
  return {
    count: 0,
    incident_ids: [],
    incidents: [],
  }
}

export async function GET() {
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
