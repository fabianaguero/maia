import os
import random
import time
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
LOG_PATH = REPO_ROOT / ".run" / "demo" / "maia_live.log"
BPM = 124  # Sincronizado con el pulso de Anyma / Progressive House
INTERVAL = 60.0 / BPM  # ~0.48s

COMPONENTS = ["Auth-Gate", "DB-Cluster", "Ingress-v1", "Cache-Store", "Worker-Anyma"]
LEVELS = ["INFO", "INFO", "INFO", "INFO", "WARN", "INFO", "ERROR"]


def generate_log():
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
    component = random.choice(COMPONENTS)
    level = random.choice(LEVELS)

    if level == "ERROR":
        message = f"CRITICAL: Resource exhaustion on {component} - Filter sweep detected."
    elif level == "WARN":
        message = f"HEADING: Latency spike of {random.uniform(200, 400):.1f}ms detected during upstream poll."
    else:
        message = f"OK: {component} pulse handled in {random.uniform(5, 25):.1f}ms."

    return f"[{timestamp}] {level} [{component}] {message}\n"


def main():
    print(f"MAIA Anyma-Hybrid Log Generator started @ {BPM} BPM")
    print(f"Writing to {LOG_PATH}")

    os.makedirs(LOG_PATH.parent, exist_ok=True)

    with LOG_PATH.open("w", encoding="utf-8") as f:
        f.write("")

    try:
        while True:
            with LOG_PATH.open("a", encoding="utf-8") as f:
                f.write(generate_log())
            time.sleep(INTERVAL)
    except KeyboardInterrupt:
        print("\nGenerator stopped.")


if __name__ == "__main__":
    main()
