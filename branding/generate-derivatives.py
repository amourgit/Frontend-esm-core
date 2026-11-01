"""Génère les dérivés web du branding EGEN à partir des masters (jamais modifiés).

Usage :  python3 branding/generate-derivatives.py      (nécessite Pillow et numpy)

Produit : egen-logo-icon.png, egen-logo-full.png, shell/favicon.ico, shell/icon-512.png
"""
import os

import numpy as np
from PIL import Image

os.chdir(os.path.dirname(os.path.abspath(__file__)))  # indépendant du dossier courant

SRC_ICON = "source/egen-logo-icon-master.png"
SRC_FULL = "source/egen-logo-full-master.png"

def bbox(im, thr):
    a = np.array(im.getchannel("A"))
    ys, xs = np.where(a > thr)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1

def denoise_alpha(im, thr=2):
    """Supprime le voile alpha résiduel du détourage (alpha <= thr) pour éviter un halo sur fond clair."""
    arr = np.array(im)
    arr[arr[:, :, 3] <= thr] = 0
    return Image.fromarray(arr, "RGBA")

def crop_pad(im, thr, pad):
    x0, y0, x1, y1 = bbox(im, thr)
    x0, y0, x1, y1 = max(0, x0 - pad), max(0, y0 - pad), min(im.width, x1 + pad), min(im.height, y1 + pad)
    return im.crop((x0, y0, x1, y1))

def to_square(im):
    s = max(im.size)
    out = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    out.paste(im, ((s - im.width) // 2, (s - im.height) // 2))
    return out

icon = Image.open(SRC_ICON).convert("RGBA")
full = Image.open(SRC_FULL).convert("RGBA")

# 1) Logo seul — UI web : recadré sur le contenu (+6 px), carré, 256x256
icon_tight = to_square(crop_pad(denoise_alpha(icon), 5, 6))
icon_ui = icon_tight.resize((256, 256), Image.LANCZOS)
icon_ui.save("egen-logo-icon.png", optimize=True)

# 2) Logo + « EGEN » — UI web : recadré (+16 px), largeur 640 px
full_c = crop_pad(denoise_alpha(full), 5, 16)
h = round(full_c.height * 640 / full_c.width)
full_ui = full_c.resize((640, h), Image.LANCZOS)
full_ui.save("egen-logo-full.png", optimize=True)

# 3) Favicon (logo seul) : ICO 16/32/48/64, depuis la version recadrée serrée (+3 %) pour rester lisible en petit
tight = to_square(crop_pad(denoise_alpha(icon), 5, 0))
m = round(tight.width * 0.03)
canvas = Image.new("RGBA", (tight.width + 2 * m,) * 2, (0, 0, 0, 0)); canvas.paste(tight, (m, m))
fav_src = canvas.resize((256, 256), Image.LANCZOS)
fav_src.save("shell/favicon.ico", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])

# 4) Icône PWA 512 : master 500x500 centré (sans agrandissement) sur canvas 512 -> contenu ≈ 79 % (zone sûre maskable)
pwa = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
pwa.paste(icon, (6, 6), icon)
pwa.save("shell/icon-512.png", optimize=True)

for f in ["egen-logo-icon.png", "egen-logo-full.png", "shell/favicon.ico", "shell/icon-512.png"]:
    im = Image.open(f)
    print(f"{f:28s} {im.size!s:12s} {os.path.getsize(f)/1024:7.1f} Ko  mode={im.mode}")
print("favicon tailles:", sorted(Image.open('shell/favicon.ico').info.get('sizes')))
