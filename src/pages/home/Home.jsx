import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { mockStore, categoryTypes } from '../../lib/mockData'
import { useRefresh } from '../../lib/RefreshContext'
import PageHeader from '../../components/shared/PageHeader'
import FilterTabs from '../../components/shared/FilterTabs'
import CityPicker from '../../components/shared/CityPicker'
import ActivityCard from '../../components/cards/ActivityCard'
import styles from './Home.module.css'

// ═══ 分类 → 卡片风格映射（可随时按需调整） ═══
const cardVariantMap = {
  '职业体验': 'text-only',   // 序号纯文字：联合定制
  '研学路线': 'compact',     // 大卡片纯文字：多行描述
  '同城活动': 'hero',        // HS同城：大图卡片
  '共居社区': 'default',     // 图文卡片：3张小图
}

export default function Home() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('职业体验')
  const [city, setCity] = useState('大理')
  const [showCityPicker, setShowCityPicker] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { refreshKey } = useRefresh()
  const listRef = useRef(null)

  const filtered = useMemo(() => {
    let acts = mockStore.activities.filter(a => a.category_type === activeTab && a.status === 'active')
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      acts = acts.filter(a => a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q))
    }
    return acts
  }, [activeTab, refreshKey, searchQuery])


  const variant = cardVariantMap[activeTab] || 'default'

  return (
    <div className={styles.page}>
      <PageHeader cn="去玩" en="PLAY" right="探索真实世界 · 寻找同行者" />

      {/* 城市 + 搜索 */}
      <div style={{ padding: '4px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Escape') setSearchQuery('') }}
            placeholder="搜索活动..."
            style={{ width: '100%', height: 32, border: '1px solid #ddd', borderRadius: 3, padding: '0 12px 0 32px', fontSize: 14, color: '#111', outline: 'none', fontFamily: 'inherit' }}
          />
        </div>
        <button onClick={() => navigate('/map')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0, marginLeft: 4 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', marginTop: 1 }}>
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
            <line x1="8" y1="2" x2="8" y2="18" />
            <line x1="16" y1="6" x2="16" y2="22" />
          </svg>
        </button>
        <button onClick={() => navigate('/guide')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', marginTop: 2 }}>
            <path d="M12 5.5C10.5 4.5 8 4 6 4c-1.5 0-3 .3-4 .8v13.9c1-.4 2.5-.7 4-.7 2 0 4.5.5 6 1.5M12 5.5c1.5-1 4-1.5 6-1.5 1.5 0 3 .3 4 .8v13.9c-1-.4-2.5-.7-4-.7-2 0-4.5.5-6 1.5" />
            <path d="M12 5.5v14" />
          </svg>
        </button>
      </div>

      <Banner />
      <ReminderCards />
      <FilterTabs tabs={categoryTypes} active={activeTab} onChange={setActiveTab} />

      <div className={styles.list} ref={listRef}>
        {filtered.map((act, idx) => (
          <ActivityCard key={act.id} act={act} index={idx} variant={variant} />
        ))}
      </div>

      <CityPicker
        show={showCityPicker}
        currentCity={city}
        onSelect={(c) => { setCity(c); setShowCityPicker(false) }}
        onClose={() => setShowCityPicker(false)}
      />
    </div>
  )
}

