import { useEffect, useMemo, useRef, useState } from 'react'
import BackButton from '../../components/BackButton'
import { incomeStatement, balanceSheet, cashFlow, type FinancialTable } from '../../data/financialData'

const financialTabs = ['손익계산서', '재무상태표', '현금흐름표']
const financialPeriods = ['분기', '반기', '연간'] as const
type FinancialPeriod = (typeof financialPeriods)[number]

const baseTableMap: Record<string, FinancialTable> = {
  '손익계산서': incomeStatement,
  '재무상태표': balanceSheet,
  '현금흐름표': cashFlow,
}

const periodHeaders: Record<FinancialPeriod, string[]> = {
  분기: ['24년 1Q', '24년 2Q', '24년 3Q', '24년 4Q'],
  반기: ['23년 상', '23년 하', '24년 상', '24년 하'],
  연간: ['2022', '2023', '2024'],
}

const periodFactor: Record<FinancialPeriod, number> = {
  분기: 4,
  반기: 2,
  연간: 1,
}

function adjustValue(raw: string | null, factor: number, variance: number): string | null {
  if (raw == null) return null
  if (raw.includes('%')) return raw
  const isNegative = raw.trim().startsWith('-')
  const cleaned = raw.replace(/,/g, '').replace('-', '')
  const num = Number(cleaned)
  if (Number.isNaN(num)) return raw
  const adjusted = (num / factor) * variance
  const rounded = Math.round(adjusted)
  return `${isNegative ? '-' : ''}${rounded.toLocaleString('ko-KR')}`
}

function getTableByPeriod(table: FinancialTable, period: FinancialPeriod): FinancialTable {
  if (period === '연간') return table
  const headers = periodHeaders[period]
  const factor = periodFactor[period]
  return {
    years: headers,
    rows: table.rows.map((row) => ({
      label: row.label,
      values: headers.map((_, i) => {
        const baseVal = row.values[row.values.length - 1] ?? null
        const variance = 0.9 + (i % 4) * 0.05
        return adjustValue(baseVal, factor, variance)
      }),
    })),
  }
}

function FinancialTableView({ table }: { table: FinancialTable }) {
  return (
    <div className="overflow-x-auto -mx-6 px-6">
      <table className="w-full min-w-[340px]">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left text-[12px] font-semibold text-gray-500 py-3 pr-4 whitespace-nowrap">
              항목
            </th>
            {table.years.map((year) => (
              <th
                key={year}
                className="text-right text-[12px] font-semibold text-gray-500 py-3 px-2 whitespace-nowrap"
              >
                {year}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, idx) => (
            <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50/50' : ''}>
              <td className="text-[13px] text-gray-700 font-medium py-2.5 pr-4 whitespace-nowrap">
                {row.label}
              </td>
              {row.values.map((val, vIdx) => (
                <td
                  key={vIdx}
                  className="text-[13px] text-gray-900 text-right py-2.5 px-2 font-medium tabular-nums whitespace-nowrap"
                >
                  {val ?? '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-[11px] text-gray-400 mt-3">(단위: 백만 USD)</p>
    </div>
  )
}

export default function FinancialsPage() {
  const [activeTab, setActiveTab] = useState('손익계산서')
  const [period, setPeriod] = useState<FinancialPeriod>('분기')
  const [periodMenuOpen, setPeriodMenuOpen] = useState(false)
  const periodMenuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!periodMenuOpen) return
    const handler = (e: MouseEvent) => {
      if (periodMenuRef.current && !periodMenuRef.current.contains(e.target as Node)) {
        setPeriodMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [periodMenuOpen])

  const table = useMemo(() => getTableByPeriod(baseTableMap[activeTab], period), [activeTab, period])

  return (
    <div className="screen pb-10">
      <div className="px-6 pt-[52px]">
        <BackButton />
      </div>

      <div className="screen-px pt-4 flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-semibold leading-8 text-gray-900">재무제표</h1>
          <p className="text-[13px] leading-5 text-gray-500 mt-1">애플 (APPLE)</p>
        </div>

        <div ref={periodMenuRef} className="relative">
          <button
            type="button"
            onClick={() => setPeriodMenuOpen((o) => !o)}
            className="flex items-center gap-1 h-[34px] px-3 rounded-[10px] bg-gray-100 text-[13px] font-medium text-gray-700 active:bg-gray-200 transition-colors"
            aria-haspopup="listbox"
            aria-expanded={periodMenuOpen}
          >
            {period}
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
              {financialPeriods.map((p) => (
                <li key={p} role="option" aria-selected={period === p}>
                  <button
                    type="button"
                    onClick={() => {
                      setPeriod(p)
                      setPeriodMenuOpen(false)
                    }}
                    className={`w-full text-left px-3 py-2 text-[13px] leading-5 transition-colors hover:bg-gray-50 ${
                      period === p ? 'text-gray-900 font-medium' : 'text-gray-500'
                    }`}
                  >
                    {p}
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
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-xl text-[13px] font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="screen-px mt-5 animate-fade-in-up" key={`${activeTab}-${period}`}>
        <FinancialTableView table={table} />
      </div>
    </div>
  )
}
