# Buscar próximo partido de un jugador
param([string]$NombreJugador)

Write-Host "Buscando: $NombreJugador" -ForegroundColor Green

# Leer JSON
$jugadores = Get-Content "data.json" -Raw -Encoding UTF8 | ConvertFrom-Json
$jugador = $jugadores | Where-Object { $_.Jugador -like "*$NombreJugador*" }

if (-not $jugador) {
    Write-Host "No encontrado" -ForegroundColor Red
    exit
}

$club = $jugador."Club Actual"
Write-Host "Club: $club" -ForegroundColor Yellow

# Buscar en Google con términos más simples
$terminos = @(
    "$club",
    "chacarita",
    "$club próximo partido"
)

foreach ($termino in $terminos) {
    Write-Host "Probando búsqueda: $termino" -ForegroundColor Cyan
    $url = "https://www.google.com/search?q=" + [uri]::EscapeDataString($termino)
    
    try {
        $content = (Invoke-WebRequest -Uri $url -Headers $headers).Content
        
        if ($content -match 'vs\.|versus') {
            Write-Host "  ✓ Encontró 'vs.' - hay partidos!" -ForegroundColor Green
            break
        } else {
            Write-Host "  ✗ No encontró partidos" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "  ✗ Error en búsqueda" -ForegroundColor Red
    }
}

# Buscar estructura vs
if ($content -match 'vs\.|versus|contre') {
    Write-Host "Estructura de partido encontrada!" -ForegroundColor Green
    
    # Buscar múltiples patrones
    $patrones = @(
        'imso_mh__vs-at-sep',
        'vs\.',
        'team-name',
        'Chacarita',
        'Estudiantes'
    )
    
    foreach ($patron in $patrones) {
        if ($content -match $patron) {
            Write-Host "Patrón encontrado: $patron" -ForegroundColor Yellow
        }
    }
    
    # Buscar si aparece el club
    if ($content -match [regex]::Escape($club)) {
        Write-Host "Club encontrado en el contenido!" -ForegroundColor Green
        
        # Extraer contexto alrededor del club
        $index = $content.IndexOf($club)
        $start = [Math]::Max(0, $index - 500)
        $length = 1000
        $contexto = $content.Substring($start, $length)
        
        # Limpiar HTML para mejor lectura
        $contextoLimpio = $contexto -replace '<[^>]+>', ' ' -replace '\s+', ' '
        
        Write-Host "Contexto alrededor del club:" -ForegroundColor Cyan
        Write-Host $contextoLimpio -ForegroundColor Gray
    }
    
} else {
    Write-Host "No se encontro estructura de partido" -ForegroundColor Red
}

Write-Host "Completado" -ForegroundColor Green
