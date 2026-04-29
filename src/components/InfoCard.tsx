interface InfoCardProps {
  title: string
  children: React.ReactNode
  className?: string
}

export default function InfoCard({ title, children, className = '' }: InfoCardProps) {
  return (
    <div className={`bg-white rounded-[15px] p-5 shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-gray-100 ${className}`}>
      <h3 className="text-[15px] font-medium leading-6 text-gray-900 mb-2.5">{title}</h3>
      <div className="text-[15px] font-normal text-gray-600 leading-[1.5]">{children}</div>
    </div>
  )
}
