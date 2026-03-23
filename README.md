# IT Asset Manager

Inventario IT moderno con telemetria segura, backend endurecido y agente Windows instalable.

## Snapshot

- Frontend: React + Vite + Tailwind.
- Backend: Express + TypeScript.
- Datos: Firebase Auth + Firestore.
- Agente: Windows PowerShell (modo instalador) con opcion de distribucion MSI.

## Que resuelve

- Centraliza activos de IT en una sola vista.
- Automatiza registro y heartbeat de endpoints.
- Mejora trazabilidad de activos en operacion.
- Reduce riesgo de seguridad eliminando control remoto inseguro.

## Seguridad aplicada

- Eliminacion de control remoto por WebSocket y ejecucion arbitraria.
- Registro de agente protegido por token de bootstrap.
- Credenciales por activo con rotacion por reinscripcion.
- Validacion de payloads, limite de body y rate limiting.
- Cabeceras defensivas y control de origen.
- Reglas de Firestore sin hardcodes de email para privilegios.

## Arquitectura

1. Usuario inicia sesion con Firebase Auth.
2. Frontend consume inventario y telemetria desde Firestore.
3. Agente Windows registra activo en backend.
4. Backend emite credenciales por activo.
5. Agente envia heartbeat autenticado (CPU, RAM, disco).

## Inicio rapido

1. Instalar dependencias:

```bash
npm install
```

2. Configurar entorno con base en `.env.example`:

- `APP_URL`
- `PORT`
- `AGENT_BOOTSTRAP_TOKEN`
- `AGENT_HEARTBEAT_INTERVAL_SECONDS`

3. Ejecutar en desarrollo:

```bash
npm run dev
```

4. Abrir:

- http://localhost:3000

## Scripts disponibles

- `npm run dev`: servidor local (Express + Vite middleware).
- `npm run lint`: chequeo TypeScript.
- `npm run test`: pruebas de seguridad backend.
- `npm run build`: build de produccion frontend.
- `npm run build:msi`: genera MSI del agente (requiere WiX).

## Agente Windows

Desde la pestaña Agente Seguro puedes descargar:

- Instalador PowerShell (`.ps1`).
- Paquete MSI (cuando este publicado).

Modos soportados por el instalador:

- `Install`
- `Run`
- `Status`
- `Uninstall`

Persistencia y estado local:

- `C:\ProgramData\AssetFlow\agent-state.json`
- `C:\ProgramData\AssetFlow\agent.log`
- Tarea programada `AssetFlowSecureAgent`

## MSI y distribucion empresarial

Blueprint incluido para empaquetado:

- `packaging/msi/AssetFlow.Agent.wxs`
- `tools/msi/build-agent-msi.ps1`

Publicacion recomendada del MSI:

1. Generar artefacto con `npm run build:msi`.
2. Publicar en GitHub Releases.
3. Configurar `VITE_AGENT_MSI_URL` o servirlo en:
- `/downloads/AssetFlow-Agent-Installer.msi`

## Calidad y validacion

Comandos recomendados antes de cada release:

```bash
npm run lint
npm run test
npm run build
```

## Roadmap fase 2

Objetivo: evolucionar de inventario seguro a plataforma ITAM empresarial.

Capacidades objetivo:

- Discovery sin agente de red.
- Integraciones Intune, Azure, Jamf, VMware, AWS.
- Inventario de software y compliance de licencias.
- Lifecycle automation (compra, renovacion, disposal).
- Auditoria de cambios y gobernanza de datos.
- Dashboards avanzados y busqueda asistida.

Documento de referencia completo:

- `Fase 2/IMPLEMENTACION_Y_ROADMAP.md`

## Preparado para GitHub

Checklist minimo:

1. Variables y secretos fuera del repo.
2. `npm run lint`, `npm run test` y `npm run build` en verde.
3. README actualizado y guia tecnica en `Fase 2/`.
4. MSI publicado como artefacto versionado.
