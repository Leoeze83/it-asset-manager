# IT Asset Manager - Implementacion, Operacion y Roadmap

## 1) Estado actual del producto

IT Asset Manager ya cuenta con:

- Inventario de activos con frontend React y backend Express.
- Persistencia en Firestore con reglas de seguridad endurecidas.
- Agente seguro para Windows con registro por bootstrap token y credenciales por activo.
- Telemetria minima (CPU, RAM, disco) sin capacidades de control remoto.
- Hardening de backend (validaciones, rate limiting, body limit, cabeceras defensivas).

## 2) Agente Windows instalable

El instalador PowerShell generado desde la app soporta estos modos:

- Install: registra el equipo y crea tarea programada al arranque.
- Run: ejecuta loop de heartbeat.
- Status: informa estado local (tarea, id de activo, ultimo resultado).
- Uninstall: elimina tarea y estado local.

Archivos y ubicaciones usadas por el agente:

- Estado: C:\ProgramData\AssetFlow\agent-state.json
- Log: C:\ProgramData\AssetFlow\agent.log
- Script instalado: C:\ProgramData\AssetFlow\assetflow-agent.ps1
- Tarea programada: AssetFlowSecureAgent

## 3) Descargas disponibles en la UI

En la vista Agente hay dos opciones:

- Descargar Instalador (.ps1)
- Descargar Paquete MSI

Resolucion de MSI en frontend:

- Primero usa VITE_AGENT_MSI_URL si esta definida.
- Si no existe, usa /downloads/AssetFlow-Agent-Installer.msi.

Si el MSI no esta publicado, la UI muestra mensaje y no rompe el flujo.

## 4) Construccion del MSI (WiX)

Este repositorio incluye blueprint para MSI en:

- packaging/msi/AssetFlow.Agent.wxs
- tools/msi/build-agent-msi.ps1

Prerequisitos:

- Windows
- .NET SDK 8+
- WiX Toolset v4 como dotnet tool:
  - dotnet tool install --global wix

Build local del MSI:

1. Ejecutar en PowerShell:

   powershell
   ./tools/msi/build-agent-msi.ps1 -Version 2.1.0

2. Resultado esperado:

- dist/msi/AssetFlow-Agent-Installer.msi

3. Publicacion:

- Subir el MSI a GitHub Releases.
- O copiarlo en public/downloads/AssetFlow-Agent-Installer.msi para hosting estatico.
- O setear VITE_AGENT_MSI_URL apuntando al artefacto publicado.

## 5) Flujo de release recomendado

1. npm run lint
2. npm run test
3. npm run build
4. build MSI
5. publicar release con:
- binario web (si aplica)
- AssetFlow-Agent-Installer.msi
- checksum SHA256 del MSI

## 6) Analisis competitivo y evolutivo fase 2

Fuente analizada: solucion de inventario de activos empresariales de InvGate.

Capacidades destacadas observadas:

- Inventario operativo desde dia uno.
- Captura por agente y descubrimiento sin agente.
- Integraciones de discovery (Intune, VMware, Azure, Jamf, AWS, etc.).
- Carga manual, CSV/Excel y codigos de barras.
- Automatizacion del ciclo de vida (compra, uso, renovacion, disposal).
- Trazabilidad y auditorias de cambios.
- Estandarizacion de datos con etiquetas, campos y reglas.
- Dashboards y busqueda asistida.
- Enfoque de cumplimiento y gobernanza.

### Gap actual de IT Asset Manager

Hoy el producto cubre inventario base y telemetria segura, pero faltan:

- Discovery sin agente en red.
- Inventario de software y licenciamiento.
- Workflows de ciclo de vida end-to-end.
- Auditoria profunda y cadena de custodia.
- Integraciones cloud/MDM/virtualizacion.
- KPI ejecutivos y analitica avanzada.

### Propuesta Fase 2 (12-16 semanas)

#### Bloque A - Discovery y cobertura de inventario

- Scanner de red sin agente (subredes, SNMP/WMI/WinRM opcional).
- Conector de sincronizacion para Intune y Azure AD.
- Importadores CSV/Excel robustos con validacion y deduplicacion.

#### Bloque B - ITAM avanzado

- Catalogo de software instalado por endpoint.
- Modelo de licencias y compliance basico.
- Contratos, garantias y renovaciones con alertas.

#### Bloque C - Gobernanza y auditoria

