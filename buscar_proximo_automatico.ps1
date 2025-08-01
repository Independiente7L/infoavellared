# Script para buscar automáticamente el próximo partido de un club específico
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
    
    Write-Host "Respuesta recibida: $($content.Length) caracteres" -ForegroundColor Green
    
    # Buscar patrones de partidos en el contenido
    Write-Host "Analizando resultados..." -ForegroundColor Cyan
    
    # Buscar fechas (formato simple)
    $fechasEncontradas = @()
    $fechaPatterns = @(
        '\b\d{1,2}[-/]\d{1,2}[-/]20\d{2}\b',
        '\b\d{1,2}\s+de\s+\w+\b',
        '\bdom\s+\d{1,2}[-/]\d{1,2}\b',
        '\bsab\s+\d{1,2}[-/]\d{1,2}\b'
    )
    
    foreach ($pattern in $fechaPatterns) {
        $matches = [regex]::Matches($content, $pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
        foreach ($match in $matches) {
            if ($match.Value -notin $fechasEncontradas) {
                $fechasEncontradas += $match.Value
            }
        }
    }
    
    # Buscar horarios
    $horariosEncontrados = @()
    $horarioPattern = '\b\d{1,2}:\d{2}\s*(?:p\.?m\.?|a\.?m\.?|hs?)\b'
    $horarioMatches = [regex]::Matches($content, $horarioPattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
    foreach ($match in $horarioMatches) {
        if ($match.Value -notin $horariosEncontrados) {
            $horariosEncontrados += $match.Value
        }
    }
    
    # Buscar nombres de equipos cerca del nombre del club
    Write-Host "Buscando equipos rivales..." -ForegroundColor Cyan
    $clubSimple = $clubActual -replace "^(CA|Club|FC|CF)\s+", "" -replace "\s+(FC|CF|CA)$", ""
    
    # Buscar patrones comunes de partidos
    $rivalPatterns = @(
        "$clubSimple\s+vs?\s+([A-Za-z\s]+)",
        "([A-Za-z\s]+)\s+vs?\s+$clubSimple",
        "$clubSimple\s+-\s+([A-Za-z\s]+)",
        "([A-Za-z\s]+)\s+-\s+$clubSimple"
    )
    
    $rivalesEncontrados = @()
    foreach ($pattern in $rivalPatterns) {
        $matches = [regex]::Matches($content, $pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
        foreach ($match in $matches) {
            if ($match.Groups.Count -gt 1) {
                $rival = $match.Groups[1].Value.Trim()
                if ($rival -and $rival.Length -gt 2 -and $rival -notin $rivalesEncontrados) {
                    $rivalesEncontrados += $rival
                }
            }
        }
    }
    
    # Mostrar resultados encontrados
    Write-Host ""
    Write-Host "=== RESULTADOS ENCONTRADOS ===" -ForegroundColor Green
    
    if ($rivalesEncontrados.Count -gt 0) {
        Write-Host "Posibles rivales encontrados:" -ForegroundColor Yellow
        $rivalesEncontrados | Select-Object -First 5 | ForEach-Object {
            Write-Host "  - $_" -ForegroundColor Gray
        }
    }
    
    if ($fechasEncontradas.Count -gt 0) {
        Write-Host "Fechas encontradas:" -ForegroundColor Yellow
        $fechasEncontradas | Select-Object -First 8 | ForEach-Object {
            Write-Host "  - $_" -ForegroundColor Gray
        }
    }
    
    if ($horariosEncontrados.Count -gt 0) {
        Write-Host "Horarios encontrados:" -ForegroundColor Yellow
        $horariosEncontrados | Select-Object -First 5 | ForEach-Object {
            Write-Host "  - $_" -ForegroundColor Gray
        }
    }
    
    # Mostrar muestra del contenido para análisis manual
    Write-Host ""
    Write-Host "=== MUESTRA DE CONTENIDO RELEVANTE ===" -ForegroundColor Yellow
    
    # Buscar secciones que contengan el nombre del club
    $indices = @()
    $searchTerms = @($clubActual, $clubSimple)
    
    foreach ($term in $searchTerms) {
        $index = $content.IndexOf($term, [System.StringComparison]::OrdinalIgnoreCase)
        if ($index -gt 0) {
            $indices += $index
        }
    }
    
    if ($indices.Count -gt 0) {
        $index = $indices[0]
        $start = [Math]::Max(0, $index - 200)
        $end = [Math]::Min($content.Length, $index + 400)
        $muestra = $content.Substring($start, $end - $start)
        
        # Limpiar HTML básico
        $muestra = $muestra -replace '<[^>]+>', ' '
        $muestra = $muestra -replace '\s+', ' '
        $muestra = $muestra.Trim()
        
        Write-Host $muestra -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "=== INFORMACIÓN ACTUAL EN JSON ===" -ForegroundColor Magenta
    Write-Host "Próximo Rival actual: $($jugador.'Próximo Rival')" -ForegroundColor White
    $fechaActual = if($jugador.'Próximo Partido') { 
        [DateTime]::FromFileTimeUtc($jugador.'Próximo Partido').ToString('dd/MM/yyyy') 
    } else { 
        'No definido' 
    }
    Write-Host "Próximo Partido actual: $fechaActual" -ForegroundColor White
    
}
catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.InnerException) {
        Write-Host "Detalles: $($_.Exception.InnerException.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== BÚSQUEDA COMPLETADA ===" -ForegroundColor Green
