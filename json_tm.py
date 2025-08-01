import pandas as pd
import os
import re

# Rutas
excel_path = r"C:\Users\chuqui\Documents\Escritorio\CAT\TC\WEB_ROJO\tm_completo.xlsx"
sheet_name = "Resu_Jugadores"
json_path = r"C:\Users\chuqui\Documents\Escritorio\CAT\TC\WEB_ROJO 2.0\data.json"
img_dir = r"C:\Users\chuqui\Documents\Escritorio\CAT\TC\WEB_ROJO 2.0\img"

# Leer Excel
df = pd.read_excel(excel_path, sheet_name=sheet_name)

# Función para convertir nombre de club a nombre de archivo válido
def club_a_archivo(club):
    # Quitar caracteres especiales, convertir a minúsculas, reemplazar espacios por "_"
    nombre_archivo = re.sub(r"[^\w\s]", "", club.lower()).replace(" ", "_") + ".png"
    ruta_archivo = os.path.join(img_dir, nombre_archivo)
    
    # Verificar si el archivo existe, si no, usar default.png
    if os.path.exists(ruta_archivo):
        return nombre_archivo
    else:
        return "default.png"

# Crear diccionario automático
escudos_por_club = {club: club_a_archivo(club) for club in df["Club Actual"].unique()}

# Mapear la columna Escudo
df["Escudo"] = df["Club Actual"].map(escudos_por_club)

# Exportar a JSON
df.to_json(json_path, orient="records", force_ascii=False, indent=2)

print(f"✅ JSON exportado correctamente a: {json_path}")
