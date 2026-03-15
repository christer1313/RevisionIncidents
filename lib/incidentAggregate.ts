import { prisma } from '@/lib/prisma'
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
    .map((row) => {
      try {
        return JSON.parse(row.reviewedJson || row.originalJson) as Incident
      } catch {
        return null
      }
    })
    .filter((item): item is Incident => item !== null)

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
