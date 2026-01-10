from app.core.database import Base, engine
from app.modules.registry import models as registry_models
from app.modules.auth import models as auth_models
from app.modules.crops import models as crop_models
from app.modules.knowledge_graph import models as kg_models
from app.modules.diagnosis import models as diag_models
from app.modules.marketplace import models as market_models
# Import other modules as needed

print("Creating database tables...")
Base.metadata.create_all(bind=engine)
print("Tables created successfully!")
