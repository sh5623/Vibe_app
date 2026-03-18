'use client';

import React, { useMemo } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { useStockQuery } from '@/hooks/useStockQuery';

export const KospiChart = () => {
    const { data: stockData, isLoading, isError } = useStockQuery('^KS11', '6mo');

    const chartData = useMemo(() => {
        if (!stockData?.history) return [];
        return stockData.history.map((h: any) => {
            const d = new Date(h.date);
            return {
                name: `${d.getMonth() + 1}/${d.getDate()}`,
                value: Math.round(h.close)
            };
        });
    }, [stockData]);

    if (isLoading) return <div style={{ width: '100%', height: 450, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading KOSPI Chart...</div>;

    // To prevent domain errors if data is empty
    if (isError || chartData.length === 0) return <div style={{ width: '100%', height: 450, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No KOSPI data available</div>;

    return (
        <div style={{ width: '100%', height: 450, minWidth: 0 }}>
            <ResponsiveContainer width="100%" height={450}>
                <AreaChart
                    data={chartData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#34d399" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis
                        dataKey="name"
                        stroke="#94a3b8"
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        dy={10}
                    />
                    <YAxis
                        stroke="#94a3b8"
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        dx={-10}
                        domain={['dataMin - 100', 'dataMax + 100']}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'rgba(15, 23, 42, 0.9)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            borderRadius: '8px',
                            color: '#fff'
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey="value"
                        name="KOSPI"
                        stroke="#34d399"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorValue)"
                        activeDot={{ r: 8, fill: '#34d399', stroke: '#fff', strokeWidth: 2 }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};
