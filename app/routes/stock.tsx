import {
  Activity,
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  Maximize2,
  MoreHorizontal,
  Search,
  TrendingUp,
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { KospiChart } from '@/components/charts/KospiChart'
import { LgCnsChart } from '@/components/charts/LgCnsChart'
import { SearchableStockChart } from '@/components/charts/SearchableStockChart'
import { useStockQuery } from '@/hooks/use-stock-query'
import type { Route } from './+types/stock'

export function meta(_: Route.MetaArgs) {
  return [{ title: 'Stock Dashboard | Vibe' }]
}

export default function StockDashboard() {
  const navigate = useNavigate()
  const { data: kospiData } = useStockQuery('^KS11', '1mo')

  const [searchSymbol, setSearchSymbol] = useState('')
  const [inputValue, setInputValue] = useState('')

  const kospiChangePercent = kospiData?.quote?.changePercent ?? 0
  const isUp = kospiChangePercent >= 0
  const changePercentStr = `${isUp ? '+' : ''}${kospiChangePercent.toFixed(2)}%`
  const kospiPrice =
    kospiData?.quote?.price?.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) ?? 'Loading...'

  return (
    <div className="min-h-screen bg-[#0b1120] text-white p-8 font-[Inter,system-ui,sans-serif] flex flex-col gap-8 max-[768px]:p-4">
      {/* Header */}
      <header className="flex justify-between items-start max-[768px]:flex-col max-[768px]:gap-6">
        <div>
          <h1 className="text-[4rem] font-extrabold m-0 tracking-[-0.02em] leading-[1.1] max-[768px]:text-[2.5rem]">
            STOCK MARKET
          </h1>
          <div className="text-[#f1f5f9] text-[2rem] font-semibold mt-2 max-[768px]:text-[1.5rem]">
            2026 Investment Guide
          </div>
          <div className="flex items-center gap-4 mt-6">
            <div className="flex flex-col gap-2">
              <span
                className="text-[5rem] font-extrabold leading-[1] max-[768px]:text-[2.25rem]"
                style={{ color: '#60a5fa', textShadow: '0 0 30px rgba(96,165,250,0.4)' }}
              >
                KOSPI : {kospiPrice}
              </span>
              <span
                className="text-[5rem] font-extrabold leading-[1] flex items-center max-[768px]:text-[2.25rem]"
                style={{
                  color: isUp ? '#34d399' : '#ef4444',
                  textShadow: isUp
                    ? '0 0 30px rgba(52,211,153,0.5)'
                    : '0 0 30px rgba(239,68,68,0.5)',
                }}
              >
                ({changePercentStr}){' '}
                {isUp ? (
                  <ArrowUpRight strokeWidth={4} color="#34d399" />
                ) : (
                  <ArrowDownRight strokeWidth={4} color="#ef4444" />
                )}
              </span>
            </div>
          </div>
        </div>
        <button
          type="button"
          className="bg-white/10 border border-white/20 text-white py-3 px-6 rounded-full cursor-pointer flex items-center gap-2 transition-all duration-200 backdrop-blur-[10px] hover:bg-white/20 hover:-translate-y-0.5"
          onClick={() => void navigate('/')}
        >
          <ArrowLeft size={18} /> 돌아가기
        </button>
      </header>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[2fr_1.2fr]">
        {/* Left: KOSPI */}
        <div className="flex flex-col gap-8">
          <div className="bg-[rgba(15,23,42,0.6)] border border-[rgba(59,130,246,0.3)] rounded-[1rem] p-8 backdrop-blur-[12px] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)]">
            <h2 className="text-[1.25rem] font-semibold mt-0 mb-10 text-[#f1f5f9] flex justify-between items-center max-[768px]:flex-col max-[768px]:items-start max-[768px]:gap-4">
              <div className="flex items-center gap-2">
                <span className="w-[10px] h-[10px] rounded-full bg-[#34d399] shadow-[0_0_10px_#34d399] inline-block" />
                <span className="text-[#f1f5f9] font-medium">KOSPI</span>
              </div>
            </h2>
            <KospiChart />
          </div>
        </div>

        {/* Right: LG CNS + Search */}
        <div className="flex flex-col gap-8">
          <div className="bg-[rgba(15,23,42,0.6)] border border-[rgba(59,130,246,0.3)] rounded-[1rem] p-6 backdrop-blur-[12px] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)]">
            <h2 className="text-[1.25rem] font-semibold mt-0 mb-6 text-[#f1f5f9] flex justify-between items-center border-b border-white/10 pb-4 max-[768px]:flex-col max-[768px]:items-start max-[768px]:gap-4">
              <span>LG 씨엔에스</span>
              <div className="flex gap-4 text-[#94a3b8]">
                <Activity size={20} className="cursor-pointer" />
                <Maximize2 size={18} className="cursor-pointer" />
                <MoreHorizontal size={20} className="cursor-pointer" />
              </div>
            </h2>
            <LgCnsChart />
          </div>

          <div className="flex-1 bg-[rgba(15,23,42,0.6)] border border-[rgba(59,130,246,0.3)] rounded-[1rem] p-6 backdrop-blur-[12px] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)]">
            <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-6 max-[768px]:flex-col max-[768px]:items-start max-[768px]:gap-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  setSearchSymbol(inputValue)
                }}
                className="flex-1 w-full max-w-[320px]"
              >
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-[8px] py-1 px-2 w-full">
                  <Search size={16} color="#94a3b8" />
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="종목명이나 코드를 입력해 주세요."
                    className="bg-transparent border-none text-[#f1f5f9] text-[1rem] outline-none flex-1 min-w-0 placeholder:text-[#94a3b8]"
                  />
                  <button
                    type="submit"
                    className="bg-[#3b82f6] text-white border-none py-[0.4rem] px-3 rounded-[6px] cursor-pointer font-semibold text-[0.875rem]"
                  >
                    검색
                  </button>
                </div>
              </form>
              <div className="flex gap-4 text-[#94a3b8]">
                <TrendingUp size={20} className="cursor-pointer" />
                <Maximize2 size={18} className="cursor-pointer" />
                <MoreHorizontal size={20} className="cursor-pointer" />
              </div>
            </div>
            {searchSymbol !== '' ? (
              <SearchableStockChart symbol={searchSymbol} />
            ) : (
              <div className="h-[260px] flex items-center justify-center text-[#94a3b8] text-center">
                검색창에 종목명이나 종목코드(6자리)를 입력하여 차트를 확인해보세요.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
