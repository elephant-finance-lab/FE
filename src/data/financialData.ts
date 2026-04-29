export interface FinancialRow {
  label: string
  values: (string | null)[]
}

export interface FinancialTable {
  years: string[]
  rows: FinancialRow[]
}

export const incomeStatement: FinancialTable = {
  years: ['2022', '2023', '2024'],
  rows: [
    { label: '매출액', values: ['394,328', '383,285', '391,035'] },
    { label: '매출원가', values: ['223,546', '214,137', '210,352'] },
    { label: '매출총이익', values: ['170,782', '169,148', '180,683'] },
    { label: '판관비', values: ['51,334', '54,847', '56,165'] },
    { label: '영업이익', values: ['119,437', '114,301', '124,518'] },
    { label: '영업이익률', values: ['30.3%', '29.8%', '31.8%'] },
    { label: '당기순이익', values: ['99,803', '96,995', '105,623'] },
    { label: '순이익률', values: ['25.3%', '25.3%', '27.0%'] },
  ],
}

export const balanceSheet: FinancialTable = {
  years: ['2022', '2023', '2024'],
  rows: [
    { label: '총자산', values: ['352,755', '352,583', '364,980'] },
    { label: '유동자산', values: ['135,405', '143,566', '152,987'] },
    { label: '비유동자산', values: ['217,350', '209,017', '211,993'] },
    { label: '총부채', values: ['302,083', '290,437', '277,854'] },
    { label: '유동부채', values: ['153,982', '145,308', '143,682'] },
    { label: '비유동부채', values: ['148,101', '145,129', '134,172'] },
    { label: '자본총계', values: ['50,672', '62,146', '87,126'] },
    { label: '부채비율', values: ['596.2%', '467.4%', '318.9%'] },
  ],
}

export const cashFlow: FinancialTable = {
  years: ['2022', '2023', '2024'],
  rows: [
    { label: '영업활동', values: ['122,151', '110,543', '118,254'] },
    { label: '투자활동', values: ['-22,354', '-7,077', '-15,234'] },
    { label: '재무활동', values: ['-110,749', '-108,488', '-105,876'] },
    { label: '현금증감', values: ['-10,952', '-5,022', '-2,856'] },
    { label: 'FCF', values: ['111,443', '99,584', '108,807'] },
    { label: 'CAPEX', values: ['10,708', '10,959', '9,447'] },
  ],
}
