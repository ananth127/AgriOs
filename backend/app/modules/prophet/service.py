import random
from typing import List
from . import schemas

# Mock ML Model Loading
# In real prod, load .pkl file here
# from sklearn.externals import joblib
# model = joblib.load('prophet_v1.pkl')

def predict_profitability(request: schemas.PredictionRequest) -> List[schemas.PredictionResponse]:
    """
    Mock implementation of the Prophet Engine.
    Real logic would use Pandas to analyze historical prices + weather.
    """
    crops = ["Wheat", "Rice", "Onion", "Tomato", "Cotton"]
    results = []

    target_crops = [request.crop_name] if request.crop_name else crops

    for crop in target_crops:
        # Simulate ML prediction
        score = random.uniform(0.4, 0.95)
        
        reason = "Stable market trends observed."
        if score > 0.8:
            reason = "High demand expected due to supply shortage in neighboring regions."
        elif score < 0.5:
            reason = "Oversupply predicted. Caution advised."

        results.append(schemas.PredictionResponse(
            crop_name=crop,
            profitability_score=round(score, 2),
            confidence=round(random.uniform(0.7, 0.9), 2),
            reason=reason,
            recommended_action="Plant Now" if score > 0.7 else "Wait"
        ))
    
    # Sort by profitability
    results.sort(key=lambda x: x.profitability_score, reverse=True)
    return results