// ── 工具 ──
const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
function fmtDate(isoStr) {
  const d = new Date(isoStr)
  return `${d.getMonth() + 1}月${d.getDate()}日 ${WEEKDAYS[d.getDay()]} ${d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
}

// ── 轮播图 ──
const BANNER_ITEMS = [
  { id: 1, title: '职业体验', desc: '发现真实世界的工作', img: 'https://picsum.photos/seed/ban1/750/300' },
  { id: 2, title: '研学路线', desc: '探索苍山洱海的奥秘', img: 'https://picsum.photos/seed/ban2/750/300' },
  { id: 3, title: 'HS同城', desc: '结识志同道合的朋友', img: 'https://picsum.photos/seed/ban3/750/300' },
  { id: 4, title: '共居社区', desc: '寻找另一种生活方式', img: 'https://picsum.photos/seed/ban4/750/300' },
]

function Banner() {
  const [cur, setCur] = useState(0)
  const [touchStartX, setTouchStartX] = useState(0)
  const [arrowsVisible, setArrowsVisible] = useState(false)
  const timer = useRef(null)
  const arrowTimer = useRef(null)

  const L = BANNER_ITEMS.length

  const autoPlay = useCallback(() => {
    timer.current = setInterval(() => setCur(c => (c + 1) % L), 4000)
  }, [L])

  useEffect(() => { autoPlay(); return () => clearInterval(timer.current) }, [autoPlay])

  const go = useCallback((i) => { setCur(i); clearInterval(timer.current); autoPlay() }, [autoPlay])
  const prev = useCallback(() => go((cur - 1 + L) % L), [cur, go, L])
  const next = useCallback(() => go((cur + 1) % L), [cur, go, L])

  // ── 箭头显隐：触摸/点击后显示，3秒无操作后隐藏 ──
  const showArrows = () => {
    setArrowsVisible(true)
    clearTimeout(arrowTimer.current)
    arrowTimer.current = setTimeout(() => setArrowsVisible(false), 3000)
  }

  // ── 手动滑动 ──
  const handleTouchStart = (e) => {
    showArrows()
    setTouchStartX(e.targetTouches[0].clientX)
  }
  const handleTouchEnd = (e) => {
    const dx = touchStartX - e.changedTouches[0].clientX
    if (Math.abs(dx) > 40) { clearInterval(timer.current); dx > 0 ? next() : prev() }
  }

  // ── 箭头条公共样式 ──
  const arrowBar = {
    position: 'absolute', top: 0, bottom: 0, width: 32,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', zIndex: 2, opacity: 0, transition: 'opacity 0.3s',
    border: 'none', outline: 'none', padding: 0, background: 'transparent',
  }

  return (
    <div style={{ padding: '0 20px', marginBottom: 0 }}>
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ position: 'relative', borderRadius: 3, overflow: 'hidden', height: 140, cursor: 'pointer' }}
        className={'banner-container' + (arrowsVisible ? ' arrows-visible' : '')}
      >
        <img src={BANNER_ITEMS[cur].img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />

        {/* 左箭头 */}
        <button className="arrow-bar" onClick={prev} style={{ ...arrowBar, left: 0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" opacity="0.85">
            <polyline points="15,3 7,12 15,21" />
          </svg>
        </button>

        {/* 右箭头 */}
        <button className="arrow-bar" onClick={next} style={{ ...arrowBar, right: 0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" opacity="0.85">
            <polyline points="9,3 17,12 9,21" />
          </svg>
        </button>

        {/* 底部文字 + 指示点 */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '10px 12px',
          background: 'linear-gradient(transparent, rgba(0,0,0,0.5))',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
          pointerEvents: 'none',
        }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{BANNER_ITEMS[cur].title}</div>
          <span style={{ display: 'flex', gap: 5, alignItems: 'flex-end', paddingBottom: 3, pointerEvents: 'auto' }}>
            {BANNER_ITEMS.map((item, i) => (
              <span key={item.id} onClick={e => { e.stopPropagation(); go(i) }} style={{
                display: 'inline-block', width: i === cur ? 14 : 5, height: 5,
                borderRadius: 3, background: i === cur ? '#fff' : 'rgba(255,255,255,0.4)',
                cursor: 'pointer', transition: 'all 0.3s',
              }} />
            ))}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── 提醒卡片 ──
function ReminderCards() {
  const navigate = useNavigate()
  const [cardType, setCardType] = useState('booking')
  const bookings = mockStore.bookings.filter(b => b.user_id === 'u0')
  const published = mockStore.activities.filter(a => a.user_id === 'u0')
  const latestBooking = bookings.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
  const latestPub = published.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
  const bAct = latestBooking ? mockStore.activities.find(a => a.id === latestBooking.activity_id) : null
  const bSession = latestBooking ? mockStore.activity_sessions.find(s => s.id === latestBooking.session_id) : null

  const isBooking = cardType === 'booking'

  return (
    <div style={{ padding: '4px 20px' }}>
      <div onClick={() => navigate(isBooking ? '/bookings' : '/profile')} style={{
        padding: '4px 12px', background: '#fff', borderRadius: 3, cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        {/* 左侧切换 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, flexShrink: 0 }}>
          <button onClick={e => { e.stopPropagation(); setCardType('booking') }} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '1px 0',
            fontSize: 11, fontWeight: isBooking ? 600 : 400, color: isBooking ? '#111' : '#ccc',
            borderBottom: isBooking ? '2px solid #111' : '2px solid transparent',
          }}>我的预约</button>
          <button onClick={e => { e.stopPropagation(); setCardType('published') }} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '3px 0',
            fontSize: 12, fontWeight: !isBooking ? 600 : 400, color: !isBooking ? '#111' : '#ccc',
            borderBottom: !isBooking ? '2px solid #111' : '2px solid transparent',
          }}>我的发布</button>
        </div>

        {/* 分隔线 */}
        <div style={{ width: 1, alignSelf: 'stretch', background: '#eee', flexShrink: 0 }} />

        {/* 内容 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {isBooking ? (
            latestBooking && bAct ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  <span style={{ fontSize: 12, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {bSession ? fmtDate(bSession.planned_start_time) : ''}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  <span style={{ fontSize: 13, color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {bAct.location_name || bAct.title}
                  </span>
                </div>
              </>
            ) : (
              <div style={{ fontSize: 13, color: '#999' }}>暂无预约</div>
            )
          ) : (
            latestPub ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  <span style={{ fontSize: 12, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {fmtDate(latestPub.created_at)}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  <span style={{ fontSize: 13, color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {latestPub.location_name || latestPub.city}
                  </span>
                </div>
              </>
            ) : (
              <div style={{ fontSize: 13, color: '#999' }}>暂无发布</div>
            )
          )}
        </div>

        {/* 右侧数字 */}
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#111', lineHeight: 1 }}>
            {isBooking ? bookings.length : published.length}
          </div>
          <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>{isBooking ? '总预约' : '总发布'}</div>
        </div>
      </div>
    </div>
  )
}
