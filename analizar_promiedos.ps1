# Script para extraer fixtures desde Promiedos.com.ar
Write-Host "=== EXTRACTOR DE FIXTURES DESDE PROMIEDOS ===" -ForegroundColor Green

$baseUrl = "https://www.promiedos.com.ar"

try {
    Write-Host "Conectando a $baseUrl..." -ForegroundColor Yellow
    
    # Headers para simular navegador (simplificados)
    $headers = @{
        'User-Agent' = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        'Accept' = 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        'Accept-Language' = 'es-AR,es;q=0.9'
    }
    
    $response = Invoke-WebRequest -Uri $baseUrl -Headers $headers -TimeoutSec 20
    $content = $response.Content
    
    Write-Host "Pagina descargada: $($content.Length) caracteres" -ForegroundColor Green
    
    # Buscar enlaces a fixture/calendario
    Write-Host "Buscando enlaces de fixture..." -ForegroundColor Cyan
    
    # Patrones comunes para fixture
    $fixturePatterns = @(
        'href="([^"]*fixture[^"]*)"',
        'href="([^"]*calendario[^"]*)"',
        'href="([^"]*partidos[^"]*)"',
        'href="([^"]*proxima[^"]*)"'
    )
    
    $fixtureLinks = @()
    foreach ($pattern in $fixturePatterns) {
        $matches = [regex]::Matches($content, $pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
        foreach ($match in $matches) {
            $link = $match.Groups[1].Value
            if ($link -notlike "*javascript*" -and $link -notin $fixtureLinks) {
                $fixtureLinks += $link
            }
        }
    }
    
    Write-Host "Enlaces de fixture encontrados:" -ForegroundColor Green
    foreach ($link in $fixtureLinks | Select-Object -First 10) {
        Write-Host "  - $link" -ForegroundColor Gray
    }
    
    # Buscar nombres de equipos en la pagina principal
    Write-Host "Buscando equipos mencionados..." -ForegroundColor Cyan
    
    $equiposPatterns = @(
        'Rosario Central',
        'Gimnasia.*?Mendoza',
        'Chacarita',
        'Los Andes',
        'Tigre',
        'Platense',
        'Independiente',
        'Barracas',
        'Nueva Chicago',
        'Arsenal',
        'Tucuman',
        'Boston River',
        'San Martin'
    )
    
    foreach ($equipoPattern in $equiposPatterns) {
        if ($content -match $equipoPattern) {
            Write-Host "Encontrado: $($matches[0])" -ForegroundColor Green
        }
    }
    
    # Buscar fechas futuras
    Write-Host "Buscando fechas futuras..." -ForegroundColor Cyan
    $fechaPatterns = @(
        '\d{1,2}\/\d{1,2}\/2025',
        '\d{1,2}-\d{1,2}-2025',
        '\d{1,2}\s+de\s+agosto',
        '\d{1,2}\s+ago'
    )
    
    foreach ($fechaPattern in $fechaPatterns) {
        $fechaMatches = [regex]::Matches($content, $fechaPattern)
        if ($fechaMatches.Count -gt 0) {
            Write-Host "Fechas con patron '$fechaPattern':" -ForegroundColor Yellow
            foreach ($fecha in $fechaMatches | Select-Object -First 3) {
                Write-Host "  - $($fecha.Value)" -ForegroundColor Gray
            }
        }
    }
    
    # Mostrar muestra de contenido relevante
    Write-Host ""
    Write-Host "=== MUESTRA DEL CONTENIDO ===" -ForegroundColor Yellow
    if ($content -match "fixture|calendario|partidos") {
        $index = $content.IndexOf($matches[0])
        $start = [Math]::Max(0, $index - 200)
        $end = [Math]::Min($content.Length, $index + 400)
        $sample = $content.Substring($start, $end - $start)
        Write-Host $sample -ForegroundColor Gray
    }
    
}
catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== ANALISIS COMPLETADO ===" -ForegroundColor Green
