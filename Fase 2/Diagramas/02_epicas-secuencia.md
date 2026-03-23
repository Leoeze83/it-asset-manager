# Diagrama 02: Épicas Fase 2 - Secuencia e Impacto

**Propósito**: Mostrar dependencias y orden de implementación de épicas  
**Formato**: Mermaid Graph

---

## 📊 Mermaid Source

```mermaid
graph TB
    subgraph "ÉPICAS FASE 2 - Secuencia y Dependencias"
        E7["EPIC-07: SaaS Multi-tenant<br/>🔴 CRÍTICA + PARALELA<br/>T1-01: tenantId Model<br/>T1-02: RBAC"]
        E1["EPIC-01: Discovery sin Agente<br/>🟠 Sprint 1+2<br/>T1-03: Network Scanner<br/>E01-H02: Assets no gestionados<br/>E01-H03: Scheduler"]
        E2["EPIC-02: Integraciones<br/>🟠 Sprint 1+3<br/>T1-04: Framework<br/>T1-05: Intune v1<br/>E02-H02: Azure AD"]
        E3["EPIC-03: Software y Licencias<br/>🟡 Sprint 3+4<br/>E03-H01: Inventario SW<br/>E03-H02: Catálogo Licencias<br/>E03-H03: Reporte Compliance"]
        E4["EPIC-04: Lifecycle Automation<br/>🟡 Sprint 2+3<br/>E04-H01: Estados Ciclo Vida<br/>E04-H02: Renovaciones/Garantías<br/>E04-H03: Onboarding/Offboarding"]
        E5["EPIC-05: Auditoría y Governance<br/>🟡 Sprint 2+3<br/>E05-H01: Bitácora Inmutable<br/>E05-H02: Etiquetas Inteligentes<br/>E05-H03: Políticas por Tenant"]
        E6["EPIC-06: Dashboards y Análisis<br/>🟢 Sprint 3+4<br/>E06-H01: Dashboard Ejecutivo<br/>E06-H02: Búsqueda Avanzada<br/>E06-H03: Reportes Programados"]
    end
    
    E7 -->|Requiere| E1
    E7 -->|Requiere| E2
    E1 -->|Consume| E2
    E2 -->|Amplía| E1
    E5 -->|Complementa| E1
    E5 -->|Complementa| E2
    E4 -->|Depende de| E7
    E3 -->|Depende de| E7
    E6 -->|Usa| E1
    E6 -->|Usa| E3
    E6 -->|Usa| E4
    E6 -->|Usa| E5
    
    style E7 fill:#FF6B6B,stroke:#C92A2A,color:#fff
    style E1 fill:#FFA500,stroke:#E67E22,color:#fff
    style E2 fill:#FFA500,stroke:#E67E22,color:#fff
    style E3 fill:#FFD700,stroke:#DAA520,color:#000
    style E4 fill:#FFD700,stroke:#DAA520,color:#000
    style E5 fill:#FFD700,stroke:#DAA520,color:#000
    style E6 fill:#90EE90,stroke:#228B22,color:#000
```

---

## 📝 Leyenda

| Color | Prioridad | Sprint | Descripción |
|-------|----------|--------|-------------|
| 🔴 Rojo | CRÍTICA | 1-4 | SaaS Multi-tenant (foundation absoluta) |
| 🟠 Naranja | ALTA | 1-3 | Discovery + Integraciones (cobertura rápida) |
| 🟡 Amarillo | MEDIA | 2-4 | ITAM, Lifecycle, Auditoría, Dashboards |
| 🟢 Verde | SOPORTE | 3-4 | Dashboards ejecutivos (dependen del resto) |

---

## 🔀 Flujo de Dependencias

1. **EPIC-07 de soporta TODAS las otras** (multi-tenant es la base)
2. **EPIC-01 + EPIC-02** pueden hacerse en paralelo (discovery + integraciones)
3. **EPIC-04 + EPIC-05** dependen de EPIC-07, pueden hacerse paralelas
4. **EPIC-03 + EPIC-06** dependen del resto, se hacen al final

---

## 🖼️ Exportar a PNG

```bash
mmdc -i Diagramas/02_epicas-secuencia.md -o Diagramas/02_epicas-secuencia.png
```
