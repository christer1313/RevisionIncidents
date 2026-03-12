'use client'

import { Incident } from '@/lib/types'
import { AlertTriangle, CheckCircle2, Circle, ShieldCheck } from 'lucide-react'
import { useMemo, useState } from 'react'

interface Props {
  incident: Incident
  approved: boolean
  onApprove: () => void
}

function ValidateToggle({
  label,
  value,
  validated,
  onValidate,
}: {
  label: string
  value: string
  validated: boolean
  onValidate: () => void
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
      <input className="input-base bg-white" value={value} readOnly />
    </div>
  )
}

export default function NarrativeValidationStep({ incident, approved, onApprove }: Props) {
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

  return (
    <div className="space-y-5">
      <section className="pending-block">
        <div className="flex flex-col gap-4 border-b border-rose-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-rose-600">Validacion pendiente</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-900">{incident.title}</h2>
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
                <h3 className="text-2xl font-semibold text-slate-900">{title}</h3>
                <p className="mt-1 text-sm text-slate-600">{description}</p>
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
                <textarea className="textarea-base bg-white" value={greimas} rows={3} readOnly />
              </div>

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                <ValidateToggle
                  label="Actor Activo"
                  value={activeSubject}
                  validated={!!validatedFields.active}
                  onValidate={() => setValidatedFields((prev) => ({ ...prev, active: !prev.active }))}
                />
                <ValidateToggle
                  label="Accion / Verbo"
                  value={action}
                  validated={!!validatedFields.action}
                  onValidate={() => setValidatedFields((prev) => ({ ...prev, action: !prev.action }))}
                />
                <ValidateToggle
                  label="Actor Pasivo / Victima"
                  value={passiveSubject}
                  validated={!!validatedFields.passive}
                  onValidate={() => setValidatedFields((prev) => ({ ...prev, passive: !prev.passive }))}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                <ValidateToggle
                  label="Objeto de Valor"
                  value={objectOfValue}
                  validated={!!validatedFields.object}
                  onValidate={() => setValidatedFields((prev) => ({ ...prev, object: !prev.object }))}
                />
                <ValidateToggle
                  label="Objetivo (Goal)"
                  value={goal}
                  validated={!!validatedFields.goal}
                  onValidate={() => setValidatedFields((prev) => ({ ...prev, goal: !prev.goal }))}
                />
                <ValidateToggle
                  label="Emocion Buscada"
                  value={emotion}
                  validated={!!validatedFields.emotion}
                  onValidate={() => setValidatedFields((prev) => ({ ...prev, emotion: !prev.emotion }))}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                <div className="field-box">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Sentimiento Actor Activo</p>
                  <input className="input-base mt-2 bg-white" readOnly value={activeSentiment} />
                </div>
                <div className="field-box">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Sentimiento Actor Pasivo</p>
                  <input className="input-base mt-2 bg-white" readOnly value={passiveSentiment} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
