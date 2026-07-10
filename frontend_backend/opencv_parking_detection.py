"""
Smart Parking — OpenCV Car Detection → Firebase
================================================
How it works:
  - Camera frame is split into LEFT half (Zone A) and RIGHT half (Zone B)
  - Green car detected in LEFT  → cvDetection/A/detected = True  → Slot A-01 = Occupied
  - Grey car detected in RIGHT  → cvDetection/B/detected = True  → Slot B-01 = Occupied
  - No car in a zone            → cvDetection/{zone}/detected = False → Slot = Available

Combined with sensorDetection (sensor_input.py), the website slot status is:
  occupied  =  cvDetected  OR  sensorDetected
  available =  both False

Requirements:
  pip install firebase-admin opencv-python ultralytics
  Place your Firebase serviceAccountKey.json in the same folder as this script.

Setup:
  1. Download serviceAccountKey.json from Firebase Console → Project Settings → Service Accounts
  2. Place it next to this file
  3. Run:  python opencv_parking_detection.py
"""

import cv2
import time
import json
import os
import firebase_admin
from firebase_admin import credentials, db

# ── Firebase Configuration ────────────────────────────────────────────────────
SERVICE_ACCOUNT_FILE = os.path.join(os.path.dirname(__file__), "serviceAccountKey.json")
DATABASE_URL = "https://smart-parking-59ecb-default-rtdb.asia-southeast1.firebasedatabase.app"

# ── Detection Settings ────────────────────────────────────────────────────────
CONFIDENCE_THRESHOLD = 0.30   # minimum confidence to count as a detected car (0.0–1.0)
ZONE_A_LABEL = "Zone A"       # left half of frame  → A-01
ZONE_B_LABEL = "Zone B"       # right half of frame → B-01
UPDATE_INTERVAL = 1.0          # seconds between Firebase writes (prevents rate limiting)

# ── Initialize Firebase ───────────────────────────────────────────────────────
if not firebase_admin._apps:
    cred = credentials.Certificate(SERVICE_ACCOUNT_FILE)
    firebase_admin.initialize_app(cred, {"databaseURL": DATABASE_URL})

cv_ref_A = db.reference("cvDetection/A")
cv_ref_B = db.reference("cvDetection/B")

# ── State tracking (avoid redundant Firebase writes) ─────────────────────────
_last_state = {"A": None, "B": None}
_last_write_time = 0.0


def write_detection(zone: str, detected: bool, confidence: float = 0.0):
    """Write detection result to Firebase only when state actually changes."""
    global _last_state, _last_write_time

    now = time.time()
    # Only update if status changed OR heartbeat interval (30s) reached
    is_heartbeat = (now - _last_write_time[zone]) > 30
    
    if _last_state[zone] == detected and not is_heartbeat:
        return  # no change and no heartbeat, skip write

    payload = {
        "detected":  detected,
        "confidence": round(confidence, 3),
        "updatedAt":  int(now * 1000),   # Unix ms timestamp
    }
    
    if zone == "A":
        cv_ref_A.set(payload)
        print(f"  → Firebase cvDetection/A  detected={detected}  conf={confidence:.2f}")
    else:
        cv_ref_B.set(payload)
        print(f"  → Firebase cvDetection/B  detected={detected}  conf={confidence:.2f}")

    _last_state[zone] = detected
    _last_write_time = now


