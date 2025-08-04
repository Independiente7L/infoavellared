import pandas as pd
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup
import time
from datetime import datetime
import logging
import sys
import os
import random
import traceback

# Suppress browser driver messages
os.environ['WDM_LOG_LEVEL'] = '0'

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("transfermarkt_scraper.log"),
        logging.StreamHandler(sys.stdout)
    ]
)

# Lista completa de equipos
equipos = {
    "Arsenal de Sarandí": "https://www.transfermarkt.com.ar/arsenal-futbol-club/startseite/verein/4673",
    "Gimnasia y Esgrima Mendoza": "https://www.transfermarkt.com.ar/gimnasia-y-esgrima-de-mendoza/startseite/verein/14687",
    "Club Puebla": "https://www.transfermarkt.com.ar/puebla-fc/startseite/verein/5662",
    "Club atletico Tigre": "https://www.transfermarkt.com.ar/club-atletico-tigre/startseite/verein/11831",
    "CA Chacarita Juniors": "https://www.transfermarkt.com.ar/ca-chacarita-juniors/startseite/verein/2154",
    "CA Los Andes": "https://www.transfermarkt.com.ar/ca-los-andes/startseite/verein/5208",
    "Volos NPS": "https://www.transfermarkt.com.ar/volos-nps/startseite/verein/60949",
    "CA Boston River": "https://www.transfermarkt.com.ar/ca-boston-river/startseite/verein/18074",
    "Club Deportivo Maldonado": "https://www.transfermarkt.com.ar/cd-maldonado/startseite/verein/18075",
    "Círculo Deportivo": "https://www.transfermarkt.com.ar/circulo-deportivo/startseite/verein/78072",
    "CA Platense": "https://www.transfermarkt.com.ar/club-atletico-platense/startseite/verein/928",
    "CA Nueva Chicago": "https://www.transfermarkt.com.ar/nueva-chicago/startseite/verein/10534",
    "Real Pilar FC": "https://www.transfermarkt.com.ar/real-pilar/startseite/verein/75858",
    "CSD Tristán Suárez": "https://www.transfermarkt.com.ar/csd-tristan-suarez/startseite/verein/1771",
    "CA Barracas Central": "https://www.transfermarkt.com.ar/club-atletico-barracas-central/startseite/verein/25184",
    "Barcelona SC Guayaquil": "https://www.transfermarkt.com.ar/barcelona-sc-guayaquil/startseite/verein/3523",
    "CS Dock Sud": "https://www.transfermarkt.com.ar/club-sportivo-dock-sud/startseite/verein/14675",
    "Club Atlético Tucumán": "https://www.transfermarkt.com.ar/club-atletico-tucuman/startseite/verein/14554",
    "Liverpool FC Montevideo": "https://www.transfermarkt.com.ar/liverpool-fc-montevideo/startseite/verein/10663",
    "CA Rosario Central": "https://www.transfermarkt.com.ar/club-atletico-rosario-central/startseite/verein/1418",
    "Club atletico San Martín San Juan": "https://www.transfermarkt.com.ar/club-atletico-san-martin-sj-/startseite/verein/10511"
}

def crear_driver(headless=False):
    """Configura y retorna una instancia de Chrome WebDriver.
    NOTA: Es recomendado usar headless=False para asegurar que todo el contenido se cargue correctamente."""
    options = Options()
    if headless:
        options.add_argument("--headless=new")
    
    # Suppress console logging
    options.add_argument("--log-level=3")
    options.add_argument("--disable-logging")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1920,1080")
    
    # Random user agent
    user_agents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
    ]
    options.add_argument(f"user-agent={random.choice(user_agents)}")
    
    return webdriver.Chrome(options=options)

def scroll_to_view_matches(driver):
    """Simula el scroll por la página para asegurar que el contenido lazy-loaded se cargue."""
    print("Realizando scroll para cargar contenido...")
    try:
        # Scrollear hacia abajo gradualmente para activar carga de contenido
        total_height = driver.execute_script("return document.body.scrollHeight")
        viewport_height = driver.execute_script("return window.innerHeight")
        steps = min(10, max(3, int(total_height / viewport_height)))
        
        for i in range(1, steps + 1):
            scroll_position = i * total_height / steps
            driver.execute_script(f"window.scrollTo(0, {scroll_position});")
            print(f"  Scroll progreso: {i}/{steps}")
            time.sleep(0.7)  # Dar tiempo para que el contenido se cargue
        
        # Enfocarse en el área donde normalmente están los partidos (1/3 del camino hacia abajo)
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight/3);")
        print("  Enfocando sección de partidos...")
        time.sleep(2)
        
        # Volver al inicio
        driver.execute_script("window.scrollTo(0, 0);")
        time.sleep(1)
        
        print("✓ Scroll completado")
    except Exception as e:
        print(f"! Error durante scroll: {str(e)}")

