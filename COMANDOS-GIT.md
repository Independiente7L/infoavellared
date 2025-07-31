# 🚀 Comandos para subir a GitHub

✅ **Git está instalado y funcionando** (versión 2.50.1.windows.1)

## Paso 1: Configurar Git (solo la primera vez)
```bash
git config --global user.name "TuNombre"
git config --global user.email "tu-email@gmail.com"
```

## Paso 2: Inicializar repositorio y conectar a GitHub
```bash
# En la carpeta del proyecto
cd "c:\Users\thiag\Documents\WEB_ROJO 2.0"

# Inicializar Git
git init

# Conectar al repositorio remoto
git remote add origin https://github.com/Independiente7L/infoavellared.git

# Crear y cambiar a la rama main
git branch -M main
```

## Paso 3: Agregar archivos y hacer commit
```bash
# Agregar todos los archivos
git add .

# Hacer commit con un mensaje
git commit -m "Añadir nueva sección de resumen de jugadores"
```

## Paso 4: Subir al repositorio
```bash
# Subir archivos a GitHub
git push -u origin main
```

## Para actualizaciones futuras:
```bash
git add .
git commit -m "Descripción de los cambios"
git push
```

## Si el repositorio ya tiene contenido:
```bash
# Descargar primero los archivos existentes
git pull origin main --allow-unrelated-histories

# Luego hacer push
git push -u origin main
```

## Archivos que se subirán:
- ✅ resumen.html (página completa)
- ✅ resumen-demo.html (página demo)
- ✅ resumen.css (estilos)
- ✅ resumen.js (JavaScript completo)
- ✅ resumen-demo.js (JavaScript demo)
- ✅ Index.html (actualizado con navegación)
- ✅ proximos.html (actualizado)
- ✅ tops.html (actualizado)
- ✅ Todos los demás archivos existentes
