# Diagrama 01: Roadmap Fase 1 → Fase 2

**Propósito**: Mostrar el flujo de evolución del proyecto  
**Formato**: Mermaid (ver en GitHub / convertir a PNG con mermaid-cli)

---

## 📊 Mermaid Source

```mermaid
graph TB
    subgraph "FASE 1 - Estado Actual"
        A1["✅ Inventario Base"]
        A2["✅ Agente Windows"]
        A3["✅ Telemetría Segura"]
        A4["✅ Backend Hardened"]
    end
    
    subgraph "SPRINT 1 - Foundation"
        B1["🔧 Multi-tenant Core<br/>tenantId Model"]
        B2["🔐 RBAC Implementation"]
        B3["🌐 Discovery MVP<br/>Network Scanner"]
        B4["🔌 Connectors Framework"]
        B5["📊 Intune Connector v1"]
    end
    
    subgraph "BLOQUES FASE 2"
        C1["Bloque A<br/>Discovery"]
        C2["Bloque B<br/>ITAM Avanzado"]
        C3["Bloque C<br/>Governance"]
        C4["Bloque D<br/>Analítica"]
        C5["Bloque E<br/>SaaS"]
    end
    
    subgraph "Épicas Prioritarias"
        D1["EPIC-07<br/>SaaS Multi-tenant"]
        D2["EPIC-01<br/>Discovery"]
        D3["EPIC-02<br/>Integraciones"]
        D4["EPIC-03<br/>Software/Licencias"]
        D5["EPIC-05<br/>Auditoría"]
        D6["EPIC-06<br/>Dashboards"]
    end
    
    A1 --> B1
    A2 --> B3
    A3 --> B4
    A4 --> B2
    
    B1 --> C5
    B2 --> C5
    B3 --> C1
    B4 --> C1
    B5 --> C1
    
    C5 --> D1
    C1 --> D2
    C1 --> D3
    C2 --> D4
    C3 --> D5
    C4 --> D6
    
    style A1 fill:#90EE90
    style A2 fill:#90EE90
    style A3 fill:#90EE90
    style A4 fill:#90EE90
    style B1 fill:#FFD700
    style B2 fill:#FFD700
    style B3 fill:#FFD700
    style B4 fill:#FFD700
    style B5 fill:#FFD700
    style D1 fill:#FF6B6B
    style C5 fill:#FF6B6B
```

---

## 🖼️ Exportar a PNG

Para convertir a imagen PNG:

```bash
# Requiere: npm install -g @mermaid-js/mermaid-cli

mmdc -i Diagramas/01_roadmap-arquitectura.md -o Diagramas/01_roadmap-arquitectura.png

# O usar online editor:
# https://mermaid.live → copiar source → export PNG
```

---

## 📝 Explicación

- **Verde (Fase 1)**: Ya completado, funcional
- **Amarillo (Sprint 1)**: Foundation de Fase 2 (tareas inmediatas)
- **Naranja (Bloques)**: Organización de trabajo
- **Rojo (Épicas)**: Resultados finales de Fase 2

El flujo muestra cómo cada componente de Fase 1 se extiende en Sprint 1 y luego se desdobla en los 5 bloques de Fase 2.
