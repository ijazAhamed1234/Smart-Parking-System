import cv2

cap = cv2.VideoCapture(0)

# Adjust this to your notebook area (use mouse if needed)
parking_slot = (100, 100, 400, 400)

reference = None  # will store empty frame

while True:
    ret, frame = cap.read()
    if not ret:
        break

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    x1, y1, x2, y2 = parking_slot

    # If reference not set yet
    if reference is None:
        reference = gray.copy()

    # Crop parking area
    ref_crop = reference[y1:y2, x1:x2]
    frame_crop = gray[y1:y2, x1:x2]

    # Find difference
    diff = cv2.absdiff(ref_crop, frame_crop)
    _, thresh = cv2.threshold(diff, 30, 255, cv2.THRESH_BINARY)

    # Count changed pixels
    count = cv2.countNonZero(thresh)

    # Adjust threshold if needed
    if count > 15000:
        status = "Occupied"
        color = (0, 0, 255)
    else:
        status = "Empty"
        color = (0, 255, 0)

    # Draw parking box
    cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
    cv2.putText(frame, status, (x1, y1-10),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)

    cv2.imshow("Parking Detection", frame)

    # 🔑 Key controls
    key = cv2.waitKey(1)

    # Press 'r' to reset reference (IMPORTANT)
    if key == ord('r'):
        reference = gray.copy()
        print("Reference reset (Empty slot saved)")

    # Press ESC to exit
    if key == 27:
        break

cap.release()
cv2.destroyAllWindows()