// ──────────────────────────────────────────────────────────────────────────────
// Incident data types
// ──────────────────────────────────────────────────────────────────────────────

export interface PropertyEntry {
  value: string
  method: string
  reasoning: string
}

export interface KGObjectMeta {
  id_data: string
  extraction_method: string
  reasoning: string
}

export interface KGObject {
  obj_type: string
  meta: KGObjectMeta
  properties: Record<string, PropertyEntry>
}

export interface KGRelation {
  source_id: string
  relationship_type: string
  target_id: string
  meta: {
    reasoning: string
  }
}

export interface KnowledgeGraph {
  objects: KGObject[]
  relations: KGRelation[]
}

export interface Artifact {
  name: string
  search_url: string
  archive_url: string
}

export interface Location {
  origin_countries: string[]
  victim_countries: string[]
  target_audience_countries: string[]
}

export interface Incident {
  incident_id: string
  title: string
  summary: string
  tags: string[]
  artifacts: Artifact[]
  author?: string
  organization?: string
  location: Location
  knowledge_graph: KnowledgeGraph
  summary_euvsdisinfo: string
  response: string
  publication_date: string
  source_file: string
  languages: string[]
  countries_regions: string[]
  outlet_count: number
}

export interface IncidentFile {
  count: number
  incident_ids: string[]
  incidents: Incident[]
}
