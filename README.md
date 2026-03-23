<p align="center">
	<img src="https://capsule-render.vercel.app/api?type=waving&height=220&color=0:0f172a,50:0ea5e9,100:10b981&text=IT%20Asset%20Manager&fontColor=ffffff&fontAlignY=38&desc=Secure%20ITAM%20Platform%20for%20Modern%20Teams&descAlignY=58&descSize=20" alt="IT Asset Manager banner" />
</p>

<p align="center">
	<img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white">
	<img alt="Vite" src="https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white">
	<img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white">
	<img alt="Firebase" src="https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore-FFCA28?logo=firebase&logoColor=black">
	<img alt="Windows Agent" src="https://img.shields.io/badge/Windows%20Agent-MSI%20Ready-0078D4?logo=windows&logoColor=white">
	<img alt="Security" src="https://img.shields.io/badge/Security-Hardened-16a34a">
</p>

<p align="center">
	<b>Inventario IT empresarial con telemetria segura, despliegue rapido y control operativo real.</b>
</p>

<p align="center">
	<a href="#quickstart"><img alt="Get Started" src="https://img.shields.io/badge/Start-Implementacion%20Rapida-0ea5e9?style=for-the-badge"></a>
	<a href="#descargas-para-equipos-admin"><img alt="Admin Downloads" src="https://img.shields.io/badge/Admin-Descargas%20MSI-0078D4?style=for-the-badge"></a>
	<a href="#calidad-y-salida-a-mercado"><img alt="Release Ready" src="https://img.shields.io/badge/Release-Enterprise%20Ready-16a34a?style=for-the-badge"></a>
</p>

---

## Resumen ejecutivo

IT Asset Manager permite a equipos de TI tener visibilidad, trazabilidad y control sobre endpoints, sin riesgos de control remoto inseguro.

Esta plataforma esta pensada para empresas que necesitan:

- Reducir tiempo de auditorias y levantamiento de inventario.
- Mejorar cumplimiento y gobernanza de activos.
- Escalar operaciones ITAM con una arquitectura lista para integraciones.

---

## Demo de producto

<p align="center">
	<img src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNXd0MXJkbW5qYXQ0ZzhpdWVqaTd4bWZ4MzRrMnhucDFwajBwd2RzYyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/coxQHKASG60HrHtvkt/giphy.gif" alt="IT Asset Manager Demo" width="880" />
</p>

<p align="center">
	<b>Dashboard operativo + inventario + flujo de agente seguro listo para despliegue empresarial.</b>
</p>

---

## Por que compradores eligen esta solucion

| Diferencial | Impacto de negocio |
|---|---|
| Seguridad por diseno | Elimina vectores criticos: sin comandos remotos, sin websocket de control, sin captura de pantalla |
| Telemetria accionable | Estado de CPU, RAM y disco con heartbeat autenticado |
| Operacion enterprise | Agente Windows distribuible por MSI para despliegue centralizado |
| Baja friccion | UI moderna para operaciones diarias de inventario |
| Escalabilidad | Base preparada para Discovery, compliance, lifecycle y conectores cloud |

---

## Comparativa para decision de compra

| Criterio clave | IT Asset Manager | Herramientas basicas de inventario |
|---|---|---|
| Seguridad operativa | Sin ejecucion remota, sin screenshot, sin websocket de control | En muchos casos incluyen superficies de riesgo adicionales |
| Despliegue en Windows | MSI instalador + MSI desinstalador con limpieza total | Instalaciones manuales o sin ciclo limpio de salida |
| Gobernanza | Roles y acceso Admin para operaciones sensibles | Controles limitados o ad-hoc |
| Evolucion ITAM | Roadmap enterprise para discovery, compliance y lifecycle | Escalabilidad reducida |
| Trazabilidad | Registro + heartbeat autenticado por activo | Telemetria parcial o no autenticada |

---

## Vista de producto

| Modulo | Stack | Valor operativo |
|---|---|---|
| Frontend | React + Vite + Tailwind | Vista unificada de inventario, estado y administracion |
| Backend | Express + TypeScript | Endpoints seguros para registro y heartbeat |
| Datos | Firebase Auth + Firestore | Identidad, autorizacion y almacenamiento gestionado |
| Agente | PowerShell + MSI | Registro automatizado y telemetria continua |

---

## Seguridad de nivel empresarial

- Registro protegido con `AGENT_BOOTSTRAP_TOKEN`.
- Credenciales por activo con rotacion por reinstalacion.
- Heartbeat autenticado con `x-agent-id` y `x-agent-key`.
- Validacion de payloads + rate limiting + hardening HTTP.
- Reglas de Firestore sin hardcodes de email para privilegios.
- MSI desinstalador para limpieza total de rastros locales.

---

## Flujo funcional

