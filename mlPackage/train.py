from ultralytics import YOLO

# Load your previous trained model
model = YOLO("runs/detect/train/weights/best.pt")

# Train again with new dataset
model.train(
    data="Dataset/data.yaml",
    epochs=50,
    imgsz=640,
    batch=8,
    patience=20,
    augment=True
)