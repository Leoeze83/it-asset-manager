# Opciones de Automatización para Fase 2

**Propósito**: Mantener sincronización automática entre documentación, Jira y progreso  
**Fecha**: 23 de marzo de 2026  
**Complejidad**: Baja a Alta (escalable)

---

## 1. Webhooks GitHub → Slack/Discord

Notificaciones automáticas en tiempo real cuando:
- Se crea un PR en rama `feat/fase2-*` o `fase2/*`
- Se hacer review en PR
- Se cierra issue de Fase 2
- Tests fallan en CI/CD

### Setup (30 minutos)

#### Opción 1: GitHub Native

1. **Settings → Webhooks → Add webhook**
   - Payload URL: `https://hooks.slack.com/services/XXXXX` (obtenido de Slack)
   - Events: `pull_requests`, `issues`, `push`
   - Active: ✅

2. **En Slack**
   - App directory → GitHub → Install
   - `/github subscribe itassetmanager` (tu repo)

#### Opción 2: IFTTT (No requiere código)

1. Ir a `ifttt.com`
2. Create → If GitHub PR created → Then Slack/Email notification
3. Configurar triggers por rama/label

### Notificaciones Recomendadas

```
🟠 Tarea iniciada: "T1-01 assigned to @developer"
🟡 PR abierto: "T1-01 ready for review (tests passing)"
🟢 PR merged: "T1-01 completed - 8 story points"
❌ Tests fallen: "T1-01 tests failed - multi-tenant security check"
⭐ Code reviewed: "T1-01 approved by @tech-lead"
```

---

## 2. Script Python para Actualizar Progreso

Corre automáticamente después de cada push → genera `SPRINT1_PROGRESO.md`

### Instalación