def run_detection(camera_index: int = 0):
    """
    Main detection loop.
    Frame is split vertically:
      Left  half → Zone A  (slot A-01)
      Right half → Zone B  (slot B-01)
    """
    # Try to load YOLO (preferred). Falls back to Haar cascade if unavailable.
    use_yolo = False
    model = None

    try:
        from ultralytics import YOLO
        model = YOLO("yolov8n.pt")   # auto-downloads on first run
        use_yolo = True
        print("[INFO] Using YOLOv8 for detection (ultralytics)")
    except ImportError:
        print("[WARN] ultralytics not found. Falling back to Haar cascade.")
        cascade_path = cv2.data.haarcascades + "haarcascade_car.xml"
        if not os.path.exists(cascade_path):
            cascade_path = "haarcascade_car.xml"
        cascade = cv2.CascadeClassifier(cascade_path)
        if cascade.empty():
            print("[ERROR] Could not load car cascade classifier.")
            print("        Download 'haarcascade_car.xml' and place it next to this script.")
            return

    cap = cv2.VideoCapture(camera_index)
    if not cap.isOpened():
        print(f"[ERROR] Cannot open camera index {camera_index}")
        return

    print(f"\n[STARTED] Smart Parking Detection — press Q to quit\n")

    while True:
        ret, frame = cap.read()
        if not ret:
            print("[WARN] Frame read failed, retrying…")
            time.sleep(0.5)
            continue

        h, w = frame.shape[:2]
        mid_x = w // 2  # vertical split line

        # Draw zone divider and labels on frame
        cv2.line(frame, (mid_x, 0), (mid_x, h), (255, 255, 0), 2)
        cv2.putText(frame, "Zone A", (10, 28),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
        cv2.putText(frame, "Zone B", (mid_x + 10, 28),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 200, 255), 2)

        car_in_A = False
        car_in_B = False
        best_conf_A = 0.0
        best_conf_B = 0.0

        if use_yolo:
            # ── YOLOv8 detection ─────────────────────────────────────────────
            results = model(frame, verbose=False)
            for result in results:
                for box in result.boxes:
                    cls_id = int(box.cls[0])
                    conf   = float(box.conf[0])
                    label  = model.names[cls_id]

                    # Only process car/truck/bus/motorcycle detections
                    if label not in ("car", "truck", "bus", "motorcycle"):
                        continue
                    if conf < CONFIDENCE_THRESHOLD:
                        continue

                    # Bounding box center x determines the zone
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    cx = (x1 + x2) // 2

                    color = (0, 100, 255) if cx < mid_x else (0, 200, 255)
                    cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                    cv2.putText(frame, f"{label} {conf:.2f}",
                                (x1, y1 - 6), cv2.FONT_HERSHEY_SIMPLEX,
                                0.55, color, 2)

                    if cx < mid_x:
                        car_in_A = True
                        best_conf_A = max(best_conf_A, conf)
                    else:
                        car_in_B = True
                        best_conf_B = max(best_conf_B, conf)

        else:
            # ── Haar Cascade fallback ─────────────────────────────────────────
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            cars = cascade.detectMultiScale(gray, scaleFactor=1.1,
                                            minNeighbors=4, minSize=(40, 40))
            for (x, y, cw, ch) in cars:
                cx = x + cw // 2
                cv2.rectangle(frame, (x, y), (x + cw, y + ch), (0, 255, 0), 2)
                if cx < mid_x:
                    car_in_A = True
                    best_conf_A = 0.75
                else:
                    car_in_B = True
                    best_conf_B = 0.75

        # ── Write results to Firebase ─────────────────────────────────────────
        write_detection("A", car_in_A, best_conf_A)
        write_detection("B", car_in_B, best_conf_B)

        # ── Status overlay ────────────────────────────────────────────────────
        status_A = "OCCUPIED" if car_in_A else "AVAILABLE"
        status_B = "OCCUPIED" if car_in_B else "AVAILABLE"
        color_A  = (0, 0, 220) if car_in_A else (0, 200, 60)
        color_B  = (0, 0, 220) if car_in_B else (0, 200, 60)
        cv2.putText(frame, f"A-01: {status_A}", (10, h - 40),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.65, color_A, 2)
        cv2.putText(frame, f"B-01: {status_B}", (mid_x + 10, h - 40),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.65, color_B, 2)

        cv2.imshow("Smart Parking Detection", frame)
        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    # ── Cleanup: clear Firebase detection flags on exit ───────────────────────
    print("\n[EXIT] Clearing Firebase detection flags…")
    write_detection("A", False)
    write_detection("B", False)
    cap.release()
    cv2.destroyAllWindows()
    print("[DONE]")


if __name__ == "__main__":
    run_detection(camera_index=0)   # change to 1, 2, etc. if using external camera
