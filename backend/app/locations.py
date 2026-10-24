"""Places we monitor for weather and river flow.
Coordinates are approximate river/city points. Add or remove rows freely.
(The flood API uses the nearest modelled river within about 5 km.)"""

LOCATIONS = [
    {"id": "guwahati", "name": "Guwahati (Brahmaputra)", "lat": 26.18, "lon": 91.75},
    {"id": "dibrugarh", "name": "Dibrugarh (Brahmaputra)", "lat": 27.48, "lon": 94.91},
    {"id": "patna", "name": "Patna (Ganga)", "lat": 25.61, "lon": 85.14},
    {"id": "bhagalpur", "name": "Bhagalpur (Ganga)", "lat": 25.25, "lon": 87.00},
    {"id": "varanasi", "name": "Varanasi (Ganga)", "lat": 25.32, "lon": 83.01},
    {"id": "prayagraj", "name": "Prayagraj (Ganga-Yamuna)", "lat": 25.43, "lon": 81.88},
    {"id": "lucknow", "name": "Lucknow (Gomti)", "lat": 26.85, "lon": 80.95},
    {"id": "delhi", "name": "Delhi (Yamuna)", "lat": 28.66, "lon": 77.25},
    {"id": "agra", "name": "Agra (Yamuna)", "lat": 27.18, "lon": 78.02},
    {"id": "kolkata", "name": "Kolkata (Hooghly)", "lat": 22.57, "lon": 88.36},
    {"id": "cuttack", "name": "Cuttack (Mahanadi)", "lat": 20.47, "lon": 85.88},
    {"id": "rajahmundry", "name": "Rajahmundry (Godavari)", "lat": 17.00, "lon": 81.78},
    {"id": "vijayawada", "name": "Vijayawada (Krishna)", "lat": 16.51, "lon": 80.62},
    {"id": "surat", "name": "Surat (Tapi)", "lat": 21.19, "lon": 72.82},
    {"id": "nashik", "name": "Nashik (Godavari)", "lat": 20.00, "lon": 73.79},
    {"id": "pune", "name": "Pune (Mula-Mutha)", "lat": 18.52, "lon": 73.86},
    {"id": "kolhapur", "name": "Kolhapur (Panchganga)", "lat": 16.70, "lon": 74.24},
    {"id": "kochi", "name": "Kochi (Periyar)", "lat": 9.97, "lon": 76.28},
    {"id": "srinagar", "name": "Srinagar (Jhelum)", "lat": 34.08, "lon": 74.80},
    {"id": "mumbai", "name": "Mumbai", "lat": 19.08, "lon": 72.88},
    {"id": "chennai", "name": "Chennai", "lat": 13.08, "lon": 80.27},
]