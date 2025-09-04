import subprocess
import sys
import os
import time


# 5. Hacer git add, commit y push
subprocess.run(["git", "add", "."], check=True)
subprocess.run(["git", "commit", "-m", "actualizacion de rutina"], check=True)
subprocess.run(["git", "push", "origin", "main"], check=True)

print("✅ Rutina completada exitosamente.")
