interface StockListItemProps {
  rank?: number
  name: string
  price: string
  changePercent: string
  isPositive?: boolean
  showHeart?: boolean
  onHeartClick?: () => void
  heartFilled?: boolean
  onClick?: () => void
}

export default function StockListItem({
  rank,
  name,
  price,
  changePercent,
  isPositive = true,
  showHeart = false,
  onHeartClick,
  heartFilled = false,
  onClick,
}: StockListItemProps) {
  return (
    <div
      className="flex items-center py-3.5 cursor-pointer active:bg-gray-50 rounded-xl transition-colors"
      onClick={onClick}
    >
      {rank !== undefined && (
        <span className="w-7 text-[15px] font-normal leading-6 text-gray-900 text-center shrink-0">{rank}</span>
      )}
      <div className="flex-1 min-w-0 ml-4">
        <p className="text-[15px] font-medium leading-6 text-gray-900 truncate">{name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[13px] leading-5 text-gray-500 font-normal tabular-nums">{price}</span>
          <span className={`text-[12px] leading-4 font-medium px-1.5 py-0.5 rounded ${
            isPositive
              ? 'text-toss-red bg-red-50'
              : 'text-toss-blue bg-blue-50'
          }`}>
            {isPositive ? '+' : ''}{changePercent}
          </span>
        </div>
      </div>
      {showHeart && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onHeartClick?.()
          }}
          className="w-10 h-10 flex items-center justify-center shrink-0 rounded-full hover:bg-gray-50"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill={heartFilled ? '#FF3B30' : 'none'} stroke={heartFilled ? '#FF3B30' : '#BDBDBD'} strokeWidth="2">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </button>
      )}
    </div>
  )
}
