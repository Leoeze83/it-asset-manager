# IT Asset Manager

Inventario IT moderno con telemetria segura, backend endurecido y agente Windows instalable.

---

## Plataforma en una mirada

| Componente | Stack | Objetivo |
|---|---|---|
| Frontend | React + Vite + Tailwind | Vista unificada de activos y estado operativo |
| Backend | Express + TypeScript | API segura para registro y heartbeat |
| Datos | Firebase Auth + Firestore | Identidad, autorizacion y almacenamiento |
| Agente | PowerShell + MSI (opcional) | Alta automatica y telemetria continua |

---

## Por que este proyecto destaca

- Centraliza activos de IT en una sola vista operativa.
- Automatiza registro de endpoints y heartbeat seguro.
- Mejora la trazabilidad del ciclo de vida de cada activo.
- Endurece seguridad eliminando control remoto inseguro.
- Preparado para escalar a una plataforma ITAM empresarial.

---

## Seguridad aplicada

- Eliminacion de control remoto por WebSocket y ejecucion arbitraria.
- Registro de agente protegido por token de bootstrap.
- Credenciales por activo con rotacion por reinscripcion.
- Validacion de payloads, limite de body y rate limiting.
- Cabeceras defensivas y control de origen.
- Reglas de Firestore sin hardcodes de email para privilegios.

---

## Flujo de arquitectura

1. Usuario inicia sesion con Firebase Auth.
2. Frontend consulta inventario y telemetria desde Firestore.
3. Agente Windows registra el activo en backend.
4. Backend emite credenciales unicas por activo.
5. Agente envia heartbeat autenticado (CPU, RAM, disco).

---

## Inicio rapido

### 1) Instalar dependencias

```bash
npm install
```

### 2) Configurar variables de entorno (basado en .env.example)

- APP_URL
- PORT
- AGENT_BOOTSTRAP_TOKEN
- AGENT_HEARTBEAT_INTERVAL_SECONDS

### 3) Levantar en desarrollo

```bash
npm run dev
```

### 4) Probar

- App local: http://localhost:3000

---

## Scripts disponibles

| Script | Que hace |
|---|---|
| npm run dev | Servidor local (Express + Vite middleware) |
| npm run lint | Chequeo TypeScript |
| npm run test | Pruebas de seguridad backend |
| npm run build | Build de produccion frontend |
| npm run build:msi | Genera MSI del agente (requiere WiX) |

---

## Agente Windows

Desde la seccion Agente Seguro puedes descargar:

- Instalador PowerShell (.ps1)
- Paquete MSI (cuando este publicado)

Modos soportados por el instalador:

- Install
- Run
- Status
- Uninstall

Persistencia y estado local:

- C:\ProgramData\AssetFlow\agent-state.json
- C:\ProgramData\AssetFlow\agent.log
- Tarea programada AssetFlowSecureAgent

---

## MSI y distribucion empresarial

Archivos de empaquetado:

- packaging/msi/AssetFlow.Agent.wxs
- tools/msi/build-agent-msi.ps1

Publicacion recomendada del MSI:

1. Generar artefacto con npm run build:msi.
2. Publicar en GitHub Releases.
3. Configurar VITE_AGENT_MSI_URL o servirlo en /downloads/AssetFlow-Agent-Installer.msi.

---

## Calidad antes de release

```bash
npm run lint
npm run test
npm run build
```

---

## Roadmap Fase 2

Objetivo: evolucionar de inventario seguro a plataforma ITAM empresarial.

Capacidades objetivo:

- Discovery sin agente de red.
- Integraciones Intune, Azure, Jamf, VMware, AWS.
- Inventario de software y compliance de licencias.
- Lifecycle automation (compra, renovacion, disposal).
- Auditoria de cambios y gobernanza de datos.
- Dashboards avanzados y busqueda asistida.

Referencias de Fase 2:

- Fase 2/IMPLEMENTACION_Y_ROADMAP.md
- Fase 2/README.md

---

## Checklist para GitHub

1. Variables y secretos fuera del repositorio.
2. npm run lint, npm run test y npm run build en verde.
3. Documentacion de Fase 2 revisada y ordenada.
4. MSI publicado como artefacto versionado.

---

## Estado del proyecto

Proyecto activo, funcional en entorno local y preparado para evolucionar por sprints en Fase 2.