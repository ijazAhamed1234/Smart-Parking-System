# Smart Parking — Python Scripts Setup Guide

## Files
| File | Purpose |
|------|---------|
| `opencv_parking_detection.py` | OpenCV car detection → Firebase `cvDetection/` |
| `sensor_input.py` | IoT sensor (GPIO/Arduino/Mock) → Firebase `sensorDetection/` |
| `serviceAccountKey.json` | Firebase Admin SDK credentials (**you must download this**) |

---

## Step 1 — Download serviceAccountKey.json

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project **smart-parking-59ecb**
3. Click ⚙️ **Project Settings** → **Service Accounts** tab
4. Click **Generate new private key** → **Generate Key**
5. Save the downloaded file as `serviceAccountKey.json` in this folder (same folder as the `.py` files)

---

## Step 2 — Install Dependencies

```bash
pip install firebase-admin opencv-python ultralytics
```

---

## Step 3 — Run OpenCV Detection

```bash
python opencv_parking_detection.py
```

### How zones are mapped:
```
┌─────────────────────────────────────┐
│  LEFT HALF        │   RIGHT HALF    │
│   Zone A          │    Zone B       │
│   (A-01 slot)     │   (B-01 slot)   │
│                   │                 │
│  Car here = A-01  │ Car here = B-01 │
│  OCCUPIED         │  OCCUPIED       │
└───────────────────┴─────────────────┘
         Camera Frame
```

- **Car detected on LEFT side** → `cvDetection/A/detected = true` → **A-01 shows OCCUPIED**
- **Car detected on RIGHT side** → `cvDetection/B/detected = true` → **B-01 shows OCCUPIED**
- **No car** → `detected = false` → **Slot shows AVAILABLE**

---

## Step 4 — Run Sensor Script (optional)

Edit `sensor_input.py` and set `SENSOR_MODE`:
- `"mock"` — test without hardware (toggles automatically)
- `"gpio"` — Raspberry Pi GPIO pins
- `"serial"` — Arduino via USB serial

```bash
python sensor_input.py
```

---

## How Combined Detection Works

```
sensorDetection/A/detected = True  OR  cvDetection/A/detected = True
                                    ↓
                          A-01 = OCCUPIED  🔴

Both = False
                                    ↓
                          A-01 = AVAILABLE 🟢
```

The website **automatically updates in real-time** as soon as you write to Firebase.

---

## Slot Mapping Summary

| Firebase Path | Written By | Controls |
|---|---|---|
| `cvDetection/A/detected` | `opencv_parking_detection.py` | Slot A-01 |
| `cvDetection/B/detected` | `opencv_parking_detection.py` | Slot B-01 |
| `sensorDetection/A/detected` | `sensor_input.py` | Slot A-01 |
| `sensorDetection/B/detected` | `sensor_input.py` | Slot B-01 |

All other slots (A-02 to A-05, B-02 to B-05) are controlled via `parkingZones` in Firebase.
