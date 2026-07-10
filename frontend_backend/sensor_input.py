"""
Smart Parking — Sensor Input → Firebase
========================================
Reads from an ultrasonic/IR sensor connected via GPIO (Raspberry Pi)
or serial port (Arduino), and writes to Firebase sensorDetection.

  sensorDetection/A/detected = True/False  → controls slot A-01
  sensorDetection/B/detected = True/False  → controls slot B-01

Combined with cvDetection (opencv_parking_detection.py):
  slot_status = "occupied" if (sensorDetected OR cvDetected) else "available"

Requirements:
  pip install firebase-admin

  For Raspberry Pi GPIO:
    pip install RPi.GPIO

  For Arduino/Serial:
    pip install pyserial

Place serviceAccountKey.json in the same folder as this script.
Run:  python sensor_input.py
"""

import time
import os
import firebase_admin
from firebase_admin import credentials, db

# ── Firebase Configuration ────────────────────────────────────────────────────
SERVICE_ACCOUNT_FILE = os.path.join(os.path.dirname(__file__), "serviceAccountKey.json")
DATABASE_URL = "https://smart-parking-59ecb-default-rtdb.asia-southeast1.firebasedatabase.app"

# ── Sensor Mode ───────────────────────────────────────────────────────────────
# Set to: "gpio"    → Raspberry Pi GPIO pins (ultrasonic or IR)
#          "serial"  → Arduino sending "A:1\n" / "A:0\n" over USB serial
#          "mock"    → Simulated toggle (for testing without hardware)
SENSOR_MODE = "mock"

# ── GPIO Settings (only used when SENSOR_MODE = "gpio") ──────────────────────
# Wiring: sensor TRIG → GPIO pin, ECHO → GPIO pin OR IR OUT → GPIO pin
GPIO_PIN_A = 17   # GPIO pin for Zone A sensor
GPIO_PIN_B = 27   # GPIO pin for Zone B sensor
TRIGGER_PIN_A = 23   # (HC-SR04 only) trigger pin for Zone A
TRIGGER_PIN_B = 24   # (HC-SR04 only) trigger pin for Zone B
DETECTION_THRESHOLD_CM = 20   # distance < this = car present

# ── Serial Settings (only used when SENSOR_MODE = "serial") ──────────────────
# Arduino sketch should send lines like: "A:1\n", "A:0\n", "B:1\n", "B:0\n"
SERIAL_PORT = "COM3"     # Windows: "COM3", Linux: "/dev/ttyUSB0"
SERIAL_BAUD = 9600

# ── Update interval ───────────────────────────────────────────────────────────
POLL_INTERVAL = 0.5   # seconds between sensor reads

# ── Initialize Firebase ───────────────────────────────────────────────────────
if not firebase_admin._apps:
    cred = credentials.Certificate(SERVICE_ACCOUNT_FILE)
    firebase_admin.initialize_app(cred, {"databaseURL": DATABASE_URL})

sensor_ref_A = db.reference("sensorDetection/A")
sensor_ref_B = db.reference("sensorDetection/B")

_last_state = {"A": None, "B": None}


def write_sensor(zone: str, detected: bool):
    """Write sensor reading to Firebase only when state changes."""
    now = time.time()
    
    payload = {
        "detected":  detected,
        "updatedAt": int(now * 1000),
    }
    # Only update if status changed OR heartbeat interval (30s) reached
    is_heartbeat = (now - _last_write_time[zone]) > 30
    
    if _last_state[zone] == detected and not is_heartbeat:
        return  # no change and no heartbeat, skip write

    _last_state[zone] = detected
    _last_write_time[zone] = now
    
    if zone == "A":
        sensor_ref_A.set(payload)
    else:
        sensor_ref_B.set(payload)

    state_str = "OCCUPIED" if detected else "AVAILABLE"
    print(f"[{zone}] {state_str}{' [Heartbeat]' if is_heartbeat else ''}")
    print(f"  → Firebase sensorDetection/{zone}  {state_str}")


