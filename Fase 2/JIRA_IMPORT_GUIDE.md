# Guia de importacion Jira (CSV)

Archivo de importacion:

- FASE2_JIRA_IMPORT.csv

## Pasos

1. Ir a Jira Settings -> System -> External System Import -> CSV.
2. Seleccionar `FASE2_JIRA_IMPORT.csv`.
3. Elegir proyecto destino (recomendado: proyecto nuevo para Fase 2).
4. Mapear campos CSV:
- Summary -> Summary
- Issue Type -> Issue Type
- Description -> Description
- Priority -> Priority
- Labels -> Labels
- Epic Name -> Epic Name
- Epic Link -> Epic Link
- Story Points -> Story Points
- Sprint -> Sprint
5. Ejecutar importacion.

## Recomendaciones

- Importar primero epicas y luego historias si Jira no resuelve `Epic Link` por texto.
- Si tu plantilla usa `Parent` en lugar de `Epic Link`, reemplazar columna en el CSV.
- Crear sprint `Fase2-Sprint1` antes de importar para asignacion directa.
