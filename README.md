# RevisionIncidents

Aplicacion Next.js para revisar incidentes y persistir el flujo de analisis.

## Persistencia de archivos

La aplicacion ahora usa Prisma + PostgreSQL para guardar:
- JSON original subido
- JSON revisado
- Estado del archivo (`PENDING` o `REVIEWED`)

Cuando finalizas la revision de un archivo:
- Se guarda su JSON revisado en base de datos
- El archivo original se marca como `REVIEWED`
- Deja de aparecer en la lista de pendientes

## Ejecutar en local

1. Instalar dependencias:

```bash
npm install
```

2. Aplicar migraciones de base de datos:

```bash
npx prisma migrate dev
```

3. Levantar el entorno de desarrollo:

```bash
npm run dev
```

## Endpoints

- `GET /api/incidents`: lista archivos pendientes para revisar
- `POST /api/incidents`: guarda nuevos archivos subidos en estado pendiente
- `PATCH /api/incidents/:id/review`: guarda JSON revisado y marca el archivo como revisado

## Nota para Vercel

Con Neon o Vercel Postgres, la base de datos si es persistente entre despliegues e instancias serverless.

Pasos minimos:
1. Configurar `DATABASE_URL` en Variables de Entorno de Vercel.
2. Ejecutar migraciones en produccion con `npx prisma migrate deploy`.
3. Redeploy del proyecto.
