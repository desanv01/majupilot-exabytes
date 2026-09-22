from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


PROJECT = Path(__file__).resolve().parents[1]
SOURCE = PROJECT / "deliverables" / "qa" / "frames"
OUTPUT = PROJECT / "planning" / "stage7" / "evidence" / "contact-sheet.jpg"
LABELS = [
    "Opening · 2.0s",
    "Problem · 31.0s",
    "Solution · 74.0s",
    "Architecture · 138.0s",
    "Document RAG boundary · 187.0s",
    "Demo home · 201.5s",
    "Demo evidence review · 219.0s",
    "Demo diagnosis · 244.0s",
    "Demo recommendations · 271.5s",
    "Scenario payback · 305.0s",
    "Blueprint · 352.5s",
    "Consent boundary · 396.0s",
    "Intentional VO silence · 413.5s",
    "Testing evidence · 449.0s",
    "Future / P1 · 562.6s",
    "Close + music credit · 572.5s",
    "Final visual hold · 579.0s",
]

files = sorted(SOURCE.glob("frame-*.png"))
if len(files) != len(LABELS):
    raise SystemExit(f"Expected {len(LABELS)} QA frames, found {len(files)}")

cols, thumb_w, thumb_h, label_h, gutter = 3, 576, 324, 34, 10
rows = (len(files) + cols - 1) // cols
sheet = Image.new(
    "RGB",
    (cols * (thumb_w + gutter) + gutter, rows * (thumb_h + label_h + gutter) + gutter),
    "#10181d",
)
draw = ImageDraw.Draw(sheet)
font = ImageFont.load_default(size=18)

for index, file in enumerate(files):
    image = Image.open(file).convert("RGB")
    image.thumbnail((thumb_w, thumb_h), Image.Resampling.LANCZOS)
    x = gutter + (index % cols) * (thumb_w + gutter)
    y = gutter + (index // cols) * (thumb_h + label_h + gutter)
    canvas = Image.new("RGB", (thumb_w, thumb_h), "#071d29")
    canvas.paste(image, ((thumb_w - image.width) // 2, (thumb_h - image.height) // 2))
    sheet.paste(canvas, (x, y + label_h))
    draw.text((x + 6, y + 6), LABELS[index], fill="#fffdf8", font=font)

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
sheet.save(OUTPUT, quality=90, optimize=True)
print(OUTPUT)
