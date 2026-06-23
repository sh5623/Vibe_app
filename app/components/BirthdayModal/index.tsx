import { useState } from 'react'

interface BirthdayModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (birthday: string) => boolean
}

export function BirthdayModal({ isOpen, onClose, onConfirm }: BirthdayModalProps) {
  const [birthday, setBirthday] = useState('')
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleConfirm = () => {
    const isValid = onConfirm(birthday)
    if (!isValid) {
      setError('올바른 생년월일을 입력해 주세요.')
    } else {
      setError('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleConfirm()
  }

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: modal backdrop — click-to-close is established UX pattern
    <div
      role="presentation"
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[1000] p-5"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="relative bg-white rounded-[20px] p-10 w-full max-w-[320px] shadow-[0_10px_40px_rgba(0,0,0,0.1)] text-center overflow-hidden before:content-[''] before:absolute before:top-[10px] before:left-[10px] before:right-[10px] before:bottom-[10px] before:border before:border-[#e0d8c8] before:rounded-[12px] before:pointer-events-none"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <p
          className="text-[1.1rem] text-[#5d4037] mb-6"
          style={{ fontFamily: "'Gowun Dodum', sans-serif" }}
        >
          생년월일(6자리)을 입력하세요
        </p>
        <input
          type="text"
          placeholder="생년월일"
          maxLength={6}
          value={birthday}
          onChange={(e) => setBirthday(e.target.value.replace(/[^0-9]/g, ''))}
          onKeyDown={handleKeyDown}
          className="w-full py-3 px-3 text-[1.2rem] text-center border border-[#e0d8c8] rounded-lg mb-2 outline-none text-[#5d4037] focus:border-[#8c7b75] placeholder:text-[#c4b6b1]"
          style={{ fontFamily: "'Gowun Dodum', sans-serif" }}
        />
        <p
          className="text-[#e57373] text-[0.85rem] mb-4 min-h-[1.2em]"
          style={{ fontFamily: "'Gowun Dodum', sans-serif" }}
        >
          {error}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-3 border-none rounded-[25px] text-[1rem] cursor-pointer transition-all duration-200 bg-[#f5f5f5] text-[#8c7b75] hover:bg-[#eeeeee]"
            style={{ fontFamily: "'Gowun Dodum', sans-serif" }}
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 py-3 px-3 border-none rounded-[25px] text-[1rem] cursor-pointer transition-all duration-200 bg-[#8c7b75] text-white hover:bg-[#5d4037]"
            style={{ fontFamily: "'Gowun Dodum', sans-serif" }}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  )
}
