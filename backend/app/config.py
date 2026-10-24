import os

from dotenv import load_dotenv

load_dotenv()  # reads .env from the project folder

# Supabase Postgres connection string (Session pooler)
DATABASE_URL = os.getenv("DATABASE_URL", "").strip()

# NASA FIRMS: free key from https://firms.modaps.eosdis.nasa.gov/api/map_key
FIRMS_MAP_KEY = os.getenv("FIRMS_MAP_KEY", "").strip()
FIRMS_PRODUCT = os.getenv("FIRMS_PRODUCT", "VIIRS_SNPP_NRT")
# west,south,east,north  (default = India)
FIRMS_BBOX = os.getenv("FIRMS_BBOX", "68,6,98,36")

# NDMA SACHET India CAP RSS feed (carries IMD, CWC, NDMA, INCOIS, ... alerts).
# Verify this URL in your browser; see README step 4.
SACHET_RSS_URL = os.getenv(
    "SACHET_RSS_URL",
    "https://sachet.ndma.gov.in/cap_public_website/rss/rss_india.xml",
)
SACHET_VERIFY_SSL = os.getenv("SACHET_VERIFY_SSL", "true").lower() == "true"

HTTP_TIMEOUT = float(os.getenv("HTTP_TIMEOUT", "30"))
FETCH_RETRIES = int(os.getenv("FETCH_RETRIES", "3"))
USER_AGENT = "CrisisSignal/0.2 (academic project)"
