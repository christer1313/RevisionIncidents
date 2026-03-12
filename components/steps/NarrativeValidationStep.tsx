'use client'

import { Incident } from '@/lib/types'
import { AlertTriangle, CheckCircle2, Circle, ShieldCheck } from 'lucide-react'
import { useMemo, useState } from 'react'

interface Props {
  incident: Incident
  approved: boolean
  onApprove: () => void
  onIncidentChange: (updated: Incident) => void
}

function EditableField({
  label,
  value,
  multiline,
  options,
  placeholder,
  onSave,
}: {
  label: string
  value: string
  multiline?: boolean
  options?: string[]
  placeholder?: string
  onSave: (value: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  function startEdit() {
    setDraft(value)
    setEditing(true)
  }

  function cancelEdit() {
    setDraft(value)
    setEditing(false)
  }

  function saveEdit() {
    onSave(draft.trim())
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="field-box space-y-2">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
        {options ? (
          <select className="input-base bg-white" value={draft} onChange={(e) => setDraft(e.target.value)}>
            {options.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        ) : multiline ? (
          <textarea
            className="textarea-base bg-white"
            rows={3}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={placeholder}
          />
        ) : (
          <input
            className="input-base bg-white"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={placeholder}
          />
        )}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary py-1" onClick={cancelEdit}>Cancelar</button>
          <button type="button" className="btn-primary py-1" onClick={saveEdit}>Guardar</button>
        </div>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={startEdit}
      className="field-box w-full text-left transition hover:border-indigo-300 hover:bg-indigo-50/40"
      title="Click para editar"
    >
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-sm text-slate-800 whitespace-pre-wrap">
        {value || <span className="italic text-slate-400">{placeholder || 'Sin valor'}</span>}
      </p>
      <p className="mt-2 text-xs text-indigo-600 font-semibold">Click para editar</p>
    </button>
  )
}

function ValidateToggle({
  label,
  value,
  validated,
  onValidate,
  onSave,
}: {
  label: string
  value: string
  validated: boolean
  onValidate: () => void
  onSave: (value: string) => void
}) {
  return (
    <div className="field-box space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
        <button type="button" className="validate-btn" onClick={onValidate}>
          {validated ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Circle className="w-3.5 h-3.5" />}
          {validated ? 'Validado' : 'Validar'}
        </button>
      </div>
      <EditableField label={label} value={value} onSave={onSave} placeholder="Completar campo" />
    </div>
  )
}

export default function NarrativeValidationStep({ incident, approved, onApprove, onIncidentChange }: Props) {
  const narrative = useMemo(
    () => incident.knowledge_graph.objects.find((obj) => obj.obj_type === 'Narrative'),
    [incident]
  )

  const [validatedFields, setValidatedFields] = useState<Record<string, boolean>>({})

  if (!narrative) {
    return (
      <div className="card">
        <p className="text-sm text-slate-600">No hay entidad de tipo Narrative en este incidente.</p>
      </div>
    )
  }

  const p = narrative.properties
  const title = p.Name?.value || incident.title
  const description = p.Description?.value || 'Sin descripcion narrativa.'
  const activeSubject = p.Active_Subject?.value || ''
  const activeSentiment = p.Active_Subject_Sentiment?.value || ''
  const action = p.Action?.value || ''
  const passiveSubject = p.Passive_Subject?.value || ''
  const passiveSentiment = p.Passive_Subject_Sentiment?.value || ''
  const objectOfValue = p.Object_of_Value?.value || ''
  const goal = p.Goal?.value || ''
  const emotion = p.Emotion?.value || ''
  const greimas = p.Greimas_Structure?.value || ''

  const total = 7
  const done = Object.values(validatedFields).filter(Boolean).length

  function updateIncidentTitle(value: string) {
    onIncidentChange({ ...incident, title: value })
  }

  function updateNarrativeProperty(propertyName: string, value: string) {
    const objects = incident.knowledge_graph.objects.map((obj) => {
      if (obj.obj_type !== 'Narrative') return obj

      const current = obj.properties[propertyName]
      return {
        ...obj,
        properties: {
          ...obj.properties,
          [propertyName]: {
            value,
            method: current?.method || 'inferred',
            reasoning: current?.reasoning || 'Updated inline during narrative validation.',
          },
        },
      }
    })

    onIncidentChange({
      ...incident,
      knowledge_graph: {
        ...incident.knowledge_graph,
        objects,
      },
    })
  }

  return (
    <div className="space-y-5">
      <section className="pending-block">
        <div className="flex flex-col gap-4 border-b border-rose-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-rose-600">Validacion pendiente</p>
            <div className="mt-1">
              <EditableField
                label="Titulo del incidente"
                value={incident.title}
                onSave={updateIncidentTitle}
                placeholder="Titulo del incidente"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={onApprove}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
          >
            <ShieldCheck className="w-4 h-4" />
            {approved ? 'Marcado como Revisado' : 'Aprobar y Marcar Revisado'}
          </button>
        </div>

        <div className="px-5 py-4">
          <div className="mb-4 flex items-center gap-2 text-slate-600">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <p className="text-sm font-semibold uppercase tracking-wide">Desglose de narrativas a validar (1)</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <EditableField
                  label="Nombre de narrativa"
                  value={title}
                  onSave={(value) => updateNarrativeProperty('Name', value)}
                  placeholder="Nombre de la narrativa"
                />
                <div className="mt-2">
                  <EditableField
                    label="Descripcion"
                    value={description}
                    multiline
                    onSave={(value) => updateNarrativeProperty('Description', value)}
                    placeholder="Descripcion de narrativa"
                  />
                </div>
              </div>
              <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                Progreso {done}/{total}
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <div className="field-box">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Estructura canonica (Greimas)</p>
                  <button
                    type="button"
                    className="validate-btn"
                    onClick={() => setValidatedFields((prev) => ({ ...prev, greimas: !prev.greimas }))}
                  >
                    {validatedFields.greimas ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Circle className="w-3.5 h-3.5" />}
                    {validatedFields.greimas ? 'Validado' : 'Validar'}
                  </button>
                </div>
                <EditableField
                  label="Estructura canonica (Greimas)"
                  value={greimas}
                  multiline
                  onSave={(value) => updateNarrativeProperty('Greimas_Structure', value)}
                  placeholder="Greimas structure"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                <ValidateToggle
                  label="Actor Activo"
                  value={activeSubject}
                  validated={!!validatedFields.active}
                  onValidate={() => setValidatedFields((prev) => ({ ...prev, active: !prev.active }))}
                  onSave={(value) => updateNarrativeProperty('Active_Subject', value)}
                />
                <ValidateToggle
                  label="Accion / Verbo"
                  value={action}
                  validated={!!validatedFields.action}
                  onValidate={() => setValidatedFields((prev) => ({ ...prev, action: !prev.action }))}
                  onSave={(value) => updateNarrativeProperty('Action', value)}
                />
                <ValidateToggle
                  label="Actor Pasivo / Victima"
                  value={passiveSubject}
                  validated={!!validatedFields.passive}
                  onValidate={() => setValidatedFields((prev) => ({ ...prev, passive: !prev.passive }))}
                  onSave={(value) => updateNarrativeProperty('Passive_Subject', value)}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                <ValidateToggle
                  label="Objeto de Valor"
                  value={objectOfValue}
                  validated={!!validatedFields.object}
                  onValidate={() => setValidatedFields((prev) => ({ ...prev, object: !prev.object }))}
                  onSave={(value) => updateNarrativeProperty('Object_of_Value', value)}
                />
                <ValidateToggle
                  label="Objetivo (Goal)"
                  value={goal}
                  validated={!!validatedFields.goal}
                  onValidate={() => setValidatedFields((prev) => ({ ...prev, goal: !prev.goal }))}
                  onSave={(value) => updateNarrativeProperty('Goal', value)}
                />
                <ValidateToggle
                  label="Emocion Buscada"
                  value={emotion}
                  validated={!!validatedFields.emotion}
                  onValidate={() => setValidatedFields((prev) => ({ ...prev, emotion: !prev.emotion }))}
                  onSave={(value) => updateNarrativeProperty('Emotion', value)}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                <EditableField
                  label="Sentimiento Actor Activo"
                  value={activeSentiment}
                  options={['Positive', 'Neutral', 'Negative']}
                  onSave={(value) => updateNarrativeProperty('Active_Subject_Sentiment', value)}
                />
                <EditableField
                  label="Sentimiento Actor Pasivo"
                  value={passiveSentiment}
                  options={['Positive', 'Neutral', 'Negative']}
                  onSave={(value) => updateNarrativeProperty('Passive_Subject_Sentiment', value)}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
