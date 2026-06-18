import { useNavigate } from 'react-router-dom'
import { mockProfiles, mockStore } from '../../lib/mockData'
import { useUserPopup } from '../shared/UserPopup'
import styles from './ActivityCard.module.css'

// 获取活动显示时间：有期次→最新期次时间，无期次→活动时间
function getDisplayTime(act) {
  const sessions = mockStore.activity_sessions.filter(s => s.activity_id === act.id)
  if (sessions.length > 0) {
    const latest = sessions.reduce((max, s) => new Date(s.planned_start_time) > new Date(max.planned_start_time) ? s : max, sessions[0])
    const d = new Date(latest.planned_start_time)
    return { dateStr: `${d.getMonth() + 1}月${d.getDate()}日`, timeStr: d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }), isEventTime: false }
  }
  return null
}

// 状态标签 → CSS 类名映射
const badgeClassMap = { open: 'statusOpen', booking: 'statusBooking', ongoing: 'statusOngoing', ended: 'statusEnded', upcoming: 'statusUpcoming', full: 'statusEnded' }
function badgeClass(cls) { return styles[badgeClassMap[cls] || 'statusOpen'] }
function getStatusBadge(act) {
  const sessions = mockStore.activity_sessions.filter(s => s.activity_id === act.id)
  if (sessions.length > 0) {
    const now = Date.now()
    // 检查各期次状态
    let hasBooking = false, hasOngoing = false, allEnded = true
    for (const s of sessions) {
      const bookingStart = new Date(s.booking_start_time || 0).getTime()
      const bookingEnd = new Date(s.booking_end_time || 0).getTime()
      const startTime = new Date(s.planned_start_time).getTime()
      const endTime = new Date(s.end_time).getTime()
      if (now >= bookingStart && now <= bookingEnd) hasBooking = true
      if (now >= startTime && now <= endTime) hasOngoing = true
      if (endTime > now) allEnded = false
    }
    if (hasBooking) return { text: '预约中', cls: 'booking' }
    if (hasOngoing) return { text: '进行中', cls: 'ongoing' }
    if (allEnded) return { text: '已结束', cls: 'ended' }
    return { text: '即将开始', cls: 'upcoming' }
  }
  // 无期次：开放申请
  return act.applicants_count >= act.max_applicants
    ? { text: '名额已满', cls: 'full' }
    : { text: '开放申请', cls: 'open' }
}

// ── Variant: 图文卡片（默认） ──
function CardImageText({ act, index, onClick, showUserPopup }) {
  const user = mockProfiles.find(p => p.id === act.user_id)
  const isNew = (Date.now() - new Date(act.created_at).getTime()) / (1000 * 60 * 60 * 24) < 7
  const displayTime = getDisplayTime(act)
  const statusBadge = getStatusBadge(act)
  const d = new Date(act.created_at)
  const dateStr = displayTime ? displayTime.dateStr : `${d.getMonth() + 1}月${d.getDate()}日`
  const timeStr = displayTime ? displayTime.timeStr : new Date(act.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className={styles.card} onClick={() => onClick(act.id)}>
      <div className={styles.cardBody}>
        <div className={styles.cardTop}>
          <div className={styles.cardTitleRow}>
            <h3 className={styles.cardTitle}>{act.title}</h3>
            {isNew && <span className={styles.newBadge}>新</span>}
          </div>
          <span className={badgeClass(statusBadge.cls)}>{statusBadge.text}</span>
        </div>
        <div className={styles.cardMeta}>
          <img src={user?.avatar || '/default-avatar.png'} alt="" className={styles.metaAvatar} onClick={(e) => { e.stopPropagation(); if (user) showUserPopup({ id: user.id, name: user.nickname, avatar: user.avatar, bio: user.bio }) }} style={{ cursor: 'pointer' }} />
          <span className={styles.metaName}>{user?.nickname || act.organizer_name}</span>
          <span className={styles.metaSep}>·</span>
          <span className={styles.metaCity}>{act.city}</span>
          <span className={styles.metaSep}>·</span>
          <span className={styles.metaDate}>{dateStr} {timeStr}</span>
        </div>
        <div className={styles.cardImages}>
          {[...Array(3)].map((_, i) => {
            const img = act.images[i] || act.cover_url
            return <img key={i} src={img} alt="" className={styles.cardImg} />
          })}
        </div>
      </div>
    </div>
  )
}

