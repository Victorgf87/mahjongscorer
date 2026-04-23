# Mahjong Scorer - Master Engram Export 🧠

Este archivo contiene el conocimiento técnico y las decisiones de arquitectura acumuladas durante la construcción del proyecto.

## 🏗️ Arquitectura "Zero Cost" Premium
- **Hosting:** Cloudflare Pages para el frontend estático.
- **Backend:** Cloudflare Pages Functions (Carpeta `/functions`). 
  - *Nota técnica:* Debe exportar `onRequestPost` para funcionar correctamente.
- **IA:** Google Gemini 1.5/2.5 PRO con Tier de Pago habilitado.
- **Multimodalidad:** Se envía el audio (.webm) directamente a Gemini en Base64 sin pasar por servicios de transcripción (STT) intermedios.

## ⚖️ Motor de Arbitraje (IA)
- **Modelos:** Se prioriza `gemini-flash-latest` por velocidad y coste, con fallback a `gemini-2.5-pro` para precisión máxima.
- **Contexto:** Se inyecta el archivo `mahjong_rules.md` en las instrucciones del sistema como "Fuente de Verdad" absoluta.
- **Validación:** El bot está instruido para detectar jugadas imposibles y corregirlas automáticamente en la sección de "Aclaraciones".

## 📊 Observabilidad y Logs
- **Sistema:** Grafana Cloud (Loki).
- **Configuración:** Envío de logs mediante `fetch` a la URL de push de Loki con autenticación básica.
- **Trazabilidad:** Cada entrada de log incluye:
  - Modelo usado.
  - Reglamento (MCR/Riichi).
  - Tiempo de ejecución en ms.
  - Fragmento del Output generado.

## 🔐 Seguridad (Ecosistema Compartido)
- **Sistema:** Basado en `master.key` (IGNORADO por Git) y `credentials.enc` (CIFRADO).
- **Unificación:** Este proyecto comparte la misma llave maestra que los proyectos `taquitos` y `andrea_bot_free`.
- **Gestión:** Script `secrets.sh` con comandos `init`, `edit`, `encrypt` y `apply`.

## 🚢 Despliegue de Producción
- **Rama:** Siempre desplegar a la rama `production` para actualizar el dominio raíz.
- **Script:** Usar `./deploy.sh` que gestiona tanto los archivos como los secretos de Cloudflare.

---
Resumen generado automáticamente - Abril 2026
