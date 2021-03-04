const API_KEY = "";

export interface TokenSummary {
  FullName: string;
  Id: string;
  ImageUrl: string;
  Symbol: string;
}

const handlers = new Map<string, Array<PriceChanged>>();

const socket = new WebSocket(`wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`);

socket.addEventListener("message", e => {
  const { TYPE: type, FROMSYMBOL: updatedTicker, PRICE: newPrice } = JSON.parse(e.data);

  if (type !== "5" || !newPrice) {
    return;
  }

  const tHandlers = handlers.get(updatedTicker) || [];
  tHandlers.forEach(fn => fn(newPrice));
});

function sendToWS(message: Record<string, unknown>) {
  const stringifiedMessage = JSON.stringify(message);

  if (socket.readyState === WebSocket.OPEN) {
    socket.send(stringifiedMessage);
    return;
  }

  socket.addEventListener("open", () => socket.send(stringifiedMessage), { once: true });
}

function subsToTickerOnWs(tickerName: string) {
  sendToWS({
    action: "SubAdd",
    subs: [`5~CCCAGG~${tickerName}~USD`],
  });
}

function unsubsFromTickerOnWs(tickerName: string) {
  sendToWS({
    action: "SubRemove",
    subs: [`5~CCCAGG~${tickerName}~USD`],
  });
}

type PriceChanged = (newPrice: number) => void;

const unSubscribeFromTicker = (tickerName: string) => {
  handlers.delete(tickerName);
  unsubsFromTickerOnWs(tickerName);
};

const subscribeToTicker = (tickerName: string, cb: PriceChanged) => {
  const subs = handlers.get(tickerName) || [];
  handlers.set(tickerName, [...subs, cb]);
  subsToTickerOnWs(tickerName);
};

const loadTickersSummary = (): Promise<{ Data: Record<string, TokenSummary> }> =>
  fetch(`https://min-api.cryptocompare.com/data/all/coinlist?summary=true&api_key=${API_KEY}`).then(d => d.json());

export const api = {
  loadTickersSummary,
  subscribeToTicker,
  unSubscribeFromTicker,
};
