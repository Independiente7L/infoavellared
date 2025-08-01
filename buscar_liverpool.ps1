# Script para buscar automáticamente el próximo partido de un jugador
param(
    [Parameter(Mandatory=$true)]
    [string]$NombreJugador
)

Write-Host "=== BUSCADOR AUTOMÁTICO DE PRÓXIMO PARTIDO ===" -ForegroundColor Green

# Leer el archivo JSON
$jsonPath = "data.json"
if (-not (Test-Path $jsonPath)) {
    Write-Host "ERROR: No se encuentra el archivo data.json" -ForegroundColor Red
    exit
}

try {
    $jugadores = Get-Content $jsonPath -Raw -Encoding UTF8 | ConvertFrom-Json
    
    # Buscar el jugador
    $jugador = $jugadores | Where-Object { $_.Jugador -like "*$NombreJugador*" }
    
    if (-not $jugador) {
        Write-Host "ERROR: No se encontró el jugador '$NombreJugador'" -ForegroundColor Red
        exit
    }
    
    $clubActual = $jugador."Club Actual"
    Write-Host "Jugador encontrado: $($jugador.Jugador)" -ForegroundColor Yellow
    Write-Host "Club actual: $clubActual" -ForegroundColor Yellow
    
    # Construir la consulta de búsqueda
    $consulta = "$clubActual próximo partido"
    $urlGoogle = "https://www.google.com/search?q=" + [System.Web.HttpUtility]::UrlEncode($consulta)
    
    Write-Host "Buscando: $consulta" -ForegroundColor Cyan
    Write-Host "URL: $urlGoogle" -ForegroundColor Gray
    
    # Headers para simular navegador
    $headers = @{
        'User-Agent' = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        'Accept' = 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        'Accept-Language' = 'es-AR,es;q=0.9'
    }
    
    Write-Host "Realizando búsqueda..." -ForegroundColor Yellow
    $response = Invoke-WebRequest -Uri $urlGoogle -Headers $headers -TimeoutSec 30
    $content = $response.Content
    
    Write-Host "Descargado: $($content.Length) caracteres" -ForegroundColor Green
    
    # Buscar estructura específica de Google Sports
    Write-Host ""
    Write-Host "=== BUSCANDO GOOGLE SPORTS ===" -ForegroundColor Cyan
    
    $patronVs = 'imso_mh__vs-at-sep'
    if ($content -match $patronVs) {
        Write-Host "Encontrada estructura de Google Sports" -ForegroundColor Green
        
        # Buscar el contexto completo alrededor del vs.
        $index = $content.IndexOf("imso_mh__vs-at-sep")
        if ($index -ge 0) {
            $start = [Math]::Max(0, $index - 1500)
            $end = [Math]::Min($content.Length, $index + 1500)
            $contexto = $content.Substring($start, $end - $start)
            
            Write-Host "Contexto encontrado alrededor del vs." -ForegroundColor Yellow
            
            # Buscar nombres de equipos
            $patronEquipo = 'team-name[^>]*>([^<]+)<'
            $equipos = [regex]::Matches($contexto, $patronEquipo, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
            
            if ($equipos.Count -ge 2) {
                $equipo1 = $equipos[0].Groups[1].Value.Trim()
                $equipo2 = $equipos[1].Groups[1].Value.Trim()
                Write-Host ""
                Write-Host "*** PARTIDO ENCONTRADO ***" -ForegroundColor White -BackgroundColor DarkBlue
                Write-Host "$equipo1 vs $equipo2" -ForegroundColor Yellow -BackgroundColor DarkBlue
                Write-Host "************************" -ForegroundColor White -BackgroundColor DarkBlue
            }
            
            # Mostrar todos los equipos encontrados
            Write-Host ""
            Write-Host "Equipos encontrados en el contexto:" -ForegroundColor Cyan
            foreach ($equipo in $equipos) {
                Write-Host "  - $($equipo.Groups[1].Value.Trim())" -ForegroundColor Gray
            }
        }
    } else {
        Write-Host "No se encontró estructura de Google Sports" -ForegroundColor Red
    }
    
    # Buscar fechas
    Write-Host ""
    Write-Host "=== FECHAS ENCONTRADAS ===" -ForegroundColor Cyan
    $patronesFecha = @(
        '\d{1,2}-\d{1,2}',
        '\d{1,2}/\d{1,2}',
        '\d{1,2}\s+ago',
        '\d{1,2}\s+sep'
    )
    
    foreach ($patron in $patronesFecha) {
        $fechas = [regex]::Matches($content, $patron)
        if ($fechas.Count -gt 0) {
            Write-Host "Patrón '$patron':" -ForegroundColor Yellow
            $fechas | Select-Object -First 3 | ForEach-Object {
                Write-Host "  - $($_.Value)" -ForegroundColor Gray
            }
        }
    }
    
    # Mostrar información actual del jugador
    Write-Host ""
    Write-Host "=== INFORMACIÓN ACTUAL ===" -ForegroundColor Magenta
    Write-Host "Próximo Rival: $($jugador.'Próximo Rival')" -ForegroundColor White
    Write-Host "Próximo Partido: $($jugador.'Próximo Partido')" -ForegroundColor White
    
}
catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Detalles: $($_.Exception)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== COMPLETADO ===" -ForegroundColor Green
