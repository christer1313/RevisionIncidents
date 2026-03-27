import { NextResponse } from 'next/server'
import { getAggregate } from '@/lib/incidentStore'
import { IncidentFile } from '@/lib/types'

function emptyIncidentFile(): IncidentFile {
  return {
    count: 0,
    incident_ids: [],
    incidents: [],
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const statusParam = searchParams.get('status')?.toUpperCase()

  if (statusParam === 'REVIEWED' || statusParam === 'DOUBT') {
    const data = await getAggregate(statusParam)
    return NextResponse.json({ data })
  }

  const data = await getAggregate()
  return NextResponse.json({ data: data ?? emptyIncidentFile() })
}
