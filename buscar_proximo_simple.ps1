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
        'User-Agent' = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        'Accept' = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        'Accept-Language' = 'es-AR,es;q=0.9,en;q=0.8'
        'Accept-Encoding' = 'gzip, deflate, br'
        'DNT' = '1'
        'Connection' = 'keep-alive'
        'Upgrade-Insecure-Requests' = '1'
    }
    
    Write-Host "Realizando búsqueda..." -ForegroundColor Yellow
    $response = Invoke-WebRequest -Uri $urlGoogle -Headers $headers -TimeoutSec 30
    $content = $response.Content
    
    Write-Host "Descargado: $($content.Length) caracteres" -ForegroundColor Green
    
    # Buscar patrones específicos de Google Sports
    Write-Host ""
    Write-Host "=== BUSCANDO PATRONES DE GOOGLE SPORTS ===" -ForegroundColor Cyan
    
    # Buscar estructura específica de Google Sports que encontraste
    $patronVs = '<div class="imso_mh__vs-at-sep"[^>]*>vs\.</div>'
    if ($content -match $patronVs) {
        Write-Host "Encontrada estructura vs. de Google Sports" -ForegroundColor Green
        
        # Buscar el contexto completo alrededor del vs.
        $index = $content.IndexOf($matches[0])
        if ($index -ge 0) {
            $start = [Math]::Max(0, $index - 1000)
            $end = [Math]::Min($content.Length, $index + 1000)
            $contexto = $content.Substring($start, $end - $start)
            
            # Buscar nombres de equipos en el contexto
            $patronEquipo1 = 'imso_mh__first-tn-ed.*?team-name.*?>([^<]+)<'
            $patronEquipo2 = 'imso_mh__second-tn-ed.*?team-name.*?>([^<]+)<'
            
            $equipo1Match = [regex]::Match($contexto, $patronEquipo1, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
            $equipo2Match = [regex]::Match($contexto, $patronEquipo2, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
            
            if ($equipo1Match.Success -and $equipo2Match.Success) {
                $equipo1 = $equipo1Match.Groups[1].Value.Trim()
                $equipo2 = $equipo2Match.Groups[1].Value.Trim()
                Write-Host "PARTIDO ENCONTRADO: $equipo1 vs $equipo2" -ForegroundColor Yellow -BackgroundColor DarkBlue
            }
        }
    }
    
    # Buscar fechas próximas
    Write-Host ""
    Write-Host "=== FECHAS ENCONTRADAS ===" -ForegroundColor Cyan
    $patronesFecha = @(
        '\b\d{1,2}[-/]\d{1,2}[-/]20\d{2}\b',
        '\b\d{1,2}\s+de\s+\w+\b',
        '\b\d{1,2}\s+ago\b',
        '\b\d{1,2}\s+sep\b',
        '\b\d{1,2}-\d{1,2}\b'
    )
    
    $fechasEncontradas = @()
    foreach ($patron in $patronesFecha) {
        $matches = [regex]::Matches($content, $patron, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
        foreach ($match in $matches) {
            if ($match.Value -notin $fechasEncontradas) {
                $fechasEncontradas += $match.Value
            }
        }
    }
    
    if ($fechasEncontradas.Count -gt 0) {
        $fechasEncontradas | Select-Object -First 5 | ForEach-Object {
            Write-Host "  - $_" -ForegroundColor Gray
        }
    } else {
        Write-Host "  No se encontraron fechas" -ForegroundColor Red
    }
    
    # Buscar horarios
    Write-Host ""
    Write-Host "=== HORARIOS ENCONTRADOS ===" -ForegroundColor Cyan
    $patronesHorario = @(
        '\b\d{1,2}:\d{2}\s*(?:p\.?m\.?|a\.?m\.?|hs?)\b',
        '\b\d{1,2}:\d{2}\b'
    )
    
    $horariosEncontrados = @()
    foreach ($patron in $patronesHorario) {
        $matches = [regex]::Matches($content, $patron, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
        foreach ($match in $matches) {
            if ($match.Value -notin $horariosEncontrados) {
                $horariosEncontrados += $match.Value
            }
        }
    }
    
    if ($horariosEncontrados.Count -gt 0) {
        $horariosEncontrados | Select-Object -First 3 | ForEach-Object {
            Write-Host "  - $_" -ForegroundColor Gray
        }
    } else {
        Write-Host "  No se encontraron horarios" -ForegroundColor Red
    }
    
    # Buscar el HTML específico que compartiste
    Write-Host ""
    Write-Host "=== MUESTRA DE CONTENIDO ===" -ForegroundColor Yellow
    
    # Buscar estructura similar a la que encontraste
    $patronHTML = 'imso_mh__tm-nm.*?team-name.*?>([^<]+)<.*?vs\..*?team-name.*?>([^<]+)<'
    $matches = [regex]::Matches($content, $patronHTML, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase -bor [System.Text.RegularExpressions.RegexOptions]::Singleline)
    
    if ($matches.Count -gt 0) {
        Write-Host "PARTIDOS ENCONTRADOS EN GOOGLE SPORTS:" -ForegroundColor Green
        foreach ($match in $matches) {
            Write-Host "  $($match.Groups[1].Value) vs $($match.Groups[2].Value)" -ForegroundColor White
        }
    } else {
        Write-Host "No se encontró estructura de Google Sports" -ForegroundColor Red
        
        # Buscar mención del club en el contenido
        $index = $content.IndexOf($clubActual, [System.StringComparison]::OrdinalIgnoreCase)
        if ($index -ge 0) {
            $start = [Math]::Max(0, $index - 200)
            $end = [Math]::Min($content.Length, $index + 400)
            $muestra = $content.Substring($start, $end - $start)
            
            # Limpiar HTML
            $muestra = $muestra -replace '<[^>]+>', ' '
            $muestra = $muestra -replace '\s+', ' '
            $muestra = $muestra.Trim()
            
            Write-Host "Muestra donde aparece el club:" -ForegroundColor Cyan
            Write-Host $muestra -ForegroundColor Gray
        }
    }
    
}
catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== COMPLETADO ===" -ForegroundColor Green
