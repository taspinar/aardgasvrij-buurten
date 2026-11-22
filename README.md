# Aardgasvrij per buurt

Buurtrapporten met advies per woningtype om stap voor stap van het aardgas af te gaan. Gemaakt door [JIDAI (jidai.nl)](https://jidai.nl) met behulp van AI, op basis van openbare bronnen.

De site draait op GitHub Pages en bestaat uit gewone HTML-bestanden, zonder bouwstap.

## Buurten

| Buurt | Gemeente | Rapport |
| --- | --- | --- |
| Molenbuurt | Capelle aan den IJssel | [`capelle-aan-den-ijssel/molenbuurt/`](capelle-aan-den-ijssel/molenbuurt/) |

## Opbouw

```
index.html                               startpagina met alle buurten
assets/style.css                         gedeelde opmaak
assets/rekenhulp.js                      rekenhulp in het rapport, zelfde model als scripts/model.py
<gemeente>/<buurt>/index.html            het rapport
<gemeente>/<buurt>/flyers.html           flyers per woningtype, printbaar als A4
<gemeente>/<buurt>/data/samenvatting.json  getotaliseerde cijfers van de buurt
scripts/analyse.py                       tellingen op de adreslijst
scripts/model.py                         rekenmodel hybride en volledig elektrisch
```

## Publiceren

1. Ga in de repository naar **Settings → Pages**.
2. Kies bij **Source** voor **Deploy from a branch**, branch `main`, map `/ (root)`.
3. De site staat daarna op `https://taspinar.github.io/aardgasvrij-buurten/`.

## Een buurt toevoegen

1. Zoek de CBS-buurtcode op en haal de kerncijfers op uit de tabel [Kerncijfers wijken en buurten](https://www.cbs.nl/nl-nl/cijfers/detail/86165ned).
2. Stel een adreslijst samen met per adres: straat, huisnummer, woonoppervlak, woningtype, bouwjaar en energielabel (BAG van het Kadaster en energielabels van RVO).
3. Draai de scripts:
   ```
   python3 scripts/analyse.py adressen.csv
   python3 scripts/model.py adressen.csv
   ```
4. Kopieer de map van een bestaande buurt, vervang de cijfers en teksten, en voeg de buurt toe aan `index.html` en aan de tabel hierboven.

De adreslijst zelf staat niet in deze repository. Alleen de getotaliseerde cijfers worden gepubliceerd.

### Formaat van de adreslijst

Puntkomma-gescheiden, met deze kolommen:

```
straat;nr;m2;type;jaar;label
Windmolen;1;122;H;1986;C
Windmolen;2;122;T;1986;Cv
```

- `type`: `T` tussenwoning, `H` hoekwoning, `2` twee-onder-een-kap, `A` appartement, `N` geen woning
- `label`: het energielabel, met een `v` erachter als het een voorlopig label is, `-` als er geen is

## Aannames in het rekenmodel

De aannames staan bovenaan `scripts/model.py`. De belangrijkste:

- Energieprijzen van Milieu Centraal voor de lange termijn (2026 tot 2040): € 1,37 per m³ gas en € 0,21 per kWh stroom.
- Hybride warmtepomp: 65% minder gas voor verwarming.
- Vaste kosten van de gasaansluiting: € 360 per jaar.
- Investeringen en subsidies: kengetallen van Milieu Centraal en RVO, stand november 2026.

De rapporten zijn een startpunt voor het gesprek in de buurt. Ze zijn geen persoonlijk advies en geen offerte.
