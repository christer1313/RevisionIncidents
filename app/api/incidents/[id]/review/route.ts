import { NextResponse } from 'next/server'
import { updateIncidentReview } from '@/lib/incidentStore'

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params

  let body: { reviewedData: unknown; status?: 'REVIEWED' | 'DOUBT' }

  try {
    body = (await request.json()) as { reviewedData: unknown; status?: 'REVIEWED' | 'DOUBT' }
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const nextStatus = body.status === 'DOUBT' ? 'DOUBT' : 'REVIEWED'
  const result = await updateIncidentReview(id, body.reviewedData, nextStatus)

  if (!result.ok) {
    if (result.error === 'INVALID_PAYLOAD') {
      return NextResponse.json({ error: 'Invalid reviewedData payload.' }, { status: 400 })
    }

    return NextResponse.json({ error: 'Incident not found.' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
