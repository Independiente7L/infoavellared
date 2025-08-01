# Script alternativo: Buscar directamente en sitios deportivos argentinos
Write-Host "=== BUSCADOR DIRECTO EN SITIOS DEPORTIVOS ===" -ForegroundColor Green

param(
    [string]$ClubName = "CA Rosario Central"
)

function Search-InSportsWebsites {
    param([string]$Club)
    
    # Sitios deportivos argentinos que suelen tener fixtures
    $sportsSites = @(
        "https://www.ole.com.ar/futbol/",
        "https://www.tycsports.com/futbol",
        "https://www.espn.com.ar/futbol/",
        "https://www.lanacion.com.ar/deportes/"
    )
    
    Write-Host "Buscando fixture de: $Club" -ForegroundColor Yellow
    
    # Simplificar nombre del club para búsqueda
    $clubSimple = $Club -replace "^CA\s+|^Club\s+", "" -replace "\s+\([^)]+\)", ""
    Write-Host "Nombre simplificado: $clubSimple" -ForegroundColor Gray
    
    # Headers básicos
    $headers = @{
        'User-Agent' = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    
    try {
        # Búsqueda directa en Google con site específico para deportes
        $queries = @(
            "site:ole.com.ar `"$clubSimple`" proximo partido",
            "site:tycsports.com `"$clubSimple`" fixture",
            "site:espn.com.ar `"$clubSimple`" calendario"
        )
        
        foreach ($query in $queries) {
            try {
                $encodedQuery = [System.Web.HttpUtility]::UrlEncode($query)
                $url = "https://www.google.com/search?q=$encodedQuery"
                
                Write-Host "Buscando: $query" -ForegroundColor Cyan
                
                $response = Invoke-WebRequest -Uri $url -Headers $headers -TimeoutSec 10
                $content = $response.Content
                
                # Buscar patrones de fecha y rival en los resultados
                if ($content -match '(\d{1,2}\/\d{1,2}\/2025).*?(?:vs|contra)\s+([A-Za-zÑáéíóúü\s\.]{4,25})') {
                    $fecha = $matches[1]
                    $rival = $matches[2].Trim()
                    
                    Write-Host "ENCONTRADO: $rival el $fecha" -ForegroundColor Green
                    return @{
                        Rival = $rival
                        Fecha = $fecha
                        Source = $query
                    }
                }
                
                Start-Sleep -Seconds 3
            }
            catch {
                Write-Host "Error en $query : $($_.Exception.Message)" -ForegroundColor Red
            }
        }
        
        # Si no encuentra con site específico, buscar genérico
        Write-Host "Probando búsqueda genérica..." -ForegroundColor Yellow
        
        $genericQuery = "`"$clubSimple`" vs agosto 2025 fixture"
        $encodedQuery = [System.Web.HttpUtility]::UrlEncode($genericQuery)
        $url = "https://www.google.com/search?q=$encodedQuery"
        
        $response = Invoke-WebRequest -Uri $url -Headers $headers -TimeoutSec 10
        $content = $response.Content
        
        # Guardar contenido para análisis
        $content | Out-File "google_search_debug.html" -Encoding UTF8
        Write-Host "Contenido guardado en google_search_debug.html para análisis" -ForegroundColor Gray
        
        # Buscar cualquier mención de fechas futuras y equipos
        $dateMatches = [regex]::Matches($content, '\d{1,2}\/\d{1,2}\/2025')
        $teamMatches = [regex]::Matches($content, '[A-Z][a-záéíóúñü]{2,}\s+[A-Z][a-záéíóúñü]{2,}')
        
        Write-Host "Fechas encontradas: $($dateMatches.Count)" -ForegroundColor Gray
        Write-Host "Equipos encontrados: $($teamMatches.Count)" -ForegroundColor Gray
        
        if ($dateMatches.Count -gt 0) {
            foreach ($match in $dateMatches | Select-Object -First 3) {
                Write-Host "  Fecha: $($match.Value)" -ForegroundColor Gray
            }
        }
        
        if ($teamMatches.Count -gt 0) {
            foreach ($match in $teamMatches | Select-Object -First 5) {
                $team = $match.Value
                if ($team -ne $clubSimple -and $team.Length -gt 5) {
                    Write-Host "  Posible rival: $team" -ForegroundColor Gray
                }
            }
        }
        
        return $null
    }
    catch {
        Write-Host "Error general: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Cargar assembly necesaria
Add-Type -AssemblyName System.Web

# Ejecutar búsqueda
$result = Search-InSportsWebsites -Club $ClubName

if ($result) {
    Write-Host "=== RESULTADO FINAL ===" -ForegroundColor Green
    Write-Host "Club: $ClubName" -ForegroundColor White
    Write-Host "Rival: $($result.Rival)" -ForegroundColor White
    Write-Host "Fecha: $($result.Fecha)" -ForegroundColor White
    Write-Host "Fuente: $($result.Source)" -ForegroundColor Gray
} else {
    Write-Host "No se encontraron datos para $ClubName" -ForegroundColor Red
    Write-Host "Revisa el archivo google_search_debug.html para análisis manual" -ForegroundColor Yellow
}

Write-Host "=== PROCESO FINALIZADO ===" -ForegroundColor Green
