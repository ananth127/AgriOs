
import os
import shutil

src_css = r"e:\MY_PROJECT\AgriOs\frontend\node_modules\leaflet\dist\leaflet.css"
dest_css = r"e:\MY_PROJECT\AgriOs\frontend\src\styles\leaflet-patched.css"

src_images = r"e:\MY_PROJECT\AgriOs\frontend\node_modules\leaflet\dist\images"
dest_images = r"e:\MY_PROJECT\AgriOs\frontend\public\images\leaflet"

# 1. Ensure CSS dir exists
if not os.path.exists(os.path.dirname(dest_css)):
    os.makedirs(os.path.dirname(dest_css))

# 2. Patch CSS
with open(src_css, 'r', encoding='utf-8') as f:
    lines = f.readlines()

with open(dest_css, 'w', encoding='utf-8') as f:
    for line in lines:
        if "filter: progid:DXImageTransform" in line:
            continue
        if "-ms-filter:" in line and "progid:" in line:
            continue
        
        # Patch image URLs
        # Original: url(images/some-icon.png)
        # New: url(/images/leaflet/some-icon.png)
        line = line.replace("url(images/", "url(/images/leaflet/")
        
        f.write(line)

print(f"Created patched css at {dest_css}")

# 3. Copy Images
if os.path.exists(src_images):
    if not os.path.exists(dest_images):
        os.makedirs(dest_images)
    for img in os.listdir(src_images):
        full_src = os.path.join(src_images, img)
        full_dest = os.path.join(dest_images, img)
        if os.path.isfile(full_src):
            shutil.copy2(full_src, full_dest)
    print(f"Copied leaflet images to {dest_images}")
else:
    print(f"Warning: Leaflet images not found at {src_images}")
