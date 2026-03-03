'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, ArrowDownRight, TrendingUp, ArrowLeft, DollarSign, Activity, Maximize2, MoreHorizontal, Search } from 'lucide-react';
import { Container, Header, Highlight, Grid, Card } from './styled';
import { KospiChart } from '../../components/KospiChart';
import { LgCnsChart } from '../../components/LgCnsChart';
import { SearchableStockChart } from '../../components/SearchableStockChart';
import { useStockQuery } from '@/hooks/useStockQuery';

export default function StockDashboard() {
    const router = useRouter();
    const { data: kospiData } = useStockQuery('^KS11', '1mo');

    const [searchSymbol, setSearchSymbol] = useState('');
    const [inputValue, setInputValue] = useState('');

    const kospiChangePercent = kospiData?.quote?.changePercent || 0;
    const isUp = kospiChangePercent >= 0;
    const changePercentStr = `${isUp ? '+' : ''}${kospiChangePercent.toFixed(2)}%`;
    const kospiPrice = kospiData?.quote?.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || 'Loading...';

    return (
        <Container>
            <Header>
                <div>
                    <h1>STOCK MARKET</h1>
                    <div className="subtitle">2026 Investment Guide</div>
                    <Highlight>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <span className="percent" style={{ color: '#60a5fa', textShadow: '0 0 30px rgba(96, 165, 250, 0.4)' }}>
                                KOSPI : {kospiPrice}
                            </span>
                            <span className="percent" style={{ color: isUp ? '#34d399' : '#ef4444', textShadow: isUp ? '0 0 30px rgba(52, 211, 153, 0.5)' : '0 0 30px rgba(239, 68, 68, 0.5)' }}>
                                ({changePercentStr}) {isUp ? <ArrowUpRight strokeWidth={4} color="#34d399" /> : <ArrowDownRight strokeWidth={4} color="#ef4444" />}
                            </span>
                        </div>
                    </Highlight>
                </div>
                <button className="return-btn" onClick={() => router.push('/')}>
                    <ArrowLeft size={18} /> 돌아가기
                </button>
            </Header>

            <Grid>
                {/* Left Column: Main Chart (Prowith/Indices) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <Card style={{ flex: 1, padding: '2rem' }}>
                        <h2 style={{ marginBottom: '2.5rem' }}>
                            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 10px #34d399' }}></span>
                                    <span style={{ color: '#f1f5f9', fontWeight: 500 }}>KOSPI</span>
                                </div>
                            </div>
                        </h2>
                        <KospiChart />
                    </Card>
                </div>

                {/* Right Column: Mini Charts */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <Card style={{ padding: '1.5rem' }}>
                        <h2 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                            <span style={{ fontSize: '1.25rem' }}>LG 씨엔에스</span>
                            <div style={{ display: 'flex', gap: '1rem', color: '#94a3b8' }}>
                                <Activity size={20} style={{ cursor: 'pointer' }} />
                                <Maximize2 size={18} style={{ cursor: 'pointer' }} />
                                <MoreHorizontal size={20} style={{ cursor: 'pointer' }} />
                            </div>
                        </h2>
                        <LgCnsChart />
                    </Card>

                    <Card style={{ padding: '1.5rem', flex: 1 }}>
                        <h2 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <form className="search-form" onSubmit={(e) => { e.preventDefault(); setSearchSymbol(inputValue); }} style={{ margin: 0, flex: 1, width: '100%', maxWidth: '300px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', padding: '0.25rem 0.5rem', width: '100%' }}>
                                    <Search size={16} color="#94a3b8" />
                                    <input
                                        type="text"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        placeholder="종목명을 입력해 주세요."
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: '#f1f5f9',
                                            fontSize: '1rem',
                                            outline: 'none',
                                            flex: 1,
                                            minWidth: 0
                                        }}
                                    />
                                    <button type="submit" style={{
                                        background: '#3b82f6',
                                        color: '#fff',
                                        border: 'none',
                                        padding: '0.4rem 0.8rem',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                        fontSize: '0.875rem'
                                    }}>
                                        검색
                                    </button>
                                </div>
                            </form>
                            <div style={{ display: 'flex', gap: '1rem', color: '#94a3b8' }}>
                                <TrendingUp size={20} style={{ cursor: 'pointer' }} />
                                <Maximize2 size={18} style={{ cursor: 'pointer' }} />
                                <MoreHorizontal size={20} style={{ cursor: 'pointer' }} />
                            </div>
                        </h2>
                        {searchSymbol ? (
                            <SearchableStockChart symbol={searchSymbol} />
                        ) : (
                            <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                                검색창에 종목명을 입력하여 차트를 확인해보세요.
                            </div>
                        )}
                    </Card>
                </div>
            </Grid>
        </Container>
    );
}
