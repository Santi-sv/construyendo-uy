"""Revelado fotográfico reproducible: no genera, reconstruye ni modifica geometría.

Requiere Pillow y NumPy. Conserva los originales y guarda maestros JPEG de la
misma resolución, con exposición en luz lineal, balance de blancos conservador,
recuperación suave de sombras, reducción leve de ruido y enfoque de captura.
"""
from pathlib import Path
from io import BytesIO
import hashlib
import json
import numpy as np
from PIL import Image, ImageCms, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / 'assets' / 'fotos-reveladas'
OUTPUT.mkdir(parents=True, exist_ok=True)
records = sum((json.loads((ROOT / f'src/data/{name}.json').read_text()) for name in ['projects', 'process']), [])
grades = json.loads((ROOT / 'scripts/photo-grades.json').read_text())
originals = list(ROOT.glob('Seccion*/*.JPG'))
srgb_profile = ImageCms.createProfile('sRGB')
srgb_icc = ImageCms.ImageCmsProfile(srgb_profile).tobytes()
manifest = []

for photo in records:
    source = next((path for path in originals if path.name.startswith(photo['prefix'])), None)
    if source is None:
        raise FileNotFoundError(photo['id'])
    image = ImageOps.exif_transpose(Image.open(source))
    if image.info.get('icc_profile'):
        source_profile = ImageCms.ImageCmsProfile(BytesIO(image.info['icc_profile']))
        image = ImageCms.profileToProfile(image, source_profile, srgb_profile, outputMode='RGB')
    else:
        image = image.convert('RGB')
    grade = grades.get(photo['id'], {'exposure': .1, 'shadows': .045, 'white_balance': [1, 1, 1.015], 'denoise': .07})
    pixels = np.asarray(image, dtype=np.float32) / 255

    # Exposición en luz lineal, con un hombro suave que protege los blancos.
    linear = np.where(pixels <= .04045, pixels / 12.92, ((pixels + .055) / 1.055) ** 2.4)
    linear *= 2 ** grade['exposure']
    linear *= np.asarray(grade['white_balance'], dtype=np.float32)[None, None, :]
    linear = np.where(linear > .86, .86 + (linear - .86) / (1 + np.maximum(linear - .86, 0) / .14), linear)
    pixels = np.where(linear <= .0031308, linear * 12.92, 1.055 * np.maximum(linear, 0) ** (1 / 2.4) - .055)

    # La máscara es cero en negro y blanco: levanta detalle sin lavar el piso negro.
    luminance = pixels @ np.array([.2126, .7152, .0722], dtype=np.float32)
    lift = grade['shadows'] * 4 * luminance * (1 - luminance) ** 3
    ratio = np.divide(luminance + lift, luminance, out=np.ones_like(luminance), where=luminance > 1e-6)
    pixels *= ratio[:, :, None]
    developed = Image.fromarray(np.uint8(np.clip(pixels, 0, 1) * 255 + .5))

    # Mezcla mínima para ruido fino; la geometría, las juntas y las texturas permanecen.
    denoised = developed.filter(ImageFilter.GaussianBlur(.55))
    developed = Image.blend(developed, denoised, grade['denoise'])
    developed = developed.filter(ImageFilter.UnsharpMask(radius=.75, percent=48, threshold=3))
    assert developed.size == image.size, 'El revelado debe conservar dimensiones y encuadre'
    destination = OUTPUT / f"{photo['id']}.jpg"
    developed.save(destination, 'JPEG', quality=97, subsampling=0, optimize=True, icc_profile=srgb_icc)
    manifest.append({
        'id': photo['id'], 'original': str(source.relative_to(ROOT)),
        'original_sha256': hashlib.sha256(source.read_bytes()).hexdigest(),
        'developed': str(destination.relative_to(ROOT)),
        'width': developed.width, 'height': developed.height,
        'adjustments': grade, 'generative_processing': False,
    })
    print(f"✓ {photo['id']}: misma foto, {developed.width} × {developed.height}")

(OUTPUT / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
print(f'Reveladas {len(manifest)} fotos. Originales intactos. Sin generación de imagen.')