# ── GPIO Mode ─────────────────────────────────────────────────────────────────
def run_gpio():
    """Read from Raspberry Pi GPIO ultrasonic sensors (HC-SR04 or IR)."""
    import RPi.GPIO as GPIO

    GPIO.setmode(GPIO.BCM)

    # Setup Zone A sensor
    GPIO.setup(TRIGGER_PIN_A, GPIO.OUT)
    GPIO.setup(GPIO_PIN_A, GPIO.IN)
    # Setup Zone B sensor
    GPIO.setup(TRIGGER_PIN_B, GPIO.OUT)
    GPIO.setup(GPIO_PIN_B, GPIO.IN)

    def measure_cm(trig, echo):
        GPIO.output(trig, False)
        time.sleep(0.05)
        GPIO.output(trig, True)
        time.sleep(0.00001)
        GPIO.output(trig, False)
        t_start = time.time()
        t_end   = time.time()
        while GPIO.input(echo) == 0:
            t_start = time.time()
        while GPIO.input(echo) == 1:
            t_end = time.time()
        elapsed = t_end - t_start
        return (elapsed * 34300) / 2   # cm

    print("[STARTED] Sensor mode: GPIO — press Ctrl+C to quit\n")
    try:
        while True:
            dist_A = measure_cm(TRIGGER_PIN_A, GPIO_PIN_A)
            dist_B = measure_cm(TRIGGER_PIN_B, GPIO_PIN_B)
            write_sensor("A", dist_A < DETECTION_THRESHOLD_CM)
            write_sensor("B", dist_B < DETECTION_THRESHOLD_CM)
            time.sleep(POLL_INTERVAL)
    except KeyboardInterrupt:
        print("\n[EXIT] Clearing sensor flags…")
        write_sensor("A", False)
        write_sensor("B", False)
        GPIO.cleanup()


# ── Serial Mode ───────────────────────────────────────────────────────────────
def run_serial():
    """
    Read from Arduino over USB serial.
    Arduino sketch should send: "A:1\n" (car) or "A:0\n" (clear), same for B.
    """
    import serial
    ser = serial.Serial(SERIAL_PORT, SERIAL_BAUD, timeout=1)
    time.sleep(2)  # wait for Arduino reset
    print(f"[STARTED] Sensor mode: Serial ({SERIAL_PORT}) — press Ctrl+C to quit\n")
    try:
        while True:
            if ser.in_waiting > 0:
                line = ser.readline().decode("utf-8").strip()
                # Expected format: "A:1", "A:0", "B:1", "B:0"
                if ":" in line:
                    zone, val = line.split(":", 1)
                    zone = zone.strip().upper()
                    detected = val.strip() == "1"
                    if zone in ("A", "B"):
                        write_sensor(zone, detected)
    except KeyboardInterrupt:
        print("\n[EXIT] Clearing sensor flags…")
        write_sensor("A", False)
        write_sensor("B", False)
        ser.close()


# ── Mock Mode (testing without hardware) ─────────────────────────────────────
def run_mock():
    """
    Simulates sensor toggling every 4 seconds.
    Use this to test Firebase + website integration without hardware.
    """
    print("[STARTED] Sensor mode: MOCK (simulating) — press Ctrl+C to quit\n")
    print("  Zone A toggles every 4s, Zone B toggles every 6s\n")
    t = 0
    try:
        while True:
            detected_A = (t // 4) % 2 == 0
            detected_B = (t // 6) % 2 == 1
            write_sensor("A", bool(detected_A))
            write_sensor("B", bool(detected_B))
            time.sleep(POLL_INTERVAL)
            t += POLL_INTERVAL
    except KeyboardInterrupt:
        print("\n[EXIT] Clearing sensor flags…")
        write_sensor("A", False)
        write_sensor("B", False)


# ── Entry Point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    if SENSOR_MODE == "gpio":
        run_gpio()
    elif SENSOR_MODE == "serial":
        run_serial()
    else:
        run_mock()
