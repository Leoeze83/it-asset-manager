# Fase 2 - Checklist de Preparación para el Equipo

**Estado**: Listo para ejecución  
**Duración estimada de setup**: 4-8 horas  
**Target**: Lunes 24 de marzo - Kickoff oficial  

---

## 📋 Pre-requisitos Técnicos

### Entorno Local (Cada desarrollador)

- [ ] Node.js v20+ instalado
- [ ] npm v10+ o pnpm 
- [ ] Git con keys SSH configuradas (GitHub)
- [ ] TypeScript v5.8+ (instalado globalmente)
- [ ] IDE (VS Code con extensiones recomendadas)
  - [ ] ESLint
  - [ ] Prettier
  - [ ] Thunder Client / REST Client
  - [ ] Firebase Extensions

- [ ] Firebase Emulator Suite (para desarrollo local)
  ```bash
  npm install -g firebase-tools
  firebase emulators:start
  ```

- [ ] WiX Toolset v4 (solo si va a buildear MSI)
  ```bash
  dotnet tool install --global wix
  ```

### Acceso a Servicios

- [ ] Credenciales Firebase (dev + staging)
- [ ] Acceso a GitHub repo (permisos de push)
- [ ] Acceso a Microsoft Graph API (para Intune/Azure AD testing)
  - [ ] App Registration creada
  - [ ] Credenciales almacenadas en `.env.local` (NO en git)

---

## 🏗️ Setup de Repositorio

### 1. Crear rama base
```bash
# En rama main/master
git checkout main
git pull origin main

# Crear rama fase2
git checkout -b fase2/foundation
git push origin fase2/foundation
```

### 2. Clonar repositorio localmente
```bash
git clone https://github.com/[owner]/it-asset-manager.git
cd it-asset-manager
git checkout -b fase2/foundation origin/fase2/foundation
npm install
```

### 3. Validar setup local
```bash
npm run lint      # Sin errores TypeScript
npm run test      # Tests pasando (si existen)
npm run dev       # Debe iniciar sin errores
# Abrir http://localhost:3000 en navegador
```

### 4. Configurar variables de entorno
- [ ] Copiar `.env.example` a `.env.local` (desarrollo)
- [ ] Copiar `.env.example` a `.env.staging` (staging)
- [ ] Asignar valores a:
  - `FIREBASE_PROJECT_ID`
  - `FIREBASE_API_KEY`
  - `VITE_APP_URL`
  - `AGENT_BOOTSTRAP_TOKEN`
  - `INTUNE_CLIENT_ID` (vacío por ahora)
  - `AZURE_TENANT_ID` (vacío por ahora)

---

## 📐 Preparación Arquitectónica

### Estructura de Directorios Propuesta (Sprint 1)

```
src/
├── modules/
│   ├── auth/              # Auth + tenantId extraction
│   ├── assets/            # Modelos de Assets (refactor)
│   ├── discovery/         # Network scanner + detección
│   ├── connectors/        # Framework + Intune
│   │   ├── types.ts       # Interfaz común
│   │   ├── base.ts        # Clase base abstracta
│   │   ├── intune/
│   │   ├── azure/
│   │   └── factory.ts     # Factory pattern
│   ├── rbac/              # Roles, permissions, middleware
│   └── common/            # Utils, types compartidos
├── services/              # Servicios de negocio
├── api/                   # Rutas Express
├── middleware/            # Express middleware
├── types.ts               # Tipos globales (agregar tenantId)
└── config/                # Configuración centralizada

tests/
├── unit/
│   ├── rbac/
│   ├── connectors/
│   └── discovery/
├── integration/
│   └── multi-tenant/      # Tests críticos de aislamiento
└── e2e/                   # Tests end-to-end

docs/
├── ARCHITECTURE.md        # Agregar sección multi-tenant
├── CONNECTORS.md          # Guía nueva para framework
├── SECURITY.md            # Actualizar con reglas de aislamiento
└── API.md                 # Documentación de endpoints
```

### Ficheros de Documentación a Crear/Actualizar

