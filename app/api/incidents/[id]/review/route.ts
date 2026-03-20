import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { refreshIncidentAggregate } from '@/lib/incidentAggregate'
import { normalizeIncidentFile } from '@/lib/incidentNormalization'

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
  const normalizedReviewed = normalizeIncidentFile(body.reviewedData)

  if (!normalizedReviewed) {
    return NextResponse.json({ error: 'Invalid reviewedData payload.' }, { status: 400 })
  }

  const existing = await prisma.incident.findUnique({ where: { id } })

  if (!existing) {
    return NextResponse.json({ error: 'Incident not found.' }, { status: 404 })
  }

  await prisma.incident.update({
    where: { id },
    data: {
      reviewedJson: JSON.stringify(normalizedReviewed),
      status: nextStatus,
      reviewedAt: new Date(),
    },
  })

  await refreshIncidentAggregate()

  return NextResponse.json({ ok: true })
}
