"""Copy superstore.sqlite into analytics/data/ for Vercel deployment.

Vercel sets the Root Directory to analytics/, so ../data/ is accessible
only when "Include source files outside of the Root Directory" is enabled
in the Vercel project settings. This script copies the file into the
analytics tree so the serverless function can bundle it.
"""

import os
import shutil

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, os.pardir, "data", "superstore.sqlite")
DST_DIR = os.path.join(HERE, "data")
DST = os.path.join(DST_DIR, "superstore.sqlite")

if os.path.isfile(SRC):
    os.makedirs(DST_DIR, exist_ok=True)
    shutil.copy2(SRC, DST)
    size_mb = os.path.getsize(DST) / (1024 * 1024)
    print(f"[build_data] Copied {SRC} -> {DST} ({size_mb:.1f} MB)")
else:
    print(f"[build_data] WARNING: source not found at {SRC}")
    print("[build_data] The analytics API will start but DB queries will fail.")
