# Liquid Study Space

Ein responsives Studien-Dashboard im Apple-inspirierten Liquid-Glass-Stil. Der
Stundenplan wird aus `public/schedule.ics` geladen und im Browser als aktueller
und nächster Termin dargestellt.

## Lokal starten

```bash
npm install
npm run dev
```

Die Seite ist anschließend unter `http://localhost:3000` erreichbar.

## Produktion bauen

```bash
npm run build
```

Die Konfiguration erzeugt einen statischen Export im Ordner `out/`. Dadurch kann
die Seite kostenlos auf statischem Hosting wie Cloudflare Pages oder GitHub
Pages veröffentlicht werden.

### Kostenlose Veröffentlichung mit Cloudflare Pages

1. Ein Cloudflare-Konto anlegen und das GitHub-Repository verbinden oder den
   Inhalt des Ordners `out/` hochladen.
2. Als Build-Befehl `npm run build` und als Ausgabeordner `out` verwenden.
3. Nach dem ersten Deployment in Cloudflare Pages unter **Custom domains** die
   erworbene Domain hinzufügen.
4. Die von Cloudflare angezeigten DNS-Einträge beim Domainanbieter setzen.

Die Datei `public/schedule.ics` wird beim Build ausgeliefert. Für tatsächlich
automatische Stundenplanänderungen muss diese Datei später regelmäßig aus der
HISinOne-Quelle aktualisiert und neu deployed werden.
