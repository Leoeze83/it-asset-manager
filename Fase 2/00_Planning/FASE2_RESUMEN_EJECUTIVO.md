# Fase 2 - Resumen Ejecutivo y Plan de Acción

**Fecha**: 23 de marzo de 2026  
**Estado**: Preparación para inicio de Fase 2  
**Duración estimada**: 12-16 semanas

---

## 1. Síntesis del Proyecto Fase 1

### Logros
✅ Plataforma de inventario de activos IT funcional  
✅ Agente Windows seguro con credenciales por activo  
✅ Telemetría sin capacidades de control remoto  
✅ Backend hardened con rate limiting y validaciones  
✅ Modelo de seguridad de datos en Firestore  

### Stack Tecnológico
- **Frontend**: React 19 + Vite 6 + Tailwind CSS 4
- **Backend**: Express + TypeScript
- **Base Datos**: Firebase (Firestore + Auth)
- **Agente**: PowerShell modular, instalador MSI con WiX

---

## 2. Objetivo Estratégico Fase 2

**Evolucionar de plataforma de inventario base → solución ITAM empresarial SaaS multi-tenant**

### Métricas de Éxito
| Métrica | Meta |
|---------|------|
| Cobertura de inventario | ≥ 90% endpoints corporativos |
| Tiempo para onboarding de descubiertos | ≤ 24h |
| Calidad de datos | ≥ 95% con campos obligatorios |
| Eficiencia operativa | ≥ 40% menos tiempo en conciliación |
| Disponibilidad (SaaS) | ≥ 99.9% mensual |
| Latencia de API | ≤ 400ms p95 |

---

## 3. Visión Arquitectónica Fase 2

### Cambio Fundamental: Single-tenant → Multi-tenant SaaS

```
ANTES (Fase 1)              DESPUÉS (Fase 2)
┌─────────────┐             ┌──────────────────────┐
│ 1 Cliente   │             │ Tenant 1: Empresa A  │
│ 1 BD        │       →     │ Tenant 2: Empresa B  │
│ 1 Instancia │             │ Tenant 3: Empresa C  │
└─────────────┘             └──────────────────────┘
                            ↓
                    Aislamiento estricto:
                    - tenantId obligatorio
                    - RBAC por tenant
                    - Datos separados
                    - Billing individual
```

### Cinco Bloques de Entrega

1. **Bloque A - Discovery sin Agente** (EPIC-01)
   - Scanner de red (CIDR ranges)
   - Identificación automática de activos
   - Scheduler de escaneos periódicos

2. **Bloque B - ITAM Avanzado** (EPIC-03, EPIC-04)
   - Inventario de software instalado
   - Catálogo de licencias y compliance
   - Ciclo de vida: compra, renovación, baja

3. **Bloque C - Gobernanza** (EPIC-05)
   - Auditoría inmutable (append-only logs)
   - Etiquetas inteligentes y normalización
   - Políticas de calidad de datos por tenant

4. **Bloque D - Operación y Analítica** (EPIC-06)
   - Dashboards ejecutivos por rol
   - Búsqueda avanzada multidimensional
   - Reportes programados con exportación

5. **Bloque E - Plataforma SaaS** (EPIC-07) ⭐ CRÍTICO
   - **Multi-tenant con aislamiento de datos**
   - **RBAC: Owner, Admin, Analyst, ReadOnly**
   - **API versionada y webhooks**
   - **Provisioning automático ≤ 30 min**

---

## 4. Sprint 1 - Foundation (Próximas 2 semanas)

### Objetivo
Establecer base técnica multi-tenant y validar concepto de discovery con MVP.

### Historias y Tareas

#### T1-01: Refactor Multi-tenant Core
**Relación**: EPIC-07-H01 (Aislamiento multi-tenant)
- [ ] Agregar `tenantId` a todas entidades (Asset, User, Settings)
- [ ] Actualizar Firestore rules para aislamiento de lectura/escritura
- [ ] Migración backward-compatible de datos existentes
- [ ] Tests de seguridad para prevenir acceso cross-tenant
- **DoD**: Pruebas automatizadas, sin datos huérfanos, logs de migración

#### T1-02: RBAC Implementation
**Relación**: EPIC-07-H02 (RBAC por tenant)
- [ ] Definir 4 roles: Owner, Admin, Analyst, ReadOnly
- [ ] Matriz de permisos por módulo (Assets, Settings, Reports, etc.)
- [ ] Middleware de autorización en backend (Express)
- [ ] Validación en frontend con bits de permiso
- **DoD**: Matriz documentada, tests de permisos, sin permisos huérfanos

#### T1-03: Discovery MVP - Network Scanner
**Relación**: EPIC-01-H01 (Escaneo de red)
- [ ] UI para ingresar rango CIDR + etiqueta de origen
- [ ] Backend: librería para ping/SNMP básico (ej: `node-ping`)
- [ ] Deduplicación automática (IP/MAC/hostname)
- [ ] Estado inicial: "discovered" no asignado
- [ ] Registrar historial de ejecución
- **DoD**: Escaneo funcional en rango /24, sin duplicados, logs de ejecución

#### T1-04: Connectors Framework
**Relación**: EPIC-02-H03 (Framework de conectores)
- [ ] Interfaz común para conectores (Contract TypeScript)
- [ ] Manejo estándar de errores y reintentos (exponential backoff)
- [ ] Queue para ingesta masiva (refactor si es necesario)
- [ ] Telemetría: duración, éxito/error, registros procesados
- **DoD**: Interfaz documentada, 3+ conectores usando framework, tests

