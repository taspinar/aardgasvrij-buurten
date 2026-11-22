"""Rekenmodel Molenbuurt: hybride vs volledig elektrisch.
Aannames (bron tussen haakjes):
- prijzen lang: gas 1,37 /m3, stroom 0,21 /kWh (Milieu Centraal, gemiddelde 2026-2040)
- prijzen nu:  gas 1,80 /m3, stroom 0,33 /kWh (afgerond, nieuwe contracten nov 2026)
- hybride: 65% minder gas voor verwarming (MC: 60-70%), 2,3 kWh extra stroom per bespaarde m3
  (afgeleid uit MC-rekenvoorbeeld 1.360 -> 680 m3, besparing 600 euro)
- volledig elektrisch: 3,6 kWh per vervangen m3 gas (MC-voorbeeld 950 m3 -> 3.400 kWh)
- vaste kosten gasaansluiting 360 euro/jaar vervallen bij volledig elektrisch (MC)
- gas voor warm water en koken: 290 m3/jaar (aanname: 250 warm water + 37 koken, afgerond)
- investering: hybride 6.200, volledig elektrisch 12.000, inductie incl. groep en pannen 1.600 (MC)
- ISDE 2026: hybride 4 kW A+++ 2.125; volledig elektrisch 8 kW A+++ 3.025
- ISDE 2027: 1.955 resp. 2.435 (RVO, voorgenomen, met slimme aansturing)
- cv-ketel alleen vervangen: 2.100 (verschil MC 8.300 - 6.200)
"""
import csv, sys, statistics as st
P = {"lang": (1.37, 0.21), "nu": (1.80, 0.33)}
TAP = 290; VAST = 360
INV_H, INV_E, INV_I, KETEL = 6200, 12000, 1600, 2100
SUB = {2026: (2125, 3025), 2027: (1955, 2435)}

def hybride(G, gas, kwh):
    saved = 0.65 * max(G - TAP, 0)
    return saved, saved * 2.3, saved * gas - saved * 2.3 * kwh

def elektrisch(G, gas, kwh):
    return G * 3.6, G * gas + VAST - G * 3.6 * kwh

print("== per eigen gasverbruik ==")
for G in (600, 800, 1000, 1300):
    for naam, (gas, kwh) in P.items():
        s, e, bh = hybride(G, gas, kwh)
        ee, be = elektrisch(G, gas, kwh)
        for jaar, (sh, se) in SUB.items():
            nh = INV_H - sh
            ne = INV_E + INV_I - se
            ne_meer = ne - KETEL
            print(f"G={G} {naam} {jaar}: hybride -{s:.0f} m3 +{e:.0f} kWh besp {bh:.0f}/jr netto {nh} tvt {nh/bh:.1f} | "
                  f"elektr +{ee:.0f} kWh besp {be:.0f}/jr netto {ne} tvt {ne/be:.1f} (meerkosten t.o.v. nieuwe ketel {ne_meer}: {ne_meer/be:.1f})")

print("\n== indicatief gasverbruik per woningtype (schaal op woonoppervlak, buurtgemiddelde 770 m3) ==")
rows = [r for r in csv.DictReader(open(sys.argv[1], encoding="utf-8"), delimiter=";") if r["type"] != "N"]
for r in rows: r["m2"] = int(r["m2"])
gem = st.mean(r["m2"] for r in rows)
print("gemiddeld m2", round(gem, 1), "gas per m2", round(770 / gem, 2))
groepen = {
    "1 tussen <130": [r for r in rows if r["type"] == "T" and r["m2"] < 130],
    "2 tussen 130-160": [r for r in rows if r["type"] == "T" and 130 <= r["m2"] < 160],
    "3 hoek/2-1 <160": [r for r in rows if r["type"] in "H2" and r["m2"] < 160],
    "4 groot >=160": [r for r in rows if r["type"] in "TH2" and r["m2"] >= 160],
    "5 appartement": [r for r in rows if r["type"] == "A"],
}
tot = 0
for k, v in groepen.items():
    m = st.median(r["m2"] for r in v); tot += len(v)
    lab = [r["label"].replace(" ", "") for r in v]
    defi = [l for l in lab if not l.endswith("v")]
    ab = sum(1 for l in defi if l[0] in "AB")
    print(f"{k}: n={len(v)} mediaan {m} m2, gas ~{770/gem*m:.0f} m3, geregistreerd label {len(defi)}, waarvan A/B {ab}")
print("som", tot)
