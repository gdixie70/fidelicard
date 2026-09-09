import * as Localization from 'expo-localization';

// Rilevata una sola volta all'avvio: la lingua del dispositivo non cambia
// mentre l'app è aperta, quindi non serve un context/hook reattivo - un
// semplice lookup sincrono basta ed è usabile ovunque, anche fuori dai
// componenti (es. utils/duration.ts).
const deviceLanguage = Localization.getLocales()[0]?.languageCode ?? 'it';
export const locale: 'it' | 'en' = deviceLanguage === 'en' ? 'en' : 'it';

type Dict = Record<string, string>;

const it: Dict = {
  'tabs.home': 'Home',
  'tabs.invite': 'Invita',
  'tabs.collabora': 'Collabora',

  'app.addCard': 'Aggiungi una tessera',
  'app.importBulk': 'Importa più tessere da foto',
  'app.screenTitle.addCard': 'Aggiungi Carta',
  'app.screenTitle.editCard': 'Modifica Carta',
  'app.screenTitle.showCode': 'Codice Tessera',
  'app.screenTitle.scan': 'Scansiona codice',
  'app.screenTitle.bulkImport': 'Importa più tessere',
  'app.screenTitle.info': 'Come funziona',

  'common.cancel': 'Annulla',
  'common.error': 'Errore',
  'common.permissionDenied': 'Permesso negato',
  'common.confirm': 'Conferma',
  'adBanner.placeholder': 'Spazio pubblicitario',

  'removeAds.sectionTitle': 'Pubblicità',
  'removeAds.intro': 'Se preferisci un\'esperienza senza banner, puoi toglierli con un acquisto una tantum.',
  'removeAds.buyWithPrice': 'Rimuovi pubblicità — {{price}}',
  'removeAds.buy': 'Rimuovi pubblicità',
  'removeAds.restore': 'Ripristina acquisti',
  'removeAds.owned': 'Pubblicità rimossa',
  'removeAds.retry': 'Riprova',
  'removeAds.manageConsent': 'Gestisci consenso pubblicità',
  'common.cardCodePlaceholder': 'Codice tessera',
  'common.until': 'fino al {{date}}',
  'common.noExpiry': 'senza scadenza',

  'carte.searchPlaceholder': 'Cerca una carta',
  'carte.emptyText': 'TOCCA IL + \nPER AGGIUNGERE LA TUA PRIMA CARD',
  'carte.emptyAccessibility': 'Tocca il più per aggiungere la tua prima card',
  'carte.lentBadge': '⭐ Prestata',
  'carte.borrowedBadge': '💛 In prestito',

  'addCard.namePlaceholder': 'Nome carta',
  'addCard.scanAccessibility': 'Scansiona il codice a barre',
  'addCard.importAccessibility': 'Importa il codice da una foto della libreria',
  'addCard.codeHint':
    'Non hai la tessera con te? Scrivi qui il numero che vedi stampato (o mostrato a schermo) sotto al codice a barre.',
  'addCard.noLogoLabel': 'Nessun logo trovato per questo negozio: scegli un colore per la tessera.',
  'addCard.chooseIconLabel': "Scegli un'icona (facoltativo) - verrà sostituita in automatico appena troviamo il logo ufficiale.",
  'addCard.sendPhotoButton': '📷 Invia una foto del logo/tessera',
  'addCard.expiryHint': 'Utile se questa è una tessera avuta in prestito: sparisce da sola dopo la data scelta.',
  'addCard.expiryLabelSet': 'Rimozione automatica il {{date}}',
  'addCard.expiryLabelNone': 'Nessuna rimozione automatica',
  'addCard.saveNew': 'Salva',
  'addCard.saveEdit': 'Salva modifiche',
  'addCard.expirySheetTitle': 'Rimuovi automaticamente',
  'addCard.expiryNeverOption': 'Nessuna (non rimuovere mai)',
  'addCard.expiryInOption': 'Tra {{label}}',
  'addCard.photoSheetTitle': 'Foto del logo/tessera',
  'addCard.takePhoto': 'Scatta una foto',
  'addCard.chooseFromLibrary': 'Scegli dalla libreria',
  'addCard.permissionPhotoBody': "Consenti l'accesso alle foto per importare uno screenshot della tessera.",
  'addCard.permissionCameraBody': "Consenti l'accesso alla fotocamera per scattare la foto.",
  'addCard.permissionLibraryBody': "Consenti l'accesso alle foto per sceglierne una.",
  'addCard.codeNotFoundTitle': 'Codice non trovato',
  'addCard.codeNotFoundBody':
    "Non ho riconosciuto nessun codice a barre nell'immagine. Prova con uno screenshot più nitido, inquadrando solo il codice, oppure usa la fotocamera dal vivo.",
  'addCard.sharingUnavailableTitle': 'Condivisione non disponibile',
  'addCard.sharingUnavailableBody': 'Il tuo dispositivo non supporta la condivisione di file.',
  'addCard.missingLogoShareTitle': 'Logo mancante: {{name}}',
  'addCard.errorNameBody': 'Inserisci il nome della carta.',
  'addCard.errorCodeBody': 'Inserisci il codice della carta.',

  'scan.permissionText': "Per scansionare il codice della tessera, consenti l'accesso alla fotocamera.",
  'scan.allowCamera': 'Consenti fotocamera',
  'scan.hint': 'Inquadra il codice a barre della tessera',

  'bulkImport.permissionBody': "Consenti l'accesso alle foto per importare le tessere.",
  'bulkImport.introTitle': 'Importa più tessere insieme',
  'bulkImport.introText':
    "Utile se arrivi da un'altra app (es. Klarna): fai uno screenshot di ogni tessera, poi selezionali tutti insieme qui. Provo a riconoscere codice e negozio di ognuna - potrai controllare e correggere prima di salvare.",
  'bulkImport.chooseScreenshots': 'Scegli gli screenshot',
  'bulkImport.analyzing': 'Analizzo le foto... {{done}}/{{total}}',
  'bulkImport.reviewHint':
    "Controlla nome e codice di ogni tessera prima di salvare - se qualcosa non è stato letto bene, correggilo qui sotto.",
  'bulkImport.storeNamePlaceholder': 'Nome negozio',
  'bulkImport.incompleteTitle': 'Alcune tessere sono incomplete',
  'bulkImport.incompleteBody': '{{count}} {{word}} senza nome o codice: completale o rimuovile con 🗑️ prima di salvare.',
  'bulkImport.saveButton': 'Salva {{count}} {{word}}',
  'bulkImport.cardWordOne': 'tessera',
  'bulkImport.cardWordMany': 'tessere',

  'collabora.intro':
    'Presta le tue tessere a chi ti sta vicino, o tieni traccia di chi ti ha prestato le sue — utile se vi dividete i punti di negozi diversi.',
  'collabora.sectionLend': 'Presta una tessera',
  'collabora.emptyHint': 'Non hai ancora nessuna tessera da prestare.',
  'collabora.sectionLentByYou': '⭐ Prestate da te',
  'collabora.sectionBorrowed': '💛 Ricevute in prestito',
  'collabora.borrowedFrom': 'Prestata da {{name}}',
  'collabora.removeTitle': "Togliere dall'elenco?",
  'collabora.removeBody':
    '"{{name}}" verrà tolto dall\'elenco di chi ha ricevuto questa tessera in prestito (è solo un promemoria: la sua copia non viene toccata).',
  'collabora.removeConfirm': 'Togli',
  'collabora.durationSheetTitle': 'Per quanto tempo?',
  'collabora.recipientTitle': 'A chi presti questa tessera?',
  'collabora.recipientPlaceholder': 'Nome del destinatario',
  'collabora.shareConfirm': 'Condividi',
  'collabora.onboardingTitle':
    "Come ti chiami? Lo vedrà chi riceve una tua tessera in prestito, così sa che sei stato tu a mandarla. Non leggiamo nessun'altra impostazione o dato del telefono.",
  'collabora.namePlaceholder': 'Il tuo nome',
  'collabora.continueConfirm': 'Continua',
  'collabora.shareMessage': 'Ti presto la tessera {{name}} ({{expiry}}). Tocca per aggiungerla in FideliCard: {{link}}',

  'showCode.deleteTitle': 'Elimina Carta',
  'showCode.deleteBody': 'Vuoi eliminare "{{name}}"?',
  'showCode.deleteConfirm': 'Elimina',
  'showCode.copyCode': 'Copia codice',
  'showCode.copied': 'Copiato',
  'showCode.edit': 'Modifica',
  'showCode.delete': 'Elimina',
  'showCode.borrowedFrom': '💛 Prestata da {{name}}',
  'showCode.lentToTitle': 'Prestata a:',
  'showCode.lentToRow': '⭐ {{name}} — {{expiry}}',

  'inviteQr.title': 'Invita qualcuno su FideliCard',
  'inviteQr.subtitle': "Fai inquadrare questo codice per scaricare l'app",
  'inviteQr.shareButton': 'Condividi il link',
  'inviteQr.close': 'Chiudi',
  'inviteQr.shareMessage': "Prova FideliCard, tutte le tessere fedeltà in un'app: {{url}}",

  'about.heroTitle': 'Le tue tessere fedeltà,\ntutte in un posto solo',
  'about.heroSubtitle':
    "FideliCard raccoglie tutte le tue tessere fedeltà in un'unica app semplice e veloce - senza account, senza dati che escono dal telefono, senza trasformarsi in altro.",
  'about.sectionHow': 'Come funziona',
  'about.step1Title': 'Aggiungi una tessera',
  'about.step1Text':
    'Scansiona il codice a barre dal vivo, importalo da una foto o da uno screenshot, oppure scrivi il numero a mano se non hai la tessera con te.',
  'about.step2Title': 'Importa più tessere insieme',
  'about.step2Text':
    'Vieni da un\'altra app e vuoi spostare tutte le tue tessere? Fai uno screenshot di ognuna, selezionale tutte insieme da "Importa più tessere da foto" e controllale prima di salvare - niente da rifare una alla volta.',
  'about.step3Title': 'Mostrala in cassa',
  'about.step3Text': 'Tocca la tessera dalla Home: codice a barre e numero grandi e leggibili, pronti da inquadrare.',
  'about.step4Title': 'Condividi con chi vuoi',
  'about.step4Text':
    'Dalla pagina Collabora presti una tessera a un familiare o un amico, per il tempo che preferisci - utile per dividervi i punti di negozi diversi.',
  'about.sectionWhy': 'Perché FideliCard',
  'about.point1Title': 'Le tue tessere restano tue',
  'about.point1Text': 'Niente account, niente server: tutto quello che aggiungi resta salvato solo sul tuo telefono.',
  'about.point2Title': 'Ogni tipo di tessera',
  'about.point2Text':
    'Supermercati, benzinai, farmacie, negozi di quartiere, programmi punti - non solo le grandi catene.',
  'about.point3Title': 'Funziona anche offline',
  'about.point3Text':
    'Il codice a barre si vede sempre, anche senza connessione: in cassa non deve mai dipendere dal wifi del negozio.',
  'about.point4Title': 'Veloce e senza fronzoli',
  'about.point4Text': "Apri l'app, tocchi la tessera, mostri il codice. Fatto.",
  'about.point5Title': 'Solo tessere fedeltà, niente altro',
  'about.point5Text':
    "Non è un'app di pagamenti e non è una carta di credito: non ti chiediamo mai dati bancari, e non ti spingiamo verso altri servizi.",
  'about.point6Title': 'Loghi sempre aggiornati',
  'about.point6Text':
    "Il database dei negozi si aggiorna da solo in background: nuovi brand e loghi arrivano senza bisogno di aggiornare l'app.",
  'about.sectionBackup': 'Backup e ripristino',
  'about.backupIntro': 'Le tue tessere vivono solo su questo telefono: se lo cambi o disinstalli l\'app, salva prima un backup.',
  'about.exportButton': 'Esporta le mie tessere',
  'about.exportingButton': 'Esportazione...',
  'about.importButton': 'Importa da un backup',
  'about.importingButton': 'Importazione...',
  'about.exportEmptyTitle': 'Nessuna tessera',
  'about.exportEmptyBody': 'Non hai ancora nessuna tessera da esportare.',
  'about.exportErrorBody': 'Non sono riuscito a creare il file di backup.',
  'about.importedTitle': 'Backup importato',
  'about.importedAdded': 'Aggiunte {{count}} tessere.',
  'about.importedSkipped': ' {{count}} già presenti, saltate.',
  'about.importErrorBody': 'Il file scelto non è un backup di FideliCard valido.',

  'lend.requestTitle': 'Prestito tessera',
  'lend.requestBody': '{{from}} ti presta la sua tessera {{name}}{{expiry}}. Vuoi accettarla?',
  'lend.no': 'No',
  'lend.yesAdd': 'Sì, aggiungila',
  'lend.duplicateTitle': 'Tessera già presente',
  'lend.duplicateBody': 'Hai già una tessera con questo codice ("{{name}}"): non l\'ho aggiunta di nuovo.',
  'lend.doneTitle': 'Fatto!',
  'lend.doneBody': '"{{name}}" di {{from}} è stata aggiunta alle tue carte.',
  'lend.untilSuffix': ' fino al {{date}}',
  'lend.noExpirySuffix': ', senza scadenza',
};