- Historial inmutable de cambios por activo.
- Etiquetas inteligentes y reglas de normalizacion.
- Polticas de calidad de datos y score de integridad.

#### Bloque D - Operacion y analitica

- Dashboards por rol (operativo, seguridad, finanzas).
- Vistas de riesgo: activos sin heartbeat, activos no conformes, expiraciones.
- Busqueda semantica sobre activos y eventos.

#### Bloque E - Plataforma

- Cola de eventos para ingesta masiva.
- API publica versionada y webhooks.
- Empaquetado empresarial del agente (MSI firmado + distribucion por GPO/Intune).

### KPIs objetivo para Fase 2

- >= 90% de cobertura de endpoints corporativos.
- <= 24h para alta de activos descubiertos en inventario.
- >= 95% de activos con datos obligatorios completos.
- Reduccion >= 40% del tiempo operativo en conciliacion de inventario.

## 7) Backlog inicial de Fase 2 (epicas)

- EPIC-01 Discovery sin agente.
- EPIC-02 Conectores MDM/Cloud.
- EPIC-03 Software y licencias.
- EPIC-04 Lifecycle automation.
- EPIC-05 Auditoria y compliance.
- EPIC-06 Dashboards y busqueda avanzada.
- EPIC-07 Distribucion empresarial del agente MSI.

## 8) Riesgos y mitigaciones

- Riesgo: complejidad de conectores externos.
  - Mitigacion: priorizar Intune + Azure en primera iteracion.
- Riesgo: calidad de datos heterogenea.
  - Mitigacion: reglas de normalizacion y score de calidad.
- Riesgo: adopcion operativa.
  - Mitigacion: playbooks de rollout, dashboards por rol y quick wins.

## 9) Resumen ejecutivo

El producto ya tiene una base segura y funcional. La Fase 2 debe enfocarse en ampliar cobertura (discovery + integraciones), robustecer gobierno de datos y entregar capacidades ITAM empresariales medibles para competir en el segmento profesional.

## 10) Enfoque SaaS para Fase 2

Para evolucionar a SaaS (Software as a Service), se recomienda que Fase 2 contemple desde el inicio el modelo multi-tenant y operacion gestionada.

### 10.1 Arquitectura SaaS objetivo

- Multi-tenant logico por organizacion (tenantId) en Auth, API y Firestore.
- Aislamiento estricto de datos por tenant en reglas de acceso y consultas.
- Configuracion por tenant para branding, politicas y retencion.
- API versionada para integraciones externas y automatizaciones.

### 10.2 Seguridad y cumplimiento SaaS

- RBAC por tenant (Owner, Admin, Analyst, ReadOnly).
- SSO empresarial (OIDC/SAML en fase posterior).
- Auditoria completa de acciones (quien, cuando, que cambio).
- Cifrado en transito y en reposo, rotacion de secretos y hardening continuo.
- Base para cumplimiento (ISO 27001/SOC2) con controles y evidencias.

### 10.3 Operacion de plataforma

- Onboarding self-service de nuevas organizaciones.
- Telemetria de plataforma (errores, latencia, disponibilidad, costos por tenant).
- Backups y plan de recuperacion con RPO/RTO definidos.
- Entornos separados (dev/staging/prod) y despliegues sin downtime.

### 10.4 Modelo comercial SaaS (propuesta inicial)

- Plan Starter: inventario base, agente, dashboards estandar.
- Plan Growth: discovery sin agente, integraciones clave, auditoria avanzada.
- Plan Enterprise: SSO, API avanzada, soporte premium, reportes ejecutivos.
- Metrica de cobro sugerida: por activo gestionado y/o por endpoint activo mensual.

### 10.5 KPIs SaaS de Fase 2

- Tiempo de onboarding de tenant <= 30 minutos.
- Disponibilidad mensual >= 99.9%.
- Tiempo medio de respuesta API p95 <= 400 ms.
- Retencion de clientes (logo retention) >= 95% trimestral.
- Expansion de cuentas (upsell) >= 20% anual en clientes activos.

## 11) Backlog tecnico ejecutable de Fase 2

Para pasar de roadmap a ejecucion, se genero backlog completo con epicas, historias de usuario, criterios de aceptacion, priorizacion y secuencia de sprints:

- Fase 2/FASE2_BACKLOG_TECNICO.md

Tablero operativo de arranque (Sprint 1):

- Fase 2/FASE2_SPRINT1_TABLERO_OPERATIVO.md
