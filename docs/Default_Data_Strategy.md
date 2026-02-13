# Default Data Seeding Strategy

## Overview

This document outlines the strategy for handling initial "Default Data" (also known as seeding data) for new users. The goal is to provide a populated, functional experience immediately upon account creation, while ensuring this data is clearly marked and seamlessly replaced or cleaned up as the user engages with the platform.

## Core Principles

1.  **Immediate Value:** New users should see a fully functioning dashboard, not empty states.
2.  **Clear Distinction:** Default items must be visually distinct from user-created content.
3.  **Automatic Cleanup:** Default items should be removed automatically when the user creates their first real item of that type.
4.  **Backend Enforcement:** The backend creates these defaults upon account creation. The frontend merely displays them.

## Implementation Details

### 1. Data Structure

All default data entries in the database will have a specific flag or metadata to identify them.

*   **Flag:** `is_default` (Boolean)
*   **Value:** `true` for system-generated default items, `false` for user-created items.

### 2. Frontend Behavior

#### Visual Indicators
*   **Badge:** Display a "Demo" or "Example" badge on cards/list items.
*   **Opacity:** Slightly reduce opacity (e.g., 90%) to differentiate from "real" active items.
*   **Tooltip:** Hovering over the badge serves a tooltip: _"This is example data. It will be removed when you add your own."_

#### Interaction Logic
*   **Editable:** Users CAN edit default items to "claim" them. If a user edits a default item, the `is_default` flag flips to `false`.
*   **Deletable:** Users CAN manually delete default items.
*   **Auto-Delete Trigger:**
    *   **Action:** When a user successfully creates a *new* item (POST request).
    *   **Effect:** The backend (or frontend logic) checks for existing `is_default=true` items of that type and deletes them.

### 3. Backend Logic (Seeding)

When a new user account is created (or first login detected), the system triggers a `seed_defaults` routine.

**Example Entities to Seed:**
*   **Marketplace Listing:**
    *   *Item:* Premium Organic Fertilizer (50kg)
    *   *Price:* $25.00
    *   *Description:* High-quality nitrogen-rich fertilizer suitable for all crop types.
    *   *Image:* Placeholder fertilizer bag image.
*   **Livestock:**
    *   *Animal:* "Bella" (Cow, Holstein)
    *   *Status:* Healthy, Lactating
*   **Crops:**
    *   *Crop:* Wheat (Demo Plot)
    *   *Stage:* Germination

## Step-by-Step Implementation Guide

### Phase 1: Database Updates
1.  Add `is_default` column (Boolean, default=False) to core tables:
    *   `marketplace_products`
    *   `livestock_animals`
    *   `crops`
    *   `farm_assets`

### Phase 2: Backend Logic
1.  **Update "Create" Endpoints:**
    *   In the `POST /create` handlers for each module, add logic:
        ```python
        # Check if user has any default items
        default_items = db.query(Model).filter_by(user_id=user.id, is_default=True).all()
        if default_items:
            for item in default_items:
                db.delete(item) # Auto-cleanup
        ```
2.  **Create Seeding Service:**
    *   Implement a function `seed_user_data(user_id)` called after registration.

### Phase 3: Frontend Components
1.  **Update Cards/Lists:**
    *   Check `item.is_default`.
    *   If true, render the "Demo" badge.
2.  **Add Helper Text:**
    *   In empty states where defaults might have been deleted, show: _"You've cleared the demo data. Add your first real item now!"_

## Reference for Developers

When working on feature modules, check for the `is_default` flag in API responses.

*   **File:** `backend/app/modules/*/models.py` -> Ensure model has `is_default`.
*   **File:** `frontend/src/components/*/Card.tsx` -> Add visual indicator.
