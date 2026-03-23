# Sprint 1 - Resumen de Tareas

**Rango de Fechas**: 24 de marzo - 3 de abril 2026  
**Duración**: 2 semanas  
**Equipo**: Tech Lead + 2 Full-Stack + 1 QA  
**Status**: Planificado

---

## 📋 Matriz de Tareas (Completa)

| ID | Tarea | Responsable | Estimación | Dependencia | Estado | Documentación |
|----|----|-----|-----------|-----------|--------|---|
| **T1-01** | Refactor Multi-tenant Core | Backend Lead | 8 pts | - | Pendiente | [Guía](../01_Sprint1/FASE2_GUIA_DESARROLLO_SPRINT1.md#t1-01) |
| **T1-02** | RBAC Implementation | Backend Lead | 5 pts | T1-01 | Pendiente | [Guía](../01_Sprint1/FASE2_GUIA_DESARROLLO_SPRINT1.md#t1-02) |
| **T1-03** | Discovery MVP Scanner | Full-Stack 1 | 8 pts | T1-01 | Pendiente | [Guía](../01_Sprint1/FASE2_GUIA_DESARROLLO_SPRINT1.md#t1-03) |
| **T1-04** | Connectors Framework | Backend Lead | 8 pts | - | Pendiente | [Guía](../01_Sprint1/FASE2_GUIA_DESARROLLO_SPRINT1.md#t1-04) |
| **T1-05** | Intune Connector v1 | Full-Stack 2 | 8 pts | T1-04 | Pendiente | [Guía](../01_Sprint1/FASE2_GUIA_DESARROLLO_SPRINT1.md#t1-05) |
| **T1-DOC** | Crear/Actualizar docs | Tech Lead | 5 pts | T1-01 a T1-05 | Pendiente | Paralelo |

**Total Story Points**: 42 pts  
**Velocidad Esperada**: 40-45 pts/semana  
**Riesgo**: Verde (estimación conservadora)

---

## 🎯 Desglose por Semana

### Semana 1 (24-28 de Marzo)

#### Lunes 24/03 - Kickoff
- 09:00-10:00: Presentación de visión (RESUMEN_EJECUTIVO.md)
- 10:00-12:00: Setup local hands-on
- 14:00-15:30: Architecture review
- 15:30-17:00: Planning Sprint 1

**Tareas a iniciar**:
- [x] **T1-01 (Iniciada)**: Multi-tenant model, tipos TypeScript
- [x] **T1-02 (Iniciada)**: RBAC estructura, enum de roles

#### Martes-Viernes (25-28/03) - Desarrollo
- 09:15: Daily standup (15 min)
- 09:30-12:30: Desarrollo individual
- 13:30-14:00: Code review session (miércoles)
- 14:00-17:00: Desarrollo / bug fixes

**Progreso esperado**:
- T1-01: 50% (middleware tenantId, primeras migraciones)
- T1-02: 60% (RBAC permissions, tests básicos)
- T1-03: 10% (setup de librerías)
- T1-04: 0% (espera a T1-01)
- T1-05: 0% (espera a T1-04)

#### Viernes 28/03 - Sprint Review Parcial
- 16:00-17:00: Demo de T1-01 en progreso
- 17:00-17:30: Retrocalización de expectativas vs realidad

---

### Semana 2 (30 Marzo - 3 Abril)

#### Lunes 30/03 - Planning Ajustado
- 09:00-09:30: Retrospectiva parcial de Semana 1
- 09:30-10:00: Ajustar prioridades si es necesario
- 10:00-12:00: Desarrollo continuado

**Tareas en paralelo**:
- [ ] **T1-01 (Finalizando)**: Merge de cambios multi-tenant
- [ ] **T1-02 (Continuando)**: Middleware RBAC en Express
- [ ] **T1-03 (Iniciada)**: Discovery service + rutas API
- [ ] **T1-04 (Iniciada)**: Marco de conectores
- [ ] **T1-05 (Iniciada)**: Intune OAuth setup

#### Martes-Jueves (31/03 - 02/04) - Cierre Sprint
- Focus en terminar T1-01 y T1-02
- Iniciar T1-03, T1-04, T1-05
- Tests de seguridad multi-tenant

**Progreso esperado**:
- T1-01: 100% (DONE)
- T1-02: 100% (DONE)
- T1-03: 50%
- T1-04: 50%
- T1-05: 10%

#### Viernes 3/04 - Sprint 1 Final Review
- 15:00-16:00: Sprint 1 Review (demo de T1-01 + T1-02 completas)
- 16:30-17:30: Retrospective

---

## ✅ Criterios per Completà Tarea (DoD)

### T1-01: Refactor Multi-tenant Core

**Responsable**: Backend Lead  
**Estimación**: 8 story points  
**Duración**: Semana 1 completa

```
Antes de considerar DONE:

✓ Arquitectura:
  - [ ] Tipo TenantId definido con branded string
  - [ ] Entidades Asset, User, Tenant con tenantId
  - [ ] Middleware extractTenantId() funcionando
  - [ ] Request.tenantId disponible en todos los endpoints

✓ Base de Datos:
  - [ ] Firestore rules actualizadas (aislamiento validado)
  - [ ] IndexesCreados si es necesario (multi-field queries)
  - [ ] Script de migración ejecutado (datos existentes)
  - [ ] Backwards compatibility validada

✓ Testing & Validation:
  - [ ] Tests unitarios de tipos y helpers (100% coverage)
  - [ ] Tests de integración: usuario A no ve datos de B (CRÍTICO)
  - [ ] Tests de migración de datos
  - [ ] Linter y TypeScript sin errores

✓ Documentación:
  - [ ] ARCHITECTURE.md creado/actualizado
  - [ ] Ejemplo de query con tenantId
  - [ ] Proceso de migración documentado
  - [ ] Inline comments en código complejo

✓ Seguridad:
  - [ ] No hay tenantId hardcodeado
  - [ ] SQL/NoSQL injection validations
  - [ ] Logs no contienen datan sensible
```

**Branchs**:
```bash
git checkout -b feat/T1-01-multi-tenant origin/feat/fase2-organization

# Commits sugeridos:
# - feat(T1-01): Add TenantId type and helpers
# - feat(T1-01): Implement tenantMiddleware
# - feat(T1-01): Update Firestore rules for multi-tenant
# - feat(T1-01): Add migration script
# - docs(T1-01): Create ARCHITECTURE.md

# PR contra: feat/fase2-organization
# Reviewers: Tech Lead (obligatorio), 1 peer
```

---

### T1-02: RBAC Implementation

**Responsable**: Backend Lead  
**Estimación**: 5 story points  
**Dependencia**: T1-01 (tenantId disponible)

```
✓ Roles y Permisos:
  - [ ] Enum Role: Owner, Admin, Analyst, ReadOnly
  - [ ] Enum Resource: Assets, Settings, Reports, etc.
  - [ ] Enum Action: Create, Read, Update, Delete, Execute
  - [ ] ROLE_PERMISSIONS matrix completa
  - [ ] hasPermission() function

✓ Backend:
  - [ ] checkPermission() middleware en Express
  - [ ] Validación en cada endpoint relevante
  - [ ] Denials logged + métricas
  - [ ] Error handling (403 Forbidden)

✓ Frontend:
  - [ ] Bits de permiso en token/session
  - [ ] UI elements hidden based on permissions
  - [ ] Graceful degradation (no rompe sin JS)

✓ Testing:
  - [ ] Tests: cada rol tiene permisos correctos
  - [ ] Tests: Owner puede todo, ReadOnly solo lee
  - [ ] Tests: permisos por módulo validados
  - [ ] Tests: denials return 403

✓ Documentación:
  - [ ] RBAC.md creado (roles, matriz, ejemplos)
  - [ ] Inline comments en middleware
```

**Branch**:
```bash
git checkout -b feat/T1-02-rbac origin/feat/T1-01-done

# Commits:
# - feat(T1-02): Define Role enum and permissions
# - feat(T1-02): Implement checkPermission middleware
# - feat(T1-02): Add permission tests
# - docs(T1-02): Create RBAC.md

# PR: contra feat/fase2-organization (después de merge T1-01)
```

---

### T1-03: Discovery MVP

**Responsable**: Full-Stack 1  
**Estimación**: 8 story points

```
✓ Backend:
  - [ ] DiscoveryService con método startScan()
  - [ ] Escaneo de rango CIDR (ping)
  - [ ] Deduplicación automática
  - [ ] Almacenamiento de historial de scans
  - [ ] Background execution

✓ API:
  - [ ] POST /discovery/scans (iniciar escaneo)
  - [ ] GET /discovery/scans (listar histórico)
  - [ ] Validación de tenantId en requests

✓ Frontend:
  - [ ] UI para ingresar rango CIDR
  - [ ] Mostrar progreso en tiempo real
  - [ ] Tabla de escaneos anteriores
  - [ ] Link para crear Assets de descubiertos

✓ Testing:
  - [ ] Tests de escaneo en rango /24
  - [ ] Tests de deduplicación
  - [ ] Tests de multi-tenant isolation
  - [ ] Mocking de ping (no depender de red real)

✓ Documentación:
  - [ ] Descripción en README Sprint 1
  - [ ] Ejemplo de uso en Postman/Thunder Client
```

---

### T1-04 & T1-05: Connectors Framework + Intune

**Responsable**: Backend Lead + Full-Stack 2  
**Estimación**: 8 + 8 pts

```
T1-04 - Framework:
✓ Interfaz IConnector
✓ BaseConnector abstracta con retry logic
✓ Factory pattern
✓ Telemetría automática
✓ Queue integration
✓ Tests de framework (mocked)
✓ Documentación: CONNECTORS.md

T1-05 - Intune:
✓ OAuth 2.0 flow funcional
✓ Token storage encriptado
✓ Sync incremental de dispositivos
✓ Mapeo de campos
✓ Tests de OAuth (mocked)
✓ Tests de sync sin errores
```

---

## 🔴 Riesgos Identificados

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|--------|-----------|
| Firestore rules incorrectas | Media | Alto | Tests de aislamiento desde día 1 |
| Intune API access delay | Media | Alto | Mock Intune en tests, proceed con dummy conector |
| Feature flags complexity | Baja | Medio | Backend Lead valida diseño antes |
| Merge conflicts en master | Baja | Bajo | Feature branch + PRs + CI/CD checks |
| Testing coverage insuficiente | Baja | Alto | Requirement: >= 80% coverage |

---

## 🎯 Definition of Done Global (Sprint 1)

**Antes de considerar Sprint 1 completado**:

- [ ] Todas tareas en status DONE (GitHub Projects)
- [ ] Mínimo 80% code coverage (CI/CD reports)
- [ ] 0 vulnerabilidades críticas (security scan)
- [ ] Multi-tenant tests passing (aislamiento validado)
- [ ] Code review: 2 aprobaciones por PR
- [ ] Documentación: ARCHITECTURE.md, CONNECTORS.md, RBAC.md, SECURITY.md updated
- [ ] CONTRIBUTING.md creado con estándares
- [ ] Rama feat/fase2-organization mergeada a master
- [ ] Rama fase2/foundation creada y lista para Sprint 2

---

## 📊 Tracking del Progreso

### Cómo Reportar Estado

**Diariamente** (Daily Standup):
```
- ¿Qué hice ayer?
- ¿Qué hago hoy?
- ¿He tengo bloqueadores?
```

**Por Tarea** (en PR):
```
- Criterios de aceptación: [ ] [ ] [ ]
- Tests: XX% coverage
- Documentation: Ready / In Progress / Not Started
```

**Al Cierre Sprint** (Viernes):
```
- Total story points completados: XX/42
- Velocity: XX pts/semana
- Lecciones: ...
- Retrospective items: ...
```

---

## 🚀 Después de Sprint 1

- Merge de `feat/fase2-organization` a `master`
- Crear rama `fase2/foundation` para desarrollo continuo (Sprint 2+)
- Retrospective + mejoras identificadas
- Planning de Sprint 2 (EPIC-01 H2, EPIC-05 H1, EPIC-04 H1)

---

**Status**: ✅ **Planificado y documentado**  
**Siguiente**: Kickoff del equipo (24/03 09:00)  
**Documentación**: Ver [GUIA_DESARROLLO_SPRINT1.md](../01_Sprint1/FASE2_GUIA_DESARROLLO_SPRINT1.md)