- [ ] [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
  - Diagrama multi-tenant
  - Flujo de request con tenantId
  - Modelo de bases de datos actualizado

- [ ] [docs/CONNECTORS.md](docs/CONNECTORS.md) - NUEVO
  - Interfaz de connector
  - Ejemplo: implementación mínima
  - Manejo de errores y reintentos
  - Telemetría esperada

- [ ] [docs/RBAC.md](docs/RBAC.md) - NUEVO
  - 4 roles base definidos
  - Matriz de permisos por módulo
  - Ejemplos de rutas autorizadas/denegadas

- [ ] [docs/SECURITY.md](docs/SECURITY.md) - ACTUALIZAR
  - Aislamiento multi-tenant (crítico)
  - Validación de tenantId en cada operación
  - Manejo seguro de tokens de connector

- [ ] [CONTRIBUTING.md](CONTRIBUTING.md) - NUEVO
  - Estándares de código (linting, format)
  - Proceso de PR (checklist)
  - Temas de testing (cobertura ≥ 80%)
  - Seguridad: revisión de datos sensibles

---

## 💻 Cadencia de Meetings

### Semana del 24-27 de marzo (Sprint 1 Semana 1)

| Día | Horario | Actividad | Duración |
|-----|---------|-----------|----------|
| **Lunes 24** | 09:00 | Kickoff Fase 2 (Visión + Timeline) | 1h |
| **Lunes 24** | 10:00 | Project Setup hands-on | 2h |
| **Lunes 24** | 15:00 | Architecture Review (Multi-tenant Design) | 1.5h |
| **Martes-Viernes** | 09:15 | Daily Standup | 15min |
| **Miércoles 26** | 14:00 | Code Review session | 1h |
| **Viernes 28** | 16:00 | Sprint Review (Demos de T1-01 inicio) | 1h |

### Semana del 30 de marzo - 3 de abril (Sprint 1 Semana 2)

| Día | Horario | Actividad | Duración |
|-----|---------|-----------|----------|
| **Martes-Viernes** | 09:15 | Daily Standup | 15min |
| **Viernes 3** | 15:00 | Sprint Review + Demo final | 1.5h |
| **Viernes 3** | 16:30 | Retrospective | 1h |

---

## ✅ Definición de Hecho por Tarea (T1-01 a T1-05)

### T1-01: Refactor Multi-tenant Core

**Criterios de Aceptación**:
- [ ] Tipo `Tenant` definido con tenantId UUID
- [ ] Entidades Asset, User, Settings incluyen `tenantId: string`
- [ ] Firestore rules actualizadas para validar tenantId en CRUD
- [ ] Script de migración ejecutado sin errores
- [ ] Tests unitarios: operación falla si tenantId falta
- [ ] Tests de integración: usuario A no puede ver datos de tenant B
- [ ] Documentación: archivo [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) actualizado

**Definition of Done**:
- ✓ Code review aprobado (2 revisores)
- ✓ Tests pasando (cobertura ≥ 85%)
- ✓ Merge a `fase2/foundation`
- ✓ Documentación en lugar
- ✓ Sin warnings de TypeScript

### T1-02: RBAC Implementation

**Criterios de Aceptación**:
- [ ] Enum de Roles: Owner, Admin, Analyst, ReadOnly
- [ ] Matriz de permisos almacenada (JSON o constante)
- [ ] Middleware `checkPermission(resource, action)` en Express
- [ ] Tests: cada rol tiene permisos correctos
- [ ] Tests: denegación de permisos bloqueado
- [ ] Frontend valida bits de permiso antes de mostrar UI
- [ ] Documentación: [docs/RBAC.md](docs/RBAC.md) completo

**Definition of Done**:
- ✓ Code review aprobado (2 revisores)
- ✓ Tests pasando (cobertura ≥ 85%)
- ✓ Merge a `fase2/foundation`
- ✓ Sin regresiones en funcionalidad existente
- ✓ Logs de autorización denegada visible

### T1-03: Discovery MVP - Network Scanner

**Criterios de Aceptación**:
- [ ] UI: Input de rango CIDR (ej: 192.168.1.0/24) + etiqueta
- [ ] Backend: Ejecuta ping/discovery en rango
- [ ] Deduplicación: no registra IP duplicada si existe
- [ ] Estado de Asset: "discovered" (sin agente)
- [ ] Historial: tabla de ejecuciones con duración y resultados
- [ ] Error handling: timeout si discover toma > 5 min
- [ ] Tests: escaneo en rango /24 sin errores

**Definition of Done**:
- ✓ E2E funcional en entorno staging
- ✓ Tests unitarios + integración (cobertura ≥ 80%)
- ✓ Documentación de uso en UI (tooltips)
- ✓ Logs estructurados de cada escaneo
- ✓ Code review aprobado

### T1-04: Connectors Framework

**Criterios de Aceptación**:
- [ ] Interfaz `IConnector` definida (connect, sync, disconnect, getMetrics)
- [ ] Clase abstracta `BaseConnector` implementada
- [ ] Manejo de errores: retry con exponential backoff
- [ ] Queue para ingesta masiva (refactor si es necesario)
- [ ] Telemetría: duración, registros procesados, errores
- [ ] Factory pattern para instanciar conectores
- [ ] Documentación: [docs/CONNECTORS.md](docs/CONNECTORS.md) con ejemplo

**Definition of Done**:
- ✓ 2+ conectores (Intune + 1 ficticio) usando framework
- ✓ Tests de retry y error handling
- ✓ Documentación clara para nuevo conector
- ✓ Code review aprobado
- ✓ Métricas visibles en logs

### T1-05: Intune Connector v1

**Criterios de Aceptación**:
- [ ] OAuth 2.0 flow implementado (Microsoft Graph)
- [ ] Access token + refresh token almacenados cifrados
- [ ] Sync incremental por usuario y dispositivo
- [ ] Mapeo configurable de campos (deviceName → hostname, etc.)
- [ ] Manejo de dispositivos retirados (marcado como inactive)
- [ ] Tests: sync importa dispositivos sin duplicados
- [ ] Telemetría: registros de éxito/error por sync

**Definition of Done**:
- ✓ Conector sincroniza con tenant Intune de test
- ✓ Tests de OAuth flow (mocked)
- ✓ Tests de sync incremental
- ✓ Documentación: credenciales esperadas + setup
- ✓ Code review aprobado (especialista en OAuth)
- ✓ Without hardcoded tokens/secrets

---

## 🔐 Checklist de Seguridad

- [ ] No hardcoden credenciales en código (usar `.env`)
- [ ] Tokens de connectors encriptados en BD
- [ ] Firestore rules actualizadas (no se permiten reads cross-tenant)
- [ ] CORS configurado para VITE_APP_URL solo
- [ ] Rate limiting activo en endpoints de sincronización
- [ ] SQL injection / NoSQL injection: validación de inputs
- [ ] XSS: sanitización de datos mostrados en UI
- [ ] Logs no contienen data sensible (passwords, tokens)
- [ ] Tests de seguridad de multi-tenant en CI/CD (automatizados)

---

## 🚀 Preparación para Deploy

- [ ] Rama `fase2/foundation` protegida (require PR reviews)
- [ ] CI/CD pipeline configurado para `fase2/foundation`
  - [ ] Lint + TypeScript check
  - [ ] Tests unitarios + integración
  - [ ] Security checks (SAST si está disponible)
  - [ ] Build exitoso

- [ ] Firebase Firestore rules revisadas por seguridad
- [ ] Variables de entorno en `.env.staging` listas
- [ ] Plan de rollback si algo falla

---

## 📞 Contactos y Escalación

| Rol | Contacto | Disponibilidad |
|-----|----------|----------------|
| Tech Lead | [Nombre] | Lunes-Viernes 9:00-18:00 |
| Frontend Lead | [Nombre] | Lunes-Viernes 9:00-18:00 |
| Backend Lead | [Nombre] | Lunes-Viernes 9:00-18:00 |
| QA Lead | [Nombre] | Lunes-Viernes 9:00-18:00 |
| DevOps | [Nombre] | Lunes-Viernes (part-time) |

**Escalación**: Si hay bloqueador crítico → contactar a Tech Lead en el momento

---

## 📅 Próximos Hitos

| Hito | Fecha | Entregable |
|------|-------|-----------|
| Kickoff Fase 2 | 24/03 | Visión alineada, repo setup listo |
| Sprint 1 Review | 03/04 | T1-01 a T1-05 completadas, código en fase2/foundation |
| Sprint 2 Planning | 06/04 | Backlog refinado, sprint 2 definido |
| MVP Multi-tenant | 17/04 | Plataforma SaaS funcional básica |
| Discovery MVP | 24/04 | Scanner de red + integración Intune operativa |

---

**Última actualización**: 23 de marzo de 2026  
**Jira**: Importar FASE2_JIRA_IMPORT.csv para seguimiento de epics/historias  
**Slack**: Canal #fase2-implementation para coordinación diaria
