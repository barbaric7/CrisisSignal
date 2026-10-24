import asyncio

from .models import Event


class EventBus:
    """In-memory pub/sub used to push new events to SSE clients."""

    def __init__(self) -> None:
        self._subs: set[asyncio.Queue[Event]] = set()

    def subscribe(self) -> asyncio.Queue[Event]:
        q: asyncio.Queue[Event] = asyncio.Queue(maxsize=200)
        self._subs.add(q)
        return q

    def unsubscribe(self, q: asyncio.Queue[Event]) -> None:
        self._subs.discard(q)

    async def publish(self, event: Event) -> None:
        for q in list(self._subs):
            if q.full():
                continue
            q.put_nowait(event)


bus = EventBus()
