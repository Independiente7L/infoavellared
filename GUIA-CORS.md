# 🔧 Guía para Resolver Problemas de CORS

## ¿Por qué no cargan los datos?

Cuando abres archivos HTML directamente desde el explorador de archivos (protocolo `file://`), los navegadores bloquean las solicitudes a otros archivos locales por seguridad. Esto se llama política CORS (Cross-Origin Resource Sharing).

## ✅ Soluciones Recomendadas

### 1. **Usar Live Server (Recomendado para VS Code)**
Si tienes VS Code:
1. Instala la extensión "Live Server"
2. Haz clic derecho en `resumen.html`
3. Selecciona "Open with Live Server"

### 2. **Servidor HTTP con Python**
Si tienes Python instalado:
```bash
# En la carpeta del proyecto
python -m http.server 8000
# Luego ve a: http://localhost:8000/resumen.html
```

### 3. **Servidor HTTP con Node.js**
Si tienes Node.js instalado:
```bash
# Instalar servidor simple
npm install -g http-server
# En la carpeta del proyecto
http-server
# Luego ve a la URL que muestre
```

### 4. **Usando XAMPP/WAMP/MAMP**
1. Instala XAMPP, WAMP o MAMP
2. Copia la carpeta del proyecto a `htdocs` (XAMPP) o `www` (WAMP)
3. Ve a `http://localhost/WEB_ROJO 2.0/resumen.html`

### 5. **Chrome con flags (Temporal)**
⚠️ **Solo para desarrollo, no recomendado para uso normal**
```bash
chrome --disable-web-security --user-data-dir="c:/temp/chrome"
```

## 📋 Archivos Disponibles

- `resumen.html` - Versión completa (necesita servidor)
- `resumen-demo.html` - Versión de demostración (funciona directamente)
- `Index.html` - Página principal

## 🚀 Versión Demo

La página `resumen-demo.html` funciona directamente en el navegador y muestra cómo se ve la página con datos reales. Úsala para ver el diseño mientras configuras un servidor para la versión completa.

## 🆘 Si nada funciona

1. Usa `resumen-demo.html` para ver la funcionalidad
2. Considera subir los archivos a un hosting gratuito como:
   - GitHub Pages
   - Netlify
   - Vercel
   - Firebase Hosting
