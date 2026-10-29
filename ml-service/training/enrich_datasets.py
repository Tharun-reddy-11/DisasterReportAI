"""Enrich datasets with location geocoding, flood scenarios, and duplicate matching benchmarks.
"""
from csv import DictWriter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "datasets" / "processed"
OUT.mkdir(parents=True, exist_ok=True)

def build_geocoding_reference():
    dest = OUT / "location_geocoding_reference.csv"
    locations = [
        {"place_name": "ramakrishnapuram", "state": "Tamil Nadu", "district": "Chennai", "latitude": 13.0425, "longitude": 80.2285, "hazard_zone": "High Flood Risk", "flood_history": "2015, 2023"},
        {"place_name": "velachery", "state": "Tamil Nadu", "district": "Chennai", "latitude": 12.9815, "longitude": 80.2180, "hazard_zone": "Severe Inundation", "flood_history": "2015, 2021, 2023"},
        {"place_name": "tambaram", "state": "Tamil Nadu", "district": "Chengalpattu", "latitude": 12.9249, "longitude": 80.1000, "hazard_zone": "Moderate Inundation", "flood_history": "2021, 2023"},
        {"place_name": "alappuzha", "state": "Kerala", "district": "Alappuzha", "latitude": 9.4981, "longitude": 76.3388, "hazard_zone": "Backwater Flood", "flood_history": "2018, 2019, 2024"},
        {"place_name": "kuttanad", "state": "Kerala", "district": "Alappuzha", "latitude": 9.4500, "longitude": 76.4500, "hazard_zone": "Below Sea Level Flood", "flood_history": "2018, 2019, 2021"},
        {"place_name": "wayanad", "state": "Kerala", "district": "Wayanad", "latitude": 11.6854, "longitude": 76.1320, "hazard_zone": "Flash Flood & Landslide", "flood_history": "2018, 2024"},
        {"place_name": "cuttack", "state": "Odisha", "district": "Cuttack", "latitude": 20.4625, "longitude": 85.8828, "hazard_zone": "Mahanadi River Basin", "flood_history": "2020, 2022"},
        {"place_name": "bhubaneswar", "state": "Odisha", "district": "Khordha", "latitude": 20.2961, "longitude": 85.8245, "hazard_zone": "Urban Waterlogging", "flood_history": "2019, 2023"},
        {"place_name": "guwahati", "state": "Assam", "district": "Kamrup Metro", "latitude": 26.1445, "longitude": 91.7362, "hazard_zone": "Brahmaputra Overflow", "flood_history": "2020, 2022, 2024"},
        {"place_name": "kaziranga", "state": "Assam", "district": "Golaghat", "latitude": 26.5775, "longitude": 93.1711, "hazard_zone": "Annual Brahmaputra Inundation", "flood_history": "2021, 2023, 2024"},
        {"place_name": "patna", "state": "Bihar", "district": "Patna", "latitude": 25.5941, "longitude": 85.1376, "hazard_zone": "Ganga Basin Inundation", "flood_history": "2019, 2021"},
        {"place_name": "dharbhanga", "state": "Bihar", "district": "Darbhanga", "latitude": 26.1542, "longitude": 85.8918, "hazard_zone": "Bagmati Flood Plain", "flood_history": "2020, 2023"},
        {"place_name": "yamuna flood plains", "state": "Delhi", "district": "East Delhi", "latitude": 28.6280, "longitude": 77.2580, "hazard_zone": "Riverbank Breach", "flood_history": "2023"},
        {"place_name": "ito delhi", "state": "Delhi", "district": "Central Delhi", "latitude": 28.6300, "longitude": 77.2450, "hazard_zone": "Urban Water Overtopping", "flood_history": "2023"},
        {"place_name": "mumbai kurla", "state": "Maharashtra", "district": "Mumbai Suburban", "latitude": 19.0728, "longitude": 72.8826, "hazard_zone": "Mithi River Overflow", "flood_history": "2005, 2019, 2023"},
        {"place_name": "mumbai hindmata", "state": "Maharashtra", "district": "Mumbai City", "latitude": 19.0140, "longitude": 72.8420, "hazard_zone": "Tidal Inundation", "flood_history": "2020, 2021, 2023"},
        {"place_name": "greenfield town", "state": "Telangana", "district": "Hyderabad", "latitude": 17.3850, "longitude": 78.4867, "hazard_zone": "Urban Nala Overflow", "flood_history": "2020, 2024"},
        {"place_name": "market road", "state": "Telangana", "district": "Hyderabad", "latitude": 17.3910, "longitude": 78.4720, "hazard_zone": "Low-Lying Market Area", "flood_history": "2020, 2022"},
        {"place_name": "vijayawada", "state": "Andhra Pradesh", "district": "NTR", "latitude": 16.5062, "longitude": 80.6480, "hazard_zone": "Budameru & Krishna Floods", "flood_history": "2024"},
        {"place_name": "budameru", "state": "Andhra Pradesh", "district": "Krishna", "latitude": 16.5400, "longitude": 80.6200, "hazard_zone": "Stream Breach", "flood_history": "2024"},
        {"place_name": "singh nagar", "state": "Andhra Pradesh", "district": "NTR", "latitude": 16.5350, "longitude": 80.6350, "hazard_zone": "Severe Residential Inundation", "flood_history": "2024"},
        {"place_name": "ahmedabad", "state": "Gujarat", "district": "Ahmedabad", "latitude": 23.0225, "longitude": 72.5714, "hazard_zone": "Sabarmati Overflow", "flood_history": "2017, 2022"},
        {"place_name": "vadodara", "state": "Gujarat", "district": "Vadodara", "latitude": 22.3072, "longitude": 73.1812, "hazard_zone": "Vishwamitri River Overflow", "flood_history": "2019, 2024"},
    ]
    with dest.open("w", encoding="utf-8", newline="") as f:
        writer = DictWriter(f, fieldnames=["place_name", "state", "district", "latitude", "longitude", "hazard_zone", "flood_history"])
        writer.writeheader()
        writer.writerows(locations)
    print(f"Created {len(locations)} geocoding records in {dest}")

