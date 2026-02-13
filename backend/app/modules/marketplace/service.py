from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from . import models, schemas
import random
from datetime import datetime, timedelta

def create_provider(db: Session, provider: schemas.ProviderCreate, user_id: int):
    # Create Point geometry structure: 'POINT(lon lat)'
    point_wkt = f'POINT({provider.longitude} {provider.latitude})'
    
    db_provider = models.ServiceProvider(
        user_id=user_id,
        business_name=provider.business_name,
        description=provider.description,
        phone_number=provider.phone_number,
        location=point_wkt
    )
    db.add(db_provider)
    db.commit()
    db.refresh(db_provider)
    return db_provider

def create_listing(db: Session, listing: schemas.ListingCreate, provider_id: int):
    db_listing = models.ServiceListing(
        **listing.model_dump(),
        provider_id=provider_id
    )
    db.add(db_listing)
    db.commit()
    db.refresh(db_listing)
    return db_listing

def create_product_listing(db: Session, listing: schemas.ProductListingCreate, seller_id: int):
    # --- DEFAULT DATA STRATEGY: AUTO-CLEANUP ---
    # Check if user has any default items. If so, delete them as the user is now creating real content.
    default_items = db.query(models.ProductListing).filter(
        models.ProductListing.seller_id == seller_id, 
        models.ProductListing.is_default == True
    ).all()
    
    if default_items:
        print(f"🧹 Default Data Strategy: Cleaning up {len(default_items)} default listings for user {seller_id}")
        for item in default_items:
            db.delete(item)
        # We don't commit here, we let the final commit handle everything or flush
        db.flush()

    # Optional Location
    loc = None
    if listing.latitude and listing.longitude:
        loc = f'POINT({listing.longitude} {listing.latitude})'

    db_prod = models.ProductListing(
        seller_id=seller_id,
        listing_type=listing.listing_type,
        product_name=listing.product_name,
        category=listing.category,
        description=listing.description,
        image_url=listing.image_url,
        quantity=listing.quantity,
        unit=listing.unit,
        price=listing.price,
        price_unit=listing.price_unit,
        available_date=listing.available_date,
        location=loc,
        is_default=False # Explicitly false for user-created items
    )
    db.add(db_prod)
    db.commit()
    db.refresh(db_prod)
    return db_prod

def get_all_listings(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.ServiceListing).filter(models.ServiceListing.is_active == True).offset(skip).limit(limit).all()

def get_all_product_listings(
    db: Session, 
    skip: int = 0, 
    limit: int = 100,
    category: str = None,
    listing_type: str = None,
    search: str = None
):
    query = db.query(models.ProductListing).filter(models.ProductListing.is_active == True)
    
    if category:
        query = query.filter(models.ProductListing.category.ilike(category))
    
    if listing_type:
        query = query.filter(models.ProductListing.listing_type == listing_type)
        
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            or_(
                models.ProductListing.product_name.ilike(search_fmt),
                models.ProductListing.description.ilike(search_fmt)
            )
        )
        
    return query.order_by(models.ProductListing.created_at.desc()).offset(skip).limit(limit).all()

def create_order(db: Session, order: schemas.OrderCreate, buyer_id: int):
    # Get listing to calculate total price
    listing = db.query(models.ProductListing).filter(models.ProductListing.id == order.listing_id).first()
    if not listing:
        raise ValueError("Listing not found")
        
    total_price = listing.price * order.quantity
    
    db_order = models.Order(
        buyer_id=buyer_id,
        listing_id=order.listing_id,
        quantity=order.quantity,
        total_price=total_price,
        status="PENDING"
    )
    
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order

def search_providers(db: Session, lat: float, lon: float, radius_km: float = 50):
    return db.query(models.ServiceProvider).all()

