'use client'

import { Incident, KGObject, KGRelation } from '@/lib/types'
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'

interface Props {
  incident: Incident
  onChange: (updated: Incident) => void
}

// ─── Small collapsible section ───────────────────────────────────────────────
function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
      >
        <span className="text-sm font-semibold text-slate-700">{title}</span>
        {open ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
      </button>
      {open && <div className="p-5 space-y-4 bg-white">{children}</div>}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label block mb-1">{label}</label>
      {children}
    </div>
  )
}

// ─── Tags editor ─────────────────────────────────────────────────────────────
function TagsEditor({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [input, setInput] = useState('')

  function add() {
    const val = input.trim()
    if (val && !tags.includes(val)) onChange([...tags, val])
    setInput('')
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {tags.map(t => (
          <span key={t} className="badge bg-violet-100 text-violet-700 pr-1 flex items-center gap-1">
            {t}
            <button onClick={() => onChange(tags.filter(x => x !== t))} className="ml-1 hover:text-red-600">×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="input-base flex-1"
          value={input}
          placeholder="Add tag..."
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
        />
        <button type="button" className="btn-secondary" onClick={add}><Plus className="w-4 h-4" /></button>
      </div>
    </div>
  )
}

// ─── Country list editor ──────────────────────────────────────────────────────
function CountryListEditor({ list, onChange }: { list: string[]; onChange: (l: string[]) => void }) {
  const [input, setInput] = useState('')
  function add() {
    const val = input.trim().toUpperCase()
    if (val && !list.includes(val)) onChange([...list, val])
    setInput('')
  }
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {list.map(c => (
          <span key={c} className="badge bg-slate-100 text-slate-700 flex items-center gap-1">
            {c}
            <button onClick={() => onChange(list.filter(x => x !== c))} className="ml-1 hover:text-red-600">×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input className="input-base flex-1" value={input} placeholder="ISO country code (e.g. RUS)" onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }} />
        <button type="button" className="btn-secondary" onClick={add}><Plus className="w-4 h-4" /></button>
      </div>
    </div>
  )
}

// ─── KG Object editor ────────────────────────────────────────────────────────
function KGObjectEditor({ obj, index, onChange, onRemove }: {
  obj: KGObject; index: number;
  onChange: (o: KGObject) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false)

  function setProp(key: string, field: 'value' | 'method' | 'reasoning', val: string) {
    onChange({
      ...obj,
      properties: {
        ...obj.properties,
        [key]: { ...obj.properties[key], [field]: val },
      },
    })
  }

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-50">
        <button type="button" onClick={() => setOpen(v => !v)} className="flex items-center gap-2 flex-1 text-left text-sm font-medium text-slate-700 hover:text-slate-900">
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <span className="badge bg-indigo-100 text-indigo-700 mr-1">{obj.obj_type}</span>
          <span className="font-mono text-xs text-slate-400">{obj.meta.id_data}</span>
        </button>
        <button type="button" onClick={onRemove} className="text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
      </div>

      {open && (
        <div className="p-4 space-y-3 bg-white">
          {/* Meta */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label block mb-1">ID</label>
              <input className="input-base" value={obj.meta.id_data} onChange={e => onChange({ ...obj, meta: { ...obj.meta, id_data: e.target.value } })} />
            </div>
            <div>
              <label className="label block mb-1">Extraction Method</label>
              <select className="input-base" value={obj.meta.extraction_method} onChange={e => onChange({ ...obj, meta: { ...obj.meta, extraction_method: e.target.value } })}>
                <option>explicit</option>
                <option>inferred</option>
                <option>generated</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label block mb-1">Meta Reasoning</label>
            <textarea className="textarea-base" rows={2} value={obj.meta.reasoning} onChange={e => onChange({ ...obj, meta: { ...obj.meta, reasoning: e.target.value } })} />
          </div>

          {/* Properties */}
          <div className="border-t border-slate-100 pt-3">
            <p className="text-xs font-semibold text-slate-500 mb-2">Properties</p>
            <div className="space-y-3">
              {Object.entries(obj.properties).map(([key, prop]) => (
                <div key={key} className="rounded-lg bg-slate-50 border border-slate-100 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600">{key}</span>
                    <select className="input-base w-auto text-xs py-0.5 px-2" value={prop.method} onChange={e => setProp(key, 'method', e.target.value)}>
                      <option>explicit</option>
                      <option>inferred</option>
                      <option>generated</option>
                    </select>
                  </div>
                  <textarea className="textarea-base" rows={2} value={prop.value} onChange={e => setProp(key, 'value', e.target.value)} placeholder="Value" />
                  <textarea className="textarea-base text-xs text-slate-500" rows={1} value={prop.reasoning} onChange={e => setProp(key, 'reasoning', e.target.value)} placeholder="Reasoning" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── KG Relation editor ───────────────────────────────────────────────────────
function KGRelationEditor({ rel, onChange, onRemove }: {
  rel: KGRelation; onChange: (r: KGRelation) => void; onRemove: () => void;
}) {
  return (
    <div className="rounded-lg border border-slate-200 p-3 bg-white space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div>
          <label className="label block mb-1">Source ID</label>
          <input className="input-base" value={rel.source_id} onChange={e => onChange({ ...rel, source_id: e.target.value })} />
        </div>
        <div>
          <label className="label block mb-1">Relationship Type</label>
          <input className="input-base" value={rel.relationship_type} onChange={e => onChange({ ...rel, relationship_type: e.target.value })} />
        </div>
        <div>
          <label className="label block mb-1">Target ID</label>
          <input className="input-base" value={rel.target_id} onChange={e => onChange({ ...rel, target_id: e.target.value })} />
        </div>
      </div>
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <label className="label block mb-1">Reasoning</label>
          <input className="input-base" value={rel.meta.reasoning} onChange={e => onChange({ ...rel, meta: { reasoning: e.target.value } })} />
        </div>
        <button type="button" onClick={onRemove} className="mt-5 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
      </div>
    </div>
  )
}

// ─── Main EditForm ─────────────────────────────────────────────────────────── 
export default function EditForm({ incident, onChange }: Props) {
  function set<K extends keyof Incident>(key: K, val: Incident[K]) {
    onChange({ ...incident, [key]: val })
  }

  function setLocation<K extends keyof Incident['location']>(key: K, val: string[]) {
    onChange({ ...incident, location: { ...incident.location, [key]: val } })
  }

  function updateObject(i: number, obj: KGObject) {
    const objects = [...incident.knowledge_graph.objects]
    objects[i] = obj
    onChange({ ...incident, knowledge_graph: { ...incident.knowledge_graph, objects } })
  }

  function removeObject(i: number) {
    const objects = incident.knowledge_graph.objects.filter((_, idx) => idx !== i)
    onChange({ ...incident, knowledge_graph: { ...incident.knowledge_graph, objects } })
  }

  function updateRelation(i: number, rel: KGRelation) {
    const relations = [...incident.knowledge_graph.relations]
    relations[i] = rel
    onChange({ ...incident, knowledge_graph: { ...incident.knowledge_graph, relations } })
  }

  function removeRelation(i: number) {
    const relations = incident.knowledge_graph.relations.filter((_, idx) => idx !== i)
    onChange({ ...incident, knowledge_graph: { ...incident.knowledge_graph, relations } })
  }

  function addRelation() {
    const newRel: KGRelation = { source_id: '', relationship_type: '', target_id: '', meta: { reasoning: '' } }
    onChange({ ...incident, knowledge_graph: { ...incident.knowledge_graph, relations: [...incident.knowledge_graph.relations, newRel] } })
  }

  return (
    <div className="space-y-4">
      {/* Basic Information */}
      <Section title="Basic Information">
        <Field label="Incident ID">
          <input className="input-base font-mono" value={incident.incident_id} onChange={e => set('incident_id', e.target.value)} />
        </Field>
        <Field label="Title">
          <input className="input-base" value={incident.title} onChange={e => set('title', e.target.value)} />
        </Field>
        <Field label="Summary">
          <textarea className="textarea-base" rows={4} value={incident.summary} onChange={e => set('summary', e.target.value)} />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Author">
            <input className="input-base" value={incident.author} onChange={e => set('author', e.target.value)} />
          </Field>
          <Field label="Organization">
            <input className="input-base" value={incident.organization} onChange={e => set('organization', e.target.value)} />
          </Field>
          <Field label="Publication Date">
            <input className="input-base" value={incident.publication_date} onChange={e => set('publication_date', e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Source File">
            <input className="input-base font-mono" value={incident.source_file} onChange={e => set('source_file', e.target.value)} />
          </Field>
          <Field label="Outlet Count">
            <input className="input-base" type="number" min={0} value={incident.outlet_count} onChange={e => set('outlet_count', parseInt(e.target.value, 10) || 0)} />
          </Field>
        </div>
        <Field label="Tags">
          <TagsEditor tags={incident.tags} onChange={v => set('tags', v)} />
        </Field>
      </Section>

      {/* Location */}
      <Section title="Location">
        <Field label="Origin Countries">
          <CountryListEditor list={incident.location.origin_countries} onChange={v => setLocation('origin_countries', v)} />
        </Field>
        <Field label="Victim Countries">
          <CountryListEditor list={incident.location.victim_countries} onChange={v => setLocation('victim_countries', v)} />
        </Field>
        <Field label="Target Audience Countries">
          <CountryListEditor list={incident.location.target_audience_countries} onChange={v => setLocation('target_audience_countries', v)} />
        </Field>
        <Field label="Countries / Regions">
          <CountryListEditor list={incident.countries_regions} onChange={v => set('countries_regions', v)} />
        </Field>
      </Section>

      {/* Artifacts */}
      <Section title="Artifacts" defaultOpen={false}>
        {incident.artifacts.map((art, i) => (
          <div key={i} className="rounded-lg border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">Artifact #{i + 1}</span>
              <button type="button" onClick={() => {
                const a = incident.artifacts.filter((_, j) => j !== i)
                set('artifacts', a)
              }} className="text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
            </div>
            <Field label="Name">
              <input className="input-base" value={art.name} onChange={e => {
                const a = [...incident.artifacts]; a[i] = { ...a[i], name: e.target.value }; set('artifacts', a)
              }} />
            </Field>
            <Field label="Search URL">
              <input className="input-base font-mono" value={art.search_url} onChange={e => {
                const a = [...incident.artifacts]; a[i] = { ...a[i], search_url: e.target.value }; set('artifacts', a)
              }} />
            </Field>
            <Field label="Archive URL">
              <input className="input-base font-mono" value={art.archive_url} onChange={e => {
                const a = [...incident.artifacts]; a[i] = { ...a[i], archive_url: e.target.value }; set('artifacts', a)
              }} />
            </Field>
          </div>
        ))}
        <button type="button" className="btn-secondary w-full justify-center" onClick={() => set('artifacts', [...incident.artifacts, { name: '', search_url: '', archive_url: '' }])}>
          <Plus className="w-4 h-4" /> Add Artifact
        </button>
      </Section>

      {/* Analysis */}
      <Section title="Analysis" defaultOpen={false}>
        <Field label="EUvsDisinfo Original Summary">
          <textarea className="textarea-base" rows={3} value={incident.summary_euvsdisinfo} onChange={e => set('summary_euvsdisinfo', e.target.value)} />
        </Field>
        <Field label="Fact-Check Response">
          <textarea className="textarea-base" rows={6} value={incident.response} onChange={e => set('response', e.target.value)} />
        </Field>
      </Section>

      {/* Knowledge Graph Objects */}
      <Section title={`Knowledge Graph — Entities (${incident.knowledge_graph.objects.length})`} defaultOpen={false}>
        <div className="space-y-3">
          {incident.knowledge_graph.objects.map((obj, i) => (
            <KGObjectEditor key={i} obj={obj} index={i} onChange={o => updateObject(i, o)} onRemove={() => removeObject(i)} />
          ))}
        </div>
      </Section>

      {/* Relations */}
      <Section title={`Knowledge Graph — Relations (${incident.knowledge_graph.relations.length})`} defaultOpen={false}>
        <div className="space-y-3">
          {incident.knowledge_graph.relations.map((rel, i) => (
            <KGRelationEditor key={i} rel={rel} onChange={r => updateRelation(i, r)} onRemove={() => removeRelation(i)} />
          ))}
        </div>
        <button type="button" className="btn-secondary w-full justify-center mt-2" onClick={addRelation}>
          <Plus className="w-4 h-4" /> Add Relation
        </button>
      </Section>
    </div>
  )
}
