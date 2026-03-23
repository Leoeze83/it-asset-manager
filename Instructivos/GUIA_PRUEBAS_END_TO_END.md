# Guia de Pruebas End-to-End

Esta guia valida el producto completo: consola web de activos y despliegue de agentes en equipos remotos.

## 1. Pre-requisitos

- Windows 10/11 en equipo de pruebas para agente.
- Acceso Admin local para instalar MSI.
- URL publica del servidor (HTTPS recomendado).
- Variables de entorno del servidor configuradas:
  - `APP_URL`
  - `PORT`
  - `AGENT_BOOTSTRAP_TOKEN`
  - `AGENT_HEARTBEAT_INTERVAL_SECONDS=14400`
- Firebase Auth y Firestore operativos con dominios autorizados.

## 2. Verificacion inicial de backend

1. Validar salud de API:

```powershell
Invoke-RestMethod -Uri "https://TU-DOMINIO/api/health" -Method Get
```

2. Resultado esperado: `{"status":"ok"}`.

## 3. Pruebas de consola web (Assets)

### 3.1 Login y carga

1. Abrir la app web.
2. Iniciar sesion con Google.
3. Confirmar que carga Dashboard e Inventario sin errores.

Resultado esperado:
- Sesion exitosa.
- Sin errores bloqueantes en consola del navegador.

### 3.2 Operaciones basicas de inventario

1. Crear un activo nuevo desde la UI (admin).
2. Editar el activo.
3. Verificar que cambios persisten.

Resultado esperado:
- Activo aparece y se actualiza correctamente.

## 4. Pruebas de MSI instalador (wizard)

### 4.1 Instalacion con asistente grafico

1. Descargar `AssetFlow-Agent-Installer.msi`.
2. Ejecutar MSI como Administrador.
3. En el wizard:
   - Completar `Base URL` (ej. `https://TU-DOMINIO`).
   - Completar `Bootstrap Token`.
4. Finalizar instalacion.

Resultado esperado:
- MSI instala archivos.
- Ejecuta instalacion del agente automaticamente al final.
- No requiere comando manual extra.

### 4.2 Verificacion de servicio en segundo plano

En el equipo remoto:

```powershell
Get-ScheduledTask -TaskName "AssetFlowSecureAgent"
```

Resultado esperado:
- La tarea existe y queda activa.

## 5. Prueba de registro remoto automatico

1. Esperar alta inicial del agente (1-2 min).
2. Ir a Inventario web.

Resultado esperado:
- Nuevo asset registrado automaticamente.
- `location` como `Managed Agent`.
- `lastSeen` actualizado.

## 6. Prueba de telemetria periodica (cada 4 horas)

1. Verificar campos de telemetria en el activo:
   - CPU
   - RAM
   - Disco
   - Uptime
   - IP
2. Confirmar que heartbeat se actualiza sin intervencion manual.

Resultado esperado:
- Nuevos valores en el activo dentro del ciclo configurado.

## 7. Prueba de refresh manual desde consola admin

1. En Inventario, presionar accion de refresh para activo gestionado.
2. Esperar hasta 60 segundos.

Resultado esperado:
- Actualizacion inmediata de `lastSeen` y telemetria.

## 8. Prueba de conexion remota (RDP)

1. En Inventario, usar accion de conexion remota para activo gestionado.
2. Confirmar apertura de cliente RDP en el equipo administrador.

Resultado esperado:
- Se inicia intento de conexion RDP al host/IP del asset.

## 9. Prueba de persistencia tras reinicio

1. Reiniciar el equipo con agente instalado.
2. Tras iniciar sesion, verificar tarea:

```powershell
Get-ScheduledTask -TaskName "AssetFlowSecureAgent"
```

3. Verificar en web que vuelve a reportar.

Resultado esperado:
- El agente sigue operativo tras reinicio.

## 10. Prueba de MSI desinstalador

1. Ejecutar `AssetFlow-Agent-Uninstaller.msi` como Admin.
2. Verificar remocion:

```powershell
Get-ScheduledTask -TaskName "AssetFlowSecureAgent" -ErrorAction SilentlyContinue
```

Resultado esperado:
- Tarea removida.
- Rastros locales principales eliminados.
- El asset deja de enviar telemetria.

## 11. Checklist de aceptacion

- [ ] Login web correcto.
- [ ] CRUD basico de activos correcto.
- [ ] Instalador MSI funcional con wizard.
- [ ] Registro remoto automatico funcionando.
- [ ] Telemetria 4h funcionando.
- [ ] Refresh admin bajo demanda funcionando.
- [ ] Conexion RDP desde consola funcionando.
- [ ] Persistencia tras reinicio funcionando.
- [ ] Desinstalador MSI funcional.

## 12. Troubleshooting rapido

- Error 401 en register: token invalido o faltante.
- Error 401/403 en heartbeat: credenciales de agente vencidas, reinstalar.
- No aparece asset: Base URL incorrecta o bloqueo de red/firewall.
- No inicia tras reinicio: revisar tarea programada y permisos admin.
- Login Google falla: revisar dominios autorizados en Firebase Auth.
