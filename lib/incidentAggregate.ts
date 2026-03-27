import { getAggregate } from '@/lib/incidentStore'

export async function refreshIncidentAggregate() {
  await getAggregate()
}
