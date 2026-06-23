import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { LoginForm } from './LoginForm'
import { ResultCard } from './ResultCard'

export type OtpErrorCode = 'INVALID_CREDENTIALS' | 'NO_MAIL_FOUND' | 'PARSE_FAILED'

export interface OtpSuccessResponse {
  code: string
  receivedAt: string
}

function useOtpViewer() {
  const [result, setResult] = useState<OtpSuccessResponse | null>(null)
  const [error, setError] = useState<OtpErrorCode | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const verify = async (email: string, pin: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, pin }),
      })
      const data = (await res.json()) as OtpSuccessResponse | { error: OtpErrorCode }
      if (!res.ok) {
        setError((data as { error: OtpErrorCode }).error)
      } else {
        setResult(data as OtpSuccessResponse)
      }
    } catch {
      setError('PARSE_FAILED')
    } finally {
      setIsLoading(false)
    }
  }

  const reset = () => {
    setResult(null)
    setError(null)
  }

  return { result, error, isLoading, verify, reset }
}

export function OtpViewer() {
  const { result, error, isLoading, verify, reset } = useOtpViewer()

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-6 bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden before:content-[''] before:absolute before:w-[400px] before:h-[400px] before:bg-[#6c63ff] before:rounded-full before:blur-[80px] before:opacity-25 before:pointer-events-none before:-top-[100px] before:-left-[100px] after:content-[''] after:absolute after:w-[300px] after:h-[300px] after:bg-[#a78bfa] after:rounded-full after:blur-[80px] after:opacity-25 after:pointer-events-none after:-bottom-[80px] after:-right-[80px]">
      <motion.div
        className="w-full max-w-[420px] px-10 py-12 rounded-[24px] bg-white/[0.07] backdrop-blur-xl border border-white/[0.14] shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] relative z-[1] max-[768px]:px-6 max-[768px]:py-9"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <AnimatePresence mode="wait">
          {result !== null ? (
            <ResultCard key="result" result={result} onReset={reset} />
          ) : (
            <LoginForm key="login" onSubmit={verify} isLoading={isLoading} error={error} />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
