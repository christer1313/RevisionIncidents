import { NextResponse } from 'next/server'
import { listIncidentSources, StatusFilter, upsertIncidentsFromFiles } from '@/lib/incidentStore'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const statusParam = searchParams.get('status')?.toUpperCase()
  const status: StatusFilter =
    statusParam === 'REVIEWED' || statusParam === 'DOUBT' || statusParam === 'ALL' ? statusParam : 'PENDING'

  const sources = await listIncidentSources(status)

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

  const { acceptedCount, skippedCount, rejected } = await upsertIncidentsFromFiles(body.files)

  return NextResponse.json({ acceptedCount, skippedCount, rejectedCount: rejected.length, rejected })
}
