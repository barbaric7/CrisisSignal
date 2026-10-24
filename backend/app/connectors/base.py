from abc import ABC, abstractmethod
from dataclasses import dataclass

from ..models import Event


@dataclass
class RawRecord:
    external_id: str
    payload: dict


class Connector(ABC):
    name: str
    interval_seconds: int

    def enabled(self) -> bool:
        """Return False if the connector is missing config (e.g. API key)."""
        return True

    @abstractmethod
    async def fetch(self) -> list[RawRecord]:
        """Fetch raw records from the source, untouched."""

    def normalize(self, record: RawRecord) -> Event | None:
        """Map one raw record to the common Event model.

        Default: None (raw only). Processing stage fills this in later.
        """
        return None
