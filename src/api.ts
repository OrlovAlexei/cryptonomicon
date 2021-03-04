const API_KEY = "";

export interface TokenSummary {
  FullName: string;
  Id: string;
  ImageUrl: string;
  Symbol: string;
}

type PriceChanged = (newPrice: number) => void;

const handlers = new Map<string, Array<PriceChanged>>();

const loadTickers = () => {
  if (handlers.size === 0) {
    return;
  }

  fetch(
    `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${Array.from(handlers.keys()).join(
      ",",
    )}&tsyms=USD&api_key=${API_KEY}`,
  )
    .then<Record<string, Record<"USD", number>>>(d => d.json())
    .then(rawData => {
      console.log("rawData", rawData);
      const updatedPrices = Object.fromEntries(Object.entries(rawData).map(([key, value]) => [key, value.USD]));

      Object.entries(updatedPrices).forEach(([cur, newPrice]) => {
        const tHandlers = handlers.get(cur) || [];
        tHandlers.forEach(fn => fn(newPrice));
      });
    });
};

const unSubscribeFromTicker = (tickerName: string) => {
  handlers.delete(tickerName);
  // const subs = handlers.get(tickerName) || [];
  // handlers.set(
  //   tickerName,
  //   subs.filter(fn => fn !== cb),
  // );
};

const subscribeToTicker = (tickerName: string, cb: PriceChanged) => {
  const subs = handlers.get(tickerName) || [];
  handlers.set(tickerName, [...subs, cb]);
};

const loadTickersSummary = (): Promise<{ Data: Record<string, TokenSummary> }> =>
  fetch(`https://min-api.cryptocompare.com/data/all/coinlist?summary=true&api_key=${API_KEY}`).then(d => d.json());

export const api = {
  loadTickersSummary,
  subscribeToTicker,
  unSubscribeFromTicker,
};

setInterval(loadTickers, 5000);
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
window.handlers = handlers;
