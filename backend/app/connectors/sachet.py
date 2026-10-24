import xml.etree.ElementTree as ET

import httpx

from .. import config
from .base import Connector, RawRecord

AGENCIES = ["IMD", "CWC", "NDMA", "INCOIS", "GSI", "FSI", "DGRE", "SDMA"]


def _local(tag: str) -> str:
    return tag.split("}")[-1].lower()


def _guess_agency(text: str) -> str:
    upper = text.upper()
    for a in AGENCIES:
        if a in upper:
            return a
    return "UNKNOWN"


def parse_cap_feed(xml_text: str) -> list[RawRecord]:
    """Parse an RSS (<item>) or Atom (<entry>) feed into raw records."""
    root = ET.fromstring(xml_text)
    records = []
    for el in root.iter():
        if _local(el.tag) not in ("item", "entry"):
            continue
        fields: dict = {}
        for child in el:
            key = _local(child.tag)
            value = (child.text or "").strip()
            if not value and child.attrib.get("href"):
                value = child.attrib["href"]
            if value:
                fields[key] = value
        ext_id = fields.get("guid") or fields.get("id") or fields.get("link")
        if not ext_id:
            continue
        blob = " ".join(fields.values())
        fields["agency"] = _guess_agency(blob)
        records.append(RawRecord(ext_id, fields))
    return records


class SachetConnector(Connector):
    """NDMA SACHET CAP feed. Carries IMD, CWC (floods), NDMA, INCOIS alerts."""

    name = "sachet"
    interval_seconds = 10 * 60

    async def fetch(self) -> list[RawRecord]:
        async with httpx.AsyncClient(
            timeout=config.HTTP_TIMEOUT,
            headers={"User-Agent": config.USER_AGENT},
            verify=config.SACHET_VERIFY_SSL,
            follow_redirects=True,
        ) as client:
            resp = await client.get(config.SACHET_RSS_URL)
            resp.raise_for_status()
        return parse_cap_feed(resp.text)
