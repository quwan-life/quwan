import { useRef, useState, useCallback } from 'react'
import PullContext from './PullContext'

export default function PullToRefresh({ onRefresh, children }) {
  const [state, setState] = useState('idle') // idle | pulling | ready | refreshing | closing
  const [offset, setOffset] = useState(0)
  const startY = useRef(0)
  const currentY = useRef(0)
  const containerRef = useRef(null)
  const timerRef = useRef(0)

  const THRESHOLD = 56
  const REFRESH_OFFSET = 44

  const handleTouchStart = useCallback((e) => {
    if (state === 'refreshing' || state === 'closing') return
    const el = containerRef.current
    if (!el || el.scrollTop > 2) return
    startY.current = e.touches[0].clientY
  }, [state])

  const handleTouchMove = useCallback((e) => {
    if (state === 'refreshing' || state === 'closing') return
    if (state !== 'pulling' && state !== 'ready') {
      const el = containerRef.current
      if (!el || el.scrollTop > 2) return
      const dy = e.touches[0].clientY - startY.current
      if (dy <= 2) return
      setState('pulling')
    }
    currentY.current = e.touches[0].clientY
    let dy = currentY.current - startY.current
    if (dy <= 0) { setOffset(0); setState('idle'); return }

    dy = dy * 0.5
    const maxPull = Math.max(200, window.innerHeight * 0.45)
    if (dy > maxPull) dy = maxPull

    setOffset(dy)
    setState(dy >= THRESHOLD ? 'ready' : 'pulling')

    if (dy > 4) e.preventDefault()
  }, [state])

  const handleTouchEnd = useCallback(() => {
    if (state === 'ready') {
      clearTimeout(timerRef.current)
      // 松手后停在刷新位置，不立即回弹
      setOffset(REFRESH_OFFSET)
      setState('refreshing')

      const doRefresh = async () => {
        try {
          await onRefresh?.()
        } finally {
          // 刷新完成后回弹到顶部
          setOffset(0)
          setState('closing')
          timerRef.current = setTimeout(() => {
            setState('idle')
          }, 500)
        }
      }
      doRefresh()
    } else {
      setOffset(0)
      setState('idle')
    }
  }, [state, onRefresh])

  const isPulling = state === 'pulling' || state === 'ready'
  const isSpinning = state === 'refreshing' || state === 'closing'

  const showHint = state !== 'idle'

  return (
    <PullContext.Provider value={isPulling}>
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        height: '100%',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        position: 'relative',
        zIndex: 2,
      }}
    >
      {showHint && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: state === 'refreshing' ? REFRESH_OFFSET : (offset > 0 ? offset : 0),
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          paddingBottom: 8,
          fontSize: 13,
          color: state === 'refreshing' ? 'var(--color-primary)' : '#999',
          pointerEvents: 'none',
          zIndex: 2,
          opacity: state === 'closing' ? 0 : 1,
          transition: 'opacity 0.3s ease',
        }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}>
            {isSpinning ? (
              <span style={{
                display: 'inline-block',
                width: 12, height: 12,
                border: '2px solid #e0d6d0',
                borderTopColor: 'var(--color-primary)',
                borderRadius: '50%',
                animation: 'ptr-spin 0.6s linear infinite',
              }} />
            ) : (
              <span style={{
                display: 'inline-block',
                transform: state === 'ready' ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
                fontSize: 14,
              }}>↓</span>
            )}
            {isSpinning ? '刷新中' : state === 'ready' ? '松开刷新' : '下拉刷新'}
          </span>
        </div>
      )}

      <div style={{
        transform: `translateY(${offset}px)`,
        transition: isPulling ? 'none' : 'transform 0.45s cubic-bezier(0.25, 0.46, 0.45, 1.03)',
        paddingTop: 'calc(var(--safe-top) * 0.7)',
        minHeight: '100%',
      }}>
        {children}
      </div>
    </div>
    </PullContext.Provider>
  )
}
