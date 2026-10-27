"""Trace the About us 'Approach and Mission' ASCII artworks into character maps
and build webflow/custom-code/about-approach-ascii.js from about-approach-ascii.src.js.

Usage: python3 tools/build-about-ascii.py [dir-with-pngs]
The PNGs are the Figma exports uploaded to Webflow (asset ids below); if no
directory is given they are downloaded from the Webflow asset store.
Needs Pillow and numpy.
"""
import io, os, sys, urllib.request
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CODE = os.path.join(ROOT, 'webflow', 'custom-code')
ASSETS = 'https://s3.amazonaws.com/webflow-prod-assets/6941239fcdbcf3917d159fd2/'
# name: (asset file, Figma container w/h, image box relative to the container: left, top, width, height)
SPEC = {
    'pillar':  ('6acbc29654f9656736d0e9f4_about-approach-ascii-pillar.png', 772, 244, -0.0003, -0.3147, 1.1249, 1.9801),
    'mission': ('6acbc2998cefba012e5f41bf_about-approach-ascii-mission.png', 908, 269, 0.0, -0.1078, 1.0, 1.4268),
    'trust':   ('6acbc29b4f1bfe253bb9a809_about-approach-ascii-trust.png', 677, 204, -0.001, -0.4627, 1.002, 2.4725),
}
PX, PY = 9.6, 16.0          # character pitch of the source art (px)
EMPTY = 4                   # cells darker than this are blank
THRESH = [18.2, 35.1, 46.9, 58.0, 77.8, 133.9]  # brightness -> levels 2..7 (level 1 from EMPTY)


def load(name, src_dir):
    fn = SPEC[name][0]
    if src_dir:
        data = open(os.path.join(src_dir, name + '.png'), 'rb').read()
    else:
        data = urllib.request.urlopen(ASSETS + fn).read()
    im = np.asarray(Image.open(io.BytesIO(data)).convert('RGBA')).astype(float)
    return im[..., :3].mean(-1) * (im[..., 3] / 255)


def trace(name, v):
    _, cw, ch, l, t, w, h = SPEC[name]
    H, W = v.shape
    best = None
    for ox in np.arange(0, PX, 0.8):
        for oy in np.arange(0, PY, 1):
            xs = (ox + np.arange(0, W / PX - 1) * PX).astype(int)
            ys = (oy + np.arange(0, H / PY - 1) * PY).astype(int)
            e = v[np.ix_(ys, xs)].sum()
            if best is None or e > best[0]:
                best = (e, ox, oy)
    x0, y0 = best[1] - PX / 2, best[2] - PY / 2
    nc, nr = int((W - x0) // PX), int((H - y0) // PY)
    sc, offx, offy = w * cw / W, l * cw, t * ch
    rows = [r for r in range(nr) if 0 <= offy + (y0 + (r + .5) * PY) * sc < ch]
    cols = [c for c in range(nc) if 0 <= offx + (x0 + (c + .5) * PX) * sc < cw]
    lines = []
    for r in rows:
        line = []
        for c in cols:
            ya, xa = int(round(y0 + r * PY)), int(round(x0 + c * PX))
            blk = v[max(ya, 0):ya + int(PY), max(xa, 0):xa + int(PX)]
            val = blk.mean() if blk.size else 0
            lvl = 0 if val < EMPTY else 1 + sum(val >= q for q in THRESH)
            line.append(lvl)
        lines.append(rle(line))
    return dict(w=cw, h=ch, px=round(PX * sc, 3), py=round(PY * sc, 3),
                x0=round(offx + (x0 + cols[0] * PX) * sc, 2), y0=round(offy + (y0 + rows[0] * PY) * sc, 2),
                map='|'.join(lines))


def rle(levels):
    s = ''.join(map(str, levels)).rstrip('0')
    out, i = '', 0
    while i < len(s):
        if s[i] == '0':
            j = i
            while j < len(s) and s[j] == '0' and j - i < 27:
                j += 1
            out += '0' if j - i == 1 else chr(ord('a') + j - i - 2)
            i = j
        else:
            out += s[i]
            i += 1
    return out


def main():
    src_dir = sys.argv[1] if len(sys.argv) > 1 else None
    parts = []
    for name in SPEC:
        a = trace(name, load(name, src_dir))
        parts.append("    %s: { w: %d, h: %d, px: %s, py: %s, x0: %s, y0: %s,\n      map: '%s' }"
                     % (name, a['w'], a['h'], a['px'], a['py'], a['x0'], a['y0'], a['map']))
    data = '  var ART = {\n' + ',\n'.join(parts) + '\n  };'
    src = open(os.path.join(CODE, 'about-approach-ascii.src.js')).read()
    open(os.path.join(CODE, 'about-approach-ascii.js'), 'w').write(src.replace('/*@@DATA@@*/', data))
    print('wrote about-approach-ascii.js')


if __name__ == '__main__':
    main()
