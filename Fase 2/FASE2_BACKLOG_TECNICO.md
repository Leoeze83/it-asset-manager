# Fase 2 - Backlog Tecnico (Epicas, Historias y Criterios)

## 1. Objetivo de Fase 2

Evolucionar IT Asset Manager desde inventario seguro base hacia una plataforma ITAM empresarial con capacidades SaaS multi-tenant, discovery ampliado, gobierno de datos, compliance y analitica operativa.

## 2. Supuestos de planificacion

- Duracion estimada: 12 a 16 semanas.
- Equipo base: 1 Tech Lead, 2 Full-Stack, 1 QA, 1 DevOps part-time.
- Entregas incrementales cada 2 semanas.

## 3. Definicion de Hecho (DoD)

- Historia con criterios de aceptacion cumplidos.
- Cobertura de pruebas unitarias/integracion para backend y frontend.
- Observabilidad minima: logs estructurados + metricas clave.
- Documentacion de uso y operacion actualizada.
- Sin vulnerabilidades criticas en revision de seguridad.

## 4. Epicas y backlog detallado

## EPIC-01 Discovery sin agente

Valor: aumentar cobertura de inventario sin depender solo de agentes.

Historia E01-H01: Escaneo de red por rango/subred
- Como administrador IT quiero escanear rangos IP para detectar activos potenciales.
- Criterios de aceptacion:
1. Permite configurar rango CIDR y etiqueta de origen.
2. Registra host detectado con estado discovered.
3. Evita duplicados por huella (IP/MAC/hostname).

Historia E01-H02: Identificacion de activos no gestionados
- Como analista quiero listar activos detectados sin agente para priorizar onboarding.
- Criterios de aceptacion:
1. Vista filtrable por criticidad, red y antiguedad de deteccion.
2. Accion one-click para convertir detected en asset gestionado.
3. Exportacion CSV.

Historia E01-H03: Scheduler de discovery
- Como operador quiero programar escaneos periodicos para mantener inventario actualizado.
- Criterios de aceptacion:
1. Configuracion diaria/semanal por tenant.
2. Historial de ejecuciones con duracion, errores y resultados.
3. Alertas cuando una ejecucion falla.

## EPIC-02 Integraciones (Intune, Azure, VMware, AWS, Jamf)

Valor: consolidar activos desde fuentes corporativas existentes.

Historia E02-H01: Conector Intune
- Como administrador quiero sincronizar dispositivos de Intune automaticamente.
- Criterios de aceptacion:
1. OAuth seguro con almacenamiento cifrado de credenciales.
2. Sync incremental por ventana temporal.
3. Mapeo configurable de campos origen-destino.

Historia E02-H02: Conector Azure AD / Entra ID
- Como administrador quiero importar metadatos de equipos y usuarios asociados.
- Criterios de aceptacion:
1. Relacion equipo-usuario en modelo de activos.
2. Deteccion de cambios y reconciliacion.
3. Registro de auditoria por sync.

Historia E02-H03: Framework de conectores
- Como equipo de producto queremos estandarizar conectores para acelerar nuevas fuentes.
- Criterios de aceptacion:
1. Contrato comun de ingest.
2. Reintentos y control de rate limits.
3. Telemetria por conector (exito/error/latencia).

## EPIC-03 Software y licencias

Valor: pasar de inventario de hardware a gestion ITAM completa.

Historia E03-H01: Inventario de software instalado
- Como administrador quiero ver software instalado por endpoint.
- Criterios de aceptacion:
1. Captura version, proveedor y fecha de deteccion.
2. Relacion software-activo con historial.
3. Busqueda por producto/version.

Historia E03-H02: Catalogo de licencias
- Como responsable de compliance quiero controlar asignaciones y vencimientos.
- Criterios de aceptacion:
1. Alta de contrato/licencia con cantidad disponible.
2. Asignacion a activos/usuarios.
3. Alertas por sobreasignacion y expiracion.

Historia E03-H03: Reporte de compliance
- Como auditor quiero reporte de cumplimiento por software critico.
- Criterios de aceptacion:
1. Indicador compliant/non-compliant por tenant.
2. Exportable a CSV/PDF.
3. Evidencias trazables por registro.

## EPIC-04 Lifecycle automation

Valor: gestionar el ciclo completo del activo, desde compra hasta baja.

Historia E04-H01: Estado y transiciones de ciclo de vida
- Como operador quiero mover activos entre estados con reglas.
- Criterios de aceptacion:
1. Estados minimos: requested, purchased, in-stock, assigned, maintenance, retired, disposed.
2. Reglas de transicion configurables.
3. Historial de cambios con usuario y timestamp.

Historia E04-H02: Renovaciones y garantias
- Como responsable de compras quiero alertas previas a vencimientos.
- Criterios de aceptacion:
1. Alertas por email/in-app configurables (30/60/90 dias).
2. Dashboard de proximos vencimientos.
3. Registro de accion tomada.

Historia E04-H03: Flujo de onboarding/offboarding
- Como IT quiero checklist automatizado de asignacion/devolucion.
- Criterios de aceptacion:
1. Plantillas por tipo de activo.
2. Tareas pendientes por responsable.
3. Cierre con evidencia.

## EPIC-05 Auditoria, governance y calidad de datos

Valor: mejorar confiabilidad, control y cumplimiento.

Historia E05-H01: Bitacora inmutable de eventos
- Como auditor quiero trazabilidad completa de cambios.
- Criterios de aceptacion:
1. Registro append-only para eventos criticos.
2. Filtros por activo, usuario, accion y fecha.
3. Exportacion para auditoria externa.

