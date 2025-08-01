# Script para extraer fixtures del calendario de Promiedos
Write-Host "=== EXTRACTOR DE CALENDARIO PROMIEDOS ===" -ForegroundColor Green

$calendarioUrl = "https://www.promiedos.com.ar/calendario"

try {
    Write-Host "Conectando al calendario: $calendarioUrl" -ForegroundColor Yellow
    
    $headers = @{
        'User-Agent' = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        'Accept' = 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        'Accept-Language' = 'es-AR,es;q=0.9'
    }
    
    $response = Invoke-WebRequest -Uri $calendarioUrl -Headers $headers -TimeoutSec 20
    $content = $response.Content
    
    Write-Host "Calendario descargado: $($content.Length) caracteres" -ForegroundColor Green
    
    # Buscar partidos futuros
    Write-Host "Buscando partidos futuros..." -ForegroundColor Cyan
    
    # Nuestros clubes de interes
    $clubesInteres = @(
        "Rosario Central",
        "Gimnasia.*?Mendoza|Mendoza.*?Gimnasia",
        "Chacarita",
        "Los Andes",
        "Boston River",
        "Tigre",
        "Platense", 
        "Independiente",
        "Barracas",
        "Nueva Chicago",
        "Arsenal",
        "Tucuman",
        "San Martin",
        "Dock Sud",
        "Tristan Suarez",
        "Circulo Deportivo",
        "Maldonado",
        "Liverpool",
        "Pilar",
        "Volos",
        "Puebla",
        "Barcelona"
    )
    
    Write-Host "Buscando cada club..." -ForegroundColor Cyan
    
    foreach ($club in $clubesInteres) {
        Write-Host "Buscando: $club" -ForegroundColor Yellow
        
        # Buscar el club en el contenido
        $clubMatches = [regex]::Matches($content, $club, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
        
        if ($clubMatches.Count -gt 0) {
            Write-Host "  ✓ $club encontrado $($clubMatches.Count) veces" -ForegroundColor Green
            
            # Buscar contexto alrededor de cada coincidencia
            foreach ($match in $clubMatches | Select-Object -First 2) {
                $index = $match.Index
                $contextStart = [Math]::Max(0, $index - 150)
                $contextEnd = [Math]::Min($content.Length, $index + 150)
                $context = $content.Substring($contextStart, $contextEnd - $contextStart)
                
                # Buscar fechas en el contexto
                if ($context -match '(\d{1,2}[/-]\d{1,2}[/-]2025)') {
                    Write-Host "    Fecha: $($matches[1])" -ForegroundColor Cyan
                }
                
                # Buscar vs/contra en el contexto
                if ($context -match 'vs\.?\s+([A-Za-z\s]+)|contra\s+([A-Za-z\s]+)') {
                    $rival = if ($matches[1]) { $matches[1] } else { $matches[2] }
                    Write-Host "    Rival: $($rival.Trim())" -ForegroundColor Cyan
                }
                
                # Mostrar una muestra del contexto
                Write-Host "    Contexto: $($context -replace '\s+', ' ')" -ForegroundColor Gray
                Write-Host ""
            }
        } else {
            Write-Host "  ✗ $club no encontrado" -ForegroundColor Red
        }
    }
    
    # Buscar patrones generales de partidos
    Write-Host "Buscando patrones de partidos..." -ForegroundColor Cyan
    
    $partidoPatterns = @(
        '(\d{1,2}[/-]\d{1,2}[/-]2025).*?([A-Za-z\s]+)\s+vs?\s+([A-Za-z\s]+)',
        '([A-Za-z\s]+)\s+vs?\s+([A-Za-z\s]+).*?(\d{1,2}[/-]\d{1,2}[/-]2025)',
        '(\d{1,2}[/-]\d{1,2}).*?([A-Za-z\s]+)\s+-\s+([A-Za-z\s]+)'
    )
    
    foreach ($pattern in $partidoPatterns) {
        $partidoMatches = [regex]::Matches($content, $pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
        if ($partidoMatches.Count -gt 0) {
            Write-Host "Patron '$pattern' encontro $($partidoMatches.Count) partidos:" -ForegroundColor Yellow
            foreach ($partido in $partidoMatches | Select-Object -First 3) {
                Write-Host "  - $($partido.Value)" -ForegroundColor Gray
            }
        }
    }
    
}
catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== EXTRACCION COMPLETADA ===" -ForegroundColor Green
