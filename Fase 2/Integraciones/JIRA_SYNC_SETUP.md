# Integración Jira + Documentación Fase 2

**Propósito**: Sincronizar documentación, backlog y progreso en Jira  
**Fecha**: 23 de marzo de 2026  
**Status**: Propuesta - Por implementar

---

## Option A: Jira Cloud (Recomendado para SaaS)

### Setup Inicial

#### 1. Crear Proyecto en Jira
```
Project Key: IF2 (IT Asset Fase 2)
Name: IT Asset Manager - Fase 2
Type: Scrum Board
Team: [Tech Lead, Developers, QA, DevOps]
```

#### 2. Configurar Campos Personalizados

En **Project Settings → Custom Fields**, crear:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `Documentation Link` | URL | Link a sección en GitHub |
| `Tech Design Approved` | Checkbox | Cambios en arquitectura validados |
| `Security Review` | Dropdown | None / Pending / Approved |
| `Multi-tenant Tested` | Checkbox | Tests de aislamiento pasaron |
| `Documentacion Updated` | Checkbox | README/inline docs actualizados |

#### 3. Importar CSV de Backlog

```bash
# 1. Obtener CSV desde el repo
cat Fase\ 2/Backlog/FASE2_JIRA_IMPORT.csv

# 2. En Jira → Projects → IF2 → Backlog
# → 3 dots → Import
# → Seleccionar "Jira Importer"
# → Subir CSV

# 3. Mapear campos:
#    - Epic Name → Epic Link
#    - Story ID → Custom ID
#    - Acceptance Criteria → Description
```

**Resultado**: Épicas E01-E07, Historias E01-H01 a E07-H04 en Jira

---

## Option B: GitHub Projects (Integración Nativa)

Si usan GitHub (lo recomendable):

### Setup

1. **Crear Project en GitHub**
   ```
   Ir a: Repository → Projects → New Project
   Name: "Fase 2 - Development"
   Template: Table atau Board (Kanban)
   ```

2. **Agregar custom fields**
   - Story Points (number)
   - Epic (text)
   - Documentation Link (text/URL)
   - Security Reviewed (yes/no)

3. **Crear Issues desde Issues tab**

```markdown
---
Project: Fase 2
Assignee: [Developer]
Labels: epic/E01-discovery, sprint/1
---

## T1-01: Multi-tenant Core Refactor

**Epic**: EPIC-07 SaaS Multi-tenant  
**Sprint**: Sprint 1  
**Story Points**: 8  

### Description
Implementar tenantId en modelo, middleware y Firestore rules...

### Acceptance Criteria
- [ ] tenantId agregado a entidades principales
- [ ] Firestore rules validan aislamiento de datos
- [ ] Tests de cross-tenant access fallan (404/403)
- [ ] Documentación ARCHITECTURE.md actualizada

### Documentation
- Guía: [GUIA_DESARROLLO_SPRINT1.md#t1-01](../../01_Sprint1/FASE2_GUIA_DESARROLLO_SPRINT1.md#t1-01-multi-tenant-core---estructura-base)
- Design: [RESUMEN_EJECUTIVO.md#3](../../00_Planning/FASE2_RESUMEN_EJECUTIVO.md#3-visión-arquitectónica-fase-2)
```

---

## Option C: Automatización con GitHub Actions + Docs Bot

La opción RECOMENDADA si quieren sincronizar automáticamente:

### Setup

#### 1. Crear Workflow que actualiza docs

**Archivo**: `.github/workflows/fase2-sync.yml`

```yaml
name: Fase 2 Sync - Auto Update Documentation

on:
  push:
    branches:
      - feat/fase2-*
      - fase2/*
    paths:
      - 'Fase 2/**'
  pull_request_review:
    types: [submitted, dismissed]
  issues:
    types: [opened, edited, closed]

jobs:
  sync-to-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Update Progress File
        run: |
          # Generar automáticamente Fase 2/01_Sprint1/SPRINT1_PROGRESO.md
          # Basado en labels y estado de PRs/Issues
          python3 scripts/update-progress.py
      
      - name: Validar multi-tenant tests
        run: npm test -- tests/integration/multi-tenant/
      
      - name: Commit generated files
        run: |
          git config user.name "Copilot[bot]"
          git config user.email "copilot@github.local"
          git add Fase\ 2/01_Sprint1/SPRINT1_PROGRESO.md
          git commit -m "chore: auto-update Fase 2 progress" || true
          git push
```

#### 2. Script Python para generar progreso

**Archivo**: `scripts/update-progress.py`

