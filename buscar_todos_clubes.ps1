# Actualizador automatico usando Google Search para cada club
Write-Host "ACTUALIZADOR AUTOMATICO DE FIXTURES" -ForegroundColor Green

# Cargar jugadores
$data = Get-Content "data.json" | ConvertFrom-Json

# Extraer clubes unicos
$clubes = $data | Select-Object -ExpandProperty "Club Actual" | Sort-Object -Unique

Write-Host "Clubes a buscar: $($clubes.Count)" -ForegroundColor Cyan
foreach ($club in $clubes) {
    Write-Host "  - $club" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Iniciando busqueda automatica..." -ForegroundColor Yellow

foreach ($club in $clubes) {
    Write-Host "Buscando: $club" -ForegroundColor Cyan
    
    try {
        # Simplificar nombre del club para busqueda
        $clubSimple = $club -replace "CA ", "" -replace "Club ", "" -replace "FC ", "" -replace "\(.*\)", ""
        $searchQuery = "$clubSimple proximo partido fixture"
        
        Write-Host "  Query: $searchQuery" -ForegroundColor Gray
        
        # Buscar en Google
        $googleUrl = "https://www.google.com/search?q=" + [System.Web.HttpUtility]::UrlEncode($searchQuery)
        
        $response = Invoke-WebRequest -Uri $googleUrl -UserAgent "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" -TimeoutSec 10
        $content = $response.Content
        
        # Buscar fechas agosto 2025
        $fechas = [regex]::Matches($content, '\d{1,2}[/-]\d{1,2}[/-]2025')
        if ($fechas.Count -gt 0) {
            Write-Host "  Fechas encontradas:" -ForegroundColor Green
            foreach ($fecha in $fechas | Select-Object -First 3) {
                Write-Host "    - $($fecha.Value)" -ForegroundColor White
            }
        }
        
        # Buscar rivales potenciales
        $equipos = @('Estudiantes', 'Racing', 'Boca', 'River', 'San Lorenzo', 'Huracan', 'Lanus', 'Banfield', 'Defensa', 'Colon', 'Union', 'Newells', 'Central', 'Gimnasia', 'Velez', 'Argentinos', 'Talleres', 'Belgrano', 'Instituto', 'Barracas', 'Riestra', 'Platense', 'Tigre', 'Sarmiento', 'Godoy Cruz')
        
        foreach ($equipo in $equipos) {
            if ($content -match "$equipo" -and $clubSimple -notlike "*$equipo*") {
                Write-Host "  Rival potencial: $equipo" -ForegroundColor Yellow
                break
            }
        }
        
        Start-Sleep -Seconds 2
        
    }
    catch {
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
}

Write-Host "Busqueda completada" -ForegroundColor Green
Write-Host ""
Write-Host "Para actualizar manualmente un jugador:" -ForegroundColor Yellow
Write-Host ".\actualizar_cualquier_jugador.ps1 -Jugador 'Nombre' -Rival 'Equipo' -Fecha 'DD/MM/YYYY'"
