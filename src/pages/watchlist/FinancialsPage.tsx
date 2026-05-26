import { useEffect, useRef, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import {
  getStockFinancial,
  type StockFinancial,
  type StockFinancialPeriod,
  type StockFinancialStatement,
} from '../../apis/stocks'
import BackButton from '../../components/BackButton'

const financialTabs: { label: string; value: StockFinancialStatement }[] = [
  { label: '손익계산서', value: 'INCOME' },
  { label: '재무상태표', value: 'BALANCE' },
  { label: '재무비율', value: 'RATIO' },
]
const financialPeriods: { label: string; value: StockFinancialPeriod }[] = [
  { label: '분기', value: 'QUARTER' },
  { label: '연간', value: 'YEAR' },
]
const hiddenFinancialRows: Record<StockFinancialStatement, Set<string>> = {
  INCOME: new Set([
    '감가상각비',
    '판매 및 관리비',
    '영업 외 수익',
    '영업 외 비용',
    '특별 이익',
    '특별 손실',
  ]),
  BALANCE: new Set(['자본 잉여금', '이익 잉여금']),
  RATIO: new Set(),
}

function mayLackCorporateFinancials(name: string) {
  return /(KODEX|TIGER|RISE|KBSTAR|KOSEF|HANARO|ACE|ARIRANG|SOL |PLUS |TIMEFOLIO|ETF|ETN|인버스|레버리지|선물)/i.test(
    name,
  )
}

function formatFinancialCell(value: string | undefined) {
  if (!value?.trim()) return '-'
  const number = Number(value.replace(/,/g, ''))
  return Number.isFinite(number) ? number.toLocaleString('ko-KR') : value
}

function FinancialTableSkeleton() {
  return (
    <div aria-label="재무 데이터 로딩 중">
      <div className="mb-3 flex justify-between">
        <div className="h-5 w-16 animate-pulse rounded bg-gray-100" />
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="h-5 w-14 animate-pulse rounded bg-gray-100" />
        ))}
      </div>
      {Array.from({ length: 8 }, (_, index) => (
        <div key={index} className="flex justify-between border-t border-gray-50 py-3">
          <div className="h-5 w-20 animate-pulse rounded bg-gray-100" />
          {Array.from({ length: 3 }, (_, cellIndex) => (
            <div key={cellIndex} className="h-5 w-14 animate-pulse rounded bg-gray-100" />
          ))}
        </div>
      ))}
    </div>
  )
}

