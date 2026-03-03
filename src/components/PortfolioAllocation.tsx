'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const data1 = [
    { name: 'Global Equities', value: 85 },
    { name: 'Other', value: 15 },
];
const data2 = [
    { name: 'Fixed Income', value: 25 },
    { name: 'Other', value: 75 },
];
const data3 = [
    { name: 'Alternative', value: 10 },
    { name: 'Other', value: 90 },
];

const COLORS = ['#3b82f6', '#34d399']; // Blue, Green
const BG_COLOR = 'rgba(255, 255, 255, 0.05)';

const Donut = ({ data, label, subLabel }: { data: any[], label: string, subLabel: string }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: 140, height: 140 }}>
                <ResponsiveContainer>
                    <PieChart>
                        {/* Outer ring */}
                        <Pie
                            data={data}
                            innerRadius={45}
                            outerRadius={65}
                            paddingAngle={2}
                            dataKey="value"
                            stroke="none"
                            startAngle={90}
                            endAngle={-270}
                        >
                            <Cell fill={COLORS[0]} />
                            <Cell fill={BG_COLOR} />
                        </Pie>
                        {/* Inner ring to give the effect */}
                        <Pie
                            data={data}
                            innerRadius={25}
                            outerRadius={40}
                            paddingAngle={2}
                            dataKey="value"
                            stroke="none"
                            startAngle={90}
                            endAngle={-270}
                        >
                            <Cell fill={COLORS[1]} />
                            <Cell fill={BG_COLOR} />
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                border: '1px solid rgba(59, 130, 246, 0.3)',
                                borderRadius: '8px',
                                color: '#fff'
                            }}
                            itemStyle={{ color: '#fff' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <div style={{ fontSize: '0.875rem', color: '#f1f5f9', fontWeight: 500 }}>{label}</div>
                <div style={{ fontSize: '0.75rem', color: '#34d399', marginTop: '0.25rem' }}>{subLabel}</div>
            </div>
        </div>
    );
};

export const PortfolioAllocation = () => {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '1rem 0' }}>
            <Donut data={data1} label="Global Equities" subLabel="(85%)" />
            <Donut data={data2} label="Fixed Income" subLabel="(25%)" />
            <Donut data={data3} label="Alternative Investments" subLabel="(10%)" />
        </div>
    );
};