def search_commercial_products(db: Session, ingredient: str = None, category: str = None) -> list[models.CommercialProduct]:
    query = db.query(models.CommercialProduct)
    
    if ingredient:
        query = query.filter(models.CommercialProduct.active_ingredient_name.ilike(f"%{ingredient}%"))
    
    if category:
        query = query.filter(models.CommercialProduct.category.ilike(category))
         
    return query.all()

def seed_commercial_products(db: Session):
    """
    Seed commercial inputs based on user request: Pesticides, Fertilizers, Seeds.
    """
    if db.query(models.CommercialProduct).count() > 0:
        return

    products = [
        # Pesticides
        models.CommercialProduct(
            brand_name="Dithane M-45", manufacturer="UPL", active_ingredient_name="Mancozeb",
            category="Pesticides", description="Broad spectrum contact fungicide",
            unit_price=450.0, image_url="https://res.cloudinary.com/agrios/image/upload/v1/pesticides/dithane.jpg"
        ),
        models.CommercialProduct(
            brand_name="Confidor", manufacturer="Bayer", active_ingredient_name="Imidacloprid",
            category="Pesticides", description="Systemic insecticide for sucking pests",
            unit_price=850.0, image_url="https://res.cloudinary.com/agrios/image/upload/v1/pesticides/confidor.jpg"
        ),
        # Fertilizers
        models.CommercialProduct(
            brand_name="Urea 46%", manufacturer="IFFCO", active_ingredient_name="Nitrogen",
            category="Fertilizers", description="High nitrogen fertilizer for vegetative growth",
            unit_price=266.0, image_url="https://res.cloudinary.com/agrios/image/upload/v1/fertilizers/urea.jpg"
        ),
        models.CommercialProduct(
            brand_name="DAP 18-46-0", manufacturer="Coromandel", active_ingredient_name="Phosphorus",
            category="Fertilizers", description="Di-ammonium Phosphate for root development",
            unit_price=1350.0, image_url="https://res.cloudinary.com/agrios/image/upload/v1/fertilizers/dap.jpg"
        ),
        # Seeds
        models.CommercialProduct(
            brand_name="Pusa Basmati 1121", manufacturer="IARI", active_ingredient_name="Paddy Seed",
            category="Seeds", description="High yielding aromatic basmati rice variety",
            unit_price=120.0, image_url="https://res.cloudinary.com/agrios/image/upload/v1/seeds/basmati.jpg"
        ),
        models.CommercialProduct(
            brand_name="Syngenta 6242", manufacturer="Syngenta", active_ingredient_name="Tomato Seed",
            category="Seeds", description="High yielding hybrid tomato seeds",
            unit_price=850.0, image_url="https://res.cloudinary.com/agrios/image/upload/v1/seeds/tomato_seed.jpg"
        )
    ]
    
    db.add_all(products)
    db.commit()

def seed_defaults_for_user(db: Session, user_id: int):
    """
    Seed default marketplace listings for a specific user.
    """
    defaults = [
        models.ProductListing(
            seller_id=user_id, listing_type="SELL", product_name="Example: Fresh Tomatoes",
            category="Vegetable", description="This is a demo listing. Add your own to remove it.",
            quantity=50.0, unit="Kg", price=40.0, price_unit="per_kg",
            image_url="https://dummyimage.com/300x200/e74c3c/fff&text=Tomato",
            available_date=datetime.now().date(),
            is_default=True
        )
    ]
    db.add_all(defaults)
    db.commit()