const en: Dict = {
  'tabs.home': 'Home',
  'tabs.invite': 'Invite',
  'tabs.collabora': 'Share',

  'app.addCard': 'Add a card',
  'app.importBulk': 'Import multiple cards from photos',
  'app.screenTitle.addCard': 'Add Card',
  'app.screenTitle.editCard': 'Edit Card',
  'app.screenTitle.showCode': 'Card Code',
  'app.screenTitle.scan': 'Scan Code',
  'app.screenTitle.bulkImport': 'Import Cards',
  'app.screenTitle.info': 'How it works',

  'common.cancel': 'Cancel',
  'common.error': 'Error',
  'common.permissionDenied': 'Permission denied',
  'common.confirm': 'Confirm',
  'adBanner.placeholder': 'Ad space',

  'removeAds.sectionTitle': 'Advertising',
  'removeAds.intro': 'If you\'d rather not see banners, you can remove them with a one-time purchase.',
  'removeAds.buyWithPrice': 'Remove ads — {{price}}',
  'removeAds.buy': 'Remove ads',
  'removeAds.restore': 'Restore purchases',
  'removeAds.owned': 'Ads removed',
  'removeAds.retry': 'Retry',
  'removeAds.manageConsent': 'Manage ad consent',
  'common.cardCodePlaceholder': 'Card code',
  'common.until': 'until {{date}}',
  'common.noExpiry': 'no expiry',

  'carte.searchPlaceholder': 'Search for a card',
  'carte.emptyText': 'TAP THE + \nTO ADD YOUR FIRST CARD',
  'carte.emptyAccessibility': 'Tap the plus to add your first card',
  'carte.lentBadge': '⭐ Lent',
  'carte.borrowedBadge': '💛 Borrowed',

  'addCard.namePlaceholder': 'Card name',
  'addCard.scanAccessibility': 'Scan the barcode',
  'addCard.importAccessibility': 'Import the code from a library photo',
  'addCard.codeHint':
    "Don't have the card with you? Type the number printed (or shown on screen) below the barcode.",
  'addCard.noLogoLabel': 'No logo found for this store: choose a color for the card.',
  'addCard.chooseIconLabel': "Choose an icon (optional) - it'll be swapped automatically once we find the official logo.",
  'addCard.sendPhotoButton': '📷 Send a photo of the logo/card',
  'addCard.expiryHint': 'Useful if this card was lent to you: it disappears on its own after the chosen date.',
  'addCard.expiryLabelSet': 'Auto-remove on {{date}}',
  'addCard.expiryLabelNone': 'No automatic removal',
  'addCard.saveNew': 'Save',
  'addCard.saveEdit': 'Save changes',
  'addCard.expirySheetTitle': 'Auto-remove',
  'addCard.expiryNeverOption': 'None (never remove)',
  'addCard.expiryInOption': 'In {{label}}',
  'addCard.photoSheetTitle': 'Logo/card photo',
  'addCard.takePhoto': 'Take a photo',
  'addCard.chooseFromLibrary': 'Choose from library',
  'addCard.permissionPhotoBody': 'Allow photo access to import a screenshot of the card.',
  'addCard.permissionCameraBody': 'Allow camera access to take the photo.',
  'addCard.permissionLibraryBody': 'Allow photo access to choose one.',
  'addCard.codeNotFoundTitle': 'Barcode not found',
  'addCard.codeNotFoundBody':
    "I couldn't recognize a barcode in the image. Try a clearer screenshot framing just the code, or use the live camera.",
  'addCard.sharingUnavailableTitle': 'Sharing unavailable',
  'addCard.sharingUnavailableBody': "Your device doesn't support file sharing.",
  'addCard.missingLogoShareTitle': 'Missing logo: {{name}}',
  'addCard.errorNameBody': "Enter the card's name.",
  'addCard.errorCodeBody': "Enter the card's code.",

  'scan.permissionText': "To scan the card's barcode, allow camera access.",
  'scan.allowCamera': 'Allow camera',
  'scan.hint': "Frame the card's barcode",

  'bulkImport.permissionBody': 'Allow photo access to import the cards.',
  'bulkImport.introTitle': 'Import multiple cards together',
  'bulkImport.introText':
    "Useful if you're coming from another app (e.g. Klarna): screenshot each card, then select them all here together. I'll try to recognize the code and store for each - you can check and fix everything before saving.",
  'bulkImport.chooseScreenshots': 'Choose screenshots',
  'bulkImport.analyzing': 'Analyzing photos... {{done}}/{{total}}',
  'bulkImport.reviewHint':
    "Check each card's name and code before saving - if something wasn't read correctly, fix it below.",
  'bulkImport.storeNamePlaceholder': 'Store name',
  'bulkImport.incompleteTitle': 'Some cards are incomplete',
  'bulkImport.incompleteBody': '{{count}} {{word}} missing a name or code: fix or remove with 🗑️ before saving.',
  'bulkImport.saveButton': 'Save {{count}} {{word}}',
  'bulkImport.cardWordOne': 'card',
  'bulkImport.cardWordMany': 'cards',

  'collabora.intro':
    "Lend your cards to people close to you, or keep track of who's lent you theirs — useful if you split points on different stores.",
  'collabora.sectionLend': 'Lend a card',
  'collabora.emptyHint': "You don't have any cards to lend yet.",
  'collabora.sectionLentByYou': '⭐ Lent by you',
  'collabora.sectionBorrowed': '💛 Borrowed',
  'collabora.borrowedFrom': 'Lent by {{name}}',
  'collabora.removeTitle': 'Remove from the list?',
  'collabora.removeBody':
    '"{{name}}" will be removed from the list of people who received this card (it\'s just a reminder — their copy isn\'t touched).',
  'collabora.removeConfirm': 'Remove',
  'collabora.durationSheetTitle': 'For how long?',
  'collabora.recipientTitle': 'Who are you lending this card to?',
  'collabora.recipientPlaceholder': "Recipient's name",
  'collabora.shareConfirm': 'Share',
  'collabora.onboardingTitle':
    "What's your name? Whoever receives a card from you will see it, so they know it's from you. We don't read any other setting or data on your phone.",
  'collabora.namePlaceholder': 'Your name',
  'collabora.continueConfirm': 'Continue',
  'collabora.shareMessage': "I'm lending you my {{name}} card ({{expiry}}). Tap to add it in FideliCard: {{link}}",

  'showCode.deleteTitle': 'Delete Card',
  'showCode.deleteBody': 'Delete "{{name}}"?',
  'showCode.deleteConfirm': 'Delete',
  'showCode.copyCode': 'Copy code',
  'showCode.copied': 'Copied',
  'showCode.edit': 'Edit',
  'showCode.delete': 'Delete',
  'showCode.borrowedFrom': '💛 Lent by {{name}}',
  'showCode.lentToTitle': 'Lent to:',
  'showCode.lentToRow': '⭐ {{name}} — {{expiry}}',

  'inviteQr.title': 'Invite someone to FideliCard',
  'inviteQr.subtitle': 'Have them scan this code to download the app',
  'inviteQr.shareButton': 'Share the link',
  'inviteQr.close': 'Close',
  'inviteQr.shareMessage': 'Try FideliCard, all your loyalty cards in one app: {{url}}',

  'about.heroTitle': 'Your loyalty cards,\nall in one place',
  'about.heroSubtitle':
    'FideliCard gathers all your loyalty cards into one simple, fast app — no account, no data leaving your phone, nothing else bolted on.',
  'about.sectionHow': 'How it works',
  'about.step1Title': 'Add a card',
  'about.step1Text':
    "Scan the barcode live, import it from a photo or screenshot, or type the number by hand if you don't have the card with you.",
  'about.step2Title': 'Import multiple cards together',
  'about.step2Text':
    'Coming from another app and want to move all your cards? Screenshot each one, select them all together from "Import multiple cards from photos" and check them before saving — nothing to redo one at a time.',
  'about.step3Title': 'Show it at checkout',
  'about.step3Text': 'Tap the card from Home: barcode and number large and readable, ready to scan.',
  'about.step4Title': 'Share with whoever you want',
  'about.step4Text':
    'From the Share page you can lend a card to a family member or friend, for as long as you like — useful for splitting points on different stores.',
  'about.sectionWhy': 'Why FideliCard',
  'about.point1Title': 'Your cards stay yours',
  'about.point1Text': 'No account, no server: everything you add stays saved only on your phone.',
  'about.point2Title': 'Every kind of card',
  'about.point2Text':
    'Supermarkets, gas stations, pharmacies, neighborhood shops, points programs — not just the big chains.',
  'about.point3Title': 'Works offline too',
  'about.point3Text':
    "The barcode always shows, even without a connection: at checkout it should never depend on the store's wifi.",
  'about.point4Title': 'Fast, no frills',
  'about.point4Text': 'Open the app, tap the card, show the code. Done.',
  'about.point5Title': 'Just loyalty cards, nothing else',
  'about.point5Text':
    "It's not a payments app and not a credit card: we never ask for banking details, and we don't push you toward other services.",
  'about.point6Title': 'Logos always up to date',
  'about.point6Text':
    'The store database updates itself in the background: new brands and logos arrive without needing to update the app.',
  'about.sectionBackup': 'Backup and restore',
  'about.backupIntro': "Your cards live only on this phone: if you change it or uninstall the app, save a backup first.",
  'about.exportButton': 'Export my cards',
  'about.exportingButton': 'Exporting...',
  'about.importButton': 'Import from a backup',
  'about.importingButton': 'Importing...',
  'about.exportEmptyTitle': 'No cards',
  'about.exportEmptyBody': "You don't have any cards to export yet.",
  'about.exportErrorBody': "I couldn't create the backup file.",
  'about.importedTitle': 'Backup imported',
  'about.importedAdded': 'Added {{count}} cards.',
  'about.importedSkipped': ' {{count}} already present, skipped.',
  'about.importErrorBody': "The chosen file isn't a valid FideliCard backup.",

  'lend.requestTitle': 'Card loan',
  'lend.requestBody': '{{from}} is lending you their {{name}} card{{expiry}}. Do you want to accept it?',
  'lend.no': 'No',
  'lend.yesAdd': 'Yes, add it',
  'lend.duplicateTitle': 'Card already present',
  'lend.duplicateBody': "You already have a card with this code (\"{{name}}\"): I didn't add it again.",
  'lend.doneTitle': 'Done!',
  'lend.doneBody': '"{{name}}" from {{from}} has been added to your cards.',
  'lend.untilSuffix': ' until {{date}}',
  'lend.noExpirySuffix': ', with no expiry',
};

const dictionaries: Record<'it' | 'en', Dict> = { it, en };

export function t(key: string, vars?: Record<string, string | number>): string {
  let str = dictionaries[locale][key] ?? dictionaries.it[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.split(`{{${k}}}`).join(String(v));
    }
  }
  return str;
}

// Parola "tessera/tessere" (o "card/cards") già declinata, da passare come
// {{word}} nelle chiavi che ne hanno bisogno - evita di dover gestire il
// plurale dentro al dizionario stesso.
export function cardWord(count: number): string {
  return count === 1 ? t('bulkImport.cardWordOne') : t('bulkImport.cardWordMany');
}
