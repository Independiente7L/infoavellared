# ============================================================
# ACTUALIZADOR UNIVERSAL DE PROXIMOS PARTIDOS
# ============================================================
# Uso: .\actualizar_cualquier_jugador.ps1 -Jugador "Nombre" -Rival "Equipo" -Fecha "DD/MM/YYYY"

param(
    [string]$Jugador = "",
    [string]$Rival = "",
    [string]$Fecha = "",
    [switch]$ListarJugadores = $false
)

Write-Host "=== ACTUALIZADOR UNIVERSAL DE JUGADORES ===" -ForegroundColor Cyan

# Si se pide listar jugadores, mostrar todos
if ($ListarJugadores) {
    $data = Get-Content "data.json" | ConvertFrom-Json
    Write-Host "JUGADORES DISPONIBLES:" -ForegroundColor Green
    $i = 1
    $data | ForEach-Object { 
        Write-Host "$i. $($_.Jugador) - $($_.'Club Actual')" -ForegroundColor White
        $i++
    }
    return
}

# Validar parámetros
if (-not $Jugador -or -not $Rival -or -not $Fecha) {
    Write-Host "ERROR: Faltan parámetros requeridos" -ForegroundColor Red
    Write-Host ""
    Write-Host "USO:" -ForegroundColor Yellow
    Write-Host "  .\actualizar_cualquier_jugador.ps1 -Jugador 'Santiago Lopez' -Rival 'Atl. Tucuman' -Fecha '09/08/2025'"
    Write-Host ""
    Write-Host "EJEMPLOS:" -ForegroundColor Yellow
    Write-Host "  # Listar todos los jugadores:"
    Write-Host "  .\actualizar_cualquier_jugador.ps1 -ListarJugadores"
    Write-Host ""
    Write-Host "  # Actualizar un jugador:"
    Write-Host "  .\actualizar_cualquier_jugador.ps1 -Jugador 'Axel Poza' -Rival 'Estudiantes' -Fecha '15/08/2025'"
    return
}

try {
    # Convertir fecha a timestamp
    $fechaObj = [DateTime]::ParseExact($Fecha, 'dd/MM/yyyy', $null)
    $timestamp = [DateTimeOffset]::new($fechaObj).ToUnixTimeMilliseconds()
    
    Write-Host "ACTUALIZANDO JUGADOR:" -ForegroundColor Green
    Write-Host "  Jugador: $Jugador"
    Write-Host "  Rival: $Rival"
    Write-Host "  Fecha: $Fecha"
    Write-Host "  Timestamp: $timestamp"
    Write-Host ""
    
    # Cargar JSON
    $jsonContent = Get-Content "data.json" -Raw -Encoding UTF8
    $players = $jsonContent | ConvertFrom-Json
    
    # Buscar jugador (búsqueda flexible)
    $targetPlayer = $null
    $jugadorLimpio = $Jugador -replace "[áàâã]", "a" -replace "[éèê]", "e" -replace "[íìî]", "i" -replace "[óòôõ]", "o" -replace "[úùû]", "u" -replace "ñ", "n"
    
    foreach ($player in $players) {
        $nombrePlayer = $player.Jugador -replace "[áàâã]", "a" -replace "[éèê]", "e" -replace "[íìî]", "i" -replace "[óòôõ]", "o" -replace "[úùû]", "u" -replace "ñ", "n"
        
        if ($nombrePlayer -like "*$jugadorLimpio*" -or $jugadorLimpio -like "*$nombrePlayer*") {
            $targetPlayer = $player
            break
        }
    }
    
    if (-not $targetPlayer) {
        Write-Host "ERROR: No se encontró el jugador '$Jugador'" -ForegroundColor Red
        Write-Host "Jugadores disponibles:" -ForegroundColor Yellow
        $players | ForEach-Object { Write-Host "  - $($_.Jugador)" -ForegroundColor Gray }
        return
    }
    
    Write-Host "JUGADOR ENCONTRADO: $($targetPlayer.Jugador)" -ForegroundColor Green
    Write-Host "Club: $($targetPlayer.'Club Actual')"
    Write-Host "Rival anterior: $($targetPlayer.'Proximo Rival')"
    Write-Host "Fecha anterior: $($targetPlayer.'Proximo Partido')"
    Write-Host ""
    
    # Hacer el reemplazo en el JSON como texto
    $jsonText = $jsonContent
    $nombreExacto = $targetPlayer.Jugador
    
    # Patrón para encontrar y reemplazar el rival
    $rivalPattern = "(`"Jugador`":\s*`"$nombreExacto`"[\s\S]*?`"Proximo Rival`":\s*`")[^`"]*(`")"
    if ($jsonText -match $rivalPattern) {
        $jsonText = $jsonText -replace $rivalPattern, "`${1}$Rival`${2}"
        Write-Host "Rival actualizado" -ForegroundColor Green
    } else {
        Write-Host "No se pudo actualizar el rival" -ForegroundColor Red
    }
    
    # Patrón para encontrar y reemplazar la fecha
    $fechaPattern = "(`"Jugador`":\s*`"$nombreExacto`"[\s\S]*?`"Proximo Partido`":\s*)([0-9]+)"
    if ($jsonText -match $fechaPattern) {
        $jsonText = $jsonText -replace $fechaPattern, "`${1}$timestamp"
        Write-Host "Fecha actualizada" -ForegroundColor Green
    } else {
        Write-Host "No se pudo actualizar la fecha" -ForegroundColor Red
    }
    
    # Guardar archivo
    Set-Content -Path "data.json" -Value $jsonText -Encoding UTF8
    
    Write-Host ""
    Write-Host "ACTUALIZACION COMPLETADA" -ForegroundColor Green
    
    # Verificar cambios
    $newData = Get-Content "data.json" -Raw -Encoding UTF8 | ConvertFrom-Json
    $updatedPlayer = $newData | Where-Object { $_.Jugador -eq $nombreExacto }
    
    if ($updatedPlayer) {
        Write-Host "VERIFICACION:" -ForegroundColor Cyan
        Write-Host "  Jugador: $($updatedPlayer.Jugador)"
        Write-Host "  Nuevo rival: $($updatedPlayer.'Proximo Rival')"
        Write-Host "  Nueva fecha: $($updatedPlayer.'Proximo Partido')"
        Write-Host "  Fecha legible: $Fecha"
    }
    
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== PROCESO FINALIZADO ===" -ForegroundColor Cyan
Write-Host "Para actualizar otro jugador, ejecuta:" -ForegroundColor Yellow
Write-Host ".\actualizar_cualquier_jugador.ps1 -Jugador 'Nombre' -Rival 'Equipo' -Fecha 'DD/MM/YYYY'"
