import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { refreshIncidentAggregate } from '@/lib/incidentAggregate'

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const hasIncidentModel = 'incident' in prisma

  let body: { reviewedData: unknown }

  try {
    body = (await request.json()) as { reviewedData: unknown }
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const existing = hasIncidentModel
    ? await prisma.incident.findUnique({ where: { id } })
    : await prisma.incidentUpload.findUnique({ where: { id } })

  if (!existing) {
    return NextResponse.json({ error: 'Incident not found.' }, { status: 404 })
  }

  if (hasIncidentModel) {
    await prisma.incident.update({
      where: { id },
      data: {
        reviewedJson: JSON.stringify(body.reviewedData),
        status: 'REVIEWED',
        reviewedAt: new Date(),
      },
    })

    await refreshIncidentAggregate()
  } else {
    await prisma.incidentUpload.update({
      where: { id },
      data: {
        reviewedJson: JSON.stringify(body.reviewedData),
        status: 'REVIEWED',
        reviewedAt: new Date(),
      },
    })
  }

  return NextResponse.json({ ok: true })
}