```bash
# 1. Crear .github/workflows/update-progress.yml
# (Ver JIRA_SYNC_SETUP.md para template)

# 2. Crear scripts/update_progress.py
cat > scripts/update_progress.py << 'EOF'
#!/usr/bin/env python3

import subprocess
import json
import os
from datetime import datetime
from pathlib import Path

def get_issues():
    """Obtener issues de GitHub con etiqueta sprint/1"""
    result = subprocess.run([
        "gh", "issue", "list",
        "--label", "sprint/1",
        "--json", "number,title,state,assignees,labels",
        "--state", "all"
    ], capture_output=True, text=True)
    
    return json.loads(result.stdout) if result.stdout else []

def get_prs():
    """Obtener PRs en rama feat/fase2-*"""
    result = subprocess.run([
        "gh", "pr", "list",
        "--search", "head:feat/fase2",
        "--json", "number,title,state,reviewDecision,mergeable",
        "--state", "all"
    ], capture_output=True, text=True)
    
    return json.loads(result.stdout) if result.stdout else []

def generate_progress_md(issues, prs):
    """Generar markdown con progreso"""
    
    completed = len([i for i in issues if i["state"] == "CLOSED"])
    total = len(issues)
    completion = (completed * 100 // total) if total > 0 else 0
    
    md = f"""# Sprint 1 - Progreso en Tiempo Real

**Actualizado**: {datetime.now().strftime('%d %b %Y - %H:%M UTC')}

## 📊 Resumen General

| Métrica | Valor |
|---------|-------|
| **Tareas Totales** | {total} |
| **Completadas** | {completed} ✅ |
| **En Progreso** | {len([i for i in issues if i['state'] == 'OPEN'])} 🔄 |
| **Completitud Sprint** | {completion}% |
| **PRs Abiertas** | {len([p for p in prs if p['state'] == 'OPEN'])} |
| **PRs Merged** | {len([p for p in prs if p['state'] == 'MERGED'])} |

## 🎯 Progreso por Épica

"""
    
    # Agrupar por épica (inferir de labels)
    epics = {}
    for issue in issues:
        epic_label = [l for l in issue.get("labels", []) if l.startswith("epic/")]
        epic = epic_label[0].replace("epic/", "") if epic_label else "UNASSIGNED"
        
        if epic not in epics:
            epics[epic] = {"open": [], "closed": []}
        
        if issue["state"] == "CLOSED":
            epics[epic]["closed"].append(issue)
        else:
            epics[epic]["open"].append(issue)
    
    for epic in sorted(epics.keys()):
        items = epics[epic]
        total_epic = len(items["open"]) + len(items["closed"])
        closed_epic = len(items["closed"])
        pct = (closed_epic * 100 // total_epic) if total_epic > 0 else 0
        
        md += f"### {epic}\n"
        md += f"**Progreso**: {closed_epic}/{total_epic} ({pct}%) \n\n"
        
        if items["closed"]:
            md += "#### ✅ Completadas\n"
            for issue in items["closed"]:
                md += f"- [#{issue['number']}](https://github.com/...#issues/{issue['number']}): {issue['title']}\n"
        
        if items["open"]:
            md += "\n#### 🔄 En Progreso\n"
            for issue in items["open"]:
                assignee = issue["assignees"][0]["login"] if issue["assignees"] else "Sin asignar"
                md += f"- [#{issue['number']}](https://github.com/...#issues/{issue['number']}): {issue['title']} (@{assignee})\n"
        
        md += "\n"
    
    # Agregar PRs
    md += "## 🔀 Pull Requests\n\n"
    
    merged_prs = [p for p in prs if p["state"] == "MERGED"]
    if merged_prs:
        md += "### ✅ Merged\n"
        for pr in merged_prs:
            md += f"- [#{pr['number']}](https://github.com/...#pulls/{pr['number']}): {pr['title']}\n"
    
    open_prs = [p for p in prs if p["state"] == "OPEN"]
    if open_prs:
        md += "\n### 📤 Abiertos (Esperando Review)\n"
        for pr in open_prs:
            review_status = "👁 Pending Review" if pr.get("reviewDecision") == "PENDING" else "✓ Approved"
            md += f"- [#{pr['number']}](https://github.com/...#pulls/{pr['number']}): {pr['title']} ({review_status})\n"
    
    # Agregar timestamp
    md += f"\n---\n**Generado automáticamente** por Copilot • [Ver documentación](../00_Planning/FASE2_START_RAPIDO.md)"
    
    return md

if __name__ == "__main__":
    issues = get_issues()
    prs = get_prs()
    
    progress_md = generate_progress_md(issues, prs)
    
    # Guardar
    output_path = Path("Fase 2/01_Sprint1/SPRINT1_PROGRESO.md")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(progress_md)
    
    print(f"✅ Actualizado progreso: {len(issues)} tareas, {len(prs)} PRs")
EOF

# 3. Hacer ejecutable
chmod +x scripts/update_progress.py

# 4. Testear
python3 scripts/update_progress.py
```

### Configuración en GitHub Action

```yaml
# .github/workflows/update-progress.yml
name: Auto-update Sprint 1 Progress

on:
  push:
    branches: [feat/fase2-*, fase2/*]
  pull_request:
    branches: [feat/fase2-*, fase2/*]
  schedule:
    # Cada hora durante horas de trabajo (9-18 UTC)
    - cron: '0 9-18 * * 1-5'

jobs:
  update-progress:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      issues: read
      pull-requests: read
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install GitHub CLI
        run: curl -fsSLo - https://cli.github.com/packages/githubcli/key.gpg | sudo gpg --dearmor -o /usr/share/keyrings/githubcli-archive-keyring.gpg && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null && sudo apt update && sudo apt install gh
      
      - name: Generate Progress
        run: python3 scripts/update_progress.py
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Commit changes
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "actions@github.com"
          git add Fase\ 2/01_Sprint1/SPRINT1_PROGRESO.md || true
          git commit -m "chore(fase2): auto-update sprint progress" || true
          git push
```

---

## 3. Auto-Tagging de PRs

Etiquetar automáticamente PRs según archivos modificados:

```yaml
# .github/workflows/label-prs.yml
name: Auto-label PRs

on: [pull_request]

jobs:
  label:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
    steps:
      - uses: actions/labeler@v4
        with:
          configuration-path: .github/labeler.yml
```

