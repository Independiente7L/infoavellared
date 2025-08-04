from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup
import pandas as pd
from io import StringIO
import time
import re
import random
import requests

urls = [
    "https://www.transfermarkt.com.ar/axel-poza/leistungsdatenverein/spieler/1246831",
    "https://www.transfermarkt.com.ar/tomas-rambert/leistungsdatenverein/spieler/1120276",
    "https://www.transfermarkt.com.ar/david-martinez/leistungsdatenverein/spieler/1123368",
    "https://www.transfermarkt.com.ar/diego-segovia/leistungsdatenverein/spieler/876456",
    "https://www.transfermarkt.com.ar/mauro-zurita/leistungsdatenverein/spieler/927766",
    "https://www.transfermarkt.com.ar/rodrigo-marquez/leistungsdatenverein/spieler/909735",
    "https://www.transfermarkt.com.ar/sergio-ortiz/leistungsdatenverein/spieler/1034081",
    "https://www.transfermarkt.com.ar/agustin-quiroga/leistungsdatenverein/spieler/1126191",
    "https://www.transfermarkt.com.ar/david-sayago/leistungsdatenverein/spieler/918656",
    "https://www.transfermarkt.com.ar/patricio-ostachuk/leistungsdatenverein/spieler/842911",
    "https://www.transfermarkt.com.ar/baltasar-barcia/leistungsdatenverein/spieler/891569",
    "https://www.transfermarkt.com.ar/braian-martinez/leistungsdatenverein/spieler/739995",
    "https://www.transfermarkt.com.ar/kevin-lopez/leistungsdatenverein/spieler/931942",
    "https://www.transfermarkt.com.ar/jhonny-quinonez/leistungsdatenverein/spieler/437842",
    "https://www.transfermarkt.com.ar/ignacio-maestro-puch/leistungsdatenverein/spieler/853278",
    "https://www.transfermarkt.com.ar/juan-fedorco/leistungsdatenverein/spieler/997070",
    "https://www.transfermarkt.com.ar/nicolas-vallejo/leistungsdatenverein/spieler/1040204",
    "https://www.transfermarkt.com.ar/javier-ruiz/leistungsdatenverein/spieler/1160106",
    "https://www.transfermarkt.com.ar/santiago-lopez/leistungsdatenverein/spieler/1000687",
    "https://www.transfermarkt.com.ar/santiago-salle/leistungsdatenverein/spieler/1108153",
    "https://www.transfermarkt.com.ar/joel-gonzalez/leistungsdatenverein/spieler/1141729",
    "https://www.transfermarkt.com.ar/enzo-franco/leistungsdatenverein/spieler/1046961",
    "https://www.transfermarkt.com.ar/manuel-tasso/leistungsdatenverein/spieler/1103405",
    "https://www.transfermarkt.com.ar/lucas-roman/leistungsdatenverein/spieler/990202",
]

def crear_driver():
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--log-level=3")
    options.add_argument("--disable-software-rasterizer")
    options.add_argument("--disable-logging")
    options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36")
    return webdriver.Chrome(options=options)

def normalizar(texto):
    return re.sub(r'\s+', ' ', texto.lower().strip())

