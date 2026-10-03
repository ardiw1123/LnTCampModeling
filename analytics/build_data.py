"""Copy superstore.sqlite into analytics/data/ for Vercel deployment.

The source database remains in the repository-level data/ directory.
During the Analytics build, it is copied into analytics/data/ so the
FastAPI serverless function can access it.
"""

import os
import shutil

HERE = os.path.dirname(os.path.abspath(__file__))

SRC = os.path.abspath(
    os.path.join(HERE, "..", "data", "superstore.sqlite")
)

DST_DIR = os.path.join(HERE, "data")
DST = os.path.join(DST_DIR, "superstore.sqlite")

print(f"[build_data] Source: {SRC}")
print(f"[build_data] Destination: {DST}")

if not os.path.isfile(SRC):
    print(f"[build_data] ERROR: source not found: {SRC}")
    raise FileNotFoundError(
        f"Database not found: {SRC}"
    )

os.makedirs(DST_DIR, exist_ok=True)

shutil.copy2(SRC, DST)

size_mb = os.path.getsize(DST) / (1024 * 1024)

print(
    f"[build_data] SUCCESS: copied database "
    f"({size_mb:.1f} MB)"
)