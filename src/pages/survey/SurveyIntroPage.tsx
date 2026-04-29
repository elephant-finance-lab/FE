import { useNavigate } from 'react-router-dom'
import Button from '../../components/Button'

export default function SurveyIntroPage() {
  const navigate = useNavigate()

  return (
    <div className="screen flex flex-col px-6 pt-[120px] pb-10">
      <div className="flex-1 text-center">
        <h1 className="section-title">선호도 조사</h1>
        <p className="body-copy mt-3">
          맞춤형 종목 추천을 위해 몇 가지 질문에 답해주세요.
        </p>
      </div>

      <div className="flex flex-col gap-3 pt-8">
        <Button onClick={() => navigate('/survey/1')}>시작하기</Button>
        <Button variant="secondary" onClick={() => navigate('/chart')}>건너뛰기</Button>
      </div>
    </div>
  )
}
