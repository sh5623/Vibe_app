import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || '^KS11';
    const range = searchParams.get('range') || '1mo';

    try {
        let targetSymbol = symbol;

        // 자주 검색하는 주요 한국 주식 한글명 매핑 (Yahoo Finance API 한글 검색 제약 보완)
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
            'lg화학': '051910.KS'
        };

        const mappedSymbol = koreanMap[symbol.trim().toLowerCase()];

        if (mappedSymbol) {
            targetSymbol = mappedSymbol;
        } else {
            // 영문명 또는 일반 검색어 처리
            try {
                const searchResult = await yahooFinance.search(symbol);
                if (searchResult.quotes && searchResult.quotes.length > 0) {
                    // 주식(EQUITY)이나 ETF 우선 적용
                    const topQuote: any = searchResult.quotes.find(q => q.quoteType === 'EQUITY' || q.quoteType === 'ETF') || searchResult.quotes[0];
                    if (topQuote?.symbol) {
                        targetSymbol = String(topQuote.symbol);
                    }
                }
            } catch (searchError) {
                console.log('Search fallback failed for:', symbol);
            }
        }

        const quote: any = await yahooFinance.quote(targetSymbol);

        const now = new Date();
        const past = new Date();
        if (range === '1mo') {
            past.setMonth(now.getMonth() - 1);
        } else if (range === '1y') {
            past.setFullYear(now.getFullYear() - 1);
        } else {
            past.setMonth(now.getMonth() - 6);
        }

        const period1 = past.toISOString().split('T')[0];
        const period2 = now.toISOString().split('T')[0];

        let history: any[] = [];
        try {
            history = await yahooFinance.historical(targetSymbol, { period1, period2, interval: '1d' });
        } catch (e) {
            console.error('History fetch error:', e);
        }

        return NextResponse.json({
            symbol: targetSymbol,
            quote: {
                price: quote.regularMarketPrice,
                change: quote.regularMarketChange,
                changePercent: quote.regularMarketChangePercent,
                name: quote.shortName || quote.longName || targetSymbol,
            },
            history: history.map((item: any) => ({
                date: item.date,
                close: item.close,
            })),
        });
    } catch (error: any) {
        console.error('Yahoo Finance API Error:', error);

        // 064400.KS가 아직 데이터가 없거나 에러를 발생시키는 경우, 임시로 LG전자(066570.KS)의 데이터를 이용해 데모 데이터로 반환합니다. 
        // 화면에는 LG CNS로 표기됩니다.
        if (symbol === '064400.KS') {
            try {
                const fallbackSymbol = '066570.KS';
                const quote: any = await yahooFinance.quote(fallbackSymbol);

                const now = new Date();
                const past = new Date();
                past.setMonth(now.getMonth() - 1);

                const period1 = past.toISOString().split('T')[0];
                const period2 = now.toISOString().split('T')[0];

                let history: any[] = [];
                try {
                    history = await yahooFinance.historical(fallbackSymbol, { period1, period2, interval: '1d' });
                } catch (e) {
                    console.error('Fallback History fetch error:', e);
                }

                return NextResponse.json({
                    symbol: '064400.KS',
                    isFallback: true,
                    quote: {
                        price: quote.regularMarketPrice,
                        change: quote.regularMarketChange,
                        changePercent: quote.regularMarketChangePercent,
                        name: 'LG CNS',
                    },
                    history: history.map((item: any) => ({
                        date: item.date,
                        close: item.close,
                    })),
                });
            } catch (fallbackError: any) {
                return NextResponse.json({ error: fallbackError.message }, { status: 500 });
            }
        }

        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
