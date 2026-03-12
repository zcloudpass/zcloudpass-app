"""Generate all Tauri icon sizes from logo.svg using svglib + Pillow."""
import os
import io
from svglib.svglib import svg2rlg
from reportlab.graphics import renderPM
from PIL import Image

ICONS_DIR = os.path.join(os.path.dirname(__file__), "..", "src-tauri", "icons")
SVG_PATH = os.path.join(ICONS_DIR, "logo.svg")


def svg_to_pil(svg_path, size=1024):
    """Convert SVG to a PIL Image at the given size."""
    drawing = svg2rlg(svg_path)
    # Scale to desired size
    sx = size / drawing.width
    sy = size / drawing.height
    drawing.width = size
    drawing.height = size
    drawing.scale(sx, sy)
    # Render to PNG bytes
    png_bytes = renderPM.drawToString(drawing, fmt="PNG", dpi=72)
    img = Image.open(io.BytesIO(png_bytes)).convert("RGBA")
    return img


def generate():
    print(f"Loading SVG from {SVG_PATH}")
    base = svg_to_pil(SVG_PATH, 1024)
    print(f"  Base image: {base.size}")

    # Required PNG sizes for Tauri
    png_icons = {
        "32x32.png": 32,
        "128x128.png": 128,
        "128x128@2x.png": 256,
        "icon.png": 512,
    }

    # Windows Store logos
    square_icons = {
        "Square30x30Logo.png": 30,
        "Square44x44Logo.png": 44,
        "Square71x71Logo.png": 71,
        "Square89x89Logo.png": 89,
        "Square107x107Logo.png": 107,
        "Square142x142Logo.png": 142,
        "Square150x150Logo.png": 150,
        "Square284x284Logo.png": 284,
        "Square310x310Logo.png": 310,
        "StoreLogo.png": 50,
    }

    all_pngs = {**png_icons, **square_icons}

    for filename, size in all_pngs.items():
        resized = base.resize((size, size), Image.LANCZOS)
        out_path = os.path.join(ICONS_DIR, filename)
        resized.save(out_path, "PNG")
        print(f"  Created {filename} ({size}x{size})")

    # ICO (Windows) - multiple sizes
    ico_sizes = [16, 24, 32, 48, 64, 128, 256]
    ico_images = [base.resize((s, s), Image.LANCZOS) for s in ico_sizes]
    ico_path = os.path.join(ICONS_DIR, "icon.ico")
    ico_images[0].save(
        ico_path,
        format="ICO",
        sizes=[(s, s) for s in ico_sizes],
        append_images=ico_images[1:],
    )
    print("  Created icon.ico")

    # ICNS (macOS)
    icns_path = os.path.join(ICONS_DIR, "icon.icns")
    icns_sizes = [16, 32, 64, 128, 256, 512, 1024]
    icns_images = [base.resize((s, s), Image.LANCZOS) for s in icns_sizes]
    try:
        icns_images[-1].save(
            icns_path, format="ICNS", append_images=icns_images[:-1]
        )
        print("  Created icon.icns")
    except Exception as e:
        print(f"  Warning: ICNS creation failed ({e}), saving as PNG fallback")
        base.resize((512, 512), Image.LANCZOS).save(icns_path, "PNG")
        print("  Created icon.icns (PNG fallback)")

    print("\nAll icons generated!")


if __name__ == "__main__":
    generate()