function FinancialTableView({
  financial,
  isFundLikeProduct,
}: {
  financial: StockFinancial
  isFundLikeProduct: boolean
}) {
  const columns = financial.columns ?? []
  const rows = (financial.rows ?? []).filter(
    (row) => !hiddenFinancialRows[financial.statement].has(row.label),
  )

  if (columns.length === 0 || rows.length === 0) {
    return (
      <p className="text-[13px] leading-5 text-gray-500">
        {isFundLikeProduct
          ? 'ETF/ETN 등 상품에는 기업 재무제표가 제공되지 않습니다.'
          : '표시할 재무 데이터가 없습니다.'}
      </p>
    )
  }

  return (
    <div className="overflow-x-auto -mx-6 px-6">
      <table className="w-full min-w-[340px]">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left text-[12px] font-semibold text-gray-500 py-3 pr-4 whitespace-nowrap">
              항목
            </th>
            {columns.map((column) => (
              <th
                key={column}
                className="text-right text-[12px] font-semibold text-gray-500 py-3 px-2 whitespace-nowrap"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.label} className={index % 2 === 0 ? 'bg-gray-50/50' : ''}>
              <td className="text-[13px] text-gray-700 font-medium py-2.5 pr-4 whitespace-nowrap">
                {row.label}
              </td>
              {columns.map((column, valueIndex) => (
                <td
                  key={`${row.label}-${column}`}
                  className="text-[13px] text-gray-900 text-right py-2.5 px-2 font-medium tabular-nums whitespace-nowrap"
                >
                  {formatFinancialCell(row.values?.[valueIndex])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-[11px] text-gray-400 mt-3">(단위: {financial.unit || '-'})</p>
    </div>
  )
}

export default function FinancialsPage() {
  const location = useLocation()
  const { id } = useParams()
  const ticker = (id ?? '').trim().toUpperCase()
  const navigationName = (location.state as { stockName?: string } | null)?.stockName?.trim()
  const [activeTab, setActiveTab] = useState<StockFinancialStatement>('INCOME')
  const [period, setPeriod] = useState<StockFinancialPeriod>('QUARTER')
  const [periodMenuOpen, setPeriodMenuOpen] = useState(false)
  const [financial, setFinancial] = useState<StockFinancial | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const periodMenuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!periodMenuOpen) return
    const handler = (event: MouseEvent) => {
      if (periodMenuRef.current && !periodMenuRef.current.contains(event.target as Node)) {
        setPeriodMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [periodMenuOpen])

  useEffect(() => {
    if (!ticker) return
    let current = true
    const timer = window.setTimeout(() => {
      setIsLoading(true)
      setHasError(false)
      setFinancial(null)
      if (navigationName && mayLackCorporateFinancials(navigationName)) {
        setIsLoading(false)
        return
      }
      void getStockFinancial(ticker, activeTab, period)
        .then((result) => {
          if (current) setFinancial(result)
        })
        .catch(() => {
          if (current) setHasError(true)
        })
        .finally(() => {
          if (current) setIsLoading(false)
        })
    }, 0)
    return () => {
      current = false
      window.clearTimeout(timer)
    }
  }, [activeTab, navigationName, period, ticker])

  const selectedPeriod = financialPeriods.find((item) => item.value === period)?.label ?? '분기'
  const displayName = financial?.nameKor ?? navigationName ?? ticker
  const isFundLikeProduct = mayLackCorporateFinancials(displayName)

  return (
    <div className="screen pb-10">
      <div className="px-6 pt-[52px]">
        <BackButton />
      </div>

      <div className="screen-px pt-4 flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-semibold leading-8 text-gray-900">재무제표</h1>
          <p className="text-[13px] leading-5 text-gray-500 mt-1">
            {displayName} ({financial?.ticker ?? ticker})
          </p>
        </div>

        <div ref={periodMenuRef} className="relative">
          <button
            type="button"
            onClick={() => setPeriodMenuOpen((open) => !open)}
            className="flex items-center gap-1 h-[34px] px-3 rounded-[10px] bg-gray-100 text-[13px] font-medium text-gray-700 active:bg-gray-200 transition-colors"
            aria-haspopup="listbox"
            aria-expanded={periodMenuOpen}
          >
            {selectedPeriod}
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform ${periodMenuOpen ? 'rotate-180' : ''}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {periodMenuOpen && (
            <ul
              role="listbox"
              className="absolute right-0 top-full mt-2 min-w-[90px] bg-white rounded-[10px] shadow-[0_4px_16px_rgba(0,0,0,0.12)] border border-gray-100 py-1 z-10 animate-fade-in"
            >
              {financialPeriods.map((item) => (
                <li key={item.value} role="option" aria-selected={period === item.value}>
                  <button
                    type="button"
                    onClick={() => {
                      setPeriod(item.value)
                      setPeriodMenuOpen(false)
                    }}
                    className={`w-full text-left px-3 py-2 text-[13px] leading-5 transition-colors hover:bg-gray-50 ${
                      period === item.value ? 'text-gray-900 font-medium' : 'text-gray-500'
                    }`}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="screen-px mt-6">
        <div className="flex gap-2">
          {financialTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={`px-3.5 py-1.5 rounded-xl text-[13px] font-medium transition-colors ${
                activeTab === tab.value ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="screen-px mt-5 animate-fade-in-up" key={`${activeTab}-${period}`}>
        {isLoading && <FinancialTableSkeleton />}
        {!isLoading && hasError && (
          <p className="text-[13px] leading-5 text-gray-500">
            {isFundLikeProduct
              ? 'ETF/ETN 등 상품은 기업 재무제표가 제공되지 않을 수 있습니다.'
              : '재무 데이터를 불러오지 못했습니다.'}
          </p>
        )}
        {!isLoading && !hasError && !financial && isFundLikeProduct && (
          <p className="text-[13px] leading-5 text-gray-500">
            ETF/ETN 등 상품에는 기업 재무제표가 제공되지 않습니다.
          </p>
        )}
        {!isLoading && !hasError && financial && (
          <FinancialTableView financial={financial} isFundLikeProduct={isFundLikeProduct} />
        )}
      </div>
    </div>
  )
}
