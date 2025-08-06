import subprocess
import sys
import os
import time
import win32com.client
import pythoncom

excel_path = os.path.abspath("tm_completo.xlsx")
excel = None
try:
    pythoncom.CoInitialize()
    excel = win32com.client.DispatchEx("Excel.Application")
    # Hazlo visible si quieres depurar
    try:
        excel.Visible = True
    except Exception:
        pass
    wb = excel.Workbooks.Open(excel_path)
    wb.RefreshAll()

    # Opcional: Forzar recalculo completo
    try:
        excel.CalculateFullRebuild()
        excel.CalculateUntilAsyncQueriesDone()
    except Exception:
        pass

    # Espera fija para dar tiempo a que termine actualización
    time.sleep(12)  # Puedes ajustar este tiempo

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

# Ejecutar json_tm.py
subprocess.run([sys.executable, "json_tm.py"], check=True)

# Hacer git add, commit y push
subprocess.run(["git", "add", "."], check=True)
subprocess.run(["git", "commit", "-m", "actualizacion de rutina"], check=True)
subprocess.run(["git", "push", "origin", "main"], check=True)

print("✅ Rutina completada exitosamente.")
