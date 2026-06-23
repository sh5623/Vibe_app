import { useQuery } from '@tanstack/react-query'

export interface Quote {
  price: number
  change: number
  changePercent: number
  name: string
}

export interface HistoryPoint {
  date: string
  close: number
}

export interface StockData {
  symbol: string
  isFallback?: boolean
  quote: Quote
  history: HistoryPoint[]
}

async function fetchStockData(symbol: string, range: string): Promise<StockData> {
  const res = await fetch(
    `/api/stock?symbol=${encodeURIComponent(symbol)}&range=${encodeURIComponent(range)}`
  )
  if (!res.ok) throw new Error('Failed to fetch stock data')
  return res.json() as Promise<StockData>
}

export function useStockQuery(symbol: string, range = '1mo') {
  return useQuery({
    queryKey: ['stock', symbol, range],
    queryFn: () => fetchStockData(symbol, range),
  })
}
