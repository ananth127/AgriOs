
import random
import math
import requests
import json
from typing import List, Dict, Any

def detect_boundaries(lat: float, lng: float, zoom: float = 18.0) -> dict:
    """
    Smart boundary detection.
    1. Tries to fetch real landuse data from OpenStreetMap.
    2. Fallback: Generates a smart grid of rectangular plots around the center.
    """
    
    geojson = {
        "type": "FeatureCollection",
        "features": []
    }

    # 1. Try OSM Data
    osm_features = _fetch_osm_boundaries(lat, lng)
    if osm_features:
        geojson["features"].extend(osm_features)
        print(f"AI Service: Found {len(osm_features)} real boundaries from OSM.")
        return geojson
    
    # 2. Fallback: Generate Smart Grid (Rectangular Plots)
    # 3x3 Grid of ~1 acre (4000 sqm) plots
    # 1 acre approx 63m x 63m -> 0.0006 deg lat, 0.0006 deg lng
    
    print("AI Service: OSM data empty, generating smart grid.")
    grid_size = 3
    step = 0.0008 # degrees, approx 80m
    
    start_lat = lat - (step * (grid_size // 2))
    start_lng = lng - (step * (grid_size // 2))
    
    for i in range(grid_size):
        for j in range(grid_size):
            # Center of the cell
            c_lat = start_lat + i * step
            c_lng = start_lng + j * step
            
            # Create a nice rectangle with slight randomness to look organic but structured
            # Half-width/height
            hw = step * 0.45 
            
            # Add jitter to corners to mitigate "perfect grid" look
            jitter = lambda: random.uniform(-0.00005, 0.00005)
            
            p1 = [c_lng - hw + jitter(), c_lat - hw + jitter()]
            p2 = [c_lng + hw + jitter(), c_lat - hw + jitter()]
            p3 = [c_lng + hw + jitter(), c_lat + hw + jitter()]
            p4 = [c_lng - hw + jitter(), c_lat + hw + jitter()]
            
            points = [p1, p2, p3, p4, p1]
            
            feature = {
                "type": "Feature",
                "id": f"ai-grid-{i}-{j}",
                "properties": {
                    "confidence": 0.65, # Lower confidence for synthetic grid
                    "type": "potential_plot",
                    "area_hectares": 0.64, # Approx
                    "crop_prediction": "Unknown" 
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [points]
                }
            }
            geojson["features"].append(feature)

    return geojson

def _fetch_osm_boundaries(lat: float, lng: float) -> List[Dict[str, Any]]:
    """Query Overpass API for farmland polygons"""
    overpass_url = "https://overpass-api.de/api/interpreter"
    # Search radius: 500m
    query = f"""
    [out:json][timeout:5];
    (
      way["landuse"~"farmland|farm|orchard|vineyard|grass"](around:500, {lat}, {lng});
      relation["landuse"~"farmland|farm|orchard|vineyard|grass"](around:500, {lat}, {lng});
    );
    out geom;
    """
    
    features = []
    try:
        response = requests.get(overpass_url, params={'data': query}, timeout=8)
        if response.status_code != 200:
            return []
            
        data = response.json()
        elements = data.get('elements', [])
        
        for el in elements:
            if 'geometry' not in el:
                continue
                
            # Convert OSM geometry (list of {lat, lon}) to GeoJSON coordinates (list of [lon, lat])
            coords = []
            for pt in el['geometry']:
                coords.append([pt['lon'], pt['lat']])
            
            # Ensure closed polygon
            if coords and coords[0] != coords[-1]:
                coords.append(coords[0])
                
            if len(coords) < 4: continue # Not a polygon

            f = {
                "type": "Feature",
                "id": f"osm-{el['id']}",
                "properties": {
                    "confidence": 0.95,
                    "type": el.get('tags', {}).get('landuse', 'farmland'),
                    "source": "OpenStreetMap"
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [coords]
                }
            }
            features.append(f)
            
    except Exception as e:
        print(f"OSM Fetch Error: {e}")
        return []
        
    return features
