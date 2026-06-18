import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { mockStore, mockProfiles } from '../../lib/mockData'
import { useRefresh } from '../../lib/RefreshContext'
import { showToast } from '../../lib/utils'
import PageHeader from '../../components/shared/PageHeader'
import FilterTabs from '../../components/shared/FilterTabs'
import RecordCard from '../../components/record/RecordCard'
import WriteRecordModal from '../../components/record/WriteRecordModal'
import styles from './Discover.module.css'

const FILTERS = [
  { key: 'all', label: '全部' },
  { key: 'hot', label: '热门' },
  { key: 'follow', label: '关注' },
  { key: 'collected', label: '收藏' },
]

export default function Discover() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')
  const [records, setRecords] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAct, setSelectedAct] = useState(null)

  // 打开页面自动选中第一条
  useEffect(() => {
    if (!selectedAct && unrecordedBookings.length > 0) {
      setSelectedAct(unrecordedBookings[0])
    }
  }, [])
  const [showWriteModal, setShowWriteModal] = useState(false)
  const { refreshKey } = useRefresh()
  const feedRef = useRef(null)
  const draftsRef = useRef({}) // 草稿存储：{ [activity_id]: { title, content, images } }

  // 用户已预约的活动
  const myBookings = mockStore.bookings
    .filter(b => b.user_id === 'u0')
    .map(b => {
      const act = mockStore.activities.find(a => a.id === b.activity_id)
      const session = mockStore.activity_sessions.find(s => s.id === b.session_id)
      return { ...b, activity: act, session }
    })
    .filter(b => b.activity)

  // 已完成的体验但还没写记录的
  const userRecords = mockStore.records.filter(r => r.user_id === 'u0')
  const unrecordedBookings = myBookings.filter(b =>
    !userRecords.some(r => r.activity_id === b.activity_id)
  )
  const showWriteArea = unrecordedBookings.length > 0

  // ── Cover Flow 轮播 ──
  const [activeIdx, setActiveIdx] = useState(0)
  const coverTouchX = useRef(0)

  const handleCoverSwipe = (dir) => {
    const next = Math.max(0, Math.min(unrecordedBookings.length - 1, activeIdx + dir))
    setActiveIdx(next)
    setSelectedAct(unrecordedBookings[next])
  }
  const handleCoverTouchStart = (e) => { coverTouchX.current = e.touches[0].clientX }
  const handleCoverTouchEnd = (e) => {
    const dx = coverTouchX.current - e.changedTouches[0].clientX
    if (Math.abs(dx) > 30) handleCoverSwipe(dx > 0 ? 1 : -1)
  }

  useEffect(() => {
    let enriched = mockStore.records
      .map(r => {
        const user = mockProfiles.find(p => p.id === r.user_id)
        return { ...r, user_nickname: user?.nickname || r.user_nickname, user_avatar: user?.avatar || r.user_avatar }
      })
      .sort((a, b) => {
        if (filter === 'hot') return b.save_count - a.save_count
        if (filter === 'follow') return a.isFollowing ? -1 : 1
        if (filter === 'collected') return a.isSaved ? -1 : 1
        return new Date(b.created_at) - new Date(a.created_at)
      })
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      enriched = enriched.filter(r => r.title?.toLowerCase().includes(q) || r.content?.toLowerCase().includes(q))
    }
    setRecords(enriched)
  }, [filter, refreshKey, searchQuery])


  return (
    <div className={styles.page}>
      <PageHeader cn="发现" en="DISCOVER" right="自主教育探索 · 真实体验记录" />

      {/* 写记录 — 仅当有未记录的体验时展示 */}
      {showWriteArea && (
      <div style={{ padding: '4px 0', background: '#fafafa' }}>
          {/* Cover Flow */}
          <div
            onTouchStart={handleCoverTouchStart}
            onTouchEnd={handleCoverTouchEnd}
            style={{
              perspective: 600, height: 70, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              position: 'relative', overflow: 'visible', padding: '2px 0',
            }}>
            {unrecordedBookings.map((b, i) => {
              const offset = i - activeIdx
              const absOff = Math.abs(offset)
              const isActive = offset === 0
              const z = absOff > 1 ? -120 : -40 * absOff
              const rotateY = offset * 30
              const scale = isActive ? 1 : 0.7
              const opacity = absOff > 1 ? 0 : absOff === 1 ? 0.5 : 1
              const zIndex = 10 - absOff
              // 左右露出更多：translateX 偏移
              const tx = offset * 100

              return (
                <div
                  key={b.id}
                  onClick={() => {
                    setActiveIdx(i)
                    setSelectedAct(b)
                  }}
                  style={{
                    position: 'absolute',
                    width: 130,
                    height: 66,
                    borderRadius: 3,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transform: `translateX(${tx}px) rotateY(${rotateY}deg) translateZ(${z}px) scale(${scale})`,
                    opacity,
                    zIndex,
                    transition: 'transform 0.35s ease, opacity 0.35s ease',
                    boxShadow: isActive ? '0 4px 20px rgba(0,0,0,0.2)' : 'none',
                  }}>
                  <img src={b.activity.cover_url || 'https://picsum.photos/seed/bk/200/120'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  {isActive && <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 0 0.5px #111', pointerEvents: 'none' }} />}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '6px 8px', background: 'linear-gradient(transparent, rgba(0,0,0,0.7))' }}>
                    <div style={{ fontSize: 12, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{b.activity.title}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
                      {b.session ? `${new Date(b.session.planned_start_time).getMonth() + 1}月${new Date(b.session.planned_start_time).getDate()}日` : ''}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <button
            onClick={() => setShowWriteModal(true)}
            disabled={!selectedAct}
            style={{
              display: 'block', width: 'calc(100% - 40px)', margin: '4px 20px 0',
              background: showWriteModal ? '#111' : '#fff',
              border: showWriteModal ? '1px solid #111' : '1px solid #ddd',
              color: showWriteModal ? '#fff' : '#666',
              fontSize: 13, fontWeight: 500, cursor: selectedAct ? 'pointer' : 'default',
              padding: '2px 0', borderRadius: 2,
            }}>
            写一下活动记录
          </button>
        </div>
      )}

      <div style={{ position: 'sticky', top: 44, zIndex: 50, background: '#fff' }}>
        <FilterTabs tabs={FILTERS} active={filter} onChange={setFilter} />
      </div>

      <div className={styles.feed} ref={feedRef}>
        {records.map(r => (
          <RecordCard key={r.id} record={r} />
        ))}
      </div>

      {showWriteModal && selectedAct && (
        <WriteRecordModal
          experience={{
            id: selectedAct.activity_id,
            title: selectedAct.activity.title,
            cover: selectedAct.activity.cover_url || '',
            date: selectedAct.session ? new Date(selectedAct.session.planned_start_time).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' }) : '',
          }}
          draft={draftsRef.current[selectedAct.activity_id] || null}
          onClose={() => setShowWriteModal(false)}
          onSaveDraft={({ title, content, images }) => {
            draftsRef.current[selectedAct.activity_id] = { title, content, images }
            showToast('草稿已保存')
          }}
          onSubmit={({ title, content, images }) => {
            delete draftsRef.current[selectedAct.activity_id]
            const expDate = selectedAct.session
              ? `${new Date(selectedAct.session.planned_start_time).getMonth() + 1}月${new Date(selectedAct.session.planned_start_time).getDate()}日`
              : ''
            mockStore.records.push({
              id: `r_${Date.now()}`,
              user_id: 'u0',
              activity_id: selectedAct.activity_id,
              title,
              content,
              images: images.slice(0, 3),
              user_nickname: '超级管理员',
              user_avatar: 'https://picsum.photos/seed/admin/200/200',
              experience_date: expDate,
              save_count: 0,
              likes: 0,
              isFollowing: false,
              isNearby: true,
              created_at: new Date().toISOString(),
            })
            setShowWriteModal(false)
            setSelectedAct(null)
            showToast('记录已发布')
          }}
        />
      )}
    </div>
  )
}
