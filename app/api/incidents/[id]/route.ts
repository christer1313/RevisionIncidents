import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { refreshIncidentAggregate } from '@/lib/incidentAggregate'

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const existing = await prisma.incident.findUnique({ where: { id } })

  if (!existing) {
    return NextResponse.json({ error: 'Incident not found.' }, { status: 404 })
  }

  await prisma.incident.delete({ where: { id } })
  await refreshIncidentAggregate()

  return NextResponse.json({ ok: true })
}
