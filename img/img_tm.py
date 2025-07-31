import pandas as pd
import os
import re
import requests
from ddgs import DDGS

# Rutas
excel_path = r"C:\Users\chuqui\Documents\Escritorio\CAT\TC\WEB_ROJO\tm_completo.xlsx"
sheet_name = "Resu_Jugadores"
img_dir = r"C:\Users\chuqui\Documents\Escritorio\CAT\TC\WEB_ROJO 2.0\img"

# Leer Excel
df = pd.read_excel(excel_path, sheet_name=sheet_name)

# Función para nombre de archivo
def club_a_archivo(club):
    return re.sub(r"[^\w\s]", "", club.lower()).replace(" ", "_") + ".png"

# Lista única
clubes = df["Club Actual"].dropna().unique()
errores = []

# Buscar y descargar escudos
with DDGS() as ddgs:
    for club in clubes:
        archivo = club_a_archivo(club)
        destino = os.path.join(img_dir, archivo)

        if os.path.exists(destino):
            print(f"🟡 Ya existe: {archivo}")
            continue

        # Corrección si aplica
        query = correcciones_busqueda.get(club, f"{club} escudo png")

        print(f"🔍 Buscando: {query}")
        resultados = ddgs.images(query, max_results=5)

        imagen_url = None
        for r in resultados:
            if r["image"].lower().endswith(".png"):
                imagen_url = r["image"]
                break

        if not imagen_url:
            print(f"❌ No se encontró PNG para: {club}")
            errores.append(club)
            continue

        # Descargar y guardar
        try:
            resp = requests.get(imagen_url, timeout=10)
            if "image/png" in resp.headers.get("Content-Type", ""):
                with open(destino, "wb") as f:
                    f.write(resp.content)
                print(f"✅ Guardado: {archivo}")
            else:
                print(f"❌ Formato no válido para: {club}")
                errores.append(club)
        except Exception as e:
            print(f"❌ Error descargando {club}: {e}")
            errores.append(club)

# Informe final
if errores:
    print("\n⚠️ Escudos no descargados o con formato incorrecto:")
    for c in errores:
        print(f" - {c}")
else:
    print("\n🎉 Todos los escudos fueron descargados correctamente.")
