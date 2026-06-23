import { AnimatePresence, motion } from 'framer-motion'
import { Lock } from 'lucide-react'
import { useRef, useState } from 'react'
import type { OtpErrorCode } from './index'

interface LoginFormProps {
  onSubmit: (email: string, pin: string) => Promise<void>
  isLoading: boolean
  error: OtpErrorCode | null
}

const ERROR_MESSAGE: Record<OtpErrorCode, string> = {
  INVALID_CREDENTIALS: '이메일 또는 PIN이 올바르지 않습니다.',
  NO_MAIL_FOUND: '조건에 맞는 메일을 찾을 수 없습니다.',
  PARSE_FAILED: '메일에서 인증번호를 찾지 못했습니다.',
}

const shakeVariants = {
  shake: {
    x: [0, -8, 8, -8, 8, -4, 4, 0],
    transition: { duration: 0.4 },
  },
  rest: { x: 0 },
}

export function LoginForm({ onSubmit, isLoading, error }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [pin, setPin] = useState(['', '', '', ''])
  const pinRef0 = useRef<HTMLInputElement>(null)
  const pinRef1 = useRef<HTMLInputElement>(null)
  const pinRef2 = useRef<HTMLInputElement>(null)
  const pinRef3 = useRef<HTMLInputElement>(null)
  const pinRefs = [pinRef0, pinRef1, pinRef2, pinRef3]

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return
    const next = [...pin]
    next[index] = value
    setPin(next)
    if (value && index < 3) {
      pinRefs[index + 1]?.current?.focus()
    }
  }

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      pinRefs[index - 1]?.current?.focus()
    }
  }

  const handlePinPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4)
    if (!text) return
    e.preventDefault()
    const next: string[] = ['', '', '', '']
    text.split('').forEach((ch, i) => {
      if (i < 4) next[i] = ch
    })
    setPin(next)
    const focusIdx = Math.min(text.length, 3)
    pinRefs[focusIdx]?.current?.focus()
  }

  const handleSubmit = async () => {
    const pinString = pin.join('')
    if (!email || pinString.length < 4) return
    await onSubmit(email, pinString)
  }

  const isFormValid = email.length > 0 && pin.every((d) => d !== '')
  const hasError = error === 'INVALID_CREDENTIALS'

  const inputBase =
    'w-full py-[14px] px-4 bg-white/[0.06] border rounded-[12px] text-white text-[0.95rem] outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-white/25'
  const inputNormal =
    'border-white/[0.12] focus:border-[rgba(167,139,250,0.7)] focus:shadow-[0_0_0_3px_rgba(167,139,250,0.15)]'
  const inputError =
    'border-[rgba(248,113,113,0.7)] focus:border-[rgba(248,113,113,0.9)] focus:shadow-[0_0_0_3px_rgba(248,113,113,0.15)]'

  return (
    <>
      <div className="w-12 h-12 rounded-[14px] bg-[rgba(108,99,255,0.2)] border border-[rgba(108,99,255,0.3)] flex items-center justify-center mb-5 text-[#a78bfa]">
        <Lock size={22} />
      </div>

      <h1 className="text-[1.5rem] font-bold text-white m-0 mb-2 tracking-[-0.02em]">OTP 뷰어</h1>
      <p className="text-[0.875rem] text-white/50 m-0 mb-9">
        이메일과 PIN을 입력하여 인증번호를 조회합니다.
      </p>

      <div className="mb-5">
        <label
          htmlFor="otp-email"
          className="block text-[0.75rem] font-medium text-white/55 tracking-[0.08em] uppercase mb-2"
        >
          이메일
        </label>
        <motion.div variants={shakeVariants} animate={hasError ? 'shake' : 'rest'}>
          <input
            id="otp-email"
            type="email"
            placeholder="your@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            disabled={isLoading}
            className={`${inputBase} ${hasError ? inputError : inputNormal} box-border`}
          />
        </motion.div>
      </div>

      <div className="mb-5">
        <label
          htmlFor="pin-0"
          className="block text-[0.75rem] font-medium text-white/55 tracking-[0.08em] uppercase mb-2"
        >
          PIN 4자리
        </label>
        <motion.div variants={shakeVariants} animate={hasError ? 'shake' : 'rest'}>
          <div className="flex gap-[10px]" onPaste={handlePinPaste}>
            {pin.map((digit, i) => {
              return (
                <input
                  // biome-ignore lint/suspicious/noArrayIndexKey: PIN slots fixed-length (always 4), index IS identity
                  key={i}
                  id={i === 0 ? 'pin-0' : undefined}
                  ref={pinRefs[i]}
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(i, e.target.value.slice(-1))}
                  onKeyDown={(e) => handlePinKeyDown(i, e)}
                  disabled={isLoading}
                  aria-label={`PIN ${i + 1}번째 자리`}
                  className={`flex-1 min-w-0 box-border py-[14px] px-0 bg-white/[0.06] border rounded-[12px] text-white text-[1.4rem] font-semibold text-center outline-none transition-[border-color,box-shadow] duration-200 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${hasError ? 'border-[rgba(248,113,113,0.7)] focus:border-[rgba(248,113,113,0.9)] focus:shadow-[0_0_0_3px_rgba(248,113,113,0.15)]' : 'border-white/[0.12] focus:border-[rgba(167,139,250,0.7)] focus:shadow-[0_0_0_3px_rgba(167,139,250,0.15)]'}`}
                />
              )
            })}
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {error !== null && (
          <motion.p
            className="text-[0.8rem] text-[rgba(248,113,113,0.9)] mt-2 m-0"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
          >
            {ERROR_MESSAGE[error]}
          </motion.p>
        )}
      </AnimatePresence>

      <motion.button
        onClick={handleSubmit}
        disabled={!isFormValid || isLoading}
        whileTap={{ scale: isLoading ? 1 : 0.97 }}
        className={`w-full py-4 mt-2 border-none rounded-[12px] text-[0.95rem] font-semibold text-white tracking-[0.02em] transition-opacity duration-200 ${isLoading ? 'cursor-not-allowed bg-gradient-to-r from-[#4c3b99] via-[#6c63ff] to-[#a78bfa] animate-pulse' : 'cursor-pointer bg-gradient-to-br from-[#6c63ff] to-[#a78bfa] hover:opacity-90'}`}
      >
        {isLoading ? '조회 중...' : '인증번호 조회'}
      </motion.button>
    </>
  )
}
