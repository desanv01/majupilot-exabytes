from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

PROJECT = Path(__file__).resolve().parents[1]
SOURCE = PROJECT / "snapshots" / "stage5-midpoints"
OUTPUT = SOURCE / "contact-sheet-all-26.jpg"
TIMES = [
    "10", "31", "53.5", "74", "95.5", "116.5", "138", "165", "187",
    "201.5", "219", "244", "271.5", "305", "352.5", "396", "413.5",
    "427", "449", "468.5", "484", "492.5", "511", "534.5", "553.5", "572.5",
]

files = sorted(SOURCE.glob("frame-*.png"))
if len(files) != 26:
    raise SystemExit(f"Expected 26 midpoint frames, found {len(files)}")

cols, thumb_w, thumb_h, label_h, gutter = 5, 480, 270, 30, 8
rows = (len(files) + cols - 1) // cols
sheet = Image.new("RGB", (cols * (thumb_w + gutter) + gutter, rows * (thumb_h + label_h + gutter) + gutter), "#171717")
draw = ImageDraw.Draw(sheet)
font = ImageFont.load_default(size=18)

for index, file in enumerate(files):
    image = Image.open(file).convert("RGB")
    image.thumbnail((thumb_w, thumb_h), Image.Resampling.LANCZOS)
    x = gutter + (index % cols) * (thumb_w + gutter)
    y = gutter + (index // cols) * (thumb_h + label_h + gutter)
    canvas = Image.new("RGB", (thumb_w, thumb_h), "#111111")
    canvas.paste(image, ((thumb_w - image.width) // 2, (thumb_h - image.height) // 2))
    sheet.paste(canvas, (x, y + label_h))
    draw.text((x + 6, y + 4), f"{index + 1:02d} · {TIMES[index]}s", fill="#f4efe6", font=font)

sheet.save(OUTPUT, quality=90, optimize=True)
print(OUTPUT)
