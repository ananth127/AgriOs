from typing import List, Dict
from . import schemas
# from ultralytics import YOLO

# Mock Model
class MockYOLO:
    def predict(self, source, save=False):
        # Return mock results object structure
        return [MockResult()]

class MockResult:
    def __init__(self):
        self.boxes = MockBoxes()

class MockBoxes:
    def __init__(self):
        # Mocking 5 detections
        self.data = [[10, 10, 50, 50, 0.9, 0], [60, 60, 100, 100, 0.85, 1]] 
        self.cls = [0, 1]
        self.conf = [0.9, 0.85]
        self.xyxy = [[10, 10, 50, 50], [60, 60, 100, 100]]

# model = YOLO("yolov8n.pt") 

def analyze_image(request: schemas.DroneAnalysisRequest) -> schemas.DroneAnalysisResponse:
    """
    Analyzes an image using YOLOv8 (Mocked for now).
    """
    # results = model.predict(request.image_url)
    
    # Mock Logic
    detected_objects = []
    detected_objects.append(schemas.DetectedObject(
        class_name="Healthy Crop",
        confidence=0.95,
        bbox=[100, 100, 200, 200]
    ))
    detected_objects.append(schemas.DetectedObject(
        class_name="Weed",
        confidence=0.88,
        bbox=[300, 300, 350, 350]
    ))

    summary = {"Healthy Crop": 1, "Weed": 1}

    return schemas.DroneAnalysisResponse(
        image_url=request.image_url,
        detected_objects=detected_objects,
        summary=summary
    )
