import type { Route } from './+types/api.stock';

interface YFSearchQuote {
  quoteType?: string;
  symbol?: string;
}

interface YFQuote {
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  shortName?: string;
  longName?: string;
}

interface YFHistoryPoint {
  date: string | Date;
  close: number | null;
}

interface YFValidationError {
  result?: { quotes?: YFSearchQuote[] };
  message?: string;
}

function isYFValidationError(e: unknown): e is YFValidationError {
  return typeof e === 'object' && e !== null && 'result' in e;
}

const koreanMap: Record<string, string> = {
  '삼성전자': '005930.KS',
  'sk하이닉스': '000660.KS',
  '네이버': '035420.KS',
  'naver': '035420.KS',
  '카카오': '035720.KS',
  '현대차': '005380.KS',
  '기아': '000270.KS',
  'lg에너지솔루션': '373220.KS',
  'lg엔솔': '373220.KS',
  'lg화학': '051910.KS',
};

export async function loader({ request }: Route.LoaderArgs) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') ?? '^KS11';
  const range = searchParams.get('range') ?? '1mo';

  const { default: YahooFinance } = await import('yahoo-finance2');
  const yahooFinance = new YahooFinance();

  try {
    let targetSymbol = symbol;

    const mappedSymbol = koreanMap[symbol.trim().toLowerCase()];
    if (mappedSymbol !== undefined) {
      targetSymbol = mappedSymbol;
    } else {
      try {
        const searchResult = await yahooFinance.search(symbol, { quotesCount: 3 });
        if (searchResult.quotes && searchResult.quotes.length > 0) {
          const quotes = searchResult.quotes as YFSearchQuote[];
          const topQuote = quotes.find((q) => q.quoteType === 'EQUITY' || q.quoteType === 'ETF') ?? quotes[0];
          if (topQuote?.symbol !== undefined) {
            targetSymbol = String(topQuote.symbol);
          }
        }
      } catch (searchError: unknown) {
        const quotes = isYFValidationError(searchError) ? searchError.result?.quotes : undefined;
        if (quotes !== undefined && quotes.length > 0) {
          const topQuote = quotes.find((q) => q.quoteType === 'EQUITY' || q.quoteType === 'ETF') ?? quotes[0];
          if (topQuote?.symbol !== undefined) {
            targetSymbol = String(topQuote.symbol);
          }
        } else if (/^\d{6}$/.test(symbol.trim())) {
          targetSymbol = `${symbol.trim()}.KQ`;
        }
      }
    }

    const quote = await yahooFinance.quote(targetSymbol) as YFQuote;

    const now = new Date();
    const past = new Date();
    if (range === '1mo') {
      past.setMonth(now.getMonth() - 1);
    } else if (range === '1y') {
      past.setFullYear(now.getFullYear() - 1);
    } else {
      past.setMonth(now.getMonth() - 6);
    }

    const period1 = past.toISOString().split('T')[0] ?? '';
    const period2 = now.toISOString().split('T')[0] ?? '';

    let history: YFHistoryPoint[] = [];
    try {
      const chartData = await yahooFinance.chart(targetSymbol, { period1, period2, interval: '1d' });
      history = ((chartData.quotes ?? []) as YFHistoryPoint[]).filter((q) => q.close !== null);
    } catch (e) {
      console.error('History fetch error:', e);
    }

    return Response.json({
      symbol: targetSymbol,
      quote: {
        price: quote.regularMarketPrice,
        change: quote.regularMarketChange,
        changePercent: quote.regularMarketChangePercent,
        name: quote.shortName ?? quote.longName ?? targetSymbol,
      },
      history: history.map((item) => ({ date: item.date, close: item.close })),
    });
  } catch (error: unknown) {
    console.error('Yahoo Finance API Error:', error);

    if (symbol === '064400.KS') {
      try {
        const fallbackSymbol = '066570.KS';
        const quote = await yahooFinance.quote(fallbackSymbol) as YFQuote;
        const now = new Date();
        const past = new Date();
        past.setMonth(now.getMonth() - 1);
        const period1 = past.toISOString().split('T')[0] ?? '';
        const period2 = now.toISOString().split('T')[0] ?? '';
        let history: YFHistoryPoint[] = [];
        try {
          const fallbackChart = await yahooFinance.chart(fallbackSymbol, { period1, period2, interval: '1d' });
          history = ((fallbackChart.quotes ?? []) as YFHistoryPoint[]).filter((q) => q.close !== null);
        } catch (e) {
          console.error('Fallback History fetch error:', e);
        }
        return Response.json({
          symbol: '064400.KS',
          isFallback: true,
          quote: {
            price: quote.regularMarketPrice,
            change: quote.regularMarketChange,
            changePercent: quote.regularMarketChangePercent,
            name: 'LG CNS',
          },
          history: history.map((item) => ({ date: item.date, close: item.close })),
        });
      } catch (fallbackError: unknown) {
        const msg = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
        return Response.json({ error: msg }, { status: 500 });
      }
    }

    const msg = error instanceof Error ? error.message : String(error);
    return Response.json({ error: msg }, { status: 500 });
  }
}
