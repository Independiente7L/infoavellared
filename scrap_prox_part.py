import pandas as pd
from datetime import datetime
import re
import time
from urllib.parse import unquote
import logging
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.common.exceptions import TimeoutException, NoSuchElementException, WebDriverException

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class FootballScraperSelenium:
    def __init__(self):
        self.results = []
        self.driver = None
        self.successful_extractions = 0
        self.excel_filename = "proximos_partidos.xlsx"
        
        # Mapeo de URLs a equipos específicos
        self.team_mapping = {
            'arsenal': 'Arsenal FC',
            'union+magdalena': 'AD Union Magdalena',
            'gimnasia+mendoza': 'CA Gimnasia y Esgrima (Mendoza)',
            'puebla': 'Club Puebla',
            'tigre': 'CA Tigre',
            'chacarita': 'CA Chacarita Juniors',
            'los+andes': 'CA Los Andes',
            'volos': 'Volos NPS',
            'boston+river': 'CA Boston River',
            'maldonado': 'Club Deportivo Maldonado',
            'circulo+deportivo': 'Círculo Deportivo',
            'platense': 'CA Platense',
            'nueva+chicago': 'CA Nueva Chicago',
            'real+pilar': 'Real Pilar FC',
            'tristan+suarez': 'CSD Tristán Suárez',
            'barracas+central': 'CA Barracas Central',
            'barcelona+guayaquil': 'Barcelona SC Guayaquil',
            'dock+sud': 'CS Dock Sud',
            'atletico+tucuman': 'Club Atlético Tucumán',
            'liverpool+montevideo': 'Liverpool FC Montevideo',
            'rosario+central': 'CA Rosario Central',
            'san+martin+san+juan': 'CA San Martín (San Juan)'
        }
    
    def setup_selenium(self):
        """Configura Selenium WebDriver"""
        try:
            logging.info("🔧 Configurando Selenium WebDriver...")
            chrome_options = Options()
            chrome_options.add_argument("--headless")
            chrome_options.add_argument("--no-sandbox")
            chrome_options.add_argument("--disable-dev-shm-usage")
            chrome_options.add_argument("--disable-blink-features=AutomationControlled")
            chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
            chrome_options.add_experimental_option('useAutomationExtension', False)
            chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
            
            self.driver = webdriver.Chrome(options=chrome_options)
            self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            self.wait = WebDriverWait(self.driver, 15)
            logging.info("✅ Selenium configurado correctamente")
        except Exception as e:
            logging.error(f"❌ Error configurando Selenium: {e}")
            raise
    
    def extract_team_from_url(self, url):
        """Extrae el nombre del equipo de la URL de búsqueda usando el mapeo específico"""
        try:
            decoded_url = unquote(url).lower()
            
            # Buscar en el mapeo específico
            for key, team_name in self.team_mapping.items():
                if key in decoded_url:
                    return team_name
            
            # Fallback: extraer de la URL como antes
            match = re.search(r'[?&]q=([^&]+)', decoded_url)
            if match:
                query = match.group(1).replace('+', ' ')
                team_name = re.sub(r'\s*(proximo|próximo)\s*partido\s*', '', query, flags=re.IGNORECASE).strip()
                return team_name.title()
                
        except Exception as e:
            logging.error(f"Error extrayendo equipo de URL: {e}")
        return "Equipo no identificado"
    
    def determine_rival(self, team_searched, equipo_local, equipo_visitante):
        """Determina cuál es el rival del equipo que se busca"""
        try:
            # Normalizar nombres para comparación
            team_searched_norm = team_searched.lower()
            local_norm = equipo_local.lower()
            visitante_norm = equipo_visitante.lower()
            
            # Buscar coincidencias parciales con el equipo buscado
            if any(word in local_norm for word in team_searched_norm.split() if len(word) > 3):
                return equipo_visitante
            elif any(word in visitante_norm for word in team_searched_norm.split() if len(word) > 3):
                return equipo_local
            else:
                # Si no hay coincidencia clara, intentar con palabras clave del equipo
                team_keywords = team_searched_norm.replace('ca ', '').replace('fc ', '').replace('club ', '').split()
                
                for keyword in team_keywords:
                    if len(keyword) > 3:
                        if keyword in local_norm:
                            return equipo_visitante
                        elif keyword in visitante_norm:
                            return equipo_local
                
                # Si aún no hay coincidencia, retornar info del partido
                return f"vs {equipo_visitante}" if equipo_local != 'No encontrado' else 'No identificado'
                
        except Exception as e:
            logging.error(f"Error determinando rival: {e}")
            return 'Error determinando rival'
    
    def scrape_match_info(self, url):
        """Extrae información del partido usando Selenium"""
        try:
            if self.driver is None:
                self.setup_selenium()
            
            team_searched = self.extract_team_from_url(url)
            logging.info(f"🌐 Procesando con Selenium: {team_searched}")
            
            self.driver.get(url)
            time.sleep(5)  # Esperar a que cargue la página
            
            match_info = {
                'Club Actual': team_searched,
                'equipo_local': 'No encontrado',
                'equipo_visitante': 'No encontrado',
                'Próximo Partido': 'No encontrada',
                'competicion': 'No encontrada',
                'fase_jornada': 'No encontrada',
                'jornada_numero': 'No encontrada',
                'estado': 'Próximo',
                'Próximo Rival': 'No identificado'
            }
            
            # Buscar equipos
            team_selectors = [
                "div.imso_mh__tm-nm span[aria-hidden='true']",
                "span[aria-hidden='true']",
                "div.ellipsisize span[aria-hidden='true']"
            ]
            
            teams_found = []
            for selector in team_selectors:
                try:
                    elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    for elem in elements:
                        text = elem.text.strip()
                        if text and len(text) > 1 and text not in teams_found:
                            teams_found.append(text)
                    if len(teams_found) >= 2:
                        break
                except Exception:
                    continue
            
            if len(teams_found) >= 2:
                match_info['equipo_local'] = teams_found[0]
                match_info['equipo_visitante'] = teams_found[1]
                
                # Determinar el rival
                match_info['Próximo Rival'] = self.determine_rival(
                    team_searched, 
                    match_info['equipo_local'], 
                    match_info['equipo_visitante']
                )
            
            # Buscar competición
            comp_selectors = [
                "span.imso-ln",
                "span[jscontroller='zhya9d']",
                "span[style*='color:#E9C018']"
            ]
            
            for selector in comp_selectors:
                try:
                    elem = self.driver.find_element(By.CSS_SELECTOR, selector)
                    if elem.text.strip():
                        match_info['competicion'] = elem.text.strip()
                        break
                except Exception:
                    continue
            
            # Buscar fecha y hora
            datetime_selectors = [
                "span.imso_mh__lr-dt-ds",
                "span[class*='dt-ds']"
            ]
            
            for selector in datetime_selectors:
                try:
                    elem = self.driver.find_element(By.CSS_SELECTOR, selector)
                    if elem.text.strip():
                        match_info['Próximo Partido'] = elem.text.strip()
                        break
                except Exception:
                    continue
            
            # Buscar fase y jornada
            try:
                elements = self.driver.find_elements(By.CSS_SELECTOR, "div.imso_mh_s__lg-st-srs div")
                for elem in elements:
                    text = elem.text.strip()
                    if text and ('jornada' in text.lower() or 'fase' in text.lower()):
                        match_info['fase_jornada'] = text
                        jornada_match = re.search(r'jornada\s*(\d+)', text, re.IGNORECASE)
                        if jornada_match:
                            match_info['jornada_numero'] = jornada_match.group(1)
                        break
            except Exception:
                pass
            
            # Verificar si encontramos información útil
            useful_data = (
                match_info['equipo_local'] != 'No encontrado' or 
                match_info['competicion'] != 'No encontrada' or 
                match_info['Próximo Partido'] != 'No encontrada'
            )
            
            if useful_data:
                logging.info(f"✅ Extracción exitosa para {team_searched}")
                self.successful_extractions += 1
            else:
                logging.warning(f"⚠️ No se encontraron datos útiles para {team_searched}")
                match_info['estado'] = 'Sin datos'
                
            return match_info
                
        except Exception as e:
            logging.error(f"❌ Error procesando {url}: {str(e)}")
            team_searched = self.extract_team_from_url(url)
            return {
                'Club Actual': team_searched,
                'equipo_local': 'Error en extracción',
                'equipo_visitante': 'Error en extracción',
                'Próximo Partido': 'Error',
                'competicion': 'Error',
                'fase_jornada': 'Error',
                'jornada_numero': 'Error',
                'estado': 'Error',
                'Próximo Rival': 'Error'
            }
    
    def scrape_multiple_urls(self, urls):
        """Procesa múltiples URLs"""
        logging.info(f"🚀 Iniciando scraping de {len(urls)} URLs con Selenium")
        
        for i, url in enumerate(urls, 1):
            logging.info(f"\n📊 Procesando URL {i}/{len(urls)}")
            logging.info(f"🔗 {url[:100]}...")
            
            match_info = self.scrape_match_info(url)
            self.results.append(match_info)
            
            # Pausa entre requests para evitar bloqueos
            if i < len(urls):
                time.sleep(3)
        
        return self.results
    
    def update_excel(self):
        """Actualiza el archivo Excel existente o crea uno nuevo"""
        try:
            df_new = pd.DataFrame(self.results)
            
            # Reordenar columnas según especificaciones
            column_order = [
                'Club Actual', 'Próximo Rival', 'Próximo Partido',
                'equipo_local', 'equipo_visitante', 'competicion', 
                'fase_jornada', 'jornada_numero', 'estado'
            ]
            df_new = df_new[column_order]
            
            # Verificar si el archivo existe
            if os.path.exists(self.excel_filename):
                logging.info(f"📝 Actualizando archivo existente: {self.excel_filename}")
                
                # Leer el archivo existente
                try:
                    df_existing = pd.read_excel(self.excel_filename, sheet_name='Sheet1')
                    
                    # Actualizar los datos existentes o agregar nuevos
                    for _, new_row in df_new.iterrows():
                        equipo = new_row['Club Actual']
                        
                        # Buscar si el equipo ya existe
                        if equipo in df_existing['Club Actual'].values:
                            # Actualizar la fila existente
                            idx = df_existing[df_existing['Club Actual'] == equipo].index[0]
                            for col in df_new.columns:
                                df_existing.loc[idx, col] = new_row[col]
                            logging.info(f"🔄 Actualizado: {equipo}")
                        else:
                            # Agregar nueva fila
                            df_existing = pd.concat([df_existing, new_row.to_frame().T], ignore_index=True)
                            logging.info(f"➕ Agregado: {equipo}")
                    
                    df_final = df_existing
                    
                except Exception as e:
                    logging.warning(f"⚠️ Error leyendo archivo existente: {e}")
                    logging.info("📝 Creando archivo nuevo con los datos actuales")
                    df_final = df_new
            else:
                logging.info(f"📝 Creando nuevo archivo: {self.excel_filename}")
                df_final = df_new
            
            # Crear hoja de estadísticas
            stats_data = {
                'Métrica': [
                    'Total equipos procesados',
                    'Extracciones exitosas',
                    'Tasa de éxito (%)',
                    'Método utilizado',
                    'Última actualización'
                ],
                'Valor': [
                    len(self.results),
                    self.successful_extractions,
                    f"{(self.successful_extractions / len(self.results) * 100):.1f}%" if self.results else "0%",
                    'Selenium',
                    datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                ]
            }
            stats_df = pd.DataFrame(stats_data)
            
            # Guardar en Excel
            with pd.ExcelWriter(self.excel_filename, engine='openpyxl') as writer:
                df_final.to_excel(writer, sheet_name='Sheet1', index=False)
                stats_df.to_excel(writer, sheet_name='Estadísticas', index=False)
                
                # Ajustar ancho de columnas
                for sheet_name in writer.sheets:
                    worksheet = writer.sheets[sheet_name]
                    for column in worksheet.columns:
                        max_length = 0
                        column_letter = column[0].column_letter
                        for cell in column:
                            try:
                                if len(str(cell.value)) > max_length:
                                    max_length = len(str(cell.value))
                            except:
                                pass
                        adjusted_width = min(max_length + 3, 60)
                        worksheet.column_dimensions[column_letter].width = adjusted_width
            
            logging.info(f"📊 Archivo actualizado: {self.excel_filename}")
            return self.excel_filename
            
        except Exception as e:
            logging.error(f"❌ Error actualizando Excel: {e}")
            return None
    
    def print_results(self):
        """Muestra los resultados en consola"""
        print("\n" + "="*100)
        print("🏆 RESULTADOS DEL SCRAPING CON SELENIUM - 22 EQUIPOS")
        print("="*100)
        
        for i, result in enumerate(self.results, 1):
            print(f"\n{i}. 🔍 EQUIPO: {result['Club Actual']}")
            print(f"   ⚡ Próximo Rival: {result['Próximo Rival']}")
            print(f"   📅 Próximo Partido: {result['Próximo Partido']}")
            print(f"   🏆 Competición: {result['competicion']}")
            print("-" * 100)
    
    def print_statistics(self):
        """Muestra estadísticas del scraping"""
        total = len(self.results)
        
        print(f"\n📊 ESTADÍSTICAS DEL SCRAPING")
        print("="*50)
        print(f"📈 URLs procesadas: {total}")
        print(f"✅ Extracciones exitosas: {self.successful_extractions}")
        print(f"📊 Tasa de éxito: {(self.successful_extractions/total*100):.1f}%")
        print(f"🔧 Método utilizado: Selenium únicamente")
        print(f"📁 Archivo Excel: {self.excel_filename}")
        print(f"⏰ Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    def close(self):
        """Cierra el driver de Selenium"""
        if self.driver:
            self.driver.quit()
            logging.info("🔧 Driver de Selenium cerrado")

def main():
    """Función principal"""
    # URLs completas para los 22 equipos
    urls = [
        # URLs existentes (3)
        "https://www.google.com/search?q=chacarita+proximo+partido&sca_esv=78cfef7a28cb5e8a&rlz=1C1GCEU_esAR965AR965&sxsrf=AE3TifPJr_kfVEaB4TZZ9yExTc9dGQEwaA%3A1754493858429&ei=onOTaOf7GZfY1sQPgaCh-QE&oq=chacarota+proximo+partido&gs_lp=Egxnd3Mtd2l6LXNlcnAiGWNoYWNhcm90YSBwcm94aW1vIHBhcnRpZG8qAggAMgcQIxiwAhgnMggQABgIGA0YHjIIEAAYgAQYogQyCBAAGIAEGKIEMggQABiABBiiBEjDDlAAWLsIcAB4AZABAJgBe6AB6waqAQM2LjO4AQPIAQD4AQGYAgegAu8FwgIGEAAYBxgewgIFEAAYgATCAggQABgHGAgYHsICCBAAGAUYBxgemAMAkgcDMi41oAeJNbIHAzIuNbgH7wXCBwUyLTEuNsgHSg&sclient=gws-wiz-serp",
        "https://www.google.com/search?q=tigre+proximo+partido&sca_esv=78cfef7a28cb5e8a&rlz=1C1GCEU_esAR965AR965&sxsrf=AE3TifPNgYOHeMHP_a6tgBK0orEmiocH2A%3A1754494095394&ei=j3STaKnoF5HJ1sQPlKOfgAo&ved=0ahUKEwjp68Pqv_aOAxWRpJUCHZTRB6AQ4dUDCBA&uact=5&oq=tigre+proximo+partido&gs_lp=Egxnd3Mtd2l6LXNlcnAiFXRpZ3JlIHByb3hpbW8gcGFydGlkbzIGEAAYBxgeMgYQABgHGB4yBhAAGAcYHjIGEAAYBxgeMgYQABgHGB4yBhAAGAcYHjIGEAAYBxgeMgYQABgHGB4yBhAAGAcYHjIGEAAYBxgeSMujAVDafljsnwFwCHgBkAEAmAHjAaAB5AqqAQYxMi4xLjG4AQPIAQD4AQGYAhSgAocKwgIKEAAYsAMY1gQYR8ICCBAAGAUYBxgewgIIEAAYBxgIGB7CAgYQABgFGB7CAgcQIxiwAhgnwgIIEAAYgAQYogTCAgoQIxiABBgnGIoFwgIGEAAYCBgemAMAiAYBkAYIkgcEMTguMqAH8F-yBwQxMC4yuAewCcIHBjItNS4xNcgHzQE&sclient=gws-wiz-serp",
        "https://www.google.com/search?q=platense+proximo+partido&sca_esv=78cfef7a28cb5e8a&rlz=1C1GCEU_esAR965AR965&sxsrf=AE3TifPdJaZ7_0X3_Snv5c_vKyp4vUOcOw%3A1754494130644&ei=snSTaIiJJ5Kq1sQP_uCAUA&oq=platense+proximo+partido&gs_lp=Egxnd3Mtd2l6LXNlcnAiGHBsYXRlbnNlIHByb3hpbW8gcGFydGlkbyoCCAAyChAjGIAEGCcYigUyCBAAGAUYBxgeMggQABgFGAcYHjIGEAAYCBgeMgYQABgIGB4yBhAAGAgYHjIGEAAYCBgeMggQABiABBiiBDIIEAAYgAQYogRIlnNQql5YiGtwAXgCkAEAmAGcAaABrweqAQM1LjS4AQHIAQD4AQGYAgmgAukGwgIEEAAYR8ICBhAAGAcYHsICBhAAGAUYHsICBxAjGLACGCfCAggQABgHGAgYHpgDAIgGAZAGCJIHAzQuNaAH20SyBwMyLjW4B8MGwgcHMi0xLjcuMcgHXQ&sclient=gws-wiz-serp",
        "https://www.google.com/search?q=arsenal+de+sarandi+proximo+partido",
        "https://www.google.com/search?q=union+magdalena+proximo+partido",
        "https://www.google.com/search?q=gimnasia+mendoza+proximo+partido",
        "https://www.google.com/search?q=puebla+proximo+partido",
        "https://www.google.com/search?q=los+andes+proximo+partido",
        "https://www.google.com/search?q=volos+proximo+partido",
        "https://www.google.com/search?q=boston+river+proximo+partido",
        "https://www.google.com/search?q=maldonado+proximo+partido",
        "https://www.google.com/search?q=circulo+deportivo+proximo+partido",
        "https://www.google.com/search?q=nueva+chicago+proximo+partido",
        "https://www.google.com/search?q=real+pilar+proximo+partido",
        "https://www.google.com/search?q=tristan+suarez+proximo+partido",
        "https://www.google.com/search?q=barracas+central+proximo+partido",
        "https://www.google.com/search?q=barcelona+guayaquil+proximo+partido",
        "https://www.google.com/search?q=dock+sud+proximo+partido",
        "https://www.google.com/search?q=atletico+tucuman+proximo+partido",
        "https://www.google.com/search?q=liverpool+montevideo+proximo+partido",
        "https://www.google.com/search?q=rosario+central+proximo+partido",
        "https://www.google.com/search?q=san+martin+san+juan+proximo+partido"
    ]
    
    print("🚀 SCRAPER DE FÚTBOL - 22 EQUIPOS COMPLETOS")
    print("="*60)
    print("👤 Usuario: Independiente7L")
    print(f"📅 Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("🔧 Método: Selenium únicamente")
    print("📁 Archivo: proximos_partidos.xlsx")
    print(f"⚽ Equipos: 22 equipos completos")
    print("="*60)
    
    # Crear el scraper
    scraper = FootballScraperSelenium()
    
    try:
        # Procesar URLs
        results = scraper.scrape_multiple_urls(urls)
        
        # Mostrar resultados
        scraper.print_results()
        scraper.print_statistics()
        
        # Actualizar Excel
        filename = scraper.update_excel()
        if filename:
            print(f"\n✅ Archivo Excel actualizado: {filename}")
        else:
            print("\n❌ Error actualizando el archivo Excel")
        
    finally:
        # Cerrar recursos
        scraper.close()

if __name__ == "__main__":
    main()
