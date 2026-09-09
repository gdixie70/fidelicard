# Standard per i loghi dei brand

Regole da seguire quando si aggiunge un nuovo brand a `assets/brands.json` e il relativo file in questa cartella (a mano o con lo script `scripts/prepare-brand-logo.js`).

## Il file immagine

- **Formato:** PNG con canale alpha (trasparenza). Mai JPG.
- **Sfondo:** trasparente attorno all'emblema, salvo il caso "logo a scatola" sotto.
- **Dimensioni:** nessuna misura fissa obbligatoria — mantieni il rapporto d'aspetto originale del logo (va benissimo un logo orizzontale come `decathlon.png`, 944×175). Come riferimento pratico: lato lungo tra 500 e 1000px (sotto ~300px è sgranato sugli schermi grandi, sopra ~1200px appesantisce il download senza bisogno).
- **Contenuto:** solo l'emblema, senza padding extra attorno — il ritaglio "contain" dentro la card lo fa già l'app.
- **Nome file:** minuscolo, snake_case, senza accenti/spazi/apostrofi — slug del nome brand (es. `piazza_italia.png`, `la_feltrinelli.png`).

## I campi in `brands.json`

| Campo | Obbligatorio | Significato |
|---|---|---|
| `brand` | sì | Nome ufficiale del brand, come va mostrato nell'app. Il matching di ricerca è case/accento-insensitive per prefisso di parola, non serve un elenco di alias. |
| `logoFile` | sì | Nome del file in questa cartella (deve combaciare esattamente). |
| `color` | sì | Colore principale del brand, usato come sfondo della card **quando non c'è `boxColor`**. Va preso da uno dei colori dominanti del logo (mai bianco/nero/grigio puro). |
| `prefix` | no, ma utile | Prefisso EAN a 4 cifre della tessera fedeltà di quel brand, per il riconoscimento automatico dal codice a barre. Si scopre solo guardando una tessera vera — non è automatizzabile. Lascia `""` se non lo conosci ancora. |
| `domain` | no | Dominio del sito ufficiale (es. `esselunga.it`). Serve al recupero automatico del logo candidato. |
| `boxColor` | **solo se serve** | Vedi sotto. |

## Quando usare `boxColor`

Alcuni loghi hanno il loro sfondo colorato "cucito dentro" l'immagine — non sono un emblema trasparente, ma un vero e proprio riquadro pieno (es. `ikea.png`: il quadrato blu con la scritta bianca è tutto parte del logo, non solo il testo). Per questi:

- Imposta `boxColor` allo **stesso colore** del riquadro dentro l'immagine.
- Serve perché altrimenti l'app mette uno sfondo bianco dietro, e il riquadro blu del logo sembra "un adesivo scollato sopra un rettangolo bianco più grande".

Se invece il logo ha davvero lo sfondo trasparente attorno all'emblema (la maggioranza dei casi, es. `esselunga.png`, `conad.png`), **non impostare `boxColor`** — lascialo assente, non stringa vuota.

Controllo pratico: apri il PNG in un editor che mostra la trasparenza (es. Anteprima, Photoshop, Paint.NET). Se il rettangolo dell'immagine è quasi tutto colorato/pieno → serve `boxColor`. Se è quasi tutto a scacchi (trasparente) tranne l'emblema → non serve.

## Pubblicazione

Basta salvare il file qui dentro e aggiungere/aggiornare la entry in `assets/brands.json`, poi commit + push su `main`: arriva a tutti gli utenti al prossimo avvio dell'app, senza bisogno di una nuova build (vedi `utils/remoteBrands.ts` e `utils/brandLogo.ts`).
