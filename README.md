# RevisionIncidents

Aplicacion Next.js para revisar incidentes y persistir el flujo de analisis en archivos JSON.

## Persistencia de archivos

La aplicacion construye una base de datos en memoria al arrancar tomando incidentes desde `jsons.zip`.

El estado de revision se persiste en dos archivos JSON:
- `reviewed.json`: incidentes marcados como revisados
- `doubt.json`: incidentes marcados como duda

Cada archivo guarda el `incidentId`, fecha de actualizacion y el payload revisado.

Cuando finalizas la revision de un archivo:
- Se guarda su JSON revisado en `reviewed.json` o `doubt.json`
- Se agrega o actualiza la entrada del `incidentId` correspondiente en el archivo de estado
- El archivo original se marca como `REVIEWED`
- Deja de aparecer en la lista de pendientes
- El agregado se reconstruye combinando base en memoria + estados persistidos

## Ejecutar en local

1. Instalar dependencias:

```bash
npm install
```

2. Levantar el entorno de desarrollo:

```bash
npm run dev
```

## Endpoints

- `GET /api/incidents`: lista incidentes segun estado
- `POST /api/incidents`: guarda nuevos archivos subidos en estado pendiente
- `PATCH /api/incidents/:id/review`: guarda JSON revisado y marca el archivo
- `DELETE /api/incidents/:id`: elimina un incidente del almacenamiento local
- `GET /api/incidents/aggregate`: devuelve el agregado de incidentes
