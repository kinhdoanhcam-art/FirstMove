"""Kill-set + rubric gate for StepOrder (project FirstMove).

GATE 1  no token or bigram may separate the two classes.
GATE 2  the rubric may share no content word with any case.
        (The gate does NOT stem: 'pay' and 'paid' look different to it,
         so a green gate still needs a human read of the rubric.)

Run:  python3 STEPORDER_KILLSET_CHECK.py
      python3 STEPORDER_KILLSET_CHECK.py contracts/StepOrder.py
"""

import re
import sys

OTHER_LABEL = "the Buyer"

CASES = {
    "AUTHOR_FIRST": {
        "F1": "The Buyer pays on delivery.",
        "F2": "We release the licence key, then invoice.",
        "F3": "Payment falls due thirty days after the report is sent.",
        "F4": "Nothing is owed until the work is handed over.",
        "F5": "The Buyer has seven days to reject after taking possession.",
    },
    "OTHER_FIRST": {
        "O1": "We ship on receipt of cleared funds.",
        "O2": "The deposit secures the slot.",
        "O3": "Work starts once the purchase order is issued.",
        "O4": "We will not begin until we are paid.",
        "O5": "The Buyer's confirmation opens the build window.",
    },
}

PAIRS = [
    ("F4", "O4", "both are negative and both hinge on the same conjunction"),
    ("F1", "O5", "both make the declared other side the grammatical subject"),
    ("F2", "O1", "both open in the same first person"),
    ("F3", "O3", "both hang the timing on an event rather than on a party"),
    ("F5", "O2", "neither uses an explicit sequencing word"),
]


def features(text):
    tok = re.findall(r"[a-z]+", text.lower())
    f = set(tok)
    f.update(" ".join(p) for p in zip(tok, tok[1:]))
    return f


def leaks(case_set):
    sides = {k: {n: features(t) for n, t in v.items()} for k, v in case_set.items()}
    names = list(sides)
    out = []
    for i, name in enumerate(names):
        other = names[1 - i]
        common = set.intersection(*sides[name].values())
        absent = set().union(*sides[other].values())
        out += [(name, f) for f in sorted(common - absent)]
    return out


STOP = set("""a an and are as at be been by do does for from has have in into is it its
of on or our that the their them there these this to us we will with your you not no
if any each one two both same other than then when where which while who whom what""".split())


def content_words(text):
    return {w for w in re.findall(r"[a-z]+", text.lower())
            if w not in STOP and len(w) > 2}


flat = {**CASES["AUTHOR_FIRST"], **CASES["OTHER_FIRST"]}

print("=" * 74)
print("DECLARED OTHER SIDE:", OTHER_LABEL)
print("=" * 74)

found = leaks(CASES)
if found:
    print(f"LEAK: {len(found)} separating feature(s) — set is NOT usable:")
    for side, f in found:
        print(f"   {f!r:34s} -> in ALL {side}, in NO case of the other class")
else:
    print("NO LEAK: no token or bigram separates the two classes.")

print()
print("Adversarial pairs (same surface, opposite label):")
for a, b, why in PAIRS:
    print(f"   {a} / {b}  - {why}")

print()
print("Byte length per case (255-byte calldata cliff; method name + 64-hex id add more):")
for name, text in sorted(flat.items()):
    n = len(text.encode("utf-8"))
    print(f"   {name}  {n:3d} bytes{'   <-- CHECK' if n > 150 else ''}")


def rubric_overlap(path):
    src = open(path, encoding="utf-8").read()
    m = re.search(r'RUBRIC\s*=\s*f?"""(.*?)"""', src, re.S)
    if not m:
        print("\ncould not find a RUBRIC block in", path)
        return 1
    cw = set()
    for t in flat.values():
        cw |= content_words(t)
    cw |= content_words(OTHER_LABEL)
    ov = sorted(content_words(m.group(1)) & cw)
    print()
    print("=" * 74)
    print("RUBRIC OVERLAP GATE —", path)
    print("=" * 74)
    if ov:
        print(f"FAIL: {len(ov)} content word(s) shared with the case set:")
        for w in ov:
            print("   ", w)
        print("The rubric defines the TASK. It never quotes an answer.")
        return 1
    print("PASS: rubric shares no content word with any case.")
    print("      (No stemming — read the rubric yourself for near-matches.)")
    return 0


print("=" * 74)
if len(sys.argv) > 1:
    sys.exit((1 if found else 0) or rubric_overlap(sys.argv[1]))
sys.exit(1 if found else 0)