def seed_dummy_listings(db: Session):
    """
    Seed farmer listings to demonstrate the marketplace categories.
    """
    if db.query(models.ProductListing).count() > 0:
        return

    listings = [
        # CROP SOLD (Plantation selling)
        models.ProductListing(
            seller_id=1, listing_type="SELL", product_name="Robusta Banana Plantation",
            category="Crop Grown", description="Ready for harvest in 2 weeks. Total 500 bunches.",
            quantity=5.0, unit="Tons", price=15000.0, price_unit="per_ton",
            image_url="https://dummyimage.com/300x200/2ecc71/fff&text=Banana",
            available_date=datetime.now().date(),
            is_default=True
        ),
        # ... (Other dummy listings also marked as default if they belong to a demo user, 
        # but for global dummy data we might keep is_default=False or True depending on policy.
        # Here we mark them True so they are clearly identifiable as non-real)
        models.ProductListing(
            seller_id=2, listing_type="SELL", product_name="Alphonso Mangoes",
            category="Fruit", description="Premium export quality organic mangoes.",
            quantity=100.0, unit="Dozen", price=800.0, price_unit="per_dozen",
            image_url="https://dummyimage.com/300x200/f1c40f/fff&text=Mango",
            available_date=datetime.now().date(),
            is_default=True
        ),
        # VEGETABLE
        models.ProductListing(
            seller_id=1, listing_type="SELL", product_name="Fresh Red Onions",
            category="Vegetable", description="Nashik Red Onions, medium size, dry.",
            quantity=500.0, unit="Kg", price=25.0, price_unit="per_kg",
            image_url="https://dummyimage.com/300x200/9b59b6/fff&text=Onion",
            available_date=datetime.now().date(),
            is_default=True
        ),
        # LIVESTOCK (Adult + Young)
        models.ProductListing(
            seller_id=3, listing_type="SELL", product_name="HF Cow",
            category="Livestock", description="Healthy Holstein Friesian cow, 2nd lactation, 15L milk/day.",
            quantity=1.0, unit="Number", price=65000.0, price_unit="per_head",
            image_url="https://dummyimage.com/300x200/ecf0f1/333&text=Cow",
            available_date=datetime.now().date(),
            is_default=True
        ),
        models.ProductListing(
            seller_id=3, listing_type="SELL", product_name="Boer Goat Kids",
            category="Livestock (Young)", description="3 month old active male kids for breeding.",
            quantity=4.0, unit="Number", price=8000.0, price_unit="per_kid",
            image_url="https://dummyimage.com/300x200/d35400/fff&text=Goat+Kid",
            available_date=datetime.now().date(),
            is_default=True
        ),
        # MACHINERY (Used/Selling) - New category
        models.ProductListing(
            seller_id=2, listing_type="SELL", product_name="Mahindra 575 Tractor",
            category="Machinery", description="2018 model, good condition, new tyres.",
            quantity=1.0, unit="Number", price=450000.0, price_unit="total",
            image_url="https://dummyimage.com/300x200/e74c3c/fff&text=Tractor",
            available_date=datetime.now().date(),
            is_default=True
        ),
        # BUY REQUEST (Wanted)
        models.ProductListing(
            seller_id=4, listing_type="BUY", product_name="Wheat Straw",
            category="Crop Residue", description="Looking for 10 tons of wheat straw for fodder.",
            quantity=10.0, unit="Tons", price=2000.0, price_unit="per_ton",
            image_url=None,
            available_date=datetime.now().date(),
            is_default=True
        ),
        # MEAT / POULTRY
        models.ProductListing(
            seller_id=3, listing_type="SELL", product_name="Kadaknath Chicken",
            category="Meat", description="Free-range, organic fed Kadaknath chicken meat.",
            quantity=20.0, unit="Kg", price=850.0, price_unit="per_kg",
            image_url="https://dummyimage.com/300x200/5e3c58/fff&text=Kadaknath",
            available_date=datetime.now().date(),
            is_default=True
        ),
        # DAIRY
        models.ProductListing(
            seller_id=3, listing_type="SELL", product_name="A2 Gir Cow Ghee",
            category="Dairy", description="Pure handmade Vedic bilona ghee from Gir cows.",
            quantity=50.0, unit="Liter", price=2500.0, price_unit="per_liter",
            image_url="https://dummyimage.com/300x200/f39c12/fff&text=Ghee",
            available_date=datetime.now().date(),
            is_default=True
        ),
    ]
    
    db.add_all(listings)
    db.commit()
