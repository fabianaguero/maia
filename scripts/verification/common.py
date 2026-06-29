import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parents[1]
ANALYZER_SRC = REPO_ROOT / "analyzer" / "src"
SCRATCH_DIR = REPO_ROOT / ".run" / "verification"
DEMO_AUDIO_DIR = REPO_ROOT / "demo" / "audio"

if str(ANALYZER_SRC) not in sys.path:
    sys.path.append(str(ANALYZER_SRC))


def ensure_scratch_dir() -> Path:
    SCRATCH_DIR.mkdir(parents=True, exist_ok=True)
    return SCRATCH_DIR


def output_path(filename: str) -> Path:
    DEMO_AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    return DEMO_AUDIO_DIR / filename


def fixture_path(*parts: str) -> Path:
    path = REPO_ROOT / "analyzer" / "fixtures"
    for part in parts:
        path /= part
    return path