```python
#!/usr/bin/env python3
import json
import subprocess
from datetime import datetime

# Obtener issues abiertos con label "sprint/1"
result = subprocess.run(
    ["gh", "issue", "list", "--label", "sprint/1", "--json", "number,title,state,milestone"],
    capture_output=True,
    text=True
)

issues = json.loads(result.stdout)

# Generar markdown con progreso
progress_md = f"""# Sprint 1 - Progreso en Tiempo Real

**Actualizado**: {datetime.now().strftime('%d/%m/%Y %H:%M')}

## Resumen
- **Total Tareas**: {len(issues)}
- **Completadas**: {len([i for i in issues if i['state'] == 'CLOSED'])}
- **En Progreso**: {len([i for i in issues if i['state'] == 'OPEN'])}
- **Completitud**: {len([i for i in issues if i['state'] == 'CLOSED']) * 100 // len(issues)}%

## Tareas por Épica

"""

# Agrupar por épica
epics = {}
for issue in issues:
    # Extraer épica de labels o título
    epic = "EPIC-XX"  # Parsear desde issue.title o labels
    if epic not in epics:
        epics[epic] = []
    epics[epic].append(issue)

# Generar tabla
for epic, items in epics.items():
    progress_md += f"### {epic}\\n"
    for item in items:
        status_emoji = "✅" if item["state"] == "CLOSED" else "🔄"
        progress_md += f"- {status_emoji} #{item['number']}: {item['title']}\\n"

# Guardar
with open("Fase 2/01_Sprint1/SPRINT1_PROGRESO.md", "w") as f:
    f.write(progress_md)

print(f"✅ Actualizado progreso: {len(issues)} tareas")
```

#### 3. Crear Issue Template para Fase 2

**Archivo**: `.github/ISSUE_TEMPLATE/fase2-tarea.md`

```markdown
---
name: 📋 Tarea Fase 2
about: Nueva tarea para Sprint de Fase 2
title: "[T1-XX] Descripción breve"
labels: ["area/backend", "sprint/1"]
assignees: []
---

## Descripción
(Pega descripción de criterios de aceptación desde GUIA_DESARROLLO_SPRINT1.md)

## Épica
E01 / E02 / E03 / E04 / E05 / E06 / E07

## Documentación Relacionada
- Guía: [link a sección en GUIA_DESARROLLO_SPRINT1.md]
- Backlog: [link a historia en FASE2_BACKLOG_TECNICO.md]
- Arquitectura: [link a sección relevante en RESUMEN_EJECUTIVO.md]

## Checklist de Completitud
- [ ] Criterios de aceptación cumplidos
- [ ] Tests unitarios + integración (>= 80%)
- [ ] Code review con 2 aprobaciones
- [ ] Documentación actualizada
- [ ] Sin vulnerabilidades (security check)

## Tareas Bloqueadas Por
(Si depende de otra tarea, links aquí)
```

---

## Option D: Integración Manual (Más Simple)

Si no quieren automatización, simplemente:

### Antes de cada sprint
1. **Crear tablero manual en Jira/GitHub Projects**
2. **Rellenar con tareas de Sprint 1:**
   - T1-01 a T1-05 como Jira Issues
   - Asignar estimaciones (story points)
   - Linker con documentación

### Durante el sprint
- **Daily standup**: actualizar estado en Jira
- **Code review**: marcar "Documentation Link" con PR/commit
- **Friday review**: cerra cerrar tareas completadas

### Después de cada sprint
- **Gen report**: Export de Jira → burndown chart
- **Update docs**: copiar lecciones a `LECCIONES_APRENDIDAS.md`

---

## Monitoreo y Métricas

Configurar dashboard en Jira con:

```
Panel 1: Sprint Metrics
- Burndown Chart (diario)
- Velocity (puntos completados/sprint)
- Completion Rate (%)

Panel 2: Code Quality
- PR Review Time (promedio)
- Code Coverage (%)
- Security Issues Found

Panel 3: Bloqueadores
- Issues marked "Blocker"
- Technical Debt Acumulada
- Risk Register
```

---

## Recomendación Final

### ✅ Opción Recomendada: GitHub Projects + GitHub Actions

**Por qué**:
- Integración nativa con repositorio
- Menos herramientas externas (no pagar Jira)
- Script de auto-actualización de progreso
- Issues directamente en código (linears)
- Historial completo en Git

### Requisitos
1. Cuenta GitHub (si no tienen)
2. Acceso admin al repo
3. GitHub Actions habilitado (es default)
4. Python 3.8+ (para scripts de automation)

### Implementación (Tiempo: 2 horas)

```bash
# 1. Crear proyecto
gh project create "Fase 2 - Development"

# 2. Crear workflow
mkdir -p .github/workflows
cat > .github/workflows/fase2-sync.yml << 'EOF'
[copiar el YAML arriba]
EOF

# 3. Crear issue template
mkdir -p .github/ISSUE_TEMPLATE
cat > .github/ISSUE_TEMPLATE/fase2-tarea.md << 'EOF'
[copiar el template arriba]
EOF

# 4. Create script
mkdir -p scripts
cat > scripts/update-progress.py << 'EOF'
[copiar el script arriba]
EOF

# 5. Commit
git add .github/ scripts/
git commit -m "feat: Setup Fase 2 automation + GitHub Projects"
git push
```

---

## Próximos Pasos

1. **Decidir**: ¿Cuál opción van a usar?
   - A: Jira Cloud (si ya tienen Jira)
   - B: GitHub Projects (recomendado)
   - C: GitHub Actions (máxima automatización)
   - D: Manual (simple, sin deps externas)

2. **Implementar**: 2-4 horas de setup

3. **Validar**: 
   - PRs se crean automáticamente
   - Documentación se actualiza
   - Dashboard muestra progreso correcto

4. **Comunicar**: Compartir link a board con equipo

---

**Status**: 📋 Propuesta lista para decisión  
**Effort**: 2-4 horas setup + 30 min mantenimiento semanal  
**ROI**: Transparencia total, reducción de micro-managemnt
