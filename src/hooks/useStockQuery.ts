import { useQuery } from '@tanstack/react-query';

interface Quote {
    price: number;
    change: number;
    changePercent: number;
    name: string;
}

interface HistoryPoint {
    date: string;
    close: number;
}

interface StockData {
    symbol: string;
    isFallback?: boolean;
    quote: Quote;
    history: HistoryPoint[];
}

const fetchStockData = async (symbol: string, range: string = '1mo'): Promise<StockData> => {
    const res = await fetch(`/api/stock?symbol=${encodeURIComponent(symbol)}&range=${encodeURIComponent(range)}`);
    if (!res.ok) {
        throw new Error('Failed to fetch stock data');
    }
    return res.json();
};

export const useStockQuery = (symbol: string, range: string = '1mo') => {
    return useQuery({
        queryKey: ['stock', symbol, range],
        queryFn: () => fetchStockData(symbol, range),
    });
};