1. Usuario inicia sesion con Firebase Auth.
2. Frontend consulta inventario y telemetria en Firestore.
3. Agente Windows registra activo contra backend seguro.
4. Backend emite credenciales unicas por dispositivo.
5. Agente envia heartbeat periodico autenticado.

---

## Descargas para equipos Admin

En la seccion Agente Seguro del software (visible para rol Admin) se habilitan estas descargas:

- Instalador PowerShell (`.ps1`)
- MSI de instalacion (`AssetFlow-Agent-Installer.msi`)
- MSI desinstalador (`AssetFlow-Agent-Uninstaller.msi`) con limpieza de tareas y rastros

Limpieza aplicada por desinstalador:

- Elimina tareas programadas del agente (incluye nombres legacy)
- Borra rastros en ProgramData, Program Files, LocalAppData y AppData
- Limpia claves de registro locales de AssetFlow

---

## Quickstart

### 1) Instalar dependencias

```bash
npm install
```

### 2) Configurar entorno (basado en `.env.example`)

- APP_URL
- PORT
- AGENT_BOOTSTRAP_TOKEN
- AGENT_HEARTBEAT_INTERVAL_SECONDS

### 3) Ejecutar en desarrollo

```bash
npm run dev
```

### 4) URL local

- http://localhost:3000

---

## Scripts principales

| Script | Descripcion |
|---|---|
| `npm run dev` | Servidor local (Express + Vite middleware) |
| `npm run lint` | Validacion TypeScript |
| `npm run test` | Pruebas backend |
| `npm run build` | Build frontend produccion |
| `npm run build:msi` | Genera MSI instalador y desinstalador (WiX requerido) |

---

## Distribucion empresarial MSI

Archivos relevantes:

- `packaging/msi/AssetFlow.Agent.wxs`
- `packaging/msi/AssetFlow.Agent.Cleanup.wxs`
- `tools/msi/build-agent-msi.ps1`

Publicacion recomendada:

1. Generar artefactos con `npm run build:msi`.
2. Publicar ambos MSI en GitHub Releases.
3. Definir `VITE_AGENT_MSI_URL` o usar `/downloads/AssetFlow-Agent-Installer.msi`.
4. Definir `VITE_AGENT_UNINSTALL_MSI_URL` o usar `/downloads/AssetFlow-Agent-Uninstaller.msi`.

---

## Roadmap comercial (Fase 2)

Objetivo: evolucionar de inventario seguro a plataforma ITAM completa.

- Discovery sin agente en segmentos de red
- Integraciones: Intune, Azure, Jamf, VMware, AWS
- Inventario de software y compliance de licencias
- Lifecycle automation (compra, renovacion, disposal)
- Auditoria de cambios y gobierno de datos
- Dashboards avanzados y busqueda asistida

Referencias:

- `Fase 2/IMPLEMENTACION_Y_ROADMAP.md`
- `Fase 2/README.md`

---

## Calidad y salida a mercado

```bash
npm run lint
npm run test
npm run build
```

Checklist de release:

1. Secretos fuera del repositorio.
2. Build y pruebas en verde.
3. Documentacion Fase 2 actualizada.
4. MSI instalador y MSI desinstalador publicados y versionados.

---

## Llamado a accion

Si estas evaluando plataforma ITAM para tu organizacion, este proyecto ya puede operar como base productiva y escalar por fases.

<p align="center">
	<a href="./Fase%202/README.md"><img alt="Ver Roadmap" src="https://img.shields.io/badge/Ver-Roadmap%20Fase%202-0f172a?style=for-the-badge"></a>
	<a href="./Fase%202/IMPLEMENTACION_Y_ROADMAP.md"><img alt="Plan de Implementacion" src="https://img.shields.io/badge/Plan-Implementacion%20Enterprise-10b981?style=for-the-badge"></a>
	<a href="./README.md#quickstart"><img alt="Probar Ahora" src="https://img.shields.io/badge/Probar-Ahora-2563eb?style=for-the-badge"></a>
</p>

---

## Estado

Proyecto activo, funcional y orientado a despliegue empresarial por sprints.

---

<p align="center">
	<img src="https://capsule-render.vercel.app/api?type=rect&color=0:0f172a,100:0f172a&height=2&section=header" alt="footer separator" />
</p>

<p align="center">
	<img alt="VaderLoop Signature" src="https://img.shields.io/badge/VaderLoop-Signature-111827?style=for-the-badge&labelColor=0b0f19&color=c7a44c" />
</p>

<p align="center">
	<sub><i>✦ Creado desde 🇦🇷 para el 🌍 con ❤️ por <b>VaderLoop</b> ✦</i></sub>
</p>

<p align="center">
	<img src="https://capsule-render.vercel.app/api?type=rect&color=0:0f172a,100:0f172a&height=2&section=footer" alt="footer separator bottom" />
</p>