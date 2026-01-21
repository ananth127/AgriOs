from sqlalchemy.orm import Session
from . import models

class RegulatoryIngestionService:
    """
    Mock service to ingest regulatory data from CIBRC (Central Insecticides Board & Registration Committee).
    In a real scenario, this would scrape 'http://ppqs.gov.in/' or consume an API.
    """
    
    def __init__(self, db: Session):
        self.db = db
        
    def sync_banned_chemicals(self):
        """
        Syncs list of banned chemicals.
        """
        # 1. Mock List of Banned Pesticides in India (Partial List)
        banned_list = [
            "DDT", "Aldrin", "Chlordane", "Heptachlor", "Endrin", "Paraquat" 
        ]
        
        count = 0
        for chem_name in banned_list:
            # Check if exists
            chem = self.db.query(models.KGChemical).filter(models.KGChemical.name.ilike(chem_name)).first()
            if chem:
                chem.is_banned = True
                chem.regulatory_status = "BANNED"
                count += 1
            else:
                # Create if not exists to ensure we track it as banned
                new_chem = models.KGChemical(
                    name=chem_name,
                    description="Automatically imported BANNED substance.",
                    is_banned=True,
                    regulatory_status="BANNED"
                )
                self.db.add(new_chem)
                count += 1
        
        self.db.commit()
        return {"synced_count": count, "message": "Regulatory data synced successfully."}

    def check_compliance(self, chemical_name: str) -> dict:
        chem = self.db.query(models.KGChemical).filter(models.KGChemical.name.ilike(chemical_name)).first()
        if not chem:
            return {"status": "UNKNOWN", "message": "Chemical not found in regulatory database."}
        
        if chem.is_banned:
            return {"status": "BANNED", "message": f"DANGER: {chem.name} is banned! Do not recommend."}
            
        return {"status": "APPROVED", "message": "Chemical is approved for use."}
