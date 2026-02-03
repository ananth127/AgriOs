from app.modules.livestock.models import LivestockFeedPlan
from app.core.database import engine, SessionLocal
from sqlalchemy import inspect

# Check table schema
inspector = inspect(engine)
print("=== Feed Plans Table Schema ===")
if 'livestock_feed_plans' in inspector.get_table_names():
    cols = inspector.get_columns('livestock_feed_plans')
    for c in cols:
        print(f"  - {c['name']}: {c['type']}")
    
    # Check if there's any data
    db = SessionLocal()
    try:
        feed_plans = db.query(LivestockFeedPlan).all()
        print(f"\n=== Found {len(feed_plans)} feed plans ===")
        for plan in feed_plans:
            print(f"  Plan {plan.id}:")
            print(f"    - housing_id: {plan.housing_id}")
            print(f"    - animal_id: {plan.animal_id}")
            print(f"    - feed_item_name: {plan.feed_item_name}")
            print(f"    - quantity_per_day: {plan.quantity_per_day}")
            print(f"    - schedule_times: {plan.schedule_times}")
            print(f"    - auto_feeder_enabled: {plan.auto_feeder_enabled}")
            print(f"    - auto_water_enabled: {plan.auto_water_enabled}")
    finally:
        db.close()
else:
    print("ERROR: Table 'livestock_feed_plans' does not exist!")
    print("\nAvailable tables:")
    for table in inspector.get_table_names():
        print(f"  - {table}")
