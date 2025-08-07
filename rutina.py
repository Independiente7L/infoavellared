import subprocess
import sys
import os
import time

# 1. Ejecutar actualizar_tm.py
subprocess.run([sys.executable, "actualizar_tm.py"], check=True)

# 2. Ejecutar clubes_tm.py
subprocess.run([sys.executable, "scrap_prox_part.py"], check=True)

# 3. Actualizar datos en Excel (requiere Excel instalado)
import win32com.client
import pythoncom

excel_path = os.path.abspath("tm_completo.xlsx")
excel = None
try:
    pythoncom.CoInitialize()
    excel = win32com.client.DispatchEx("Excel.Application")
    wb = excel.Workbooks.Open(excel_path, ReadOnly=False)
    wb.RefreshAll()
    # Espera a que terminen las consultas asíncronas (si tu versión lo permite)
    try:
        excel.CalculateUntilAsyncQueriesDone()
    except Exception:
        print("Método CalculateUntilAsyncQueriesDone no disponible. Usando espera fija.")
        time.sleep(30)  # Aumenta este tiempo si tus datos tardan más

    wb.Save()
    wb.Close(SaveChanges=1)
    excel.Quit()
finally:
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
