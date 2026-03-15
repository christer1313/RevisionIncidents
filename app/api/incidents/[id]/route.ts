import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { refreshIncidentAggregate } from '@/lib/incidentAggregate'

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const hasIncidentModel = 'incident' in prisma

  const existing = hasIncidentModel
    ? await prisma.incident.findUnique({ where: { id } })
    : await prisma.incidentUpload.findUnique({ where: { id } })

  if (!existing) {
    return NextResponse.json({ error: 'Incident not found.' }, { status: 404 })
  }

  if (hasIncidentModel) {
    await prisma.incident.delete({ where: { id } })
    await refreshIncidentAggregate()
  } else {
    await prisma.incidentUpload.delete({ where: { id } })
  }

  return NextResponse.json({ ok: true })
}
