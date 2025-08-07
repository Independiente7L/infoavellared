// Script de debug para contar partidos
fetch('data.json?v=20250807v2')
  .then(response => response.json())
  .then(jugadores => {
    console.log('Total jugadores:', jugadores.length);
    
    const conRival = jugadores.filter(j => j["Próximo Rival"] && j["Próximo Rival"].trim() !== '');
    console.log('Jugadores con próximo rival:', conRival.length);
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const partidosFuturos = jugadores.filter(j => {
      const fechaPartido = obtenerTimestamp(j["Próximo Partido"]);
      const tieneRival = j["Próximo Rival"] && j["Próximo Rival"].trim() !== '';
      const esFuturo = fechaPartido >= hoy.getTime();
      
      if (tieneRival && !esFuturo) {
        console.log(`Partido pasado: ${j["Jugador"]} vs ${j["Próximo Rival"]} - ${new Date(fechaPartido).toLocaleDateString()}`);
      }
      if (!tieneRival) {
        console.log(`Sin rival: ${j["Jugador"]}`);
      }
      
      return esFuturo && tieneRival;
    });
    
    console.log('Partidos futuros con rival:', partidosFuturos.length);
  });

function obtenerTimestamp(valor) {
  const numero = Number(valor);
  if (typeof valor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    return new Date(valor).getTime();
  }
  if (!isNaN(numero) && numero > 1_500_000_000_000) {
    return numero;
  }
  if (!isNaN(numero) && numero > 30000 && numero < 60000) {
    return (numero - 25569) * 86400 * 1000;
  }
  return 0;
}
