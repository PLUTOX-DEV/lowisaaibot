const COINS = {
  btc: { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC' },
  bitcoin: { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC' },
  eth: { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
  ethereum: { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
  sol: { id: 'solana', name: 'Solana', symbol: 'SOL' },
  solana: { id: 'solana', name: 'Solana', symbol: 'SOL' },
  bnb: { id: 'binancecoin', name: 'BNB', symbol: 'BNB' },
  ada: { id: 'cardano', name: 'Cardano', symbol: 'ADA' },
  doge: { id: 'dogecoin', name: 'Dogecoin', symbol: 'DOGE' },
  xrp: { id: 'ripple', name: 'XRP', symbol: 'XRP' },
  link: { id: 'chainlink', name: 'Chainlink', symbol: 'LINK' }
} as const;

type Coin = typeof COINS[keyof typeof COINS];

export function resolveCoins(input: string): Coin[] {
  const requested = input.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  const unique = new Map<string, Coin>();
  for (const token of requested) {
    const coin = COINS[token as keyof typeof COINS];
    if (coin) unique.set(coin.id, coin);
  }
  return [...unique.values()].slice(0, 10);
}

export async function getCryptoPrices(coins: Coin[]) {
  if (!coins.length) return [];
  const ids = coins.map((coin) => coin.id).join(',');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(ids)}&vs_currencies=usd&include_24hr_change=true`,
      { signal: controller.signal, headers: { Accept: 'application/json' } }
    );
    if (!response.ok) throw new Error(`CoinGecko request failed (${response.status})`);
    const payload = await response.json() as Record<string, { usd?: number; usd_24h_change?: number }>;
    return coins.flatMap((coin) => {
      const quote = payload[coin.id];
      return quote?.usd === undefined ? [] : [{ ...coin, price: quote.usd, change24h: quote.usd_24h_change }];
    });
  } finally {
    clearTimeout(timeout);
  }
}
