import { prisma } from '@/lib/prisma'
import { normalizeIncidentFile } from '@/lib/incidentNormalization'
import { Incident, IncidentFile } from '@/lib/types'

const ALL_INCIDENTS_AGGREGATE_ID = 'ALL_INCIDENTS'

function buildAggregatedPayload(incidents: Incident[]): IncidentFile {
  return {
    count: incidents.length,
    incident_ids: incidents.map((item) => item.incident_id).filter(Boolean),
    incidents,
  }
}

export async function refreshIncidentAggregate() {
  const hasIncidentModel = 'incident' in prisma
  const hasAggregateModel = 'incidentAggregate' in prisma

  if (!hasIncidentModel || !hasAggregateModel) {
    return
  }

  const rows = await prisma.incident.findMany({
    orderBy: { createdAt: 'asc' },
  })

  const incidents: Incident[] = rows
    .flatMap((row) => {
      const payloads = [row.reviewedJson, row.originalJson].filter(Boolean) as string[]

      for (const payload of payloads) {
        try {
          const parsed = JSON.parse(payload) as unknown
          const normalized = normalizeIncidentFile(parsed)

          if (normalized?.incidents?.length) {
            return normalized.incidents
          }
        } catch {
          continue
        }
      }

      return []
    })
    .filter((item) => Boolean(item?.incident_id))

  const aggregate = buildAggregatedPayload(incidents)

  await prisma.incidentAggregate.upsert({
    where: { id: ALL_INCIDENTS_AGGREGATE_ID },
    create: {
      id: ALL_INCIDENTS_AGGREGATE_ID,
      aggregatedJson: JSON.stringify(aggregate),
      incidentCount: aggregate.count,
    },
    update: {
      aggregatedJson: JSON.stringify(aggregate),
      incidentCount: aggregate.count,
    },
  })
}
