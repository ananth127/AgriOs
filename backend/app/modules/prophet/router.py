from fastapi import APIRouter, Depends
from typing import List
from . import service, schemas

router = APIRouter()

@router.post("/predict", response_model=List[schemas.PredictionResponse])
def get_prediction(request: schemas.PredictionRequest):
    return service.predict_profitability(request)