Historia E05-H02: Etiquetas inteligentes y normalizacion
- Como operador quiero reglas que limpien y estandaricen datos automaticamente.
- Criterios de aceptacion:
1. Reglas por regex, diccionario o mapeo.
2. Preview antes de aplicar masivamente.
3. Score de calidad por activo.

Historia E05-H03: Politicas por tenant
- Como owner de tenant quiero definir campos obligatorios y validaciones.
- Criterios de aceptacion:
1. Campos obligatorios configurables.
2. Bloqueo de guardado cuando faltan datos.
3. Reporte de activos no conformes.

## EPIC-06 Dashboards, busqueda y reportes avanzados

Valor: acelerar decisiones operativas y ejecutivas.

Historia E06-H01: Dashboard ejecutivo
- Como manager quiero KPIs de inventario, riesgo y cumplimiento.
- Criterios de aceptacion:
1. KPIs clave: cobertura, activos sin heartbeat, compliance, vencimientos.
2. Filtros por tenant, sede, area y tipo.
3. Export a PDF.

Historia E06-H02: Busqueda avanzada
- Como analista quiero encontrar activos por multiples criterios en segundos.
- Criterios de aceptacion:
1. Filtros compuestos + texto libre.
2. Guardado de vistas favoritas.
3. Tiempo de respuesta p95 <= 400 ms en dataset objetivo.

Historia E06-H03: Reportes programados
- Como responsable quiero enviar reportes periodicos automaticamente.
- Criterios de aceptacion:
1. Programacion diaria/semanal/mensual.
2. Destinatarios por rol.
3. Trazabilidad de envio.

## EPIC-07 SaaS Multi-tenant y plataforma

Valor: habilitar modelo SaaS escalable y monetizable.

Historia E07-H01: Aislamiento multi-tenant
- Como proveedor SaaS necesito separar datos y acceso por tenant.
- Criterios de aceptacion:
1. tenantId obligatorio en entidades principales.
2. Reglas de autorizacion impiden acceso cross-tenant.
3. Pruebas de seguridad de aislamiento automatizadas.

Historia E07-H02: RBAC por tenant
- Como owner quiero administrar permisos por rol en mi organizacion.
- Criterios de aceptacion:
1. Roles base: Owner, Admin, Analyst, ReadOnly.
2. Matriz de permisos por modulo.
3. Auditoria de cambios de rol.

Historia E07-H03: Provisioning de tenant
- Como equipo comercial quiero crear tenant en minutos.
- Criterios de aceptacion:
1. Alta automatica de tenant y usuario owner.
2. Configuracion base (branding, timezone, politicas iniciales).
3. SLA de onboarding <= 30 min.

Historia E07-H04: Base de billing metered
- Como negocio quiero medir consumo para pricing por activo/endpoint.
- Criterios de aceptacion:
1. Contadores por tenant y periodo.
2. Export para facturacion.
3. Alertas de umbral de plan.

## 5. Priorizacion sugerida

Prioridad Alta:
1. EPIC-01 Discovery
2. EPIC-02 Integraciones base (Intune/Azure)
3. EPIC-07 Multi-tenant + RBAC

Prioridad Media:
1. EPIC-03 Software/Licencias
2. EPIC-04 Lifecycle
3. EPIC-05 Governance

Prioridad Media-Alta:
1. EPIC-06 Dashboards avanzados

## 6. Secuencia de entrega recomendada

Sprint 1-2:
1. Fundaciones SaaS: tenantId + RBAC + auditoria base.
2. Discovery MVP por rango IP.

Sprint 3-4:
1. Conector Intune/Azure MVP.
2. Dashboard operativo inicial.

Sprint 5-6:
1. Inventario de software y licencias basicas.
2. Workflows lifecycle iniciales.

Sprint 7-8:
1. Governance de datos y scoring.
2. Reportes avanzados y programados.
3. Hardening final + KPIs de salida.

## 7. KPIs de salida de Fase 2

1. Cobertura de endpoints >= 90%.
2. Tiempo de onboarding de tenant <= 30 min.
3. p95 API <= 400 ms en flujos clave.
4. Activos con datos completos >= 95%.
5. Reduccion de tiempo operativo de inventario >= 40%.

## 8. Riesgos tecnicos y mitigacion

Riesgo: deuda de datos historicos.
- Mitigacion: pipeline de normalizacion y reglas de calidad antes de migraciones masivas.

Riesgo: limites de APIs externas.
- Mitigacion: sincronizacion incremental, colas y politicas de retry/backoff.

Riesgo: complejidad multi-tenant.
- Mitigacion: pruebas de aislamiento desde Sprint 1 y revisiones de seguridad por release.

## 9. Criterios para iniciar Fase 3

1. KPIs de Fase 2 alcanzados por 2 ciclos mensuales consecutivos.
2. NPS tecnico interno > 8/10 en equipos de IT piloto.
3. Error budget dentro de objetivo y sin incidentes criticos abiertos.

## 10. Tablero operativo Sprint 1

Para ejecucion inmediata de Fase 2 (por rol, dependencias y criterios de salida):

- Fase 2/FASE2_SPRINT1_TABLERO_OPERATIVO.md

Importacion Jira (CSV) y guia:

- Fase 2/FASE2_JIRA_IMPORT.csv
- Fase 2/JIRA_IMPORT_GUIDE.md
