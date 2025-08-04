import pandas as pd
import os
import re

# Rutas - Ruta específica al directorio WEB_ROJO donde está el Excel
current_dir = os.path.dirname(os.path.abspath(__file__))
excel_directory = r"C:\Users\thiag\Documents\WEB_ROJO"  # Directorio específico del Excel
excel_path = os.path.join(excel_directory, "tm_completo.xlsx")  # Archivo correcto
sheet_name = "Resu_Jugadores"  # Hoja correcta
json_path = os.path.join(current_dir, "data.json")  # JSON se mantiene en el directorio actual
img_dir = os.path.join(current_dir, "img")

# Leer Excel sin convertir fechas automáticamente
df = pd.read_excel(excel_path, sheet_name=sheet_name, date_parser=None)

# Convertir columnas de fecha a string legible (formato DD/MM/YYYY)
columnas_fecha = ['Desde', 'Hasta', 'Próximo Partido']  # Ajusta según tus columnas
for col in columnas_fecha:
    if col in df.columns:
        # Si pandas las leyó como fechas, convertir a formato legible
        if pd.api.types.is_datetime64_any_dtype(df[col]):
            df[col] = df[col].dt.strftime('%d/%m/%Y')
        # Si están como timestamp (números grandes), convertir también
        elif pd.api.types.is_numeric_dtype(df[col]):
            # Verificar si son timestamps (números > 1000000000 probablemente sean timestamps)
            if df[col].max() > 1000000000:
                # Convertir de timestamp a fecha legible
                df[col] = pd.to_datetime(df[col], unit='ms', errors='coerce').dt.strftime('%d/%m/%Y')

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
print("🔄 Las fechas ahora aparecerán en formato DD/MM/YYYY")
