from sqlalchemy.orm import Session
from . import models

class KnowledgeGraphService:
    def __init__(self, db: Session):
        self.db = db

    def get_treatment_for_pest(self, pest_name: str) -> str:
        """
        Query the Graph to find chemicals that control the given pest.
        """
        pest = self.db.query(models.KGPest).filter(models.KGPest.name == pest_name).first()
        
        if not pest:
            return "No specific data found in Knowledge Graph."
            
        if not pest.chemicals:
            return "No chemical treatments registered for this pest."
            
        chemicals = [chem.name for chem in pest.chemicals]
        return f"Recommended treatments: {', '.join(chemicals)}."

    def seed_initial_data(self):
        """
        Populate the graph with some basic data (Potato Late Blight example).
        """
        # Check if already seeded
        if self.db.query(models.KGPest).first():
            return

        # Create Crop
        potato = models.KGCrop(name="Potato")
        tomato = models.KGCrop(name="Tomato")
        
        # Create Pest
        late_blight = models.KGPest(name="Late Blight", symptoms="Dark lesions on leaves")
        early_blight = models.KGPest(name="Early Blight", symptoms="Bullseye pattern spots")
        
        # Create Chemicals
        mancozeb = models.KGChemical(name="Mancozeb 75% WP", description="Contact fungicide")
        metalaxyl = models.KGChemical(name="Metalaxyl", description="Systemic fungicide")
        
        # Build Relationships
        late_blight.crops.extend([potato, tomato])
        early_blight.crops.extend([potato, tomato])
        
        late_blight.chemicals.extend([mancozeb, metalaxyl])
        early_blight.chemicals.append(mancozeb)
        
        self.db.add_all([potato, tomato, late_blight, early_blight, mancozeb, metalaxyl])
        self.db.commit()
