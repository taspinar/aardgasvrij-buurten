/* Rekenhulp: hybride of volledig elektrische warmtepomp.
   Zelfde model en aannames als scripts/model.py. */
(function () {
  'use strict';

  var MODEL = {
    tapEnKoken: 290,         // m3 gas per jaar voor warm water en koken
    aandeelHybride: 0.65,    // deel van het gas voor verwarming dat een hybride bespaart
    kwhPerM3Hybride: 2.3,    // extra stroom per bespaarde m3 gas
    kwhPerM3Elektrisch: 3.6, // stroom per vervangen m3 gas
    vasteKostenGas: 360,     // euro per jaar, vervalt zonder gasaansluiting
    prijsHybride: 6200,
    prijsElektrisch: 12000,
    prijsInductie: 1600,
    prijsKetel: 2100,
    subsidie: { '2026': { hybride: 2125, elektrisch: 3025 }, '2027': { hybride: 1955, elektrisch: 2435 } },
    prijzen: { lang: { gas: 1.37, stroom: 0.21 }, nu: { gas: 1.80, stroom: 0.33 } },
    levensduur: 15,
    horizon: 20
  };
  var SERIES = [
    { key: 'hybride', naam: 'Hybride warmtepomp', kleur: '#2a78d6' },
    { key: 'elektrisch', naam: 'Volledig elektrisch', kleur: '#eb6834' }
  ];
  var NS = 'http://www.w3.org/2000/svg';

  function bereken(invoer) {
    var G = invoer.gas, pg = invoer.prijsGas, ps = invoer.prijsStroom;
    var sub = MODEL.subsidie[invoer.jaar];
    var bespaardGas = MODEL.aandeelHybride * Math.max(G - MODEL.tapEnKoken, 0);
    var extraStroomH = bespaardGas * MODEL.kwhPerM3Hybride;
    var besparingH = bespaardGas * pg - extraStroomH * ps;
    var nettoH = MODEL.prijsHybride - sub.hybride;
    var stroomE = G * MODEL.kwhPerM3Elektrisch;
    var besparingE = G * pg + MODEL.vasteKostenGas - stroomE * ps;
    var nettoE = MODEL.prijsElektrisch + MODEL.prijsInductie - sub.elektrisch - (invoer.ketelOp ? MODEL.prijsKetel : 0);
    return {
      hybride: { gasMinder: bespaardGas, stroomMeer: extraStroomH, besparing: besparingH, netto: nettoH, tvt: besparingH > 0 ? nettoH / besparingH : null },
      elektrisch: { gasMinder: G, stroomMeer: stroomE, besparing: besparingE, netto: nettoE, tvt: besparingE > 0 ? nettoE / besparingE : null }
    };
  }

  function getal(x) { return Math.round(x).toLocaleString('nl-NL'); }
  function euro(x) { return '€ ' + getal(x); }
  function saldoTekst(x) { return (x < 0 ? '− € ' : '+ € ') + getal(Math.abs(x)); }
  function jaren(t) {
    if (t === null) { return 'nooit'; }
    if (t > 40) { return '40+ jaar'; }
    return Math.round(t) + ' jaar';
  }

  function oordeel(r, gas) {
    var h = r.hybride.tvt, e = r.elektrisch.tvt, L = MODEL.levensduur;
    if (gas <= MODEL.tapEnKoken) {
      return 'Je gebruikt bijna geen gas voor verwarming. Een hybride warmtepomp bespaart dan niets; volledig elektrisch levert vooral de vaste gaskosten op.';
    }
    if (h !== null && h <= L && (e === null || h < e)) {
      return 'Een hybride warmtepomp verdient zich bij jou het snelst terug. Volledig elektrisch bespaart per jaar wel meer.';
    }
    if (e !== null && e <= L) {
      return (h === null || h > L)
        ? 'Volledig elektrisch verdient zich terug. Een hybride warmtepomp doet dat niet binnen de levensduur van ongeveer ' + L + ' jaar.'
        : 'Volledig elektrisch verdient zich bij jou het snelst terug.';
    }
    return 'Geen van beide verdient zich terug binnen de levensduur van ongeveer ' + L + ' jaar. Wacht tot de ketel aan vervanging toe is en reken dan opnieuw.';
  }

  function svg(naam, attrs, tekst) {
    var n = document.createElementNS(NS, naam);
    for (var k in attrs) { if (Object.prototype.hasOwnProperty.call(attrs, k)) { n.setAttribute(k, attrs[k]); } }
    if (tekst !== undefined) { n.textContent = tekst; }
    return n;
  }

  function nettestap(bereik) {
    var stappen = [500, 1000, 2000, 2500, 5000, 10000, 20000];
    for (var i = 0; i < stappen.length; i++) { if (bereik / stappen[i] <= 6) { return stappen[i]; } }
    return 50000;
  }

  function tekenGrafiek(root, r, breedte) {
    var W = Math.max(280, Math.round(breedte || 640)), smal = W < 480;
    var H = smal ? 290 : 340, m = { l: 74, r: 14, t: 14, b: 34 };
    var pw = W - m.l - m.r, ph = H - m.t - m.b, T = MODEL.horizon;
    var saldo = function (k, t) { return r[k].besparing * t - r[k].netto; };
    var lo = Math.min(-r.hybride.netto, -r.elektrisch.netto);
    var hi = Math.max(saldo('hybride', T), saldo('elektrisch', T), 1000);
    var stap = nettestap(hi - lo);
    lo = Math.floor(lo / stap) * stap; hi = Math.ceil(hi / stap) * stap;
    var x = function (t) { return m.l + pw * t / T; };
    var y = function (v) { return m.t + ph * (hi - v) / (hi - lo); };

    while (root.firstChild) { root.removeChild(root.firstChild); }
    root.setAttribute('viewBox', '0 0 ' + W + ' ' + H);

    for (var v = lo; v <= hi + 1; v += stap) {
      var nul = Math.abs(v) < 1;
      root.appendChild(svg('line', { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v), stroke: nul ? '#6b7280' : '#e3e6ea', 'stroke-width': 1 }));
      root.appendChild(svg('text', { x: m.l - 8, y: y(v) + 4, 'text-anchor': 'end', 'class': 'rh-as' }, (v < 0 ? '−' : '') + '€ ' + getal(Math.abs(v))));
    }
    for (var t = 0; t <= T; t += 5) {
      root.appendChild(svg('text', { x: x(t), y: H - 12, 'text-anchor': t === 0 ? 'start' : (t === T ? 'end' : 'middle'), 'class': 'rh-as' }, t === 0 ? 'nu' : (smal ? (t === T ? t + ' jaar' : String(t)) : 'na ' + t + ' jaar')));
    }
    var xl = x(MODEL.levensduur);
    root.appendChild(svg('line', { x1: xl, x2: xl, y1: m.t, y2: m.t + ph, stroke: '#6b7280', 'stroke-width': 1, 'stroke-dasharray': '4 4' }));
    root.appendChild(svg('text', { x: xl - 6, y: m.t + 12, 'text-anchor': 'end', 'class': 'rh-as' }, 'levensduur ±' + MODEL.levensduur + ' jaar'));

    var begin = SERIES.map(function (s) { return { s: s, y: y(saldo(s.key, 0)) }; });
    begin.sort(function (a, b) { return a.y - b.y; });
    SERIES.forEach(function (s) {
      root.appendChild(svg('line', { x1: x(0), y1: y(saldo(s.key, 0)), x2: x(T), y2: y(saldo(s.key, T)), stroke: s.kleur, 'stroke-width': 2.5, 'stroke-linecap': 'round' }));
      var tv = r[s.key].tvt;
      if (tv !== null && tv <= T) {
        root.appendChild(svg('circle', { cx: x(tv), cy: y(0), r: 5.5, fill: s.kleur, stroke: '#ffffff', 'stroke-width': 2 }));
      }
    });
    begin.forEach(function (e, i) {
      var ly = i === 0 ? Math.max(e.y - 16, m.t + 12) : Math.min(e.y + 20, m.t + ph - 6);
      root.appendChild(svg('text', { x: m.l + 8, y: ly, 'text-anchor': 'start', 'class': 'rh-lijnlabel' }, e.s.naam));
    });

    var kruis = svg('line', { y1: m.t, y2: m.t + ph, stroke: '#1a1a1a', 'stroke-width': 1, visibility: 'hidden' });
    root.appendChild(kruis);
    var punten = SERIES.map(function (s) {
      var c = svg('circle', { r: 5, fill: s.kleur, stroke: '#ffffff', 'stroke-width': 2, visibility: 'hidden' });
      root.appendChild(c); return c;
    });
    var vang = svg('rect', { x: m.l, y: m.t, width: pw, height: ph, fill: 'transparent' });
    root.appendChild(vang);

    return {
      toon: function (clientX) {
        var box = root.getBoundingClientRect();
        var t = Math.round(((clientX - box.left) / box.width * W - m.l) / pw * T);
        t = Math.max(0, Math.min(T, t));
        kruis.setAttribute('x1', x(t)); kruis.setAttribute('x2', x(t)); kruis.setAttribute('visibility', 'visible');
        SERIES.forEach(function (s, i) {
          punten[i].setAttribute('cx', x(t)); punten[i].setAttribute('cy', y(saldo(s.key, t))); punten[i].setAttribute('visibility', 'visible');
        });
        return { jaar: t, links: x(t) / W, waarden: SERIES.map(function (s) { return { s: s, v: saldo(s.key, t) }; }) };
      },
      verberg: function () {
        kruis.setAttribute('visibility', 'hidden');
        punten.forEach(function (p) { p.setAttribute('visibility', 'hidden'); });
      },
      saldo: saldo
    };
  }

  function init() {
    var form = document.getElementById('rekenhulp');
    if (!form) { return; }
    var el = function (id) { return document.getElementById(id); };
    var schuif = el('rh-gas'), veld = el('rh-gas-getal'), uit = el('rh-gas-uit');
    var chips = Array.prototype.slice.call(form.querySelectorAll('.rh-chip'));
    var grafiek = null, tip = el('rh-tip'), figuur = el('rh-figuur'), plaat = el('rh-grafiek');
    var keuze = function (naam) { var n = form.querySelector('input[name="' + naam + '"]:checked'); return n ? n.value : null; };
    var num = function (n) { return parseFloat(String(n.value).replace(',', '.')); };

    function prijzen() {
      var k = keuze('rh-prijzen');
      if (k === 'eigen') { return { gas: num(el('rh-prijs-gas')), stroom: num(el('rh-prijs-stroom')) }; }
      return MODEL.prijzen[k];
    }

    function vulRegel(tr, cellen) {
      cellen.forEach(function (c, i) {
        var td = document.createElement(i === 0 ? 'th' : 'td');
        if (i === 0) { td.scope = 'row'; } else { td.className = 'num'; }
        td.textContent = c; tr.appendChild(td);
      });
    }

    function toon() {
      var G = num(veld);
      el('rh-eigen').hidden = keuze('rh-prijzen') !== 'eigen';
      var p = prijzen(), fout = el('rh-fout');
      if (!(G >= 0 && G <= 5000) || !(p.gas > 0) || !(p.stroom > 0)) {
        fout.textContent = 'Vul een gasverbruik tussen 0 en 5.000 m³ in, en prijzen hoger dan 0.';
        fout.hidden = false; el('rh-uitkomst').hidden = true; return;
      }
      fout.hidden = true;
      el('rh-uitkomst').hidden = false;
      schuif.value = Math.max(+schuif.min, Math.min(+schuif.max, G));
      uit.textContent = getal(G);
      var pct = (Math.max(+schuif.min, Math.min(+schuif.max, G)) - schuif.min) / (schuif.max - schuif.min) * 100;
      schuif.style.setProperty('--rh-vul', pct + '%');
      chips.forEach(function (c) { c.setAttribute('aria-pressed', String(+c.getAttribute('data-gas') === G && c.getAttribute('data-actief') === '1')); });

      var r = bereken({ gas: G, ketelOp: keuze('rh-ketel') === 'ja', jaar: keuze('rh-jaar'), prijsGas: p.gas, prijsStroom: p.stroom });
      SERIES.forEach(function (s) {
        var d = r[s.key], k = s.key;
        el('rh-' + k + '-tvt').textContent = jaren(d.tvt);
        el('rh-' + k + '-besparing').textContent = euro(d.besparing) + ' per jaar';
        el('rh-' + k + '-netto').textContent = euro(d.netto);
        el('rh-' + k + '-gas').textContent = getal(d.gasMinder) + ' m³ minder gas, ' + getal(d.stroomMeer) + ' kWh meer stroom per jaar';
        var deel = d.tvt === null ? 100 : Math.min(d.tvt / MODEL.horizon, 1) * 100;
        el('rh-' + k + '-balk').style.width = deel + '%';
        el('rh-' + k + '-oordeel').textContent = d.tvt === null ? 'Verdient zich niet terug'
          : (d.tvt <= MODEL.levensduur ? 'Terugverdiend binnen de levensduur' : 'Langer dan de levensduur van ±' + MODEL.levensduur + ' jaar');
      });
      el('rh-oordeel').textContent = oordeel(r, G);

      grafiek = tekenGrafiek(plaat, r, plaat.parentNode.clientWidth);
      var body = el('rh-tabel');
      while (body.firstChild) { body.removeChild(body.firstChild); }
      [0, 5, 10, 15, 20].forEach(function (t) {
        var tr = document.createElement('tr');
        vulRegel(tr, [t === 0 ? 'Nu' : 'Na ' + t + ' jaar', saldoTekst(grafiek.saldo('hybride', t)), saldoTekst(grafiek.saldo('elektrisch', t))]);
        body.appendChild(tr);
      });
      plaat.setAttribute('aria-label', 'Lijngrafiek van het saldo over 20 jaar. Hybride: terugverdiend na ' + jaren(r.hybride.tvt) + '. Volledig elektrisch: terugverdiend na ' + jaren(r.elektrisch.tvt) + '.');
      tip.hidden = true;
    }

    function wijs(e) {
      if (!grafiek) { return; }
      var d = grafiek.toon(e.clientX);
      while (tip.firstChild) { tip.removeChild(tip.firstChild); }
      var kop = document.createElement('div'); kop.className = 'rh-tip-kop';
      kop.textContent = d.jaar === 0 ? 'Nu' : 'Na ' + d.jaar + ' jaar'; tip.appendChild(kop);
      d.waarden.forEach(function (w) {
        var rij = document.createElement('div'); rij.className = 'rh-tip-rij';
        var st = document.createElement('span'); st.className = 'rh-streep'; st.style.background = w.s.kleur;
        var wa = document.createElement('strong'); wa.textContent = saldoTekst(w.v);
        var na = document.createElement('span'); na.textContent = w.s.naam;
        rij.appendChild(st); rij.appendChild(wa); rij.appendChild(na); tip.appendChild(rij);
      });
      tip.hidden = false;
      var breed = figuur.clientWidth, tb = tip.offsetWidth, links = d.links * plaat.clientWidth + 12;
      if (links + tb > breed) { links = d.links * plaat.clientWidth - tb - 12; }
      tip.style.left = Math.max(0, links) + 'px';
    }
    plaat.addEventListener('pointermove', wijs);
    plaat.addEventListener('pointerdown', wijs);
    plaat.addEventListener('pointerleave', function () { if (grafiek) { grafiek.verberg(); } tip.hidden = true; });

    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        chips.forEach(function (o) { o.setAttribute('data-actief', o === c ? '1' : '0'); });
        veld.value = c.getAttribute('data-gas'); toon();
      });
    });
    schuif.addEventListener('input', function () { chips.forEach(function (o) { o.setAttribute('data-actief', '0'); }); veld.value = schuif.value; toon(); });
    veld.addEventListener('input', function () { chips.forEach(function (o) { o.setAttribute('data-actief', '0'); }); toon(); });
    form.addEventListener('change', function (e) { if (e.target !== schuif && e.target !== veld) { toon(); } });
    ['rh-prijs-gas', 'rh-prijs-stroom'].forEach(function (id) { el(id).addEventListener('input', function () { toon(); }); });
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    var wacht = null;
    window.addEventListener('resize', function () { clearTimeout(wacht); wacht = setTimeout(toon, 150); });
    toon();
  }

  if (typeof module !== 'undefined' && module.exports) { module.exports = { bereken: bereken, MODEL: MODEL }; }
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
  }
})();
