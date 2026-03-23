# Guia de Entorno Pre-Productivo E2E (sin costo)

Este instructivo te permite validar el flujo completo en conectividad real: desde la instalacion del agente en equipos remotos hasta la visualizacion y operacion en la consola web de Asset Manager.

## 1. Objetivo de la prueba

Validar en entorno pre-productivo que:

- La consola web funciona con autenticacion, inventario y acciones de admin.
- El agente se instala correctamente por MSI en equipos activos.
- El activo se registra automaticamente en la plataforma.
- La telemetria se actualiza y responde a refresh manual.
- La desinstalacion elimina la operacion del agente.

## 2. Arquitectura recomendada (sin costo)

- Servidor app: desplegar en VM/laptop encendida o servicio free tier.
- Base de datos/autenticacion: Firebase (plan gratuito).
- Equipos de prueba: 1 a 3 PCs reales en otra red (casa/oficina distinta o tethering 4G).
- Conexion remota: RDP nativo de Windows.

## 3. Pre-requisitos

### 3.1 Servidor

- Variables de entorno definidas:
  - APP_URL
  - PORT
  - AGENT_BOOTSTRAP_TOKEN
  - AGENT_HEARTBEAT_INTERVAL_SECONDS=14400
  - VITE_FIREBASE_API_KEY
  - VITE_FIREBASE_AUTH_DOMAIN
  - VITE_FIREBASE_PROJECT_ID
  - VITE_FIREBASE_STORAGE_BUCKET
  - VITE_FIREBASE_MESSAGING_SENDER_ID
  - VITE_FIREBASE_APP_ID
- HTTPS recomendado para URL publica.
- Endpoint de salud accesible externamente.

### 3.2 Seguridad minima

- AGENT_BOOTSTRAP_TOKEN fuerte y no compartido por canales inseguros.
- API key de Firebase restringida por dominio y APIs.
- Dominio de la app autorizado en Firebase Auth.

## 4. Preparar entorno pre-productivo

### Paso 1: levantar servidor

```powershell
npm install
npm run dev
```

Si vas a exponer una URL publica, usar deploy o tunel estable.

### Paso 2: validar endpoint de salud desde fuera

En una maquina externa:

```powershell
Invoke-RestMethod -Uri "https://TU-DOMINIO/api/health" -Method Get
```

Esperado: `{"status":"ok"}`.

### Paso 3: acceder a la consola web

- Abrir URL publica.
- Iniciar sesion con usuario Admin.
- Verificar carga de Dashboard e Inventario.

## 5. Prueba end-to-end del agente

### Paso 4: descargar instalador en equipo remoto

Descargar:

- /downloads/AssetFlow-Agent-Installer.msi

### Paso 5: instalar MSI como administrador

- Ejecutar MSI.
- Completar wizard de configuracion del agente:
  - Base URL: https://TU-DOMINIO
  - Bootstrap Token: valor vigente

Esperado:

- Instalacion finaliza sin error.
- Se crea tarea `AssetFlowSecureAgent`.
- El agente queda corriendo en segundo plano.

### Paso 6: validar estado local en el equipo

```powershell
Get-ScheduledTask -TaskName "AssetFlowSecureAgent"
```

Esperado: tarea existente y activa.

### Paso 7: verificar registro automatico en consola

En Inventario de la web:

- Debe aparecer el nuevo asset.
- `location`: Managed Agent.
- `lastSeen` reciente.
- Telemetria basica visible (CPU, RAM, disco, uptime, IP).

## 6. Pruebas funcionales en consola

### Paso 8: refresh manual desde admin

- En Inventario, usar accion de refresh del asset.
- Esperar hasta 60 segundos.

Esperado:

- Se actualiza `lastSeen`.
- Se refresca telemetria sin esperar ciclo largo.

### Paso 9: conexion remota por RDP

- En Inventario, usar accion de conexion remota.

Esperado:

- Se abre cliente RDP al host/IP del activo.

## 7. Pruebas de resiliencia

### Paso 10: reinicio del equipo remoto

- Reiniciar equipo con agente instalado.
- Verificar nuevamente tarea programada.
- Revisar en consola que vuelve a reportar.

Esperado:

- Persistencia correcta tras reinicio.

### Paso 11: corte y retorno de internet

- Desconectar red 2-5 minutos.
- Reconectar.

Esperado:

- El agente retoma envio automatico.

## 8. Prueba de desinstalacion

### Paso 12: ejecutar desinstalador MSI

Descargar y ejecutar:

- /downloads/AssetFlow-Agent-Uninstaller.msi

### Paso 13: validar remocion

```powershell
Get-ScheduledTask -TaskName "AssetFlowSecureAgent" -ErrorAction SilentlyContinue
```

Esperado:

- Tarea eliminada.
- El equipo deja de reportar.

## 9. Checklist de aceptacion pre-productiva

- [ ] Login web admin operativo.
- [ ] Inventario visible y consistente.
- [ ] Instalacion MSI remota exitosa.
- [ ] Registro automatico de activos.
- [ ] Telemetria cada 4 horas activa.
- [ ] Refresh manual en menos de 60 segundos.
- [ ] RDP lanzado desde consola.
- [ ] Persistencia tras reinicio.
- [ ] Desinstalacion limpia.

## 10. Troubleshooting rapido

- 401 en register: bootstrap token invalido.
- 401/403 en heartbeat: credenciales agente no validas, reinstalar.
- No aparece activo: Base URL incorrecta o firewall/proxy.
- Login falla: dominio no autorizado en Firebase Auth.
- MSI no registra: ejecutar instalador como Admin y revisar token/base URL.

## 11. Evidencia recomendada para cierre de prueba

- Capturas de:
  - Wizard MSI completado.
  - Asset creado automaticamente.
  - Telemetria antes/despues de refresh.
  - Tarea activa en Windows.
  - Desinstalacion completada.
- Log de instalacion MSI y timestamp de prueba.

Con estas evidencias, el entorno queda validado para pasar a una etapa piloto controlada.
