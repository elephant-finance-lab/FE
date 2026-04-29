import { useNavigate } from 'react-router-dom'
import BackButton from '../../components/BackButton'
import InfoCard from '../../components/InfoCard'
import StockChart from '../../components/StockChart'
import { appleLineData, sliceDataByPeriod } from '../../data/mockChartData'
import Button from '../../components/Button'

export default function RecommendDetailPage() {
  const navigate = useNavigate()
  const chartData = sliceDataByPeriod(appleLineData, '3달')

  return (
    <div className="screen pb-10 animate-fade-in-up">
      <div className="px-6 pt-[52px]">
        <BackButton />
      </div>

      <div className="screen-header pt-4 pb-2">
        <h1 className="section-title">종목 추천</h1>
        <p className="body-copy mt-2">
          사용자 성향 분석 결과
        </p>
        <div className="mt-3 inline-flex items-center gap-2 bg-toss-blue-light px-3 py-1.5 rounded-[10px]">
          <span className="text-[13px] leading-5 font-medium text-toss-blue">안정형 투자자</span>
          <span className="text-[12px] leading-5 text-gray-500">변동성 낮고 배당있는 종목</span>
        </div>
      </div>

      <div className="screen-px mt-4 mb-2">
        <StockChart type="area" lineData={chartData} height={200} />
      </div>

      <div className="screen-px space-y-4 mt-4">
        <InfoCard title="추천 이유">
          <p>해당 종목은 사용자의 투자 성향에 맞는 안정적인 배당 수익과 성장 가능성을 동시에 갖추고 있습니다.</p>
        </InfoCard>

        <InfoCard title="기업 정보 요약">
          <p>글로벌 시가총액 1위 기업으로, 안정적인 매출과 혁신적인 제품 라인업을 보유하고 있습니다.</p>
        </InfoCard>

        <InfoCard title="성장성 & 투자 포인트">
          <p>AI 및 서비스 부문 매출 성장세가 지속되고 있으며, 자사주 매입을 통한 주주 환원도 활발합니다.</p>
        </InfoCard>

        <InfoCard title="현재 가격 매력도">
          <p>PER 기준 과거 평균 대비 합리적인 수준이며, 기술적 지지선 근처에 위치하고 있습니다.</p>
        </InfoCard>

        <InfoCard title="리스크">
          <p>글로벌 경기 침체, 규제 리스크, 환율 변동 등이 주요 위험 요인입니다.</p>
        </InfoCard>
      </div>

      <div className="screen-px mt-8">
        <Button onClick={() => navigate('/trade/amount')}>
          매수하기
        </Button>
      </div>
    </div>
  )
}
