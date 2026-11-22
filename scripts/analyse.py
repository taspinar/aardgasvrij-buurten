import csv, sys, statistics as st
from collections import Counter, defaultdict
rows = list(csv.DictReader(open(sys.argv[1], encoding="utf-8"), delimiter=";"))
for r in rows:
    r["m2"] = int(r["m2"]); r["jaar"] = int(r["jaar"]); r["label"] = r["label"].replace(" ", "")
print("adressen totaal", len(rows))
won = [r for r in rows if r["type"] != "N"]
print("woningen", len(won), "niet-woning", len(rows) - len(won))
print("per straat", Counter(r["straat"] for r in won))
tn = {"T": "tussen", "H": "hoek", "A": "appartement", "2": "2-1-kap"}
print("type", {tn[k]: (v, round(100 * v / len(won))) for k, v in Counter(r["type"] for r in won).items()})
print("bouwjaar", sorted(Counter(r["jaar"] for r in won).items()))
def lab(sel, name):
    n = len(sel)
    defi = [r for r in sel if not r["label"].endswith("v")]
    voorl = n - len(defi)
    c = Counter(r["label"] for r in defi)
    print(f"\n{name}: n={n}, m2 mediaan {st.median(r['m2'] for r in sel)}, min {min(r['m2'] for r in sel)}, max {max(r['m2'] for r in sel)}")
    print("  definitief label:", len(defi), f"({round(100*len(defi)/n)}%)", "voorlopig:", voorl)
    print("  verdeling definitief:", sorted(c.items()))
    ab = sum(v for k, v in c.items() if k[0] in "AB")
    print("  A of B (definitief):", ab, f"= {round(100*ab/n)}% van alle, {round(100*ab/len(defi))}% van definitief")
lab(won, "ALLE")
egw = [r for r in won if r["type"] != "A"]
lab(egw, "EENGEZINS")
lab([r for r in won if r["type"] == "A"], "APPARTEMENT")
lab([r for r in won if r["type"] == "T"], "TUSSEN")
lab([r for r in won if r["type"] in "H2"], "HOEK+2-1")
# grootteklassen eengezins
for lo, hi in [(0, 130), (130, 160), (160, 999)]:
    s = [r for r in egw if lo <= r["m2"] < hi]
    print(f"eengezins {lo}-{hi} m2: {len(s)} ({round(100*len(s)/len(egw))}%)")
# complexen appartementen
d = defaultdict(list)
for r in won:
    if r["type"] == "A":
        d[(r["straat"], r["jaar"])].append(r["m2"])
for k, v in d.items():
    print("app-complex", k, len(v), "mediaan m2", st.median(v))
