import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BackButton from '../../components/BackButton'
import Button from '../../components/Button'

export default function EditProfilePage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '김이박', phone: '010-1234-5678' })

  const handleSubmit = () => {
    navigate('/mypage')
  }

  return (
    <div className="screen flex flex-col pb-10">
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
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full h-[56px] px-5 rounded-[14px] bg-gray-100/60 text-[17px] leading-6 text-gray-900 placeholder:text-gray-400 outline-none focus:bg-gray-100"
              placeholder="이름"
            />
          </div>

          <div className="flex flex-col gap-[7px]">
            <label className="text-[15px] font-light leading-[1.2] text-gray-900">전화번호</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full h-[56px] px-5 rounded-[14px] bg-gray-100/60 text-[17px] leading-6 text-gray-900 placeholder:text-gray-400 outline-none focus:bg-gray-100"
              placeholder="010-0000-0000"
            />
          </div>
        </div>
      </div>

      <div className="px-[26px] pt-8">
        <Button onClick={handleSubmit}>수정 완료</Button>
      </div>
    </div>
  )
}