#### T1-05: Intune Connector v1
**Relación**: EPIC-02-H01 (Conector Intune)
- [ ] Flujo OAuth 2.0 para Microsoft Graph
- [ ] Almacenamiento cifrado de access/refresh tokens
- [ ] Sync incremental por usuario y dispositivo
- [ ] Mapeo configurable de campos: deviceName → hostname, etc.
- [ ] Manejo de dispositivos retirados
- **DoD**: Sync funcional, tokens renovados, campos mapeados, logs

---

## 5. Plan de Equipo y Metodología

### Composición Recomendada
- **1 Tech Lead** (revisiones, decisiones arquitectónicas)
- **2 Full-Stack** (implementación de historias)
- **1 QA** (testing, seguridad)
- **1 DevOps part-time** (CI/CD, infraestructura)

### Cadencia de Trabajo
- **Daily Standup**: 15 min (problemas, bloqueadores)
- **Code Review**: Mínimo 2 aprobaciones (Tech Lead + 1 peer)
- **Sprint Planning**: Lunes (refinement de 5 días)
- **Sprint Review**: Viernes (demo de completados)
- **Retrospectiva**: Viernes (lecciones, mejoras)

### Definición de Hecho (DoD) - Obligatorio
✓ Criterios de aceptación cumplidos  
✓ Pruebas unitarias/integración (cobertura ≥ 80%)  
✓ Logs estructurados y métricas clave  
✓ Documentación actualizada (README, API docs)  
✓ Sin vulnerabilidades críticas (security review)  
✓ Merge a rama fase2/foundation sin conflictos  

---

## 6. Riesgos y Mitigaciones

| Riesgo | Mitigation |
|--------|-----------|
| Complejidad de conectores externas | Priorizar Intune + Azure en Sprint 1; framework reutilizable |
| Calidad data heterogénea | Reglas de normalización automáticas, score de integridad |
| Data leaks (cross-tenant) | Testing riguroso de autorización, Firestore rules audit |
| Adopción operativa lenta | Playbooks de rollout, quick wins visibles, dashboards claros |
| Deuda técnica acumulada | Code reviews estrictos, refactoring incremental, tests |

---

## 7. Dependencias Externas

1. **APIs Microsoft**
   - Acceso a Microsoft Graph (Intune, Azure AD)
   - Credenciales con permisos de lectura de dispositivos

2. **Infraestructura**
   - Firebase (Firestore, Auth)
   - Posible cola de mensajes (Pub/Sub, RabbitMQ, Redis)
   - Almacenamiento cifrado para credenciales de conectores

3. **Tooling**
   - WiX Toolset v4 para builds de MSI
   - Git workflow (ramas, PRs, CI/CD)

---

## 8. Próximos Pasos Inmediatos

### Semana 1 (23-27 de marzo)

- [ ] **Planning Meeting**: Refinement de Sprint 1 (2h)
- [ ] **Repository Setup** (4h)
  - Crear rama `fase2/foundation`
  - Documentar setup local en README
  - Actualizar `.github/workflows/` para CI
  
- [ ] **Architecture Review** (2h)
  - Validar diseño multi-tenant
  - Consenso en estructura de directorios
  - Documentar patrones de Firestore queries

- [ ] **T1-01: Inicia desarrollo** (4h)
  - Creación de modelo tenantId
  - Primeras migraciones de datos

### Semana 2 (30-3 de abril)

- [ ] **T1-02 + T1-03**: Avance en RBAC y Discovery
- [ ] **T1-04**: Framework de conectores completado
- [ ] **Sprint Review** (demo funcional)
- [ ] **Retrospective** (mejoras identificadas)

---

## 9. Entregables Sprint 1

### Código
- Rama `fase2/foundation` con todos los commits
- PRs con code review completado
- Tests pasando en CI/CD

### Documentación
- Actualizar [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) con diagrama multi-tenant
- Guía de escritura de conectores en [docs/CONNECTORS.md](docs/CONNECTORS.md)
- API docs generada (Swagger/OpenAPI)

### Funcionalidad Validada
✅ Multi-tenant aislado (tests de seguridad)  
✅ RBAC funcionando (4 roles, permisos por módulo)  
✅ Discovery MVP escanea red /24  
✅ Framework de conectores permite 3+ conectores  
✅ Conector Intune sincroniza dispositivos  

---

## 10. Comunicación y Stakeholders

- **Tech Lead**: Decisiones técnicas, code reviews
- **Product Manager** (si existe): Priorización, feedback de mercado
- **DevOps**: Deployment, infraestructura, backups
- **Clientes Piloto**: Feedback de UX, casos de uso
- **Seguridad**: Reviews de multi-tenant, tokens, datos sensibles

---

## 11. Éxito Fase 2

**Al cerrar Fase 2 esperamos**:
- Plataforma SaaS multi-tenant operativa
- ≥ 90% de cobertura de inventario (agente + discovery + integraciones)
- 5+ clientes piloto activos
- Automatización de ciclos de vida reduciendo tiempo operativo ≥ 40%
- Documentación y playbooks para rollout a producción

---

**Validación Recomendada**: Este documento debe ser revisado y aprobado por Tech Lead, PM y DevOps antes de iniciar Sprint 1.
