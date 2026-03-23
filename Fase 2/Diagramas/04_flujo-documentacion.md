# Diagrama 04: Flujo de Documentación y Lectura

**Propósito**: Mostrar cómo navegar toda la documentación generada  
**Formato**: Mermaid Graph (Flow)

---

## 📊 Mermaid Source

```mermaid
graph LR
    subgraph "Documentación Fase 2 - Flujo de Lectura"
        A["🟢 START AQUÍ<br/>FASE2_START_RAPIDO.md<br/>(5 min)"]
        B["📋 RESUMEN_EJECUTIVO.md<br/>Visión + KPIs + Roadmap<br/>(15 min)"]
        C["✅ CHECKLIST_PREPARACION.md<br/>Setup técnico del equipo<br/>(4-8 horas)"]
        D["💻 GUIA_DESARROLLO_SPRINT1.md<br/>Templates + Ejemplos de código<br/>(Referencia durante dev)"]
        E["📚 INDICE_DOCUMENTACION.md<br/>Índice completo<br/>(Bookmark)"]
        F["🚀 Ejecutar Sprint 1<br/>T1-01 a T1-05<br/>(2 semanas)"]
        G["📝 Crear docs/<br/>ARCHITECTURE.md<br/>CONNECTORS.md<br/>RBAC.md<br/>SECURITY.md"]
        H["✨ Sprint 1 Review<br/>03/04 15:00<br/>Demo + Retrospective"]
        I["🔄 Sprint 2 inicia<br/>06/04"]
    end
    
    J["Fase 2/FASE2_BACKLOG_TECNICO.md<br/>Épicas y historias<br/>(Referencia)"]
    K["Fase 2/IMPLEMENTACION_Y_ROADMAP.md<br/>Roadmap detallado<br/>(Referencia)"]
    
    A -->|Lee| B
    B -->|Entiende| C
    C -->|Setup completo| D
    D -->|Referencia| F
    F -->|Paralelo| G
    G -->|Termina| H
    H -->|Retro| I
    
    B -.Consulta.-> J
    B -.Consulta.-> K
    F -.Consulta.-> J
    D -.Consulta.-> E
    
    style A fill:#90EE90,stroke:#228B22,stroke-width:3px,color:#000
    style B fill:#FFD700,stroke:#DAA520,stroke-width:2px,color:#000
    style C fill:#FFD700,stroke:#DAA520,stroke-width:2px,color:#000
    style D fill:#87CEEB,stroke:#4682B4,stroke-width:2px,color:#000
    style F fill:#FF6B6B,stroke:#C92A2A,stroke-width:2px,color:#fff
    style H fill:#FF6B6B,stroke:#C92A2A,stroke-width:2px,color:#fff
    style I fill:#FFD700,stroke:#DAA520,stroke-width:2px,color:#000
    style J fill:#DDA0DD,stroke:#8B008B,stroke-width:1px,color:#000
    style K fill:#DDA0DD,stroke:#8B008B,stroke-width:1px,color:#000
    style E fill:#DDA0DD,stroke:#8B008B,stroke-width:1px,color:#000
    style G fill:#87CEEB,stroke:#4682B4,stroke-width:2px,color:#000
```

---

## 📍 Puntos Clave del Flujo

1. **Verde (START)**: Punto de entrada único
2. **Amarillo (Planning)**: Entiende visión y prepárate
3. **Azul (Ejecución)**: Desarrolla usando templates
4. **Rojo (Sprint)**: Demo y cierre
5. **Puntedas (Referencia)**: Consulta según sea necesario

---

## 🔀 Flujos Alternativos

### Si eres Developer
```
START → RESUMEN_EJECUTIVO (15 min) 
      → CHECKLIST_PREPARACION (4h) 
      → GUIA_DESARROLLO_SPRINT1 (referencia)
      → Ejecutar T1-XX
```

### Si eres Tech Lead
```
START → RESUMEN_EJECUTIVO (30 min - validate vision)
      → INDICE_DOCUMENTACION (tabla de contenidos)
      → BACKLOG_TECNICO (épicas)
      → Plan timeline y equipo
```

### Si eres PM
```
START → RESUMEN_EJECUTIVO (30 min)
      → IMPLEMENTACION_Y_ROADMAP (competitive analysis)
      → KPIs y tracking
      → Jira setup (ver Integraciones/)
```

---

## 🖼️ Exportar a PNG

```bash
mmdc -i Diagramas/04_flujo-documentacion.md -o Diagramas/04_flujo-documentacion.png
```

---

## 💡 Cómo Usar Este Diagrama

**En el Kickoff (24/03)**:
- Presentar este diagrama
- Mostrar camino específico según rol
- Dar los links correctos a cada persona

**Durante la ejecución**:
- Referencia visual de dónde estamos
- Guía para onboarding de nuevos team members
- Validación de que estamos en el camino correcto
