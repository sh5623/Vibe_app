'use client';

import React, { useMemo } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useStockQuery } from '@/hooks/useStockQuery';

export const LgCnsChart = () => {
    const { data: stockData, isLoading, isError } = useStockQuery('064400.KS', '1mo');

    const chartData = useMemo(() => {
        if (!stockData?.history) return [];
        return stockData.history.map((h: any) => ({
            name: h.date.split('T')[0],
            price: h.close
        }));
    }, [stockData]);

    if (isLoading) return <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
    if (isError || !stockData) return <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Error loading data</div>;

    const { quote } = stockData;
    const isUp = quote.change >= 0;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
                <div>
                    <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Stock / LG CNS • {quote.price?.toLocaleString()} {isUp ? '+' : ''}{quote.change?.toLocaleString()} ({isUp ? '+' : ''}{quote.changePercent?.toFixed(2)}%)</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f1f5f9' }}>
                        {quote.price?.toLocaleString()}
                        <span style={{ color: isUp ? '#34d399' : '#ef4444', fontSize: '1.125rem', display: 'flex', alignItems: 'center' }}>
                            {isUp ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />} {isUp ? '+' : ''}{quote.changePercent?.toFixed(2)}%
                        </span>
                    </div>
                </div>
            </div>
            <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer>
                    <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="name" hide />
                        <YAxis hide domain={['dataMin - 1000', 'dataMax + 1000']} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                border: '1px solid rgba(59, 130, 246, 0.3)',
                                borderRadius: '8px',
                                color: '#fff'
                            }}
                        />
                        <Line type="monotone" dataKey="price" name="LG CNS" stroke="#3b82f6" strokeWidth={2} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
