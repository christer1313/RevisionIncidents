import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { normalizeIncidentFile } from '@/lib/incidentNormalization'

interface ReviewRequestBody {
  reviewedData: unknown
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params

  let body: ReviewRequestBody

  try {
    body = (await request.json()) as ReviewRequestBody
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const normalized = normalizeIncidentFile(body?.reviewedData)

  if (!normalized) {
    return NextResponse.json({ error: 'reviewedData has invalid format.' }, { status: 400 })
  }

  const existing = await prisma.incidentUpload.findUnique({ where: { id } })

  if (!existing) {
    return NextResponse.json({ error: 'File not found.' }, { status: 404 })
  }

  await prisma.incidentUpload.update({
    where: { id },
    data: {
      reviewedJson: JSON.stringify(normalized),
      status: 'REVIEWED',
      reviewedAt: new Date(),
    },
  })

  return NextResponse.json({ ok: true })
}
