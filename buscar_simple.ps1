# Buscador automatico de proximo partido
param([string]$NombreJugador)

Write-Host "=== BUSCADOR AUTOMATICO DE PROXIMO PARTIDO ===" -ForegroundColor Green

# Leer JSON
$jugadores = Get-Content "data.json" -Raw -Encoding UTF8 | ConvertFrom-Json
$jugador = $jugadores | Where-Object { $_.Jugador -like "*$NombreJugador*" }

if (-not $jugador) {
    Write-Host "ERROR: Jugador no encontrado" -ForegroundColor Red
    exit
}

$club = $jugador."Club Actual"
Write-Host "Jugador: $($jugador.Jugador)" -ForegroundColor Yellow
Write-Host "Club: $club" -ForegroundColor Yellow

# Buscar en Google
$consulta = "$club proximo partido"
$url = "https://www.google.com/search?q=" + [uri]::EscapeDataString($consulta)

Write-Host "Buscando: $consulta" -ForegroundColor Cyan

$headers = @{
    'User-Agent' = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

try {
    $response = Invoke-WebRequest -Uri $url -Headers $headers -TimeoutSec 20
    $content = $response.Content
    
    Write-Host "Descargado: $($content.Length) caracteres" -ForegroundColor Green
    
    # Buscar fechas
    $fechas = @()
    $patronesFecha = @(
        '\d{1,2}[-/]\d{1,2}[-/]202\d',
        '\d{1,2}\s+de\s+\w+',
        'dom\s+\d{1,2}[-/]\d{1,2}',
        'sab\s+\d{1,2}[-/]\d{1,2}'
    )
    
    foreach ($patron in $patronesFecha) {
        $resultados = [regex]::Matches($content, $patron, 'IgnoreCase')
        foreach ($match in $resultados) {
            if ($match.Value -notin $fechas) {
                $fechas += $match.Value
            }
        }
    }
    
    # Buscar horarios
    $horarios = @()
    $resultadosHorarios = [regex]::Matches($content, '\d{1,2}:\d{2}\s*(?:p\.?m\.?|a\.?m\.?)', 'IgnoreCase')
    foreach ($match in $resultadosHorarios) {
        if ($match.Value -notin $horarios) {
            $horarios += $match.Value
        }
    }
    
    # Mostrar resultados
    Write-Host ""
    Write-Host "=== FECHAS ENCONTRADAS ===" -ForegroundColor Green
    $fechas | Select-Object -First 10 | ForEach-Object {
        Write-Host "  - $_" -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "=== HORARIOS ENCONTRADOS ===" -ForegroundColor Green
    $horarios | Select-Object -First 5 | ForEach-Object {
        Write-Host "  - $_" -ForegroundColor Gray
    }
    
    # Mostrar muestra
    Write-Host ""
    Write-Host "=== MUESTRA DE CONTENIDO ===" -ForegroundColor Yellow
    $index = $content.IndexOf($club, 'OrdinalIgnoreCase')
    if ($index -gt 0) {
        $start = [Math]::Max(0, $index - 150)
        $end = [Math]::Min($content.Length, $index + 300)
        $muestra = $content.Substring($start, $end - $start)
        $muestra = $muestra -replace '<[^>]+>', ' ' -replace '\s+', ' '
        Write-Host $muestra.Trim() -ForegroundColor Gray
    }
    
    # Info actual
    Write-Host ""
    Write-Host "=== INFO ACTUAL ===" -ForegroundColor Magenta
    Write-Host "Rival actual: $($jugador.'Próximo Rival')" -ForegroundColor White
    $fechaActual = if($jugador.'Próximo Partido') { 
        [DateTime]::FromFileTimeUtc($jugador.'Próximo Partido').ToString('dd/MM/yyyy') 
    } else { 'No definido' }
    Write-Host "Fecha actual: $fechaActual" -ForegroundColor White
    
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== COMPLETADO ===" -ForegroundColor Green
