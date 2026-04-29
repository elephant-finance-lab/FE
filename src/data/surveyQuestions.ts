export interface SurveyQuestion {
  id: number
  question: string
  options: string[]
  multiSelect?: boolean
}

export const surveyQuestions: SurveyQuestion[] = [
  {
    id: 1,
    question: '투자 금액이 단기간에 손실이 난다면\n어떻게 하시겠습니까?',
    options: ['바로 매도하고 손실을 줄인다', '상황을 지켜본다', '추가 매수 기회로 본다'],
  },
  {
    id: 2,
    question: '하루에 10% 손실이 발생한다면\n어떻게 하시겠습니까?',
    options: ['불안하지만 정리한다', '불안하지만 유지한다', '오히려 기회라고 생각한다'],
  },
  {
    id: 3,
    question: '투자에서 더 중요한 것은\n뭐라고 생각하시나요?',
    options: ['원금 보존', '안정적인 수익', '높은 수익 가능성'],
  },
  {
    id: 4,
    question: '투자 기간은 어느 정도를 생각하시나요?',
    options: ['1개월 이내', '2~6개월', '6개월 이상'],
  },
  {
    id: 5,
    question: '투자 목적은 무엇인가요?',
    options: ['용돈', '자산 증식', '큰 수익 추구'],
  },
  {
    id: 6,
    question: '관심 있는 투자 스타일은 무엇인가요?',
    options: ['안정적인 대형주', '성장 가능성 있는 기업', '변동성이 큰 종목'],
  },
  {
    id: 7,
    question: '관심 산업군을 선택해주세요\n(복수 선택 가능)',
    options: ['IT/AI', '바이오', '엔터', '반도체', '금융', '소비재', '2차 전지', '기타'],
    multiSelect: true,
  },
  {
    id: 8,
    question: '투자 금액 기준으로,\n어느 정도 손실까지 감수할 수 있나요?',
    options: ['5% 이하', '5~10%', '10~20%', '20% 이상'],
  },
]