def aceptar_cookies(driver):
    """Acepta cookies si aparece el banner."""
    try:
        WebDriverWait(driver, 5).until(
            EC.frame_to_be_available_and_switch_to_it((By.CSS_SELECTOR, "iframe[src*='consent']"))
        )
        aceptar_btn = WebDriverWait(driver, 5).until(
            EC.element_to_be_clickable((By.XPATH, '//button[contains(text(),"Aceptar y continuar")]'))
        )
        aceptar_btn.click()
        time.sleep(1)
        driver.switch_to.default_content()
        logging.info("Cookies aceptadas")
    except Exception:
        driver.switch_to.default_content()
        logging.info("No se encontró banner de cookies o ya fue aceptado")

def extraer_proximo_partido(driver, equipo_nombre):
    """Extrae información del próximo partido. Siempre devuelve 4 valores."""
    try:
        html = driver.page_source
        soup = BeautifulSoup(html, 'html.parser')
        
        print(f"Buscando partidos para {equipo_nombre}...")
        
        # Verificar si hay un contenedor de partidos
        matches_container = soup.find('tm-matches') or soup.find('section', class_='tm-matches')
        
        if not matches_container:
            logging.warning(f"No se encontró contenedor de partidos para {equipo_nombre}")
            return None, None, None, None
            
        # Buscar slides de partidos
        slides = matches_container.find_all('swiper-slide') or matches_container.find_all('div', class_='matches')
        
        if not slides:
            logging.warning(f"No se encontraron partidos para {equipo_nombre}")
            return None, None, None, None
        
        # Debug - contar cuántos slides/partidos hay
        print(f"Encontrados {len(slides)} partidos potenciales")
        
        for slide in slides:
            # Buscar elementos de resultado con diferentes selectores
            result_element = (
                slide.select_one('a[class*="result-state"][class*="fixture"]') or
                slide.select_one('.result-state--fixture') or
                slide.select_one('a[href*="spielbericht"]')
            )
            
            if not result_element:
                continue
                
            result_text = result_element.get_text().strip() if result_element else ""
            print(f"Resultado encontrado: '{result_text}'")
            
            # Verificar si es partido futuro
            if '-:-' in result_text or (result_element.get('class', []) and 'fixture' in ' '.join(result_element.get('class', []))):
                print(f"Es un partido futuro")
                
                # Extraer fecha y hora
                time_element = slide.find('div', class_='competition-time')
                fecha_hora = time_element.get_text().strip() if time_element else "Fecha no disponible"
                print(f"Fecha/hora: {fecha_hora}")
                
                # Extraer equipos
                teams = slide.find_all('div', class_='team')
                
                if len(teams) >= 2:
                    equipo_local_elem = teams[0].find('div', class_='club-name')
                    equipo_visitante_elem = teams[1].find('div', class_='club-name')
                    
                    local = equipo_local_elem.get_text().strip() if equipo_local_elem else "Equipo no disponible"
                    visitante = equipo_visitante_elem.get_text().strip() if equipo_visitante_elem else "Equipo no disponible"
                    
                    print(f"Local: {local}, Visitante: {visitante}")
                    
                    # También intentar obtener la competición
                    competition_element = slide.find('div', class_='competition-name')
                    competicion = competition_element.get_text().strip() if competition_element else "Desconocida"
                    print(f"Competición: {competicion}")
                    
                    return local, visitante, fecha_hora, competicion
        
        logging.warning(f"No se encontró próximo partido para {equipo_nombre}")
        return None, None, None, None
        
    except Exception as e:
        logging.error(f"Error al extraer partido de {equipo_nombre}: {str(e)}")
        print(f"Error detallado: {traceback.format_exc()}")
        return None, None, None, None  # Siempre devolver 4 valores aunque haya error

