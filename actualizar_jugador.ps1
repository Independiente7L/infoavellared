# Script simple para actualizar cualquier jugador
param(
    [string]$Jugador = "",
    [string]$Rival = "",
    [string]$Fecha = "",
    [switch]$ListarJugadores = $false
)

Write-Host "=== ACTUALIZADOR DE JUGADORES ===" -ForegroundColor Green

if ($ListarJugadores) {
    $data = Get-Content "data.json" | ConvertFrom-Json
    Write-Host "JUGADORES DISPONIBLES:" -ForegroundColor Yellow
    $i = 1
    $data | ForEach-Object { 
        Write-Host "$i. $($_.Jugador) - $($_.'Club Actual')" -ForegroundColor White
        $i++
    }
    return
}

if (-not $Jugador -or -not $Rival -or -not $Fecha) {
    Write-Host "Uso: .\actualizar_jugador.ps1 -Jugador 'Nombre' -Rival 'Equipo' -Fecha 'DD/MM/YYYY'" -ForegroundColor Yellow
    Write-Host "Ejemplo: .\actualizar_jugador.ps1 -Jugador 'Axel Poza' -Rival 'Estudiantes' -Fecha '15/08/2025'" -ForegroundColor Gray
    Write-Host "Listar: .\actualizar_jugador.ps1 -ListarJugadores" -ForegroundColor Gray
    return
}

try {
    # Convertir fecha
    $fechaObj = [DateTime]::ParseExact($Fecha, 'dd/MM/yyyy', $null)
    $timestamp = [DateTimeOffset]::new($fechaObj).ToUnixTimeMilliseconds()
    
    Write-Host "Buscando jugador: $Jugador" -ForegroundColor Cyan
    
    # Cargar y buscar jugador
    $data = Get-Content "data.json" | ConvertFrom-Json
    $player = $data | Where-Object { $_.Jugador -like "*$Jugador*" }
    
    if (-not $player) {
        Write-Host "ERROR: Jugador no encontrado" -ForegroundColor Red
        return
    }
    
    Write-Host "Encontrado: $($player.Jugador)" -ForegroundColor Green
    Write-Host "Club: $($player.'Club Actual')" -ForegroundColor Gray
    Write-Host "Actualizando rival: $($player.'Próximo Rival') -> $Rival" -ForegroundColor Yellow
    Write-Host "Actualizando fecha: $($player.'Próximo Partido') -> $timestamp ($Fecha)" -ForegroundColor Yellow
    
    # Actualizar directamente usando las propiedades exactas del JSON
    $player.PSObject.Properties["Próximo Rival"].Value = $Rival
    $player.PSObject.Properties["Próximo Partido"].Value = $timestamp
    
    # Guardar
    $data | ConvertTo-Json -Depth 10 | Set-Content "data.json" -Encoding UTF8
    
    Write-Host "ACTUALIZADO EXITOSAMENTE" -ForegroundColor Green
    
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Proceso finalizado" -ForegroundColor Cyan
