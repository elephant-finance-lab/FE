import type { ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'kakao' | 'naver' | 'google' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  fullWidth?: boolean
  size?: 'sm' | 'md' | 'lg'
  icon?: React.ReactNode
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-toss-blue text-white active:bg-toss-blue-dark shadow-[0_2px_8px_rgba(49,130,246,0.18)]',
  secondary: 'bg-gray-100 text-gray-700 active:bg-gray-200',
  outline: 'bg-white text-gray-700 border border-gray-300 active:bg-gray-50',
  kakao: 'bg-[#FEE500] text-[#191919] active:bg-[#E5CF00]',
  naver: 'bg-[#03C75A] text-white active:bg-[#02B150]',
  google: 'bg-white text-gray-800 border border-gray-200 active:bg-gray-50 shadow-sm',
  danger: 'bg-toss-red text-white active:bg-[#E0352B]',
}

const sizeStyles: Record<string, string> = {
  sm: 'h-10 px-4 text-[14px] rounded-[10px]',
  md: 'h-[54px] px-5 text-[16px] rounded-[15px]',
  lg: 'h-[56px] px-6 text-[16px] rounded-[15px]',
}

export default function Button({
  variant = 'primary',
  fullWidth = true,
  size = 'md',
  icon,
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`flex items-center justify-center gap-2.5 font-normal leading-6 transition-all duration-150 ${variantStyles[variant]} ${sizeStyles[size]} ${fullWidth ? 'w-full' : ''} disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none ${className}`}
      {...props}
    >
      {icon && <span className="flex shrink-0">{icon}</span>}
      {children}
    </button>
  )
}
