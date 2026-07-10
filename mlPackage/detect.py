from ultralytics import YOLO
import cv2
import time
import firebase_admin
from firebase_admin import credentials, db

# ── Firebase setup ────────────────────────────────────────────────────────────
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred, {
    "databaseURL": "https://smart-parking-59ecb-default-rtdb.asia-southeast1.firebasedatabase.app/"
})

# React website reads from: cvDetection/A  and  cvDetection/B
cv_ref_A = db.reference("cvDetection/A")
cv_ref_B = db.reference("cvDetection/B")

# ── Load YOUR trained YOLO model ──────────────────────────────────────────────
model = YOLO("runs/detect/train/weights/best.pt")

# ── Webcam ────────────────────────────────────────────────────────────────────
cap = cv2.VideoCapture(0)

# ── State tracking — only write Firebase when state actually changes ──────────
last_state = {"A": None, "B": None}

def write_firebase(zone, detected, confidence=0.0):
    """Write to Firebase only when state changes (avoids flooding)."""
    if last_state[zone] == detected:
        return
    payload = {
        "detected":   detected,
        "confidence": round(confidence, 3),
        "updatedAt":  int(time.time() * 1000),
    }
    if zone == "A":
        cv_ref_A.set(payload)
    else:
        cv_ref_B.set(payload)
    last_state[zone] = detected
    state_str = "OCCUPIED" if detected else "AVAILABLE"
    print(f"  Firebase cvDetection/{zone} -> {state_str}  (conf={confidence:.2f})")

# ── Detection loop ────────────────────────────────────────────────────────────
print("\n[STARTED] Smart Parking Detection - press ESC to quit\n")
print("  LEFT  half of frame = Zone A -> controls slot A-01")
print("  RIGHT half of frame = Zone B -> controls slot B-01\n")

while True:
    ret, frame = cap.read()
    if not ret:
        break

    h, w = frame.shape[:2]
    mid_x = w // 2   # vertical split: left=ZoneA, right=ZoneB

    # Run YOUR trained YOLO model
    results = model(frame, verbose=False)

    car_in_A    = False
    car_in_B    = False
    best_conf_A = 0.0
    best_conf_B = 0.0

    for box in results[0].boxes:
        conf = float(box.conf[0])
        if conf < 0.30:        # skip low-confidence detections
            continue

        x1, y1, x2, y2 = map(int, box.xyxy[0])
        cx = (x1 + x2) // 2   # centre-x of bounding box

        # Which zone does this detection belong to?
        if cx < mid_x:
            car_in_A = True
            best_conf_A = max(best_conf_A, conf)
            color = (0, 80, 255)    # red for Zone A
        else:
            car_in_B = True
            best_conf_B = max(best_conf_B, conf)
            color = (255, 160, 0)   # blue for Zone B

        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
        cv2.putText(frame, f"Car {conf:.2f}", (x1, y1 - 6),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, color, 2)

    # ── Write results to Firebase ─────────────────────────────────────────────
    write_firebase("A", car_in_A, best_conf_A)
    write_firebase("B", car_in_B, best_conf_B)

    # ── Zone divider and status overlay ──────────────────────────────────────
    cv2.line(frame, (mid_x, 0), (mid_x, h), (255, 255, 0), 2)
    cv2.putText(frame, "ZONE A", (10, 28),
                cv2.FONT_HERSHEY_SIMPLEX, 0.75, (0, 255, 100), 2)
    cv2.putText(frame, "ZONE B", (mid_x + 10, 28),
                cv2.FONT_HERSHEY_SIMPLEX, 0.75, (0, 200, 255), 2)

    status_A = "A-01: OCCUPIED" if car_in_A else "A-01: AVAILABLE"
    status_B = "B-01: OCCUPIED" if car_in_B else "B-01: AVAILABLE"
    cv2.putText(frame, status_A, (10, h - 14),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6,
                (0, 60, 220) if car_in_A else (0, 200, 60), 2)
    cv2.putText(frame, status_B, (mid_x + 10, h - 14),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6,
                (0, 60, 220) if car_in_B else (0, 200, 60), 2)

    cv2.imshow("Smart Parking Detection", frame)

    if cv2.waitKey(1) == 27:    # ESC to quit
        break

# ── On exit: clear Firebase flags ─────────────────────────────────────────────
print("\n[EXIT] Clearing Firebase flags...")
write_firebase("A", False)
write_firebase("B", False)
cap.release()
cv2.destroyAllWindows()
print("[DONE]")