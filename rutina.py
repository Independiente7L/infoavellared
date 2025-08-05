import subprocess
import sys
import os
import time


# 3. Actualizar datos en Excel (requiere Excel instalado)
import win32com.client
import pythoncom

excel_path = os.path.abspath("tm_completo.xlsx")
excel = None
try:
    pythoncom.CoInitialize()
    excel = win32com.client.Dispatch("Excel.Application")
    excel.Visible = False  # No mostrar ventana

    wb = excel.Workbooks.Open(excel_path)
    wb.RefreshAll()

    # Esperar a que termine la actualización
    while excel.CalculationState != -1:  # -1 = xlDone
        time.sleep(1)

    wb.Save()
    wb.Close(SaveChanges=1)
    excel.Quit()
finally:
    # Forzar cierre del proceso Excel si sigue abierto
    if excel is not None:
        try:
            excel.Quit()
        except Exception:
            pass
    del excel

# 4. Ejecutar json_tm.py
subprocess.run([sys.executable, "json_tm.py"], check=True)

# 5. Hacer git add, commit y push
subprocess.run(["git", "add", "."], check=True)
subprocess.run(["git", "commit", "-m", "actualizacion de rutina"], check=True)
subprocess.run(["git", "push", "origin", "main"], check=True)

print("✅ Rutina completada exitosamente.")
