import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { normalizeIncidentFile } from '@/lib/incidentNormalization'
import { IncidentFile } from '@/lib/types'

interface UploadFilePayload {
  name: string
  data: unknown
}

interface UploadRequestBody {
  files: UploadFilePayload[]
}

interface PendingSourcePayload {
  id: string
  name: string
  incidentCount: number
  createdAt: string
  data: IncidentFile
}

export async function GET() {
  const pending = await prisma.incidentUpload.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'asc' },
  })

  const sources = pending
    .map((item: { id: string; fileName: string; incidentCount: number; createdAt: Date; originalJson: string }): PendingSourcePayload | null => {
      try {
        const parsed = JSON.parse(item.originalJson) as unknown
        const normalized = normalizeIncidentFile(parsed)

        if (!normalized) return null

        return {
          id: item.id,
          name: item.fileName,
          incidentCount: item.incidentCount,
          createdAt: item.createdAt.toISOString(),
          data: normalized,
        }
      } catch {
        return null
      }
    })
    .filter((item: PendingSourcePayload | null): item is PendingSourcePayload => item !== null)

  return NextResponse.json({
    sources,
  })
}

export async function POST(request: Request) {
  let body: UploadRequestBody

  try {
    body = (await request.json()) as UploadRequestBody
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  if (!body || !Array.isArray(body.files) || body.files.length === 0) {
    return NextResponse.json({ error: 'files is required and must be a non-empty array.' }, { status: 400 })
  }

  const accepted: string[] = []
  const rejected: string[] = []

  for (const entry of body.files) {
    if (!entry || typeof entry.name !== 'string') {
      rejected.push('unknown')
      continue
    }

    const normalized = normalizeIncidentFile(entry.data)

    if (!normalized) {
      rejected.push(entry.name)
      continue
    }

    await prisma.incidentUpload.create({
      data: {
        fileName: entry.name,
        incidentCount: normalized.incidents.length,
        originalJson: JSON.stringify(normalized),
      },
    })

    accepted.push(entry.name)
  }

  return NextResponse.json({
    acceptedCount: accepted.length,
    rejectedCount: rejected.length,
    rejected,
  })
}
