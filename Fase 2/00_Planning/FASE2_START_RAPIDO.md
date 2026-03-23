# Fase 2 - Quick Start para el Equipo

**Para empezar de inmediato**, lee esto en este orden:

---

## 1️⃣ LEE PRIMERO (15 min)
👉 **[FASE2_RESUMEN_EJECUTIVO.md](FASE2_RESUMEN_EJECUTIVO.md)**

**¿Qué hay?**: Visión de Fase 2, cambio fundamental (single-tenant → SaaS multi-tenant), 5 bloques de entrega, KPIs, riesgos.

**Sección clave**: "4. Sprint 1 - Foundation" (establece qué hay que hacer en primeras 2 semanas)

---

## 2️⃣ PREPÁRATE (4-8 horas)
👉 **[FASE2_CHECKLIST_PREPARACION.md](FASE2_CHECKLIST_PREPARACION.md)**

**Haz todo esto antes del Kickoff (24/03)**:
- [ ] Node v20+, npm v10+, TypeScript instalados
- [ ] Git SSH keys configuradas
- [ ] Firebase Emulator Suite instalado
- [ ] Clonar repo → `git checkout -b fase2/foundation`
- [ ] `npm install` + `npm run dev` (debe funcionar)
- [ ] `.env.local` con variables de entorno

**Checklist de Seguridad**: Revisa sección de hardening antes de escribir código.

---

## 3️⃣ DESARROLLA (Sprint 1)
👉 **[FASE2_GUIA_DESARROLLO_SPRINT1.md](FASE2_GUIA_DESARROLLO_SPRINT1.md)**

**Para cada tarea T1-01 a T1-05**:
- Ve a la sección correspondiente (ej: "T1-01: Multi-tenant Core")
- Copia los templates de código
- Implementa ajustando a tu contexto
- Escribir tests ANTES del código (TDD)
- Hace PR contra `fase2/foundation`

**Ejemplo**:
```bash
git checkout -b feat/T1-01-multi-tenant
# Editar archivos según guía
git add . && git commit -m "T1-01: Add tenantId to model"
git push origin feat/T1-01-multi-tenant
# Abrir PR, pedir code review (2 aprobaciones)
```

---

## 4️⃣ DOCUMENTA (Paralelo)
👉 **[FASE2_GUIA_DESARROLLO_SPRINT1.md - Testing Template](FASE2_GUIA_DESARROLLO_SPRINT1.md#-testing-template)**

Mientras desarrollas, crea:
- `docs/ARCHITECTURE.md` (multi-tenant diagrams)
- `docs/CONNECTORS.md` (framework guide)
- `docs/RBAC.md` (roles + permissions matrix)
- `CONTRIBUTING.md` (estándares de código)

---

## 🚀 Hitos Rápidos

| Fecha | Qué | Responsable |
|-------|-----|-------------|
| **24/03 09:00** | Kickoff Fase 2 | Tech Lead |
| **24-27/03** | T1-01, T1-02, T1-03 en desarrollo | 2 Full-Stack |
| **30-03/04** | T1-04, T1-05 completas | Backend Lead |
| **03/04 15:00** | Sprint 1 Review + Demo | Equipo |
| **03/04 16:30** | Retrospective | Equipo |

---

## 🎯 Crítico para el Éxito

### ✅ Seguridad Multi-Tenant
- Validate `tenantId` EN TODO REQUEST
- Tests automatizados: Usuario Tenant A NO puede ver datos Tenant B
- Firestore rules: `match /assets/{assetId}` valida tenantId

### ✅ RBAC desde el Inicio
- 4 roles: Owner, Admin, Analyst, ReadOnly
- Matriz de permisos documentada
- Tests con permiso denegado debe 403

### ✅ Framework de Connectors
- Interfaz `IConnector` clara
- 2+ conectores usando framework (Intune + 1 ficticio)
- Reintentos y telemetría automáticos

### ✅ Testing (Min 80% coverage)
- Tests unitarios por módulo
- Tests de integración multi-tenant (CRÍTICO)
- Tests de seguridad en CI/CD

---

## 📞 Preguntas Comunes

**P: ¿Cuál es la rama base?**  
R: `fase2/foundation` - todas las PRs van contra ella

**P: ¿Cómo validar que tenantId funciona correctamente?**  
R: Escribe tests en `tests/integration/multi-tenant/` - simula 2 usuarios diferentes

**P: ¿Dónde guardar credenciales de Intune?**  
R: Nunca en código. Usar `.env.local` + Firebase Secrets Manager

**P: ¿Qué si tengo bloqueadores?**  
R: Daily standup a las 09:15, escalación inmediata con Tech Lead

**P: ¿Cuándo empieza Sprint 2?**  
R: 06/04, después del Sprint 1 Review + Retrospective

---

## 🔗 Referencias Rápidas

| Documento | Para Qué |
|-----------|----------|
| [FASE2_RESUMEN_EJECUTIVO.md](FASE2_RESUMEN_EJECUTIVO.md) | Entender la visión |
| [FASE2_GUIA_DESARROLLO_SPRINT1.md](FASE2_GUIA_DESARROLLO_SPRINT1.md) | Código + templates |
| [FASE2_BACKLOG_TECNICO.md](Fase 2/FASE2_BACKLOG_TECNICO.md) | Detalles de épicas |
| [FASE2_INDICE_DOCUMENTACION.md](FASE2_INDICE_DOCUMENTACION.md) | Índice completo |

---

## ✍️ Checklist Pre-Kickoff

- [ ] Lei RESUMEN_EJECUTIVO.md
- [ ] Completé setup técnico (npm, Node, Git, Firebase)
- [ ] Ejecuté `npm run dev` sin errores
- [ ] Entiendo qué es T1-01 a T1-05
- [ ] Tengo preguntas listas para mañana

---

**Kickoff**: Lunes 24 de marzo, 09:00  
**Slack**: #fase2-implementation  
**Estado**: 🟢 LISTO PARA EJECUTAR

👏 ¡A trabajar en Fase 2!
