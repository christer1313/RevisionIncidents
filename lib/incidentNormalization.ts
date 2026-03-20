import { Incident, IncidentFile } from '@/lib/types'

function asString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function normalizePropertyEntry(entry: unknown) {
  if (entry && typeof entry === 'object') {
    const obj = entry as { value?: unknown; method?: unknown; reasoning?: unknown }
    return {
      value: asString(obj.value),
      method: asString(obj.method) || 'inferred',
      reasoning: asString(obj.reasoning),
    }
  }

  // Backward compatibility: some payloads store KG properties as plain strings.
  return {
    value: asString(entry),
    method: 'inferred',
    reasoning: 'Normalized from scalar property format.',
  }
}

function normalizeIncident(input: unknown): Incident | null {
  if (!input || typeof input !== 'object') {
    return null
  }

  const obj = input as Record<string, unknown>
  const incidentId = asString(obj.incident_id)
  if (!incidentId) {
    return null
  }

  const locationObj = (obj.location && typeof obj.location === 'object' ? obj.location : {}) as Record<string, unknown>
  const kgObj = (obj.knowledge_graph && typeof obj.knowledge_graph === 'object' ? obj.knowledge_graph : {}) as Record<string, unknown>
  const rawObjects = Array.isArray(kgObj.objects) ? kgObj.objects : []
  const rawRelations = Array.isArray(kgObj.relations) ? kgObj.relations : []

  const objects = rawObjects
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
    .map((item) => {
      const meta = (item.meta && typeof item.meta === 'object' ? item.meta : {}) as Record<string, unknown>
      const props = (item.properties && typeof item.properties === 'object' ? item.properties : {}) as Record<string, unknown>

      const normalizedProperties = Object.fromEntries(
        Object.entries(props).map(([key, value]) => [key, normalizePropertyEntry(value)])
      )

      return {
        obj_type: asString(item.obj_type),
        meta: {
          id_data: asString(meta.id_data),
          extraction_method: asString(meta.extraction_method) || 'inferred',
          reasoning: asString(meta.reasoning),
        },
        properties: normalizedProperties,
      }
    })

  const relations = rawRelations
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
    .map((item) => {
      const meta = (item.meta && typeof item.meta === 'object' ? item.meta : {}) as Record<string, unknown>
      return {
        source_id: asString(item.source_id),
        relationship_type: asString(item.relationship_type),
        target_id: asString(item.target_id),
        meta: {
          reasoning: asString(meta.reasoning),
        },
      }
    })

  return {
    incident_id: incidentId,
    title: asString(obj.title),
    summary: asString(obj.summary),
    tags: asStringArray(obj.tags),
    artifacts: Array.isArray(obj.artifacts)
      ? obj.artifacts
          .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
          .map((item) => ({
            name: asString(item.name),
            search_url: asString(item.search_url),
            archive_url: asString(item.archive_url),
          }))
      : [],
    author: typeof obj.author === 'string' ? obj.author : undefined,
    organization: typeof obj.organization === 'string' ? obj.organization : undefined,
    location: {
      origin_countries: asStringArray(locationObj.origin_countries),
      victim_countries: asStringArray(locationObj.victim_countries),
      target_audience_countries: asStringArray(locationObj.target_audience_countries),
    },
    knowledge_graph: {
      objects,
      relations,
    },
    summary_euvsdisinfo: asString(obj.summary_euvsdisinfo),
    response: asString(obj.response),
    publication_date: asString(obj.publication_date),
    source_file: asString(obj.source_file),
    languages: asStringArray(obj.languages),
    countries_regions: asStringArray(obj.countries_regions),
    outlet_count: typeof obj.outlet_count === 'number' ? obj.outlet_count : 0,
  }
}

export function normalizeIncidentFile(input: unknown): IncidentFile | null {
  if (Array.isArray(input)) {
    const incidents = input.map((item) => normalizeIncident(item)).filter((item): item is Incident => item !== null)
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
    const incidents = obj.incidents.map((item) => normalizeIncident(item)).filter((item): item is Incident => item !== null)
    return {
      count: typeof obj.count === 'number' ? obj.count : incidents.length,
      incident_ids: Array.isArray(obj.incident_ids)
        ? obj.incident_ids
        : incidents.map((item) => item.incident_id).filter(Boolean),
      incidents,
    }
  }

  if (typeof obj.incident_id === 'string') {
    const incident = normalizeIncident(obj)
    if (!incident) {
      return null
    }
    return {
      count: 1,
      incident_ids: [incident.incident_id],
      incidents: [incident],
    }
  }

  return null
}
