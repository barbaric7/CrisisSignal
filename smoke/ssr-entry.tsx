import { renderToString } from "react-dom/server";
import App from "../src/App";
import { EventsView, SourcesView, AlertsView } from "../src/components/views";
import { DetailView } from "../src/components/DetailView";
import { EVENTS, SOURCES, ALERTS } from "../src/data/mock";

const noop = () => {};
const cases: [string, () => string][] = [
  ["App/overview", () => renderToString(<App />)],
  ["EventsView", () => renderToString(<EventsView events={EVENTS} onOpen={noop} />)],
  ["SourcesView", () => renderToString(<SourcesView sources={SOURCES} />)],
  ["AlertsView", () => renderToString(<AlertsView alerts={ALERTS} onAck={noop} onAckAll={noop} onOpenEvent={noop} />)],
  ["DetailView", () => renderToString(<DetailView event={EVENTS[0]} onBack={noop} onBackEvents={noop} />)],
];

let failed = 0;
for (const [name, fn] of cases) {
  try {
    const html = fn();
    console.log(`OK   ${name}  (${html.length} bytes of markup)`);
  } catch (e: any) {
    failed++;
    console.log(`FAIL ${name}: ${e.message}`);
  }
}
process.exit(failed ? 1 : 0);
