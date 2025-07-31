// Script para verificar fechas de próximos partidos
const fs = require('fs');

// Leer el archivo data.json
const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));

console.log('=== VERIFICACIÓN DE FECHAS DE PRÓXIMOS PARTIDOS ===');
console.log('Fecha actual:', new Date().toLocaleDateString('es-AR'));
console.log('');

const fechaActual = new Date();
fechaActual.setHours(0, 0, 0, 0); // Inicio del día actual

let partidosPasados = 0;
let partidosFuturos = 0;
let sinRival = 0;

data.forEach((jugador, index) => {
  const fechaPartido = new Date(jugador["Próximo Partido"]);
  const rival = jugador["Próximo Rival"];
  const tieneRival = rival && rival !== "-" && rival.trim() !== "";
  
  const esFuturo = fechaPartido >= fechaActual;
  const esPasado = fechaPartido < fechaActual;
  
  if (!tieneRival) {
    sinRival++;
  } else if (esPasado) {
    partidosPasados++;
    console.log(`❌ PARTIDO PASADO - ${jugador.Jugador} (${jugador["Club Actual"]}) vs ${rival} - ${fechaPartido.toLocaleDateString('es-AR')}`);
  } else {
    partidosFuturos++;
    console.log(`✅ PARTIDO FUTURO - ${jugador.Jugador} (${jugador["Club Actual"]}) vs ${rival} - ${fechaPartido.toLocaleDateString('es-AR')}`);
  }
});

console.log('\n=== RESUMEN ===');
console.log(`✅ Partidos futuros válidos: ${partidosFuturos}`);
console.log(`❌ Partidos con fechas pasadas: ${partidosPasados}`);
console.log(`⚪ Sin rival definido: ${sinRival}`);
console.log(`📊 Total de jugadores: ${data.length}`);
