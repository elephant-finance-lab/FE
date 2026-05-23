import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { updateUserProfile } from '../../apis/auth'
import BackButton from '../../components/BackButton'
import Button from '../../components/Button'
import { useAuth } from '../../contexts/useAuth'

const schema = z.object({
  name: z.string().trim().min(2, '이름은 2자 이상 입력해주세요').max(100, '이름은 100자 이하여야 합니다'),
  phone: z.string().regex(/^01[016789]-?\d{3,4}-?\d{4}$/, '올바른 전화번호를 입력해주세요'),
})

type FormData = z.infer<typeof schema>

function formatPhone(phone: string | null | undefined) {
  const digits = (phone ?? '').replace(/\D/g, '')

  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
  }

  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
  }

  return phone ?? ''
}

export default function EditProfilePage() {
  const navigate = useNavigate()
  const { checkAuth, user } = useAuth()
  const [submitError, setSubmitError] = useState('')
  const {
    register,
    handleSubmit,
    reset,
    trigger,
    formState: { errors, isSubmitting, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      name: user?.profile?.name ?? '',
      phone: formatPhone(user?.profile?.phone),
    },
  })

  useEffect(() => {
    reset({
      name: user?.profile?.name ?? '',
      phone: formatPhone(user?.profile?.phone),
    })
    void trigger()
  }, [reset, trigger, user?.profile?.name, user?.profile?.phone])

  const onSubmit = async (data: FormData) => {
    try {
      setSubmitError('')
      await updateUserProfile({
        name: data.name.trim(),
        phone: data.phone,
      })
      await checkAuth()
      navigate('/mypage', { replace: true })
    } catch {
      setSubmitError('회원 정보를 수정하지 못했어요. 다시 시도해주세요.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="screen flex flex-col pb-10">
      <div className="px-6 pt-[52px]">
        <BackButton />
      </div>

      <div className="px-[26px] pt-[37px] flex-1">
        <h1 className="text-[25px] font-semibold leading-[1.2] text-gray-900 mb-9">
          회원 정보를 입력해주세요
        </h1>

        <div className="flex flex-col gap-[28px]">
          <div className="flex flex-col gap-[7px]">
            <label className="text-[15px] font-light leading-[1.2] text-gray-900">이름</label>
            <input
              {...register('name')}
              type="text"
              className={`w-full h-[56px] px-5 rounded-[14px] bg-gray-100/60 text-[17px] leading-6 text-gray-900 placeholder:text-gray-400 outline-none focus:bg-gray-100 ${errors.name ? 'border border-error' : ''}`}
              placeholder="이름"
            />
            {errors.name && <p className="text-[12px] leading-4 text-error mt-1 ml-1">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col gap-[7px]">
            <label className="text-[15px] font-light leading-[1.2] text-gray-900">전화번호</label>
            <input
              {...register('phone')}
              type="tel"
              className={`w-full h-[56px] px-5 rounded-[14px] bg-gray-100/60 text-[17px] leading-6 text-gray-900 placeholder:text-gray-400 outline-none focus:bg-gray-100 ${errors.phone ? 'border border-error' : ''}`}
              placeholder="010-0000-0000"
            />
            {errors.phone && <p className="text-[12px] leading-4 text-error mt-1 ml-1">{errors.phone.message}</p>}
          </div>
        </div>
      </div>

      <div className="px-[26px] pt-8">
        {submitError && <p className="mb-3 text-center text-[13px] leading-5 text-error">{submitError}</p>}
        <Button type="submit" disabled={!isValid || isSubmitting}>
          {isSubmitting ? '수정 중' : '수정 완료'}
        </Button>
      </div>
    </form>
  )
}
