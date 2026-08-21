// Mappa dei loghi inclusi nell'app (placeholder testuali, non veri loghi grafici).
// NOTA: carrefour.png, ikea.png e mediaworld.png sono stati rimossi perché erano
// copie duplicate mal etichettate di altri brand (mostravano rispettivamente
// "COOP", "CONAD" e "BRICO"). Per questi brand ora si usa il logo recuperato
// dal servizio remoto (se il dominio è configurato) o il badge colorato.
const logoMap: { [key: string]: any } = {
  'coop.png': require('../assets/loghi/coop.png'),
  'esselunga.png': require('../assets/loghi/esselunga.png'),
  'decathlon.png': require('../assets/loghi/decathlon.png'),
  'conad.png': require('../assets/loghi/conad.png'),
  'lidl.png': require('../assets/loghi/lidl.png'),
  'brico.png': require('../assets/loghi/brico.png'),
  'cisalfa.png': require('../assets/loghi/cisalfa.png'),
  // Aggiungi qui il logo quando ne hai uno nuovo e corretto in assets/loghi
};

export default logoMap;