def main():
    """Función principal que procesa todos los equipos."""
    print("\n==================================================")
    print(" SCRAPER DE PRÓXIMOS PARTIDOS - TRANSFERMARKT ")
    print("==================================================\n")
    
    fecha_actual = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    logging.info(f"Iniciando scraping de partidos en Transfermarkt - Fecha: {fecha_actual}")
    
    # Lista para almacenar los resultados
    resultados = []
    
    # Equipos procesados correctamente e incorrectamente
    equipos_ok = []
    equipos_error = []
    
    driver = None
    try:
        driver = crear_driver(headless=False)  # ¡IMPORTANTE! Mantener headless=False para asegurar carga correcta
        
        # Contador de equipos procesados
        total = len(equipos)
        contador = 0
        
        # Procesar cada equipo
        for nombre_equipo, url in equipos.items():
            contador += 1
            print(f"\n[{contador}/{total}] Procesando: {nombre_equipo}")
            print(f"URL: {url}")
            logging.info(f"Procesando: {nombre_equipo} ({contador}/{total})")
            
            for intento in range(3):  # Intentar hasta 3 veces en caso de error
                try:
                    print(f"Intento {intento+1}/3...")
                    driver.get(url)
                    
                    # Esperar carga básica
                    WebDriverWait(driver, 15).until(EC.presence_of_element_located((By.TAG_NAME, "body")))
                    
                    # Aceptar cookies
                    aceptar_cookies(driver)
                    
                    # IMPORTANTE: Realizar scroll para activar carga de contenido lazy-loaded
                    scroll_to_view_matches(driver)
                    
                    # Extraer datos - asegurándonos de recibir 4 valores
                    local, visitante, fecha_hora, competicion = extraer_proximo_partido(driver, nombre_equipo)
                    
                    if local and visitante:
                        # Formatear el resultado y guardarlo
                        resultado = {
                            "equipo": nombre_equipo,
                            "local": local,
                            "visitante": visitante,
                            "fecha_hora": fecha_hora,
                            "competicion": competicion if competicion else "Desconocida",
                            "fecha_consulta": fecha_actual
                        }
                        resultados.append(resultado)
                        equipos_ok.append(nombre_equipo)
                        print(f"✓ Éxito: {local} vs {visitante} - {fecha_hora}")
                        logging.info(f"Éxito: {local} vs {visitante} - {fecha_hora}")
                        break  # Salir del bucle de intentos si tuvo éxito
                    else:
                        print(f"× Intento {intento+1}: No se encontraron datos")
                        if intento == 2:  # Si es el último intento
                            resultados.append({
                                "equipo": nombre_equipo,
                                "local": "Error",
                                "visitante": "Error",
                                "fecha_hora": "Error",
                                "competicion": "Error",
                                "fecha_consulta": fecha_actual
                            })
                            equipos_error.append(nombre_equipo)
                        time.sleep(2)  # Esperar antes de reintentar
                
                except Exception as e:
                    print(f"× Error en intento {intento+1}: {str(e)[:100]}...")
                    logging.error(f"Error en intento {intento+1} para {nombre_equipo}: {str(e)}")
                    
                    if intento == 2:  # Si es el último intento
                        resultados.append({
                            "equipo": nombre_equipo,
                            "local": "Error",
                            "visitante": "Error",
                            "fecha_hora": "Error",
                            "competicion": "Error",
                            "fecha_consulta": fecha_actual
                        })
                        equipos_error.append(nombre_equipo)
                    
                    time.sleep(3)  # Esperar antes de reintentar
            
            # Pausa entre equipos para evitar bloqueos
            tiempo_espera = random.uniform(2, 5)
            print(f"Esperando {tiempo_espera:.1f}s antes del siguiente equipo...")
            time.sleep(tiempo_espera)
            
            # Guardar resultados parciales cada 5 equipos
            if contador % 5 == 0 or contador == total:
                try:
                    df_parcial = pd.DataFrame(resultados)
                    filename_parcial = f"proximos_partidos_parcial.csv"
                    df_parcial.to_csv(filename_parcial, index=False, encoding='utf-8-sig')
                    print(f"✓ Guardado parcial realizado ({contador}/{total} equipos)")
                except Exception as e:
                    print(f"! Error al guardar parcial: {str(e)}")
        
        # Crear un DataFrame con los resultados finales
        df = pd.DataFrame(resultados)
        
        # Guardar a CSV
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"proximos_partidos_{timestamp}.csv"
        df.to_csv(filename, index=False, encoding='utf-8-sig')
        logging.info(f"Resultados guardados en {filename}")
        
        # También guardar en formato Excel si es posible
        try:
            excel_filename = f"proximos_partidos_{timestamp}.xlsx"
            df.to_excel(excel_filename, index=False)
            print(f"✓ Resultados guardados en Excel: {excel_filename}")
        except Exception as e:
            print(f"! Error al guardar Excel: {str(e)}")
        
        # Mostrar tabla de resultados
        print("\n==================================================")
        print(" RESUMEN DE PRÓXIMOS PARTIDOS ")
        print("==================================================")
        print(f"Total equipos: {total}")
        print(f"Equipos con datos: {len(equipos_ok)} ({', '.join(equipos_ok[:5]) + ('...' if len(equipos_ok) > 5 else '')})")
        print(f"Equipos sin datos: {len(equipos_error)} ({', '.join(equipos_error) if equipos_error else 'Ninguno'})")
        print("\nRESUMEN DE PRÓXIMOS PARTIDOS:")
        print(df[["equipo", "local", "visitante", "fecha_hora", "competicion"]])
        print(f"\nResultados guardados en: {filename}")
        
    except Exception as e:
        logging.error(f"Error general: {str(e)}")
        print(f"! Error general: {str(e)}")
        
        # Intentar guardar los datos que se hayan recopilado hasta el momento
        if resultados:
            try:
                df_emergency = pd.DataFrame(resultados)
                emergency_file = f"proximos_partidos_emergency_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
                df_emergency.to_csv(emergency_file, index=False, encoding='utf-8-sig')
                print(f"✓ Datos parciales guardados en caso de emergencia: {emergency_file}")
            except:
                print("! No se pudieron guardar datos de emergencia")
    finally:
        if driver:
            driver.quit()
        logging.info("Proceso finalizado")
        print("\nProceso finalizado")

if __name__ == "__main__":
    main()