**Archivo**: `.github/labeler.yml`

```yaml
# Etiquetar según archivos modificados
area/backend:
  - src/**/*.ts
  - tests/**/*.ts

area/frontend:
  - src/**/*.tsx
  - src/**/*.css

area/infra:
  - docker/**
  - .github/**

sprint/1:
  - Fase 2/01_Sprint1/**

docs:
  - Fase 2/**/*.md
  - docs/**

security:
  - firestore.rules
  - src/middleware/**
  - src/rbac/**
```

---

## 4. Validación Automática en PRs

Checklist automático que debe cumplirse antes de merge:

```yaml
# .github/workflows/pr-checks.yml
name: PR Validation

on: [pull_request]

jobs:
  checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      # Control de acceso
      - name: Block PRs without documentation
        if: ${{ !contains(github.event.pull_request.body, 'Documentation Link:') }}
        run: exit 1
      
      # Tests
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      
      # Seguridad
      - name: Sonarqube Scan
        uses: sonarsource/sonarcloud-github-action@master
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
      
      # Requerimientos de Fase 2
      - name: Check multi-tenant tests
        run: npm test -- tests/integration/multi-tenant/
      
      - name: Build acceptance
        run: npm run build
```

---

## 5. Reportes Semanales Automáticos

Generar y enviar resumen cada viernes:

```python
# scripts/weekly_report.py
import subprocess
from datetime import datetime, timedelta
import json

def generate_weekly_report():
    """Generar reporte semanal de Fase 2"""
    
    # Issues cerradas esta semana
    last_week = (datetime.now() - timedelta(days=7)).isoformat()
    result = subprocess.run([
        "gh", "issue", "list",
        "--label", "sprint/1",
        "--search", f"closed:{last_week}",
        "--json", "number,title,closedAt"
    ], capture_output=True, text=True)
    
    closed_issues = json.loads(result.stdout) if result.stdout else []
    
    # Compilar reporte
    report = f"""
# Fase 2 - Reporte Semanal

**Semana del {(datetime.now() - timedelta(days=7)).strftime('%d/%m')} al {datetime.now().strftime('%d/%m/%Y')}**

## Metrics
- Issues completadas: {len(closed_issues)}
- Story points (aprox): {len(closed_issues) * 8}  # asumir 8 points cada una
- Velocidad: {len(closed_issues) * 8} points/semana

## Issues Completadas
{chr(10).join([f'- #{i["number"]}: {i["title"]}' for i in closed_issues])}

## Próximos Pasos
- Revisar avance en Daily Stand-ups
- Validar cambios de arquitectura
- Actualizar timeline si hay bloqueadores
"""
    
    return report

# Enviar a Slack/Email
```

---

## 6. Resumen Comparativo

| Opción | Setup | Automatización | Costo | Recomendación |
|--------|-------|----------------|-------|---|
| GitHub Projects Manual | 30 min | 0% | Gratis | Para equipos pequeños |
| Webhooks Slack | 1 h | 50% | Gratis | Notificaciones en tiempo real |
| GitHub Actions + Scripts | 2-3 h | 80% | Gratis | Muy recomendado |
| Jira Cloud Full | 4 h | 100% | $10-25/user | Para empresas grandes |
| IFTTT Custom | 1.5 h | 60% | Freemium | Para no-code |

---

## 🎯 Recomendación Final

**Hacer primero (1-2 horas)**:
1. Setup GitHub Webhooks → Slack (notificaciones)
2. Crear GitHub Project básico

**Hacer después (2-3 horas, opcional pero muy valioso)**:
3. Configurar GitHub Actions para generar progreso
4. Crear script Python de actualización automática

**No es necesario**:
- Jira (a menos que ya lo usen)
- IFTTT (si tienen GitHub Actions)

---

**Status**: 📋 Opciones detalladas, listas para implementar  
**Tiempo Total**: 3-5 horas de setup + automatización perpetua  
**ROI**: Transparencia total, actualización en tiempo real, sin intervención manual
