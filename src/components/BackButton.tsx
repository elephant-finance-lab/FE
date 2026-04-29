import { useNavigate } from 'react-router-dom'

export default function BackButton() {
  const navigate = useNavigate()

  return (
    <button
      onClick={() => navigate(-1)}
      className="flex h-10 w-10 -ml-2 items-center justify-center text-gray-800"
    >
      <svg width="12" height="24" viewBox="0 0 12 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="10 4 2 12 10 20" />
      </svg>
    </button>
  )
}
