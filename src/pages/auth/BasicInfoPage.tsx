import { useForm, useWatch } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import Button from '../../components/Button'

const schema = z.object({
  name: z.string().min(2, '이름은 2자 이상 입력해주세요'),
  phone: z.string().regex(/^01[016789]-?\d{3,4}-?\d{4}$/, '올바른 전화번호를 입력해주세요'),
  account: z.string().min(8, '계좌번호는 8자리 이상이어야 합니다').regex(/^[\d-]+$/, '숫자와 하이픈만 입력 가능합니다'),
  gender: z.enum(['여성', '남성'], { error: '성별을 선택해주세요' }),
})

type FormData = z.infer<typeof schema>

export default function BasicInfoPage() {
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
  })

  const gender = useWatch({ control, name: 'gender' })

  const onSubmit = () => {
    navigate('/survey')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="screen flex flex-col px-6 pt-[72px] pb-10">
      <div className="flex-1 animate-fade-in-up">
        <h1 className="section-title mb-3">
          기본 정보를 입력해주세요
        </h1>
        <p className="body-copy mb-10">서비스 이용을 위해 필요한 정보입니다.</p>

        <div className="flex flex-col gap-6">
          <div>
            <label className="field-label">이름</label>
            <input
              {...register('name')}
              type="text"
              className={`field-input ${errors.name ? 'border-error' : ''}`}
              placeholder="이름을 입력하세요"
            />
            {errors.name && <p className="text-[12px] leading-4 text-error mt-2 ml-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="field-label">전화번호</label>
            <input
              {...register('phone')}
              type="tel"
              className={`field-input ${errors.phone ? 'border-error' : ''}`}
              placeholder="010-0000-0000"
            />
            {errors.phone && <p className="text-[12px] leading-4 text-error mt-2 ml-1">{errors.phone.message}</p>}
          </div>

          <div>
            <label className="field-label">계좌번호</label>
            <input
              {...register('account')}
              type="text"
              className={`field-input ${errors.account ? 'border-error' : ''}`}
              placeholder="계좌번호를 입력하세요"
            />
            {errors.account && <p className="text-[12px] leading-4 text-error mt-2 ml-1">{errors.account.message}</p>}
          </div>

          <div>
            <label className="field-label">성별</label>
            <div className="flex gap-3">
              {(['여성', '남성'] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setValue('gender', g, { shouldValidate: true })}
                  className={`flex flex-1 items-center justify-center gap-2 h-[52px] rounded-[14px] border transition-all ${
                    gender === g
                      ? 'border-toss-blue bg-toss-blue-light'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${gender === g ? 'border-toss-blue' : 'border-gray-300'}`}>
                    {gender === g && <span className="w-2.5 h-2.5 rounded-full bg-toss-blue" />}
                  </span>
                  <span className={`text-[15px] font-medium leading-6 ${gender === g ? 'text-toss-blue' : 'text-gray-700'}`}>{g}</span>
                </button>
              ))}
            </div>
            {errors.gender && <p className="text-[12px] leading-4 text-error mt-2 ml-1">{errors.gender.message}</p>}
          </div>
        </div>
      </div>

      <div className="pt-8">
        <Button type="submit" disabled={!isValid}>
          다음으로
        </Button>
      </div>
    </form>
  )
}
