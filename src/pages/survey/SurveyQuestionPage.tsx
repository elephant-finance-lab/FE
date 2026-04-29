import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Button from '../../components/Button'
import CheckboxOption from '../../components/CheckboxOption'
import { surveyQuestions } from '../../data/surveyQuestions'

export default function SurveyQuestionPage() {
  const navigate = useNavigate()
  const { step } = useParams<{ step: string }>()
  const stepNum = Number(step)
  const question = surveyQuestions[stepNum - 1]

  const [selected, setSelected] = useState<Set<number>>(new Set())

  if (!question) {
    navigate('/chart')
    return null
  }

  const handleSelect = (idx: number) => {
    if (question.multiSelect) {
      const next = new Set(selected)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      setSelected(next)
    } else {
      setSelected(new Set([idx]))
    }
  }

  const handleContinue = () => {
    if (stepNum < surveyQuestions.length) {
      setSelected(new Set())
      navigate(`/survey/${stepNum + 1}`)
    } else {
      navigate('/recommend/analyzing')
    }
  }

  const isLast = stepNum === surveyQuestions.length

  return (
    <div className="screen flex flex-col px-6 pt-[72px] pb-10">
      <div className="mb-7">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[13px] leading-5 text-gray-400">{stepNum} / {surveyQuestions.length}</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div
            className="bg-toss-blue h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${(stepNum / surveyQuestions.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex-1">
        <h2 className="section-title whitespace-pre-line mb-7">
          {question.question}
        </h2>

        <div className="flex flex-col gap-2.5">
          {question.multiSelect ? (
            <div className="flex flex-wrap gap-2">
              {question.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  className={`h-10 px-4 rounded-[10px] text-[14px] font-medium leading-5 transition-colors ${
                    selected.has(idx)
                      ? 'bg-toss-blue text-white'
                      : 'bg-gray-50 text-gray-700 border border-gray-200'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          ) : (
            question.options.map((opt, idx) => (
              <CheckboxOption
                key={idx}
                label={opt}
                selected={selected.has(idx)}
                onClick={() => handleSelect(idx)}
              />
            ))
          )}
        </div>
      </div>

      <div className="pt-8">
        <Button disabled={selected.size === 0} onClick={handleContinue}>
          {isLast ? '완료' : '다음'}
        </Button>
      </div>
    </div>
  )
}
