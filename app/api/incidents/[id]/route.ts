import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params

  const existing = await prisma.incidentUpload.findUnique({ where: { id } })

  if (!existing) {
    return NextResponse.json({ error: 'File not found.' }, { status: 404 })
  }

  await prisma.incidentUpload.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
