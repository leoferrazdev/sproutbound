from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1] / 'media' / 'covers'

def font(size):
    return ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf', size)

def gradient(size):
    width, height = size
    image = Image.new('RGB', size)
    pixels = image.load()
    top = (7, 26, 49)
    middle = (18, 62, 75)
    bottom = (23, 79, 62)
    for y in range(height):
        ratio = y / max(1, height - 1)
        if ratio < 0.6:
            t = ratio / 0.6
            color = tuple(round(top[i] * (1 - t) + middle[i] * t) for i in range(3))
        else:
            t = (ratio - 0.6) / 0.4
            color = tuple(round(middle[i] * (1 - t) + bottom[i] * t) for i in range(3))
        for x in range(width):
            pixels[x, y] = color
    return image

def glow(image, center, radius):
    overlay = Image.new('RGBA', image.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    x, y = center
    for step in range(radius, 0, -max(1, radius // 32)):
        alpha = round(150 * (1 - step / radius) ** 1.8)
        draw.ellipse((x - step, y - step, x + step, y + step), fill=(255, 209, 102, alpha))
    image.paste(overlay, (0, 0), overlay)

def leaf(draw, x, y, width, height):
    points = [(x, y + height // 2), (x + width // 2, y), (x + width, y + height // 2), (x + width // 2, y + height)]
    draw.polygon(points, fill=(73, 185, 122), outline=(227, 255, 147), width=max(3, width // 50))
    draw.line((x + width * 0.2, y + height * 0.55, x + width * 0.8, y + height * 0.45), fill=(116, 220, 126), width=max(2, width // 70))

def pip(draw, x, y, scale):
    body = (x, y, x + 210 * scale, y + 265 * scale)
    draw.ellipse(body, fill=(136, 223, 131), outline=(234, 255, 158), width=max(4, round(12 * scale)))
    draw.ellipse((x + 3 * scale, y - 52 * scale, x + 115 * scale, y + 8 * scale), fill=(185, 244, 107))
    draw.ellipse((x + 95 * scale, y - 52 * scale, x + 207 * scale, y + 8 * scale), fill=(185, 244, 107))
    eye = max(5, round(14 * scale))
    draw.ellipse((x + 55 * scale, y + 120 * scale, x + 55 * scale + eye * 2, y + 120 * scale + eye * 2), fill=(9, 43, 58))
    draw.ellipse((x + 142 * scale, y + 120 * scale, x + 142 * scale + eye * 2, y + 120 * scale + eye * 2), fill=(9, 43, 58))
    draw.arc((x + 58 * scale, y + 155 * scale, x + 152 * scale, y + 215 * scale), 15, 165, fill=(9, 43, 58), width=max(3, round(10 * scale)))
    draw.arc((x - 12 * scale, y + 250 * scale, x + 222 * scale, y + 330 * scale), 190, 350, fill=(255, 209, 102), width=max(4, round(18 * scale)))

def render(filename, size, title_size, layout):
    image = gradient(size)
    draw = ImageDraw.Draw(image)
    width, height = size
    glow(image, (round(width * 0.52), round(height * 0.28)), round(min(width, height) * 0.38))
    draw = ImageDraw.Draw(image)
    draw.polygon([(0, height), (0, round(height * 0.84)), (round(width * 0.22), round(height * 0.73)), (round(width * 0.5), round(height * 0.83)), (round(width * 0.75), round(height * 0.69)), (width, round(height * 0.78)), (width, height)], fill=(11, 41, 53))
    for x, y, w, h in layout['leaves']:
        leaf(draw, round(width * x), round(height * y), round(width * w), round(height * h))
    pip(draw, round(width * layout['pip'][0]), round(height * layout['pip'][1]), width / 1920 * layout['pip'][2])
    title = font(title_size)
    bbox = draw.textbbox((0, 0), 'SPROUTBOUND', font=title)
    draw.text(((width - (bbox[2] - bbox[0])) // 2, round(height * 0.07)), 'SPROUTBOUND', font=title, fill=(255, 247, 207), stroke_width=1, stroke_fill=(7, 26, 49))
    image.save(ROOT / filename, 'PNG', optimize=True)

render('sproutbound-landscape.png', (1920, 1080), 112, {
    'pip': (0.47, 0.33, 1.0),
    'leaves': [(0.10, 0.70, 0.17, 0.12), (0.70, 0.68, 0.17, 0.12), (0.34, 0.48, 0.19, 0.13), (0.54, 0.82, 0.20, 0.14)],
})
render('sproutbound-portrait.png', (800, 1200), 72, {
    'pip': (0.37, 0.39, 0.53),
    'leaves': [(0.07, 0.75, 0.31, 0.11), (0.59, 0.61, 0.31, 0.11), (0.08, 0.44, 0.31, 0.11), (0.53, 0.29, 0.31, 0.11)],
})
render('sproutbound-square.png', (800, 800), 70, {
    'pip': (0.37, 0.29, 1.35),
    'leaves': [(0.03, 0.77, 0.37, 0.12), (0.60, 0.76, 0.37, 0.12)],
})
