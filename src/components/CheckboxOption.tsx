interface CheckboxOptionProps {
  label: string
  selected: boolean
  onClick: () => void
  multiSelect?: boolean
}

export default function CheckboxOption({ label, selected, onClick }: CheckboxOptionProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 w-full h-[56px] px-5 rounded-[14px] text-left text-[15px] font-medium leading-6 transition-all duration-150 ${
        selected
          ? 'bg-toss-blue-light text-toss-blue border border-toss-blue'
          : 'bg-white text-gray-800 border border-gray-200 hover:border-gray-300'
      }`}
    >
      <span className={`flex items-center justify-center w-[22px] h-[22px] rounded-full border-2 shrink-0 transition-colors ${
        selected ? 'border-toss-blue bg-toss-blue' : 'border-gray-300 bg-white'
      }`}>
        {selected && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6L5 8.5L9.5 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      {label}
    </button>
  )
}