def procesar_url(url, driver, sheets_dict, errores):
    try:
        # Verificar si la página está disponible antes de abrir con Selenium
        try:
            r = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=20)
            if r.status_code != 200:
                raise Exception(f"HTTP {r.status_code}")
        except Exception as req_err:
            errores.append((url, f"No responde (requests): {str(req_err)}"))
            print(f"❌ {url} no respondió: {req_err}")
            return

        driver.get(url)
        WebDriverWait(driver, 20).until(EC.presence_of_element_located((By.TAG_NAME, "body")))

        # Aceptar cookies si es necesario
        try:
            WebDriverWait(driver, 5).until(
                EC.frame_to_be_available_and_switch_to_it((By.CSS_SELECTOR, "iframe[src*='consent']"))
            )
            aceptar_btn = WebDriverWait(driver, 5).until(
                EC.element_to_be_clickable((By.XPATH, '//button[contains(text(),"Aceptar y continuar")]'))
            )
            aceptar_btn.click()
            time.sleep(2)
            driver.switch_to.default_content()
        except:
            driver.switch_to.default_content()

        time.sleep(1)
        html = driver.page_source
        soup = BeautifulSoup(html, 'html.parser')

        # Buscar la tabla de rendimiento
        tabla_html = None
        bloque_h2 = soup.find('h2', string=re.compile("Datos de rendimento por club", re.I))
        if bloque_h2:
            contenedor_tabla = bloque_h2.find_next("div", class_="responsive-table")
            if contenedor_tabla:
                tabla = contenedor_tabla.find("table", class_="items")
                if tabla:
                    tabla_html = str(tabla)

        if not tabla_html:
            errores.append((url, "No se encontró la tabla"))
            print(f"⚠️ Tabla no encontrada en: {url}")
            return

        tabla_soup = BeautifulSoup(tabla_html, 'html.parser')

        # Detectar si es arquero
        es_arquero = bool(tabla_soup.select_one("span.icon-gegentor-table-header, span.icon-ohnegegentor-table-header"))

        if es_arquero:
            encabezados = ["Club", "Club_nombre", "Partidos", "Goles", "Amarillas", "2ª Amarilla", "Rojas", "Goles en Contra", "Imbatido", "Minutos"]
        else:
            encabezados = ["Club", "Club_nombre", "Partidos", "Goles", "Asistencias", "Amarillas", "2ª Amarilla", "Rojas", "Minutos"]

        df = pd.read_html(StringIO(str(tabla_soup)), header=None)[0]
        df = df[~df.iloc[:, 0].astype(str).str.contains('Total', na=False)]

        if len(encabezados) > len(df.columns):
            encabezados = encabezados[:len(df.columns)]
        elif len(encabezados) < len(df.columns):
            encabezados += [f"Extra_{i}" for i in range(len(df.columns) - len(encabezados))]

        df.columns = encabezados

        columnas_numericas = ["Partidos", "Goles", "Asistencias", "Amarillas", "2ª Amarilla", "Rojas", "Goles en Contra", "Imbatido", "Minutos"]
        for col in columnas_numericas:
            if col in df.columns:
                df[col] = df[col].replace("-", "0")

        if "Minutos" in df.columns:
            df["Minutos"] = df["Minutos"].astype(str).str.replace("'", "", regex=False).str.replace(".", "", regex=False)
            df["Minutos"] = pd.to_numeric(df["Minutos"], errors='coerce').fillna(0).astype(int)

        for col in columnas_numericas:
            if col in df.columns and col != "Minutos":
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0).astype(int)

        extra_cols = [col for col in df.columns if col.startswith('Extra_')]
        df.drop(columns=extra_cols, inplace=True)

        nombre_completo = "No disponible"
        h1 = soup.find('h1', class_='data-header__headline-wrapper')
        if h1:
            nombres = []
            for elem in h1.contents:
                if isinstance(elem, str):
                    nombres.append(elem.strip())
                elif elem.name == "strong":
                    nombres.append(elem.get_text(strip=True))
            nombre_completo = " ".join(nombres).strip()

        nombre_jugador = re.search(r'/([^/]+)/leistungsdatenverein', url)
        nombre_hoja = nombre_jugador.group(1).replace('-', ' ').title() if nombre_jugador else "Jugador"
        if not nombre_completo or len(nombre_completo) < 3:
            nombre_completo = nombre_hoja

        club_actual = "No disponible"
        club_span = soup.find("span", class_="data-header__club")
        if club_span:
            club_a = club_span.find("a")
            if club_a and club_a.has_attr("title"):
                club_actual = club_a["title"].strip()

        posicion = "No disponible"
        li_items = soup.select("li.data-header__label")
        for li in li_items:
            if "Posición" in li.get_text(strip=True):
                span = li.find("span", class_="data-header__content")
                if span:
                    posicion = span.get_text(strip=True)
                break

        df['Nombre Completo'] = nombre_completo
        df['Club Actual'] = club_actual
        df['Posición'] = posicion

        columnas_info = ['Nombre Completo', 'Club Actual', 'Posición']
        columnas_estadisticas = [c for c in df.columns if c not in columnas_info]
        df = df[columnas_info + columnas_estadisticas]

        sheets_dict[nombre_hoja[:31]] = df
        print(f"✅ Procesado: {nombre_completo} ({club_actual})")

    except Exception as e:
        errores.append((url, str(e)))
        print(f"❌ Error procesando {url}: {e}")

