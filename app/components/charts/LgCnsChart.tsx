import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useStockQuery } from '@/hooks/use-stock-query';

export function LgCnsChart() {
  const { data: stockData, isLoading, isError } = useStockQuery('064400.KS', '1mo');

  const chartData = useMemo(() => {
    if (!stockData?.history) return [];
    return stockData.history.map((h) => ({
      name: h.date.split('T')[0],
      price: h.close,
    }));
  }, [stockData]);

  if (isLoading) {
    return (
      <div className="h-[260px] flex items-center justify-center">Loading...</div>
    );
  }

  if (isError || stockData === undefined) {
    return (
      <div className="h-[260px] flex items-center justify-center">
        Error loading data
      </div>
    );
  }

  const { quote } = stockData;
  const isUp = quote.change >= 0;

  return (
    <div>
      <div className="flex justify-between items-end mb-6">
        <div>
          <div className="text-[#94a3b8] text-[0.875rem] mb-1">
            Stock / LG CNS &bull; {quote.price?.toLocaleString()}{' '}
            {isUp ? '+' : ''}
            {quote.change?.toLocaleString()} ({isUp ? '+' : ''}
            {quote.changePercent?.toFixed(2)}%)
          </div>
          <div className="text-[1.75rem] font-bold flex items-center gap-2 text-[#f1f5f9]">
            {quote.price?.toLocaleString()}
            <span
              className="text-[1.125rem] flex items-center"
              style={{ color: isUp ? '#34d399' : '#ef4444' }}
            >
              {isUp ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}{' '}
              {isUp ? '+' : ''}
              {quote.changePercent?.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>
      <div className="w-full h-[250px] min-w-0">
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" hide />
            <YAxis hide domain={['dataMin - 1000', 'dataMax + 1000']} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '8px',
                color: '#fff',
              }}
            />
            <Line
              type="monotone"
              dataKey="price"
              name="LG CNS"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
