# Script para buscar automáticamente el próximo partido de un club específico
param(
    [Parameter(Mandatory=$true)]
    [string]$NombreJugador
)

Write-Host "=== BUSCADOR AUTOMÁTICO DE PRÓXIMO PARTIDO ===" -ForegroundColor Green
Write-Host "Buscando información para: $NombreJugador" -ForegroundColor Yellow

# Leer el JSON de jugadores
try {
    $jsonContent = Get-Content "data.json" -Raw -Encoding UTF8
    $jugadores = $jsonContent | ConvertFrom-Json
    
    # Buscar el jugador
    $jugador = $jugadores | Where-Object { $_.Jugador -eq $NombreJugador }
    
    if (-not $jugador) {
        Write-Host "ERROR: No se encontró el jugador '$NombreJugador'" -ForegroundColor Red
        return
    }
    
    $clubActual = $jugador."Club Actual"
    Write-Host "Club actual: $clubActual" -ForegroundColor Cyan
    
    # Preparar la búsqueda en Google
    $searchQuery = "$clubActual proximo partido"
    $encodedQuery = [System.Web.HttpUtility]::UrlEncode($searchQuery)
    $googleUrl = "https://www.google.com/search?q=$encodedQuery"
    
    Write-Host "Realizando búsqueda: '$searchQuery'" -ForegroundColor Yellow
    Write-Host "URL: $googleUrl" -ForegroundColor Gray
    
    # Headers para simular navegador
    $headers = @{
        'User-Agent' = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        'Accept' = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        'Accept-Language' = 'es-ES,es;q=0.9,en;q=0.8'
        'Accept-Encoding' = 'gzip, deflate, br'
        'DNT' = '1'
        'Connection' = 'keep-alive'
        'Upgrade-Insecure-Requests' = '1'
    }
    
    # Realizar la búsqueda
    Write-Host "Conectando a Google..." -ForegroundColor Yellow
    $response = Invoke-WebRequest -Uri $googleUrl -Headers $headers -TimeoutSec 30
    $content = $response.Content
    
    Write-Host "Página descargada: $($content.Length) caracteres" -ForegroundColor Green
    
    # Buscar patrones de información de partidos
    Write-Host "Analizando resultados..." -ForegroundColor Cyan
    
    # Patrones para encontrar información de partidos
    $patronesFecha = @(
        'Dom\s+(\d{1,2})-(\d{1,2})',  # Dom 3-8
        'Sáb\s+(\d{1,2})-(\d{1,2})',  # Sáb 9-8
        'Lun\s+(\d{1,2})-(\d{1,2})',  # Lun etc.
        'Mar\s+(\d{1,2})-(\d{1,2})',
        'Mié\s+(\d{1,2})-(\d{1,2})',
        'Jue\s+(\d{1,2})-(\d{1,2})',
        'Vie\s+(\d{1,2})-(\d{1,2})',
        '(\d{1,2})\s+de\s+agosto',     # 3 de agosto
        '(\d{1,2})/(\d{1,2})/2025'     # 3/8/2025
    )
    
    $fechasEncontradas = @()
    foreach ($patron in $patronesFecha) {
        $matches = [regex]::Matches($content, $patron, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
        foreach ($match in $matches) {
            $fechasEncontradas += $match.Value
        }
    }
    
    if ($fechasEncontradas.Count -gt 0) {
        Write-Host "Fechas encontradas:" -ForegroundColor Green
        $fechasEncontradas | Select-Object -Unique | ForEach-Object {
            Write-Host "  - $_" -ForegroundColor Gray
        }
    }
    
    # Buscar nombres de equipos rivales
    Write-Host "Buscando equipos rivales..." -ForegroundColor Cyan
    
    # Extraer una muestra del contenido alrededor de donde aparece el nombre del club
    $clubSimple = $clubActual -replace "^(CA|Club|FC|CF)\s+", "" -replace "\s+\([^)]+\)$", ""
    Write-Host "Buscando referencias a: $clubSimple" -ForegroundColor Gray
    
    if ($content -match $clubSimple) {
        # Encontrar el contexto alrededor de la mención del club
        $index = $content.IndexOf($clubSimple, [StringComparison]::OrdinalIgnoreCase)
        if ($index -ge 0) {
            $start = [Math]::Max(0, $index - 500)
            $end = [Math]::Min($content.Length, $index + 1000)
            $contexto = $content.Substring($start, $end - $start)
            
            Write-Host ""
            Write-Host "=== CONTEXTO ENCONTRADO ===" -ForegroundColor Yellow
            Write-Host $contexto -ForegroundColor Gray
            Write-Host ""
            
            # Buscar patrones de vs/contra en el contexto
            $patronesVs = @(
                "$clubSimple\s+vs\s+([A-Za-z\s]+)",
                "([A-Za-z\s]+)\s+vs\s+$clubSimple",
                "$clubSimple.*?contra\s+([A-Za-z\s]+)",
                "([A-Za-z\s]+).*?contra\s+$clubSimple"
            )
            
            foreach ($patron in $patronesVs) {
                $vsMatches = [regex]::Matches($contexto, $patron, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
                if ($vsMatches.Count -gt 0) {
                    Write-Host "Posibles rivales encontrados:" -ForegroundColor Green
                    foreach ($vsMatch in $vsMatches) {
                        Write-Host "  - $($vsMatch.Value)" -ForegroundColor Cyan
                    }
                }
            }
        }
    }
    
    # Buscar en tablas HTML (como en tu captura)
    Write-Host "Buscando en estructuras de tabla..." -ForegroundColor Cyan
    $tablaMatches = [regex]::Matches($content, '<tr[^>]*>.*?</tr>', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase -bor [System.Text.RegularExpressions.RegexOptions]::Singleline)
    
    $tablasConClub = @()
    foreach ($tabla in $tablaMatches) {
        if ($tabla.Value -match $clubSimple) {
            $tablasConClub += $tabla.Value
        }
    }
    
    if ($tablasConClub.Count -gt 0) {
        Write-Host "Encontradas $($tablasConClub.Count) filas de tabla con el club" -ForegroundColor Green
        Write-Host "Primera fila relevante:" -ForegroundColor Yellow
        Write-Host $tablasConClub[0] -ForegroundColor Gray
    }
    
}
catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Detalles: $($_.Exception.ToString())" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== BÚSQUEDA COMPLETADA ===" -ForegroundColor Green
