"""Génère les icônes de l'app (proposition I.1 d'Euclide, palette de Byrne).
Usage : python3 tools/make-icons.py   (nécessite Pillow)"""
import math
from pathlib import Path
from PIL import Image, ImageDraw

PAPER = (242, 243, 240)
INK = (27, 28, 31)
GRAPHITE = (122, 129, 139)
RED = (190, 58, 33)
BLUE = (29, 76, 154)
YELLOW = (226, 160, 39)

OUT = Path(__file__).resolve().parent.parent / "src" / "icons"


def draw_icon(size, a_ratio):
    S = 1024  # dessin en haute résolution puis réduction (anticrénelage)
    img = Image.new("RGB", (S, S), PAPER)
    d = ImageDraw.Draw(img)
    a = a_ratio * S
    h = a * math.sqrt(3) / 2
    cx, cy = S / 2, S / 2 + h * 0.25  # cercles presque centrés, triangle légèrement remonté
    A = (cx - a / 2, cy)
    B = (cx + a / 2, cy)
    C = (cx, cy - h)
    lw_c = max(2, round(S * 0.011))
    lw_t = round(S * 0.026)
    # cercles de construction
    for (x, y) in (A, B):
        d.ellipse([x - a, y - a, x + a, y + a], outline=GRAPHITE, width=lw_c)
    # triangle
    d.polygon([A, B, C], fill=(240, 205, 140))
    d.line([A, C], fill=RED, width=lw_t)
    d.line([B, C], fill=BLUE, width=lw_t)
    d.line([A, B], fill=INK, width=lw_t)
    r = S * 0.026
    for (x, y) in (A, B, C):
        d.ellipse([x - r, y - r, x + r, y + r], fill=INK)
    return img.resize((size, size), Image.LANCZOS)


OUT.mkdir(parents=True, exist_ok=True)
draw_icon(192, 0.30).save(OUT / "icon-192.png")
draw_icon(512, 0.30).save(OUT / "icon-512.png")
draw_icon(512, 0.21).save(OUT / "icon-maskable-512.png")
print("icônes écrites dans", OUT)
