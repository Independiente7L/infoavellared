# =========================================================
# Script para actualizar próximos partidos usando Google Search
# =========================================================

param(
    [switch]$TestMode = $false,
    [string]$SpecificClub = ""
)

# Configuración
$DataFile = "data.json"
$LogFile = "google_search_partidos.log"

# Limpiar log anterior
if (Test-Path $LogFile) { Remove-Item $LogFile }

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    
    switch ($Level) {
        "SUCCESS" { Write-Host $logEntry -ForegroundColor Green }
        "ERROR" { Write-Host $logEntry -ForegroundColor Red }
        "WARNING" { Write-Host $logEntry -ForegroundColor Yellow }
        default { Write-Host $logEntry -ForegroundColor White }
    }
    
    Add-Content -Path $LogFile -Value $logEntry -Encoding UTF8
}

function Get-NextFixtureFromGoogle {
    param([string]$ClubName)
    
    try {
        Write-Log "Buscando próximo partido de: $ClubName"
        
        # Crear query de búsqueda optimizada con diferentes variaciones
        $searchQueries = @(
            "$ClubName proximo partido fixture",
            "$ClubName vs cuando juega",
            "$ClubName calendario partidos 2025",
            "fixture $ClubName agosto 2025"
        )
        
        $allContent = ""
        
        foreach ($query in $searchQueries) {
            try {
                $encodedQuery = [System.Web.HttpUtility]::UrlEncode($query)
                $googleUrl = "https://www.google.com/search?q=$encodedQuery&hl=es&gl=ar"
                
                Write-Log "Probando búsqueda: $query"
                
                $response = Invoke-WebRequest -Uri $googleUrl -Headers $headers -TimeoutSec 10 -UseBasicParsing
                $allContent += " " + $response.Content
                
                Start-Sleep -Seconds 2  # Pausa entre queries
            }
            catch {
                Write-Log "Error en query '$query': $($_.Exception.Message)" "WARNING"
                continue
            }
        }
        
        Write-Log "Respuesta de Google obtenida: $($content.Length) caracteres"
        
        # Patrones mejorados para extraer información de Google Search
        $patterns = @{
            # Fechas en formato argentino
            'fecha1' = '(\d{1,2}\/\d{1,2}\/2025|\d{1,2}\/\d{1,2}\/25)'
            'fecha2' = '(\d{1,2}\s+de\s+\w+\s+de\s+2025|\d{1,2}\s+\w+\s+2025)'
            'fecha3' = '(agosto\s+\d{1,2}|septiembre\s+\d{1,2}|octubre\s+\d{1,2})'
            
            # Rivales y oponentes
            'rival1' = '(?:vs\.?\s+|contra\s+|ante\s+)([A-ZÑ][A-Za-zÑáéíóúü\s\.]{3,30})'
            'rival2' = '([A-ZÑ][A-Za-zÑáéíóúü\s\.]{3,30})\s+(?:vs\.?\s+|contra\s+|ante\s+)'
            'rival3' = 'próximo\s+rival[:\s]+([A-ZÑ][A-Za-zÑáéíóúü\s\.]{3,30})'
            
            # Estructuras específicas de resultados deportivos
            'estructura1' = "$ClubName\s+[-–]\s+([A-ZÑ][A-Za-zÑáéíóúü\s\.]{3,30})"
            'estructura2' = "([A-ZÑ][A-Za-zÑáéíóúü\s\.]{3,30})\s+[-–]\s+$ClubName"
            'estructura3' = "$ClubName\s+(?:\d{1,2}\/\d{1,2})\s+([A-ZÑ][A-Za-zÑáéíóúü\s\.]{3,30})"
            
            # Patrones para días y fechas
            'dia_fecha' = '(lunes|martes|miércoles|jueves|viernes|sábado|domingo)\s+(\d{1,2}\/\d{1,2})'
        }
        
        $foundDates = @()
        $foundRivals = @()
        
        # Buscar fechas
        foreach ($pattern in $patterns.GetEnumerator()) {
            if ($pattern.Key -like "fecha*") {
                $matches = [regex]::Matches($content, $pattern.Value, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
                foreach ($match in $matches) {
                    $foundDates += $match.Groups[1].Value
                }
            }
        }
        
        # Buscar rivales
        foreach ($pattern in $patterns.GetEnumerator()) {
            if ($pattern.Key -like "*rival*" -or $pattern.Key -like "*estructura*") {
                $matches = [regex]::Matches($content, $pattern.Value, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
                foreach ($match in $matches) {
                    if ($match.Groups[1].Success -and $match.Groups[1].Value.Trim().Length -gt 2) {
                        $foundRivals += $match.Groups[1].Value.Trim()
                    }
                    if ($match.Groups[2].Success -and $match.Groups[2].Value.Trim().Length -gt 2) {
                        $foundRivals += $match.Groups[2].Value.Trim()
                    }
                }
            }
        }
        
        Write-Log "Fechas encontradas: $($foundDates.Count) - $($foundDates -join ', ')"
        Write-Log "Rivales encontrados: $($foundRivals.Count) - $($foundRivals -join ', ')"
        
        # Procesar resultados
        if ($foundDates.Count -gt 0 -and $foundRivals.Count -gt 0) {
            $bestDate = $foundDates[0]
            $bestRival = $foundRivals[0]
            
            # Limpiar nombre del rival
            $bestRival = $bestRival -replace "^\W+|\W+$", ""  # Quitar caracteres especiales del inicio/fin
            $bestRival = $bestRival -replace "\s+", " "       # Normalizar espacios
            
            # Intentar convertir fecha a timestamp
            $timestamp = $null
            try {
                # Intentar diferentes formatos de fecha
                $dateFormats = @('dd/MM/yyyy', 'dd/MM/yy', 'dd-MM-yyyy', 'dd de MMMM de yyyy')
                
                foreach ($format in $dateFormats) {
                    try {
                        if ($bestDate -match '\d{1,2}\/\d{1,2}\/\d{2,4}') {
                            # Formato DD/MM/YYYY o DD/MM/YY
                            if ($bestDate -match '\/\d{2}$') {
                                $bestDate = $bestDate -replace '\/(\d{2})$', '/20$1'  # Convertir YY a 20YY
                            }
                            $dateObj = [DateTime]::ParseExact($bestDate, 'dd/MM/yyyy', $null)
                            $timestamp = [DateTimeOffset]::new($dateObj).ToUnixTimeMilliseconds()
                            break
                        }
                    }
                    catch { continue }
                }
                
                if (-not $timestamp) {
                    Write-Log "No se pudo convertir la fecha: $bestDate" "WARNING"
                    return $null
                }
            }
            catch {
                Write-Log "Error al procesar fecha $bestDate : $($_.Exception.Message)" "WARNING"
                return $null
            }
            
            Write-Log "PARTIDO ENCONTRADO: $bestRival el $bestDate" "SUCCESS"
            
            return @{
                Rival = $bestRival
                Fecha = $timestamp
                FechaLegible = $bestDate
                Source = "Google Search"
            }
        }
        else {
            Write-Log "No se encontraron resultados suficientes para $ClubName" "WARNING"
            return $null
        }
        
    }
    catch {
        Write-Log "Error buscando $ClubName en Google: $($_.Exception.Message)" "ERROR"
        return $null
    }
}

function Update-AllPlayersFromGoogle {
    Write-Log "=== INICIANDO ACTUALIZACION DESDE GOOGLE SEARCH ==="
    Write-Log "Fecha de ejecución: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')"
    Write-Log "Modo de prueba: $TestMode"
    
    # Crear backup
    $backupFile = "data_backup_google_$(Get-Date -Format 'yyyyMMdd_HHmm').json"
    Copy-Item $DataFile $backupFile -ErrorAction SilentlyContinue
    Write-Log "Backup creado: $backupFile"
    
    # Cargar datos
    $jsonContent = Get-Content $DataFile -Raw -Encoding UTF8
    $players = $jsonContent | ConvertFrom-Json
    
    # Obtener clubes únicos
    $uniqueClubs = $players | Select-Object -ExpandProperty "Club Actual" | Sort-Object -Unique
    
    if ($SpecificClub) {
        $uniqueClubs = $uniqueClubs | Where-Object { $_ -like "*$SpecificClub*" }
    }
    
    Write-Log "Clubes a procesar: $($uniqueClubs.Count)"
    
    $processedClubs = @{}
    $totalUpdated = 0
    $totalErrors = 0
    
    foreach ($club in $uniqueClubs) {
        Write-Log "--- Procesando club: $club ---"
        
        $fixture = Get-NextFixtureFromGoogle -ClubName $club
        
        if ($fixture) {
            $processedClubs[$club] = $fixture
            
            # Actualizar todos los jugadores de este club
            $playersInClub = $players | Where-Object { $_."Club Actual" -eq $club }
            
            foreach ($player in $playersInClub) {
                $oldRival = $player."Próximo Rival"
                $oldDate = $player."Próximo Partido"
                
                $player."Próximo Rival" = $fixture.Rival
                $player."Próximo Partido" = $fixture.Fecha
                
                Write-Log "    ACTUALIZADO: $($player.Jugador) - $oldRival → $($fixture.Rival) ($($fixture.FechaLegible))" "SUCCESS"
                $totalUpdated++
            }
        }
        else {
            Write-Log "    Sin datos para: $club" "WARNING"
            $totalErrors++
        }
        
        # Pausa entre búsquedas para no saturar Google
        Start-Sleep -Seconds 5
    }
    
    # Guardar cambios
    if (-not $TestMode) {
        $updatedJson = $players | ConvertTo-Json -Depth 10 -Compress:$false
        Set-Content -Path $DataFile -Value $updatedJson -Encoding UTF8
        Write-Log "Datos guardados en $DataFile" "SUCCESS"
    }
    else {
        Write-Log "MODO TEST: Cambios NO guardados" "WARNING"
    }
    
    # Resumen final
    Write-Log ""
    Write-Log "=== RESUMEN DE ACTUALIZACION ==="
    Write-Log "Clubes procesados: $($uniqueClubs.Count)"
    Write-Log "Jugadores actualizados: $totalUpdated"
    Write-Log "Errores: $totalErrors"
    Write-Log "Archivo de log: $LogFile"
    Write-Log "Finalizado: $(Get-Date -Format 'HH:mm:ss')"
    
    return @{
        Clubs = $uniqueClubs.Count
        Updated = $totalUpdated
        Errors = $totalErrors
    }
}

# ========================================
# EJECUCIÓN PRINCIPAL
# ========================================

# Cargar la clase para UrlEncode
Add-Type -AssemblyName System.Web

Write-Host "=== ACTUALIZADOR DE PARTIDOS VIA GOOGLE SEARCH ===" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

try {
    $results = Update-AllPlayersFromGoogle
    
    if ($results.Updated -gt 0) {
        Write-Host "Actualización exitosa: $($results.Updated) jugadores actualizados" -ForegroundColor Green
    }
    else {
        Write-Host "No se realizaron actualizaciones" -ForegroundColor Yellow
    }
}
catch {
    Write-Log "ERROR CRÍTICO: $($_.Exception.Message)" "ERROR"
    Write-Host "Error durante la ejecución. Ver log para detalles." -ForegroundColor Red
}

Write-Host "Log completo disponible en: $LogFile" -ForegroundColor Cyan
