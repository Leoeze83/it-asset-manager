# Fase 2 - Inicio Rápido para Desarrollo

**Status**: ✅ Listo para iniciar Sprint 1 (24/03)

Este documento explica cómo empezar a trabajar con el código de Fase 2 ya implementado.

---

## 🚀 Inicio en 5 Minutos

### 1. Clone la rama de desarrollo
```bash
git clone <repo>
cd it-asset-manager
git fetch origin
git checkout feat/fase2-organization
```

### 2. Instale dependencias
```bash
npm install
```

### 3. Verifique que el código está disponible
```bash
# Ver tipos disponibles
ls -la src/types/
ls -la src/auth/
ls -la src/connectors/

# Ejecutar tests
npm test
```

### 4. Abra un archivo
Abra `src/types/tenant.ts` para ver el código de T1-01 (tipos multi-tenant)

---

## 📁 Estructura de Código Implementado

```
src/
├── types/
│   └── tenant.ts              ← T1-01: Tipos y interfaces
├── middleware/
│   └── tenantMiddleware.ts    ← T1-01: Middleware Express
├── auth/
│   ├── rbac.ts                ← T1-02: Matriz de permisos
│   └── rbacMiddleware.ts      ← T1-02: Middleware RBAC
├── services/
│   └── discoveryService.ts    ← T1-03: Utilidades de scan
├── connectors/
│   ├── BaseConnector.ts       ← T1-04: Framework base
│   └── IntuneConnector.ts     ← T1-05: Conector Intune
└── fase2/
    └── index.ts               ← Exports centralizados

tests/unit/
├── tenant.test.ts             ← Tests T1-01
├── rbac.test.ts               ← Tests T1-02
├── discovery.test.ts          ← Tests T1-03
└── connectors.test.ts         ← Tests T1-04

Fase 2/
├── 00_Planning/               ← Documentación estratégica
├── 01_Sprint1/
│   ├── CODIGO_IMPLEMENTADO.md ← Mapeo código ↔ docs
│   └── ...
├── Diagramas/                 ← Visualizaciones Mermaid
└── Integraciones/             ← Setup Jira/GitHub/Automation
```

---

## 💻 Cómo Usar el Código

### Importar tipos y middleware
```typescript
// En src/server.ts o similar
import { 
  createTenantId,
  extractTenantMiddleware,
  checkPermission,
  DummyConnector,
} from './fase2';

// Agregar middleware a Express
app.use(extractTenantMiddleware);

// Proteger ruta con permisos
app.post('/assets', 
  checkPermission('asset:create'),
  (req, res) => {
    // req.tenantId está disponible
  }
);
```

### Crear conector personalizado
```typescript
import { BaseConnector } from './connectors/BaseConnector';

class MyConnector extends BaseConnector {
  async connect() {
    // Conectar a fuente externa
  }
  
  async sync() {
    return {
      connectorId: this.getId(),
      status: 'success',
      itemsSynced: 0,
      itemsFailed: 0,
      duration: 0,
      errors: [],
      lastSync: new Date(),
    };
  }
  
  async getMetrics() {
    return { status: 'connected' };
  }
}
```

---

## ✅ Checklist de Desarrollo

### Antes de mergear feat/fase2-organization a master
- [ ] Ejecutar tests: `npm test`
- [ ] TypeScript no tiene errores: `npm run build`
- [ ] Decidir: ¿Mergear ahora o después del Kickoff?
- [ ] Si mergea: crear rama `fase2/foundation` desde master para desarrollo real

### Durante Sprint 1 (después de merge y Kickoff)
- [ ] Crear rama feat/T1-01-multi-tenant desde fase2/foundation
- [ ] Implementar endpoints Express que usen extractTenantMiddleware
- [ ] Conectar tipos Tenant/Asset con Firestore
- [ ] Agregar tests de integración

### Integración con Firestore
```typescript
import { TenantId, Asset } from './fase2';
import { firestore } from './firebase';

async function getAssetsByTenant(tenantId: TenantId) {
  return firestore.collection('assets')
    .where('tenantId', '==', tenantId)
    .get();
}
```

---

## 🧪 Ejecutar Tests

```bash
# Todos los tests
npm test

# Tests específicos
npm test tenant.test.ts
npm test rbac.test.ts
npm test discovery.test.ts
npm test connectors.test.ts

# Con coverage
npm test -- --coverage
```

