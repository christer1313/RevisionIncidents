import { NextResponse } from 'next/server'
import { deleteIncidentById } from '@/lib/incidentStore'

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params

  const deleted = await deleteIncidentById(id)
  if (!deleted) {
    return NextResponse.json({ error: 'Incident not found.' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
