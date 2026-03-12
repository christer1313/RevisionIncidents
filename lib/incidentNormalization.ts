import { Incident, IncidentFile } from '@/lib/types'

export function normalizeIncidentFile(input: unknown): IncidentFile | null {
  if (Array.isArray(input)) {
    const incidents = input as Incident[]
    return {
      count: incidents.length,
      incident_ids: incidents.map((item) => item.incident_id).filter(Boolean),
      incidents,
    }
  }

  if (!input || typeof input !== 'object') {
    return null
  }

  const obj = input as Partial<IncidentFile> & Partial<Incident>

  if (Array.isArray(obj.incidents)) {
    const incidents = obj.incidents as Incident[]
    return {
      count: typeof obj.count === 'number' ? obj.count : incidents.length,
      incident_ids: Array.isArray(obj.incident_ids)
        ? obj.incident_ids
        : incidents.map((item) => item.incident_id).filter(Boolean),
      incidents,
    }
  }

  if (typeof obj.incident_id === 'string') {
    const incident = obj as Incident
    return {
      count: 1,
      incident_ids: [incident.incident_id],
      incidents: [incident],
    }
  }

  return null
}