### Resultado esperado
```
PASS  tests/unit/tenant.test.ts (3 tests)
PASS  tests/unit/rbac.test.ts (5 tests)
PASS  tests/unit/discovery.test.ts (5 tests)
PASS  tests/unit/connectors.test.ts (5 tests)

Total: 18 tests, all passing ✅
```

---

## 📊 Próximos Pasos por Rol

### Developer (Backend)
1. Leer `Fase 2/01_Sprint1/CODIGO_IMPLEMENTADO.md` (15 min)
2. Explorar código en `src/` (30 min)
3. Ejecutar tests (5 min)
4. Esperar asignación de tarea (T1-XX) en Kickoff

### Tech Lead
1. Revisar `Fase 2/00_Planning/FASE2_RESUMEN_EJECUTIVO.md` (45 min)
2. Validar que tipos en `src/types/tenant.ts` son correctos (15 min)
3. Aprobar estructura de carpetas
4. Escribir first.tsx endpoint que use middleware

### Product Manager
1. Leer `Fase 2/00_Planning/FASE2_START_RAPIDO.md` (5 min)
2. Verificar que tasks en Jira/GitHub Projects reflejan documentación
3. Preparar comunicación de Kickoff

---

## 🔗 Enlaces Clave

| Documento | Duración | Audiencia |
|-----------|----------|-----------|
| [FASE2_START_RAPIDO.md](Fase%202/00_Planning/FASE2_START_RAPIDO.md) | 5 min | Todos |
| [FASE2_RESUMEN_EJECUTIVO.md](Fase%202/00_Planning/FASE2_RESUMEN_EJECUTIVO.md) | 45 min | Tech Lead, PM |
| [CODIGO_IMPLEMENTADO.md](Fase%202/01_Sprint1/CODIGO_IMPLEMENTADO.md) | 15 min | Developers |
| [RESUMEN_TAREAS.md](Fase%202/01_Sprint1/RESUMEN_TAREAS.md) | 30 min | Tech Lead |
| [04_flujo-documentacion.md](Fase%202/Diagramas/04_flujo-documentacion.md) | 10 min | Visual learners |

---

## ⚠️ Decisión Pendiente: Merge Strategy

### Opción A: Mergear AHORA a master
```bash
git checkout master
git merge feat/fase2-organization --no-ff
git push origin master
```
**Ventaja**: Todo en master desde el inicio
**Desventaja**: Menos tiempo para revisar antes

### Opción B: Mergear DESPUÉS del Kickoff (24/03)
```bash
# Después de Kickoff:
git checkout master
git merge feat/fase2-organization
git checkout -b fase2/foundation
# Developers comienzan aquí
```
**Ventaja**: Tiempo para validar y ajustar documentación
**Desventaja**: Coordinación extra entre rama de features

**Recomendación**: Opción B (más seguro para equipo distribuido)

---

## 🤔 FAQ

**P: ¿Debo modificar el código ya implementado?**
R: El código en `src/` es base. Deberías extenderlo, no reemplazarlo. Por ejemplo, extender `BaseConnector` para crear nuevos conectores.

**P: ¿Dónde van los endpoints Express?**
R: Crea `src/routes/assets.ts`, `users.ts`, etc. Usa middleware `extractTenantMiddleware` en todas.

**P: ¿Cómo integro con Firestore?**
R: Ejemplos en `Fase 2/01_Sprint1/CODIGO_IMPLEMENTADO.md#Integración-con-Firestore`

**P: ¿Qué hacer si tests fallan?**
R: Verifica Node version (>=20), ejecuta `npm clean-install`, corre `npm test -- --no-cache`

---

## 📞 Contacto

- **Documentación**: Ver [Fase 2/README.md](Fase%202/README.md)
- **Contexto técnico**: Ver [Fase 2/00_Planning/FASE2_INDICE_DOCUMENTACION.md](Fase%202/00_Planning/FASE2_INDICE_DOCUMENTACION.md)
- **Estado actual**: Ver memoria de sesión en `/memories/session/FASE2_ANALISIS_Y_PLAN.md`

---

**Última actualización**: Session actual
**Status**: 🟢 LISTO PARA KICKOFF (24/03)
**Rama actual**: `feat/fase2-organization`
**Master status**: Intacto ✅