def build_flood_emergency_scenarios():
    dest = OUT / "flood_and_emergency_reports.csv"
    scenarios = [
        {"title": "Water entering homes near bridge", "description": "Heavy rain caused river overflow. Water level is 4 feet inside houses near Ramakrishnapuram bridge. 12 people trapped on upper floors.", "category": "flood", "location": "Ramakrishnapuram", "trapped": 12, "injured": 0, "urgency": "critical", "requested_help": "rescue boats and food packets"},
        {"title": "Bridge submerged and road cut off", "description": "Village access bridge completely submerged under fast current. 25 residents cut off from medical center. Immediate evacuation requested.", "category": "flood", "location": "Ramakrishnapuram", "trapped": 25, "injured": 2, "urgency": "critical", "requested_help": "evacuation team, NDRF boats"},
        {"title": "Residential colony waterlogged", "description": "Over 50 houses in Velachery inundated after storm drainage choked. Water at waist level. Elderly citizens need transport to relief camp.", "category": "flood", "location": "Velachery", "trapped": 4, "injured": 0, "urgency": "high", "requested_help": "de-watering pumps, transport to shelter"},
        {"title": "Budameru diversion breach", "description": "Stream breached right embankment near Singh Nagar. Swift floodwaters gushing into ground floor apartments. Over 100 families affected.", "category": "flood", "location": "Singh Nagar, Vijayawada", "trapped": 30, "injured": 5, "urgency": "critical", "requested_help": "heavy rescue boats, drone food drops"},
        {"title": "Severe waterlogging on highway", "description": "National highway junction blocked by 3 feet stagnant water. Vehicles stalled, traffic paralyzed for 6 km. No injuries reported.", "category": "flood", "location": "Tambaram", "trapped": 0, "injured": 0, "urgency": "moderate", "requested_help": "traffic diversion, mobile pumps"},
        {"title": "Brahmaputra embankment leak", "description": "Seepage observed on village earthen dyke near river bank. Soil eroding rapidly. Over 40 villagers attempting emergency sandbag reinforcement.", "category": "flood", "location": "Guwahati riverbank", "trapped": 0, "injured": 1, "urgency": "high", "requested_help": "sandbags, engineering crew, standby boats"},
        {"title": "Commercial complex transformer fire", "description": "Electrical transformer burst into flames following short circuit. Thick black smoke engulfing second floor. 8 office staff trapped inside.", "category": "fire", "location": "Market Road", "trapped": 8, "injured": 3, "urgency": "critical", "requested_help": "fire tenders, hydraulic ladder, ambulance"},
        {"title": "Cyclone high wind damage", "description": "Gusts of 110 kmph uprooted massive trees and tore tin roofs off school shelter. Power lines down across road.", "category": "cyclone_storm", "location": "Cuttack", "trapped": 0, "injured": 4, "urgency": "high", "requested_help": "tree clearing squads, emergency power team"},
        {"title": "Earthquake tremors and wall collapse", "description": "Magnitude 5.2 shock felt. Two old masonry walls collapsed near bazaar. 3 persons sustained minor fractures.", "category": "earthquake", "location": "Wayanad", "trapped": 0, "injured": 3, "urgency": "high", "requested_help": "first aid kits, structural safety inspection"},
    ]
    with dest.open("w", encoding="utf-8", newline="") as f:
        writer = DictWriter(f, fieldnames=["title", "description", "category", "location", "trapped", "injured", "urgency", "requested_help"])
        writer.writeheader()
        writer.writerows(scenarios)
    print(f"Created {len(scenarios)} emergency scenarios in {dest}")

if __name__ == "__main__":
    build_geocoding_reference()
    build_flood_emergency_scenarios()
