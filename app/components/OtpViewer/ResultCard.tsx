import { AnimatePresence, motion } from 'framer-motion'
import { Check, Copy, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import type { OtpSuccessResponse } from './index'

interface ResultCardProps {
  result: OtpSuccessResponse
  onReset: () => void
}

function formatKST(isoString: string): string {
  return new Date(isoString).toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

export function ResultCard({ result, onReset }: ResultCardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <h1 className="text-[1.5rem] font-bold text-white m-0 mb-2 tracking-[-0.02em]">인증번호</h1>
      <p className="text-[0.875rem] text-white/50 m-0 mb-9">최신 메일에서 추출한 인증번호입니다.</p>

      <motion.div
        className="text-[clamp(3rem,12vw,4.5rem)] font-extrabold text-white text-center tracking-[0.15em] my-7"
        style={{
          textShadow: '0 0 20px rgba(167,139,250,0.6), 0 0 40px rgba(167,139,250,0.3)',
          animation: 'codeGlow 2.5s ease-in-out infinite',
        }}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {result.code}
      </motion.div>

      <p className="text-[0.82rem] text-white/45 text-center m-0 mb-8">
        수신 {formatKST(result.receivedAt)}
      </p>

      <AnimatePresence mode="wait">
        <motion.button
          key={copied ? 'copied' : 'copy'}
          onClick={handleCopy}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileTap={{ scale: 0.97 }}
          className={`flex items-center justify-center gap-2 w-full py-[14px] border rounded-[12px] text-[0.9rem] font-medium cursor-pointer transition-[background,border-color,color] duration-200 mb-4 ${copied ? 'border-[rgba(74,222,128,0.5)] bg-[rgba(74,222,128,0.12)] text-[rgba(74,222,128,0.9)] hover:bg-[rgba(74,222,128,0.18)]' : 'border-white/[0.15] bg-white/[0.06] text-white/85 hover:bg-white/[0.1]'}`}
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? '복사됨' : '클립보드에 복사'}
        </motion.button>
      </AnimatePresence>

      <div className="h-px bg-white/[0.08] my-5" />

      <button
        type="button"
        onClick={onReset}
        aria-label="다시 조회"
        className="block w-full py-3 border-none bg-transparent text-white/40 text-[0.85rem] cursor-pointer transition-colors duration-200 hover:text-white/70"
      >
        <RefreshCw size={14} className="inline mr-1.5 align-middle" />
        다시 조회
      </button>
    </>
  )
}
