# Script para ayudar con actualizaciones masivas
Write-Host "=== ASISTENTE DE ACTUALIZACION MASIVA ===" -ForegroundColor Green

# Cargar jugadores
$data = Get-Content "data.json" | ConvertFrom-Json

Write-Host "JUGADORES POR CLUB:" -ForegroundColor Cyan
Write-Host ""

# Agrupar jugadores por club
$gruposPorClub = $data | Group-Object "Club Actual" | Sort-Object Name

foreach ($grupo in $gruposPorClub) {
    $club = $grupo.Name
    $jugadores = $grupo.Group
    
    Write-Host "=== $club ===" -ForegroundColor Yellow
    Write-Host "Jugadores: $($jugadores.Count)" -ForegroundColor Gray
    
    foreach ($jugador in $jugadores) {
        Write-Host "  - $($jugador.Jugador)" -ForegroundColor White
        Write-Host "    Rival actual: $($jugador.'Proximo Rival')" -ForegroundColor Gray
        Write-Host "    Fecha actual: $($jugador.'Proximo Partido')" -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "Para actualizar este club, busca en Google o Promiedos:" -ForegroundColor Cyan
    Write-Host "  - 'sitio:promiedos.com.ar $($club.Replace('CA ', '').Replace('Club ', ''))'" -ForegroundColor Yellow
    Write-Host "  - '$($club.Replace('CA ', '').Replace('Club ', '')) proximo partido'" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Comando para actualizar (reemplaza RIVAL y FECHA):" -ForegroundColor Green
    
    foreach ($jugador in $jugadores) {
        Write-Host "  .\actualizar_cualquier_jugador.ps1 -Jugador '$($jugador.Jugador)' -Rival 'RIVAL' -Fecha 'DD/MM/YYYY'" -ForegroundColor White
    }
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "RESUMEN:" -ForegroundColor Green
Write-Host "  Total de jugadores: $($data.Count)"
Write-Host "  Total de clubes: $($gruposPorClub.Count)"
Write-Host ""
Write-Host "PROXIMOS PASOS:" -ForegroundColor Yellow
Write-Host "1. Busca cada club en promiedos.com.ar"
Write-Host "2. Anota el proximo rival y fecha"
Write-Host "3. Usa los comandos mostrados arriba para actualizar"
