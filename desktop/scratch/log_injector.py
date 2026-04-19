import time
import random
import os
from datetime import datetime

LOG_FILE = "scratch/test_live.log"

LEVELS = ["INFO", "WARN", "ERROR", "DEBUG", "TRACE"]
SERVICES = ["db-proxy", "auth-node", "api-gateway", "worker-pool-1", "cache-redis"]
MESSAGES = [
    "Connection established",
    "Request processed successfully",
    "Slow query detected: SELECT * FROM audit_logs...",
    "Authentication failed for user 0x921...",
    "Memory threshold reached: 85%",
    "Replica lag: 140ms",
    "Incoming webhook from stripe",
    "Background job started: nightly_cleanup",
    "Socket closed by peer",
]

def generate_log():
    ts = datetime.utcnow().isoformat() + "Z"
    level = random.choice(LEVELS)
    if random.random() < 0.2: level = "ERROR" # Bias towards errors for testing
    service = random.choice(SERVICES)
    msg = random.choice(MESSAGES)
    return f'{{"timestamp": "{ts}", "level": "{level}", "service": "{service}", "message": "{msg}"}}\n'

def main():
    print(f"Starting MAIA Log Injector on {LOG_FILE}...")
    # Ensure directory exists
    os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)
    
    # Clear file
    with open(LOG_FILE, "w") as f:
        f.write("")

    try:
        count = 0
        while True:
            # Normal traffic
            batch_size = random.randint(1, 3)
            with open(LOG_FILE, "a") as f:
                for _ in range(batch_size):
                    f.write(generate_log())
                    count += 1
            
            # Periodic BURST
            if count % 20 == 0:
                print(f"Injecting BURST of logs... (Total: {count})")
                with open(LOG_FILE, "a") as f:
                    for _ in range(15):
                        f.write(generate_log().replace("INFO", "ERROR").replace("DEBUG", "ERROR"))
            
            time.sleep(random.uniform(0.3, 0.8))
            
    except KeyboardInterrupt:
        print("Injector stopped.")

if __name__ == "__main__":
    main()