// ── Variant: 纯文字卡片 ──
function CardTextOnly({ act, index, onClick, showUserPopup }) {
  const user = mockProfiles.find(p => p.id === act.user_id)
  const d = new Date(act.created_at)
  const displayTime = getDisplayTime(act)
  const statusBadge = getStatusBadge(act)
  const dateStr = displayTime ? displayTime.dateStr : `${d.getMonth() + 1}月${d.getDate()}日`
  const timeStr = displayTime ? displayTime.timeStr : d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className={styles.textCard} onClick={() => onClick(act.id)}>
      <div className={styles.textCardBody}>
        <div className={styles.textTitleRow}>
          <h3 className={styles.textTitle}>{act.title}</h3>
          <span className={badgeClass(statusBadge.cls)}>{statusBadge.text}</span>
        </div>
        <div className={styles.textMeta}>
          <img src={user?.avatar || '/default-avatar.png'} alt="" className={styles.textMetaAvatar} onClick={(e) => { e.stopPropagation(); if (user) showUserPopup({ id: user.id, name: user.nickname, avatar: user.avatar, bio: user.bio }) }} style={{ cursor: 'pointer' }} />
          <span>{user?.nickname || act.organizer_name}</span>
          <span className={styles.textSep}>·</span>
          <span>{act.city}</span>
          <span className={styles.textSep}>·</span>
          <span>{dateStr} {timeStr}</span>
        </div>
      </div>
    </div>
  )
}

// ── Variant: 大图卡片 ──
function CardHero({ act, index, onClick, showUserPopup }) {
  const user = mockProfiles.find(p => p.id === act.user_id)
  const d = new Date(act.created_at)
  const displayTime = getDisplayTime(act)
  const statusBadge = getStatusBadge(act)
  const dateStr = displayTime ? displayTime.dateStr : `${d.getMonth() + 1}月${d.getDate()}日`
  const timeStr = displayTime ? displayTime.timeStr : new Date(act.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className={styles.heroCard} onClick={() => onClick(act.id)}>
      <div className={styles.heroCover}>
        <img src={act.cover_url} alt="" className={styles.heroImg} />
        <span className={`${styles.heroStatus} ${badgeClass(statusBadge.cls)}`}>{statusBadge.text}</span>
      </div>
      <div className={styles.heroBody}>
        <h3 className={styles.heroTitle}>{act.title}</h3>
        <div className={styles.heroMeta}>
          <img src={user?.avatar || '/default-avatar.png'} alt="" className={styles.heroAvatar} onClick={(e) => { e.stopPropagation(); if (user) showUserPopup({ id: user.id, name: user.nickname, avatar: user.avatar, bio: user.bio }) }} style={{ cursor: 'pointer' }} />
          <span className={styles.heroName}>{user?.nickname || act.organizer_name}</span>
          <span className={styles.heroSep}>·</span>
          <span className={styles.heroCity}>{act.city}</span>
          <span className={styles.heroSep}>·</span>
          <span className={styles.heroDate}>{dateStr} {timeStr}</span>
        </div>
        <p className={styles.heroDesc}>{act.description}</p>
      </div>
    </div>
  )
}

// ── Variant: 大卡片纯文字 ──
function CardLargeText({ act, index, onClick, showUserPopup }) {
  const user = mockProfiles.find(p => p.id === act.user_id)
  const d = new Date(act.created_at)
  const displayTime = getDisplayTime(act)
  const statusBadge = getStatusBadge(act)
  const dateStr = displayTime ? displayTime.dateStr : `${d.getMonth() + 1}月${d.getDate()}日`
  const timeStr = displayTime ? displayTime.timeStr : d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className={styles.compactCard} onClick={() => onClick(act.id)}>
      <div className={styles.compactBody}>
        <div className={styles.compactTop}>
          <h3 className={styles.compactTitle}>{act.title}</h3>
          <span className={badgeClass(statusBadge.cls)}>{statusBadge.text}</span>
        </div>
        <div className={styles.compactMeta}>
          <img src={user?.avatar || '/default-avatar.png'} alt="" className={styles.compactAvatar} onClick={(e) => { e.stopPropagation(); if (user) showUserPopup({ id: user.id, name: user.nickname, avatar: user.avatar, bio: user.bio }) }} style={{ cursor: 'pointer' }} />
          <span className={styles.compactName}>{user?.nickname || act.organizer_name}</span>
          <span className={styles.compactSep}>·</span>
          <span>{act.city}</span>
          <span className={styles.compactSep}>·</span>
          <span>{dateStr} {timeStr}</span>
        </div>
        <p className={styles.compactDesc}>{act.description}</p>
      </div>
    </div>
  )
}

// ── 统一入口 ──
const VARIANTS = {
  default: CardImageText,
  'text-only': CardTextOnly,
  hero: CardHero,
  compact: CardLargeText,
}

export default function ActivityCard({ act, index = 0, variant = 'default' }) {
  const navigate = useNavigate()
  const { showUserPopup } = useUserPopup()
  const handleClick = (id) => navigate(`/activity/${id}`)

  const VariantComp = VARIANTS[variant] || VARIANTS.default
  return <VariantComp act={act} index={index} onClick={handleClick} showUserPopup={showUserPopup} />
}

export { VARIANTS }
