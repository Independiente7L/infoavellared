# Script para buscar el proximo partido de CA Gimnasia y Esgrima (Mendoza)
Write-Host "BUSCANDO PROXIMO PARTIDO DE CA GIMNASIA Y ESGRIMA (MENDOZA)" -ForegroundColor Green

$club = "CA Gimnasia y Esgrima Mendoza"
$searchQuery = "gimnasia mendoza proximo partido 2025"

try {
    Write-Host "Buscando: $searchQuery" -ForegroundColor Yellow
    
    # Buscar en Google
    $googleUrl = "https://www.google.com/search?q=" + [System.Web.HttpUtility]::UrlEncode($searchQuery)
    
    $headers = @{
        'User-Agent' = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        'Accept-Language' = 'es-ES,es;q=0.9'
    }
    
    $response = Invoke-WebRequest -Uri $googleUrl -Headers $headers -TimeoutSec 15
    $content = $response.Content
    
    Write-Host "Respuesta obtenida: $($content.Length) caracteres" -ForegroundColor Green
    
    # Buscar patrones comunes de resultados deportivos
    $patterns = @(
        'vs\.?\s+([A-Za-z\s\.]+)',
        'contra\s+([A-Za-z\s\.]+)',
        'ante\s+([A-Za-z\s\.]+)',
        'Gimnasia.*?(\d{1,2}/\d{1,2}/2025)',
        '(\d{1,2}/\d{1,2}/2025).*?vs',
        'próximo.*?(\d{1,2}/\d{1,2})',
        'siguiente.*?partido.*?(\d{1,2}/\d{1,2})'
    )
    
    Write-Host "Buscando patrones de partidos..." -ForegroundColor Cyan
    
    foreach ($pattern in $patterns) {
        $matches = [regex]::Matches($content, $pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
        if ($matches.Count -gt 0) {
            Write-Host "Patron '$pattern' encontro:" -ForegroundColor Yellow
            foreach ($match in $matches | Select-Object -First 3) {
                Write-Host "  - $($match.Groups[1].Value)" -ForegroundColor Gray
            }
        }
    }
    
    # Buscar también nombres de equipos conocidos
    $equipos = @(
        'Colon', 'Union', 'Estudiantes', 'Racing', 'Independiente', 'Boca', 'River',
        'San Martin', 'Tucuman', 'Tigre', 'Platense', 'Arsenal', 'Chacarita',
        'Los Andes', 'Nueva Chicago', 'Barracas', 'Temperley', 'Atlanta'
    )
    
    Write-Host "Buscando equipos rivales..." -ForegroundColor Cyan
    foreach ($equipo in $equipos) {
        if ($content -match "Gimnasia.*?$equipo|$equipo.*?Gimnasia") {
            Write-Host "Posible rival encontrado: $equipo" -ForegroundColor Green
        }
    }
    
    # Mostrar muestra del contenido para analisis manual
    Write-Host ""
    Write-Host "=== MUESTRA DEL CONTENIDO RELEVANTE ===" -ForegroundColor Yellow
    $gimnasiaIndex = $content.IndexOf("Gimnasia")
    if ($gimnasiaIndex -gt 0) {
        $contextStart = [Math]::Max(0, $gimnasiaIndex - 200)
        $contextEnd = [Math]::Min($content.Length, $gimnasiaIndex + 400)
        $context = $content.Substring($contextStart, $contextEnd - $contextStart)
        Write-Host $context -ForegroundColor Gray
    }
    
}
catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== BUSQUEDA COMPLETADA ===" -ForegroundColor Green
