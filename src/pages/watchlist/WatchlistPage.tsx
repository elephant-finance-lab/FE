import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { watchlistStocks, type Stock } from '../../data/mockStocks'

const STORAGE_KEY = 'watchlist-groups'
const DEFAULT_GROUPS = ['IT / AI']

function loadGroups(): string[] {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY)
    if (!saved) return DEFAULT_GROUPS
    const parsed = JSON.parse(saved)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_GROUPS
  } catch {
    return DEFAULT_GROUPS
  }
}

type ModalState = 'closed' | 'edit' | 'confirm-delete'

interface SortableGroupRowProps {
  group: string
  isEditing: boolean
  editingValue: string
  setEditingValue: (v: string) => void
  onAskDelete: (g: string) => void
  onStartEdit: (g: string) => void
  onCommitEdit: () => void
  onCancelEdit: () => void
  inputRef: React.RefObject<HTMLInputElement | null>
}

function SortableGroupRow({
  group,
  isEditing,
  editingValue,
  setEditingValue,
  onAskDelete,
  onStartEdit,
  onCommitEdit,
  onCancelEdit,
  inputRef,
}: SortableGroupRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: group,
    disabled: isEditing,
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.92 : 1,
    boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.12)' : undefined,
    backgroundColor: isDragging ? '#fff' : undefined,
    borderRadius: isDragging ? 12 : undefined,
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 py-3 touch-none">
      <button
        type="button"
        onClick={() => onAskDelete(group)}
        aria-label="삭제"
        className="w-6 h-6 rounded-full border border-gray-400 flex items-center justify-center text-gray-500 shrink-0"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editingValue}
          onChange={(e) => setEditingValue(e.target.value)}
          onBlur={onCommitEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              onCommitEdit()
            }
            if (e.key === 'Escape') {
              onCancelEdit()
            }
          }}
          className="flex-1 text-[15px] font-medium text-gray-900 bg-transparent border-b border-gray-400 outline-none px-0 py-0.5"
        />
      ) : (
        <span className="text-[15px] font-medium text-gray-900">{group}</span>
      )}

      <button
        type="button"
        onClick={() => (isEditing ? onCommitEdit() : onStartEdit(group))}
        aria-label={isEditing ? '저장' : '편집'}
        className="w-5 h-5 flex items-center justify-center text-gray-500 shrink-0"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </button>

      <button
        type="button"
        aria-label="순서 변경"
        {...attributes}
        {...listeners}
        className="ml-auto text-gray-300 shrink-0 cursor-grab active:cursor-grabbing touch-none p-1"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="9" cy="6" r="1.6" />
          <circle cx="15" cy="6" r="1.6" />
          <circle cx="9" cy="12" r="1.6" />
          <circle cx="15" cy="12" r="1.6" />
          <circle cx="9" cy="18" r="1.6" />
          <circle cx="15" cy="18" r="1.6" />
        </svg>
      </button>
    </div>
  )
}