# --- INICIO DEL SCRIPT ---

urls_a_procesar = urls.copy()
sheets_dict = {}
errores = []

# Primer intento
driver = crear_driver()
for url in urls_a_procesar:
    procesar_url(url, driver, sheets_dict, errores)
    time.sleep(random.uniform(2, 5))
driver.quit()

# Reintentos con los URLs que fallaron (una vez más)
if errores:
    errores_urls = [url for url, _ in errores]
    print(f"\n♻️ Reintentando jugadores con error: {errores_urls}\n")
    errores_reintento = []
    driver = crear_driver()
    for url in errores_urls:
        procesar_url(url, driver, sheets_dict, errores_reintento)
        time.sleep(random.uniform(2, 5))
    driver.quit()
    errores = errores_reintento  # Guardar solo los errores que realmente quedaron

# Crear hoja de resumen general
resumen_filas = []

for nombre_hoja, df in sheets_dict.items():
    club_actual = df['Club Actual'].iloc[0]
    df_filtrado = df[df['Club_nombre'] == club_actual]

    es_arquero = 'Goles en Contra' in df.columns

    fila = {
        'Jugador': df['Nombre Completo'].iloc[0],
        'Posición': df['Posición'].iloc[0],
        'Club Actual': club_actual,
        'Partidos Jugados': 0,
        'Minutos Jugados': 0,
        'Goles': 0,
        'Asistencias': 0,
        'Goles en Contra': 0,
        'Imbatido': 0
    }

    if not df_filtrado.empty:
        for stat in ['Partidos', 'Minutos', 'Goles', 'Asistencias', 'Goles en Contra', 'Imbatido']:
            if stat in df_filtrado.columns:
                valor_sum = pd.to_numeric(df_filtrado[stat], errors='coerce').fillna(0).sum()
                if stat == 'Partidos':
                    fila['Partidos Jugados'] = int(valor_sum)
                elif stat == 'Minutos':
                    fila['Minutos Jugados'] = int(valor_sum)
                elif stat == 'Goles':
                    fila['Goles'] = int(valor_sum)
                elif stat == 'Asistencias' and not es_arquero:
                    fila['Asistencias'] = int(valor_sum)
                elif stat == 'Goles en Contra' and es_arquero:
                    fila['Goles en Contra'] = int(valor_sum)
                elif stat == 'Imbatido' and es_arquero:
                    fila['Imbatido'] = int(valor_sum)

    resumen_filas.append(fila)

df_resumen = pd.DataFrame(resumen_filas)[
    ['Jugador', 'Posición', 'Club Actual', 'Partidos Jugados', 'Minutos Jugados', 'Goles', 'Asistencias', 'Goles en Contra', 'Imbatido']
]

# Guardar datos en Excel
with pd.ExcelWriter("jugadores_transfermarkt.xlsx", engine='openpyxl') as writer:
    for nombre_hoja, df in sheets_dict.items():
        df.to_excel(writer, sheet_name=nombre_hoja, index=False)
    # Agregar hoja resumen
    df_resumen.to_excel(writer, sheet_name="Resumen", index=False)

print("📁 Datos guardados en jugadores_transfermarkt.xlsx")

# Guardar errores si los hubo
if errores:
    errores_df = pd.DataFrame(errores, columns=["URL", "Error"])
    errores_df.to_csv("errores_transfermarkt.csv", index=False, encoding="utf-8-sig")
    print("⚠️ Se guardaron errores en errores_transfermarkt.csv")
else:
    print("✅ Sin errores detectados.")
