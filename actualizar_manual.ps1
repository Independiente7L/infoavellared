# Script simple para actualizar Santiago Lopez con datos reales
Write-Host "ACTUALIZANDO SANTIAGO LOPEZ CON DATOS REALES" -ForegroundColor Green

# Datos conocidos del próximo partido de Rosario Central
$fechaPartido = "09/08/2025"  # sábado vs Atlético Tucumán
$rivalNombre = "Atl. Tucuman"
$jugadorNombre = "Santiago Lopez"  # Sin acentos para evitar problemas

# Convertir fecha a timestamp
$fechaObj = [DateTime]::ParseExact($fechaPartido, 'dd/MM/yyyy', $null)
$timestamp = [DateTimeOffset]::new($fechaObj).ToUnixTimeMilliseconds()

Write-Host "Actualizando con:"
Write-Host "  Jugador: $jugadorNombre"
Write-Host "  Rival: $rivalNombre"
Write-Host "  Fecha: $fechaPartido"
Write-Host "  Timestamp: $timestamp"

try {
    # Cargar JSON
    $jsonContent = Get-Content "data.json" -Raw -Encoding UTF8
    $players = $jsonContent | ConvertFrom-Json
    
    # Buscar jugador por nombre (usando Like para mayor flexibilidad)
    $santiago = $players | Where-Object { $_.Jugador -like "*Santiago*" -and $_.Jugador -like "*L*pez*" }
    
    if ($santiago) {
        Write-Host "JUGADOR ENCONTRADO: $($santiago.Jugador)" -ForegroundColor Green
        Write-Host "Club: $($santiago.'Club Actual')"
        Write-Host "Rival anterior: $($santiago.'Proximo Rival')"
        Write-Host "Fecha anterior: $($santiago.'Proximo Partido')"
        
        # Crear una copia actualizada del JSON como texto y hacer reemplazo directo
        $jsonText = $jsonContent
        
        # Encontrar el bloque de Santiago y actualizar los campos específicos
        $pattern = '("Jugador":\s*"Santiago[^"]*"[\s\S]*?"Pr[^"]*ximo Rival":\s*")[^"]*("[\s\S]*?"Pr[^"]*ximo Partido":\s*)([0-9]+)'
        $replacement = "`${1}$rivalNombre`${2}$timestamp"
        
        if ($jsonText -match $pattern) {
            $newJsonText = $jsonText -replace $pattern, $replacement
            
            # Guardar archivo actualizado
            Set-Content -Path "data.json" -Value $newJsonText -Encoding UTF8
            
            Write-Host "ARCHIVO ACTUALIZADO EXITOSAMENTE" -ForegroundColor Green
            
            # Verificar cambios
            $newData = Get-Content "data.json" -Raw -Encoding UTF8 | ConvertFrom-Json
            $updatedSantiago = $newData | Where-Object { $_.Jugador -like "*Santiago*" -and $_.Jugador -like "*L*pez*" }
            
            if ($updatedSantiago) {
                Write-Host "VERIFICACION EXITOSA:" -ForegroundColor Green
                Write-Host "  Nuevo rival: $($updatedSantiago.'Proximo Rival')" -ForegroundColor White
                Write-Host "  Nueva fecha: $($updatedSantiago.'Proximo Partido')" -ForegroundColor White
            }
        } else {
            Write-Host "ERROR: No se pudo encontrar el patron para actualizar" -ForegroundColor Red
        }
        
    } else {
        Write-Host "ERROR: No se encontro a Santiago Lopez en el JSON" -ForegroundColor Red
        
        # Mostrar todos los jugadores para debug
        Write-Host "Jugadores disponibles:" -ForegroundColor Yellow
        $players | ForEach-Object { Write-Host "  - $($_.Jugador)" -ForegroundColor Gray }
    }
    
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "PROCESO COMPLETADO" -ForegroundColor Green

# Mostrar cómo aplicar esto a otros jugadores
Write-Host ""
Write-Host "=== COMO USAR PARA OTROS JUGADORES ===" -ForegroundColor Cyan
Write-Host "1. Busca en Google: 'nombre_del_club proximo partido'"
Write-Host "2. Anota la fecha y rival del próximo partido"
Write-Host "3. Ejecuta este script cambiando los valores al inicio"
Write-Host "4. El script actualizará automáticamente el JSON"
