# Orbit — versione statica (GitHub Pages)

App di gestione abbonamenti. Nessun server, nessun database, nessun login:
i dati vivono nel localStorage del browser/telefono. Installabile come app
(PWA) su iPhone e Android.

## Come metterla online (una volta sola)

1. Crea un repository nuovo su GitHub (pubblico o privato, indifferente).
2. Carica dentro TUTTO il contenuto di questa cartella (compresa la cartella
   nascosta `.github`, che contiene il robot che builda l'app in automatico).
3. Vai su **Settings → Pages** del repository.
4. In "Build and deployment" → "Source", scegli **GitHub Actions**
   (non "Deploy from a branch").
5. Vai su **Actions**, in alto: dovresti vedere un workflow "Deploy su
   GitHub Pages" già partito da solo dopo il push. Aspetta che finisca
   (icona verde ✓, di solito 1-2 minuti).
6. Torna su **Settings → Pages**: in alto trovi l'indirizzo pubblico,
   tipo `https://tuonome.github.io/nome-repo/`. Aprilo.

Da questo momento in poi, ogni volta che modifichi qualcosa e fai push su
`main`, il sito si aggiorna da solo in 1-2 minuti. Non devi buildare nulla
a mano.

## Come installarla sul telefono

**iPhone (Safari):** apri il link → tasto Condividi → "Aggiungi alla
schermata Home".

**Android (Chrome):** apri il link → appare in automatico un banner
"Installa app", oppure menu ⋮ → "Installa app" / "Aggiungi alla schermata
Home".

Dopo l'installazione si apre a schermo intero, come un'app vera, con la
sua icona (il sole cyan).

## Sviluppo in locale (facoltativo, solo se vuoi modificarla tu)

Serve Node.js 20+.

```
npm install
npm run dev
```

Apri l'indirizzo che stampa in console (di solito `http://localhost:5173`).

Per generare la build statica manualmente (di solito non serve, ci pensa
GitHub Actions):

```
npm run build
```

I file pronti per il web escono in `dist/`.

## Cosa NON c'è (e perché va bene così)

- **Nessun login/account.** I dati sono legati al browser/dispositivo.
  Se cancelli i dati del browser o cambi telefono, li perdi — usa
  Impostazioni → Esporta per un backup manuale in JSON, e Importa per
  ripristinarlo altrove.
- **Nessun database, nessun costo di hosting.** GitHub Pages è gratuito
  per questo tipo di sito.
- **Font Google caricati da internet.** Se il telefono è offline al primo
  avvio, l'app usa un font di sistema al posto di Orbitron/Outfit — tutto
  il resto (dati, icone, sole cyan) funziona lo stesso anche offline grazie
  al service worker incluso.

## Struttura

- `src/components/` — tutta l'interfaccia (home, orbita animata, agenda,
  dati, impostazioni, form).
- `src/lib/` — dati, formattazione, store (localStorage), elenco brand.
- `public/` — icone dei brand, icone dell'app, manifest PWA, service worker.
