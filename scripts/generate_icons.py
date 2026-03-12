"""Generate zCloudPass app icons for Tauri from scratch using Pillow."""
import math
import os
from PIL import Image, ImageDraw, ImageFont

ICON_DIR = os.path.join(os.path.dirname(__file__), "..", "src-tauri", "icons")

def create_base_icon(size=1024):
    """Create a shield + cloud + lock icon for zCloudPass."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    cx, cy = size // 2, size // 2
    
    # Background: rounded rectangle with gradient-like effect
    # Deep blue-purple gradient background
    for i in range(size):
        ratio = i / size
        r = int(15 + ratio * 20)
        g = int(23 + ratio * 10)
        b = int(42 + ratio * 40)
        draw.line([(0, i), (size, i)], fill=(r, g, b, 255))
    
    # Create rounded corners mask
    mask = Image.new("L", (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    corner_radius = size // 5
    mask_draw.rounded_rectangle([0, 0, size-1, size-1], radius=corner_radius, fill=255)
    img.putalpha(mask)
    
    draw = ImageDraw.Draw(img)
    
    # Draw shield shape
    shield_margin = size * 0.15
    shield_top = size * 0.12
    shield_bottom = size * 0.88
    shield_width = size * 0.7
    shield_cx = cx
    
    # Shield path points
    shield_points = []
    # Top left curve to top center
    top_y = shield_top
    mid_y = size * 0.55
    bottom_y = shield_bottom
    left_x = shield_cx - shield_width / 2
    right_x = shield_cx + shield_width / 2
    
    # Build shield outline
    steps = 50
    # Left side (top to bottom)
    for i in range(steps + 1):
        t = i / steps
        if t < 0.6:
            # Straight-ish top portion
            tt = t / 0.6
            x = left_x
            y = top_y + tt * (mid_y - top_y)
        else:
            # Curve to bottom point
            tt = (t - 0.6) / 0.4
            x = left_x + tt * (shield_cx - left_x)
            y = mid_y + tt * (bottom_y - mid_y)
        shield_points.append((x, y))
    
    # Right side (bottom to top)
    for i in range(steps, -1, -1):
        t = i / steps
        if t < 0.6:
            tt = t / 0.6
            x = right_x
            y = top_y + tt * (mid_y - top_y)
        else:
            tt = (t - 0.6) / 0.4
            x = right_x - tt * (right_x - shield_cx)
            y = mid_y + tt * (bottom_y - mid_y)
        shield_points.append((x, y))
    
    # Draw shield with a nice gradient color (cyan/teal)
    # Outer shield - darker border
    draw.polygon(shield_points, fill=(0, 180, 220, 255))
    
    # Inner shield - slightly lighter
    inner_scale = 0.92
    inner_points = []
    for px, py in shield_points:
        dx = px - shield_cx
        dy = py - (shield_top + (shield_bottom - shield_top) * 0.4)
        inner_points.append((shield_cx + dx * inner_scale, (shield_top + (shield_bottom - shield_top) * 0.4) + dy * inner_scale))
    draw.polygon(inner_points, fill=(10, 40, 80, 240))
    
    # Draw lock icon in center of shield
    lock_cx = cx
    lock_cy = cy + size * 0.05
    lock_size = size * 0.22
    
    # Lock body (rectangle)
    lock_body_top = lock_cy - lock_size * 0.1
    lock_body_bottom = lock_cy + lock_size * 0.8
    lock_body_left = lock_cx - lock_size * 0.55
    lock_body_right = lock_cx + lock_size * 0.55
    body_radius = lock_size * 0.15
    
    draw.rounded_rectangle(
        [lock_body_left, lock_body_top, lock_body_right, lock_body_bottom],
        radius=int(body_radius),
        fill=(0, 200, 255, 255)
    )
    
    # Lock shackle (arc on top)
    shackle_width = lock_size * 0.7
    shackle_height = lock_size * 0.6
    shackle_top = lock_body_top - shackle_height
    shackle_thickness = lock_size * 0.15
    
    # Outer shackle arc
    draw.arc(
        [lock_cx - shackle_width/2, shackle_top, 
         lock_cx + shackle_width/2, lock_body_top + shackle_height * 0.3],
        180, 0,
        fill=(0, 200, 255, 255),
        width=int(shackle_thickness)
    )
    
    # Keyhole
    keyhole_r = lock_size * 0.12
    keyhole_cy = lock_cy + lock_size * 0.25
    draw.ellipse(
        [lock_cx - keyhole_r, keyhole_cy - keyhole_r,
         lock_cx + keyhole_r, keyhole_cy + keyhole_r],
        fill=(10, 40, 80, 255)
    )
    # Keyhole slot
    slot_width = lock_size * 0.06
    draw.rectangle(
        [lock_cx - slot_width, keyhole_cy,
         lock_cx + slot_width, keyhole_cy + lock_size * 0.25],
        fill=(10, 40, 80, 255)
    )
    
    # Add small cloud element at top
    cloud_y = shield_top + size * 0.08
    cloud_cx = cx
    cloud_r1 = size * 0.06
    cloud_r2 = size * 0.045
    
    # Cloud puffs
    for offset_x, offset_y, r in [
        (0, 0, cloud_r1),
        (-cloud_r1 * 0.8, cloud_r1 * 0.3, cloud_r2),
        (cloud_r1 * 0.8, cloud_r1 * 0.3, cloud_r2),
        (-cloud_r1 * 0.4, -cloud_r1 * 0.2, cloud_r2 * 0.9),
        (cloud_r1 * 0.4, -cloud_r1 * 0.2, cloud_r2 * 0.9),
    ]:
        draw.ellipse(
            [cloud_cx + offset_x - r, cloud_y + offset_y - r,
             cloud_cx + offset_x + r, cloud_y + offset_y + r],
            fill=(255, 255, 255, 220)
        )
    
    return img


def generate_all_icons():
    base = create_base_icon(1024)
    os.makedirs(ICON_DIR, exist_ok=True)
    
    # PNG icons for Tauri
    png_sizes = {
        "32x32.png": 32,
        "128x128.png": 128,
        "128x128@2x.png": 256,
        "icon.png": 512,
    }
    
    for filename, size in png_sizes.items():
        resized = base.resize((size, size), Image.LANCZOS)
        resized.save(os.path.join(ICON_DIR, filename), "PNG")
        print(f"  Created {filename} ({size}x{size})")
    
    # Windows Store logos
    square_sizes = {
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
    
    for filename, size in square_sizes.items():
        resized = base.resize((size, size), Image.LANCZOS)
        resized.save(os.path.join(ICON_DIR, filename), "PNG")
        print(f"  Created {filename} ({size}x{size})")
    
    # ICO file (Windows) - multiple sizes embedded
    ico_sizes = [16, 24, 32, 48, 64, 128, 256]
    ico_images = [base.resize((s, s), Image.LANCZOS) for s in ico_sizes]
    ico_images[0].save(
        os.path.join(ICON_DIR, "icon.ico"),
        format="ICO",
        sizes=[(s, s) for s in ico_sizes],
        append_images=ico_images[1:]
    )
    print("  Created icon.ico")
    
    # ICNS file (macOS)
    # Pillow can save ICNS with the right sizes
    icns_sizes = [16, 32, 64, 128, 256, 512, 1024]
    icns_images = [base.resize((s, s), Image.LANCZOS) for s in icns_sizes]
    try:
        icns_images[-1].save(
            os.path.join(ICON_DIR, "icon.icns"),
            format="ICNS",
            append_images=icns_images[:-1]
        )
        print("  Created icon.icns")
    except Exception as e:
        print(f"  Warning: Could not create icon.icns ({e}), using PNG fallback")
        # Save as large PNG instead - Tauri can handle it
        base.resize((512, 512), Image.LANCZOS).save(
            os.path.join(ICON_DIR, "icon.icns"), "PNG"
        )
    
    print("\nAll icons generated!")


if __name__ == "__main__":
    print("Generating zCloudPass icons...")
    generate_all_icons()
