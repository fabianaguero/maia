import time
import random
import os

# Ruta absoluta para persistencia en el directorio del proyecto
LOG_PATH = "/home/faguero/dev/maia/maia_live.log"
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
    
    # Asegurar que el directorio existe
    os.makedirs(os.path.dirname(LOG_PATH), exist_ok=True)
    
    # Limpiar logs viejos
    with open(LOG_PATH, "w") as f:
        f.write("")

    try:
        while True:
            with open(LOG_PATH, "a") as f:
                f.write(generate_log())
            time.sleep(INTERVAL)
    except KeyboardInterrupt:
        print("\nGenerator stopped.")

if __name__ == "__main__":
    main()
