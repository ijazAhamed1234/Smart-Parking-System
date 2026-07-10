# Smart Parking System

An end-to-end, multi-sensor and computer vision-based **Smart Parking Management System**. This system integrates physical IoT hardware, real-time image processing, an Express notification server, and an interactive React-based dashboard. All state is synchronized in real-time using a Firebase Realtime Database.

---

## 🛠️ System Architecture & Working

The system determines the status of a parking slot by combining physical sensor inputs and real-time computer vision detection:

$$\text{Slot Status} = \text{Sensor Detected} \lor \text{CV (Camera) Detected}$$

```
                   +---------------------------------------+
                   |            Smart Parking              |
                   |               Dashboard               |
                   |           (React + Firebase)          |
                   +-------------------+-------------------+
                                       ^
                                       | Real-time updates
                                       v
                     +-----------------+-----------------+
                     |            Firebase               |
                     |        Realtime Database          |
                     +-------+-------------------+-------+
                             ^                   ^
             Sensor Readings |                   | Detections
                             |                   |
            +----------------+---+           +---+----------------+
            |    ESP32 IoT       |           |   Computer Vision  |
            | (Ultrasonic + LEDs)|           | (YOLOv8 / Webcam)  |
            +--------------------+           +--------------------+
```

1. **Physical Layer (ESP32)**: Ultrasonic sensors continuously measure the distance of vehicles in physical slots. Status LEDs reflect occupancy (Blue = Available, Red = Occupied). The states are transmitted directly to Firebase Realtime Database over WiFi.
2. **Vision Layer (YOLOv8 / OpenCV)**: A camera captures the parking area. The frame is divided into zones (Left = Zone A, Right = Zone B). If a car is detected with confidence above the threshold, the corresponding Firebase path is updated.
3. **Synchronization Layer (Firebase RTDB)**: Acts as the central communication hub. The frontend React app subscribes to the changes and updates the UI instantly.
4. **Notification Layer (Express + Twilio)**: Sends WhatsApp alerts to users upon booking confirmations.

---

## 📁 Repository Structure

*   `hardware/`: ESP32 microcontroller firmware (`hardware.ino`).
*   `mlPackage/`: YOLOv8 training/detection scripts and dataset files:
    *   `Dataset/`: Roboflow dataset with training, validation, and test folders (images + YOLOv8 labels).
    *   `detect.py`: Real-time YOLOv8 vehicle detection and Firebase syncer.
    *   `train.py`: Script to train the YOLOv8 model on the custom dataset.
    *   `Parking_detection.py`: Fallback frame-differencing detector.
*   `frontend_backend/`: Web application code:
    *   `backend/`: Express notification server (`server.js`) using Twilio.
    *   `src/`: Frontend React application source.
    *   `opencv_parking_detection.py` & `sensor_input.py`: Alternative local deployment runner scripts.

---

## 🚀 Component Details & Setup

### 1. Hardware Module (`hardware/`)
*   **Microcontroller**: ESP32
*   **Sensors**: 2x HC-SR04 Ultrasonic Sensors (TRIG1/ECHO1 on Pins 4/19, TRIG2/ECHO2 on Pins 5/18)
*   **Indicators**: 4x LEDs (Zone A Red/Blue on Pins 12/13, Zone B Red/Blue on Pins 14/27)

#### Setup Instructions:
1. Open `hardware/hardware.ino` in Arduino IDE.
2. Configure your WiFi credentials:
    ```cpp
    #define WIFI_SSID     "Your_WiFi_SSID"
    #define WIFI_PASSWORD "Your_WiFi_Password"
    ```
3. Set your Firebase Realtime Database URL:
    ```cpp
    #define FIREBASE_HOST "https://your-firebase-rtdb.firebaseio.com"
    ```
4. Flash the code to the ESP32.

---

### 2. Machine Learning Module (`mlPackage/`)
The system uses **YOLOv8** to monitor physical parking zones via video/webcam feed.

#### Setup Instructions:
1. Navigate to the `mlPackage` directory:
    ```bash
    cd mlPackage
    ```
2. Activate your virtual environment and install dependencies:
    ```bash
    pip install -r requirements.txt
    # Needs: ultralytics opencv-python firebase-admin
    ```
3. Place your Firebase administrative key file (`serviceAccountKey.json`) inside the `mlPackage/` directory.
4. To train the model with your custom dataset:
    ```bash
    python train.py
    ```
5. To run the detection loop:
    ```bash
    python detect.py
    ```
    *   *Controls*: Left half of webcam feed controls Slot A-01, right half controls Slot B-01. Press `ESC` to close.

---

### 3. Backend Notification Server (`frontend_backend/backend/`)
Sends WhatsApp templates to clients when slots are booked.

#### Setup Instructions:
1. Go to the backend directory:
    ```bash
    cd frontend_backend/backend
    ```
2. Install Node packages:
    ```bash
    npm install
    ```
3. Update Twilio API credentials in `server.js` (Account SID, Auth Token, Sender Whatsapp Number).
4. Run the server:
    ```bash
    node server.js
    ```
    *   Runs on port `5000`.

---

### 4. Frontend Application (`frontend_backend/`)
An interactive dashboard displaying live slot counts, pricing, booking, historical analytics, and system health status.

#### Setup Instructions:
1. Navigate to the frontend directory:
    ```bash
    cd frontend_backend
    ```
2. Install packages:
    ```bash
    npm install
    ```
3. Edit `src/firebase.js` to point to your Firebase Web App configuration credentials.
4. Launch the developer build locally:
    ```bash
    npm run dev
    ```

---

## 🔒 Security Practices

*   **Secrets**: Administrative credentials (`serviceAccountKey.json`, `.env` configurations) are explicitly ignored via `.gitignore` to prevent leakage. Please ensure they are created locally for each microservice.