export default function WatchlistPage() {
  const navigate = useNavigate()
  const [groups, setGroups] = useState<string[]>(() => loadGroups())
  const [activeGroup, setActiveGroup] = useState<string>(() => loadGroups()[0] ?? '')
  const [stocks, setStocks] = useState<Stock[]>(watchlistStocks)
  const [modalState, setModalState] = useState<ModalState>('closed')
  const [deletingGroup, setDeletingGroup] = useState<string | null>(null)
  const [editingGroup, setEditingGroup] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const editInputRef = useRef<HTMLInputElement | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(groups))
  }, [groups])

  useEffect(() => {
    if (modalState === 'closed') return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [modalState])

  useEffect(() => {
    if (editingGroup && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingGroup])

  const handleRemoveStock = (id: string) => {
    setStocks((prev) => prev.filter((s) => s.id !== id))
  }

  const closeModal = () => {
    setModalState('closed')
    setDeletingGroup(null)
    setEditingGroup(null)
  }

  const askDelete = (g: string) => {
    setDeletingGroup(g)
    setModalState('confirm-delete')
  }

  const confirmDelete = () => {
    if (deletingGroup) {
      const next = groups.filter((g) => g !== deletingGroup)
      setGroups(next.length > 0 ? next : DEFAULT_GROUPS)
      if (activeGroup === deletingGroup) {
        setActiveGroup(next[0] ?? DEFAULT_GROUPS[0])
      }
    }
    closeModal()
  }

  const startEdit = (g: string) => {
    setEditingGroup(g)
    setEditingValue(g)
  }

  const cancelEdit = () => {
    setEditingGroup(null)
  }

  const commitEdit = () => {
    if (!editingGroup) return
    const trimmed = editingValue.trim()
    if (!trimmed || trimmed === editingGroup) {
      setEditingGroup(null)
      return
    }
    setGroups((prev) => {
      if (prev.includes(trimmed)) return prev
      return prev.map((g) => (g === editingGroup ? trimmed : g))
    })
    if (activeGroup === editingGroup) setActiveGroup(trimmed)
    setEditingGroup(null)
  }

  const goAddGroup = () => {
    closeModal()
    navigate('/watchlist/add-group')
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setGroups((prev) => {
      const oldIndex = prev.indexOf(String(active.id))
      const newIndex = prev.indexOf(String(over.id))
      if (oldIndex === -1 || newIndex === -1) return prev
      return arrayMove(prev, oldIndex, newIndex)
    })
  }

  return (
    <div className="pb-2">
      <div className="border-b border-[rgba(217,217,217,0.7)] px-[27px] pt-6 pb-5">
        <span className="text-[20px] font-semibold leading-7 text-gray-900">관심</span>
      </div>

      <div className="pt-4 pb-6 px-[27px] flex items-center gap-2.5 flex-wrap">
        {groups.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setActiveGroup(g)}
            className={`h-[30px] px-3 rounded-[7px] text-[13px] leading-6 font-normal transition-colors ${
              activeGroup === g
                ? 'bg-[rgba(217,217,217,0.4)] text-gray-900'
                : 'bg-transparent text-gray-700/60'
            }`}
          >
            {g}
          </button>
        ))}
        <button
          type="button"
          onClick={goAddGroup}
          className="h-[30px] px-3 rounded-[7px] text-[13px] leading-6 font-normal text-gray-700/60"
        >
          그룹추가
        </button>
        <button
          type="button"
          onClick={() => setModalState('edit')}
          className="ml-auto text-[12px] leading-5 text-gray-500"
        >
          그룹 편집
        </button>
      </div>

      <div className="pl-[33px] pr-[16px] flex flex-col gap-7">
        {stocks.map((stock) => (
          <div
            key={stock.id}
            role="button"
            tabIndex={0}
            onClick={() => navigate(`/stock/${stock.id}`)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') navigate(`/stock/${stock.id}`)
            }}
            className="flex items-center gap-[17px] cursor-pointer"
          >
            <div className="w-[33px] h-[33px] rounded-full bg-[#D9D9D9] shrink-0" />
            <div className="flex-1 flex flex-col gap-1 min-w-0">
              <span className="text-[15px] font-semibold leading-6 text-gray-900 truncate">
                {stock.name}
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-[12px] leading-5 text-[#2B2B2B] tabular-nums font-light">
                  {stock.price}
                </span>
                <span
                  className={`text-[12px] leading-5 tabular-nums font-light ${
                    stock.isPositive ? 'text-toss-red' : 'text-[#3985FF]'
                  }`}
                >
                  {stock.isPositive ? '+' : '-'}
                  {stock.changePercent}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleRemoveStock(stock.id)
              }}
              className="w-5 h-5 flex items-center justify-center text-gray-400 shrink-0"
              aria-label="제거"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {modalState !== 'closed' && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-[60] animate-fade-in"
            onClick={closeModal}
          />
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[393px] bg-white rounded-t-[24px] z-[70] animate-slide-up shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
            {modalState === 'edit' ? (
              <div className="px-6 pt-7 pb-7">
                <button
                  type="button"
                  onClick={goAddGroup}
                  className="flex items-center gap-3 py-3 w-full text-left"
                >
                  <span className="w-6 h-6 rounded-full border border-gray-400 flex items-center justify-center text-gray-500">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </span>
                  <span className="text-[15px] font-medium text-gray-900">새 그룹 추가</span>
                </button>

                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext items={groups} strategy={verticalListSortingStrategy}>
                    {groups.map((g) => (
                      <SortableGroupRow
                        key={g}
                        group={g}
                        isEditing={editingGroup === g}
                        editingValue={editingValue}
                        setEditingValue={setEditingValue}
                        onAskDelete={askDelete}
                        onStartEdit={startEdit}
                        onCommitEdit={commitEdit}
                        onCancelEdit={cancelEdit}
                        inputRef={editInputRef}
                      />
                    ))}
                  </SortableContext>
                </DndContext>

                <button
                  type="button"
                  onClick={closeModal}
                  className="mt-8 w-full h-[52px] bg-black text-white text-[15px] font-medium rounded-full active:bg-gray-800 transition-colors"
                >
                  확인
                </button>
              </div>
            ) : (
              <div className="px-6 pt-7 pb-7 min-h-[360px] flex flex-col">
                <h3 className="text-[17px] font-semibold leading-7 text-gray-900">
                  {deletingGroup} 그룹을 삭제할까요?
                </h3>
                <p className="mt-2 text-[13px] leading-5 text-gray-500">
                  그룹 내 종목도 함께 삭제돼요.
                </p>

                <div className="mt-auto flex flex-col gap-2 pt-6">
                  <button
                    type="button"
                    onClick={confirmDelete}
                    className="w-full h-[52px] bg-black text-white text-[15px] font-medium rounded-full active:bg-gray-800 transition-colors"
                  >
                    삭제하기
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalState('edit')}
                    className="w-full h-[52px] bg-white text-gray-900 text-[15px] font-medium rounded-full border border-gray-300 active:bg-gray-50 transition-colors"
                  >
                    나중에
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
