# Mahjong Scorer PRO 🀄🤖

Calculadora profesional de Mahjong (Riichi y MCR) por voz, construida con una arquitectura **Zero Cost** de alta disponibilidad.

## 🚀 Infraestructura
- **Frontend:** Cloudflare Pages (Hosting gratuito).
- **Backend:** Cloudflare Functions (Node.js/V8).
- **IA:** Google Gemini 1.5/2.5 PRO (Tier de Pago habilitado).
- **Logs:** Grafana Cloud (Loki) para trazabilidad completa.

## 📊 Sistema de Logs (Grafana Loki)
Los logs están centralizados en Grafana Cloud para monitorizar el rendimiento y detectar errores de la IA.

- **URL de Consulta:** `https://victorgf87.grafana.net/explore`
- **Filtro Principal:** `{app="mahjong-scorer"}`
- **Etiquetas disponibles:**
  - `level`: info, warn, error.
  - `tier`: premium (indica uso de modelos de pago).
- **Trazabilidad:** Cada log de éxito incluye el modelo usado, el modo de juego y el tiempo de respuesta.

## 🔐 Gestión de Secretos (Security First)
Usamos un sistema de credenciales cifradas inspirado en Rails. Los secretos NUNCA se suben al repositorio en claro.

### Archivos clave:
- `master.key`: (IGNORADO POR GIT) Contiene la llave maestra para descifrar.
- `credentials.enc`: Archivo cifrado con AES-256 que contiene las API Keys.
- `secrets.sh`: Script de gestión.

### Comandos útiles:
- `./secrets.sh edit`: Descifra, abre el editor y vuelve a cifrar al cerrar.
- `./secrets.sh apply`: Sube los secretos actuales a la consola de Cloudflare.

## 🚢 Despliegue
Para actualizar la aplicación en el dominio principal (`mahjong-scorer-pwa.pages.dev`), usa siempre el script de producción:

```bash
./deploy.sh
```
*Este script fuerza el despliegue a la rama `production` para evitar URLs de previsualización innecesarias.*

## 💰 Configuración de Monetización
- **AdSense:** Los archivos `ads.txt` y `robots.txt` están en la carpeta `/public`.
- **Ko-fi:** El enlace de donación está configurado para el usuario `victorgf87`. Se puede cambiar en `index.html`.

## ⚖️ Diccionario de Reglas
El archivo `mahjong_rules.md` sirve como fuente de verdad para la IA. Si alguna puntuación es incorrecta, actualiza ese archivo y la IA aprenderá el nuevo valor automáticamente en el siguiente despliegue.

---
Creado por Víctor (victorgf87) - 2026
