from datetime import datetime, timedelta
import random

class WeatherService:
    def get_weather_forecast(self, lat: float, lng: float):
        """
        Mock weather API integration (e.g. OpenWeatherMap/IBM).
        Returns 5-day forecast.
        """
        forecast = []
        today = datetime.now()
        
        for i in range(5):
            date = today + timedelta(days=i)
            # Simulate weather data
            temp_max = random.uniform(25, 35)
            temp_min = random.uniform(18, 22)
            humidity = random.uniform(40, 95)
            rain_mm = 0 if random.random() > 0.3 else random.uniform(5, 50)
            
            forecast.append({
                "date": date.strftime("%Y-%m-%d"),
                "temp_max": round(temp_max, 1),
                "temp_min": round(temp_min, 1),
                "humidity": round(humidity, 1),
                "rainfall_mm": round(rain_mm, 1),
                "condition": "Rainy" if rain_mm > 5 else "Sunny"
            })
            
        return forecast

    def calculate_disease_risk(self, forecast):
        """
        Rule Engine for Disease Forecasting.
        Example: High Blight Risk if Humidity > 90% for 3 days.
        """
        alerts = []
        
        high_humidity_days = 0
        for day in forecast:
            if day['humidity'] > 90:
                high_humidity_days += 1
            else:
                high_humidity_days = 0 # Reset if chain broken
            
            if high_humidity_days >= 3:
                alerts.append({
                    "date": day['date'],
                    "risk_level": "HIGH",
                    "disease": "Late Blight",
                    "reason": "Humidity > 90% for 3 consecutive days."
                })
                # Don't duplicate alert for same streak
                high_humidity_days = 0 
                
        return alerts
