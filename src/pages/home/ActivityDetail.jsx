import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/AuthContext'
import { mockStore, addMockSession } from '../../lib/mockData'
import { useUserPopup } from '../../components/shared/UserPopup'
import BookingModal from '../../components/activity/BookingModal'
import RecordCard from '../../components/record/RecordCard'
import { computeSessionStatus } from '../../components/activity/SessionCard'
import { showToast } from '../../lib/utils'
import styles from './ActivityDetail.module.css'

export default function ActivityDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showUserPopup } = useUserPopup()
  const [activity, setActivity] = useState(null)
  const [sessions, setSessions] = useState([])
  const [selectedSession, setSelectedSession] = useState(null)
  const [showBooking, setShowBooking] = useState(false)
  const [showAddSession, setShowAddSession] = useState(false)
  const [editingSessionId, setEditingSessionId] = useState(null)
  const [sessionForm, setSessionForm] = useState({
    bookingStartDate: '', bookingStartTime: '', bookingEndDate: '', bookingEndTime: '',
    plannedStartDate: '', plannedStartTime: '', plannedEndDate: '', plannedEndTime: '',
    capacity: '2', allowWaitlist: false, price: '', priceFree: false,
  })
  const [eventTimeValue, setEventTimeValue] = useState('')
  const [confirmedEventTime, setConfirmedEventTime] = useState('')

  // ── 封面轮播（hooks 必须在 early return 之前） ──
  const [curSlide, setCurSlide] = useState(0)
  const [touchStartX, setTouchStartX] = useState(0)

  const [records, setRecords] = useState([])

  useEffect(() => {
    const act = mockStore.activities.find(a => a.id === id)
    setActivity(act || null)
    if (act) {
      const sess = mockStore.activity_sessions.filter(s => s.activity_id === act.id)
      setSessions(sess)
      setSelectedSession(sess[0] || null)
      const recs = mockStore.records.filter(r => r.activity_id === act.id)
      setRecords(recs)
    }
  }, [id])

  if (!activity) {
    return (
      <div className={styles.page}>
        <div className={styles.empty}>加载中...</div>
      </div>
    )
  }

  const isOwner = user && user.id === activity.user_id
  const isAdmin = user && (user.role === 'admin' || user.role === 'superadmin')
  const canEdit = isOwner || isAdmin

  // 初始化编辑表单
  const openEditSession = (s) => {
    const toDate = (iso) => {
      if (!iso) return { date: '', time: '' }
      const d = new Date(iso)
      const pad = n => String(n).padStart(2, '0')
      return {
        date: `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`,
        time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
      }
    }
    const bs = toDate(s.booking_start_time)
    const be = toDate(s.booking_end_time)
    const ps = toDate(s.planned_start_time)
    const pe = toDate(s.end_time)
    setSessionForm({
      bookingStartDate: bs.date, bookingStartTime: bs.time,
      bookingEndDate: be.date, bookingEndTime: be.time,
      plannedStartDate: ps.date, plannedStartTime: ps.time,
      plannedEndDate: pe.date, plannedEndTime: pe.time,
      capacity: String(s.capacity || 2),
      allowWaitlist: false,
      price: s.price > 0 ? String(s.price / 100) : '',
      priceFree: s.price === 0,
    })
    setEditingSessionId(s.id)
  }

  // 表单通用输入样式
  const inputStyle = { flex: 1, minWidth: 0, padding: '10px 6px', border: '1px solid #e0e0e0', borderRadius: 3, fontSize: 14, color: '#333', outline: 'none', background: '#fafafa', height: 40, boxSizing: 'border-box' }

  const ToggleBtn = ({ on, labelOn, labelOff, onClick }) => (
    <span onClick={onClick} style={{
      flex: 1, minWidth: 0, cursor: 'pointer', textAlign: 'center', padding: '10px 6px',
      fontSize: 14, border: '1px solid', borderRadius: 3,
      background: on ? '#111' : '#fff', color: on ? '#fff' : '#999',
      borderColor: on ? '#111' : '#e0e0e0',
    }}>{on ? labelOn : labelOff}</span>
  )

  const FieldRow = ({ label, dateValue, timeValue, onDate, onTime }) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#333', width: 72, flexShrink: 0, paddingTop: 10 }}>{label}</span>
      <div style={{ flex: 1, display: 'flex', gap: 8 }}>
        <input type="date" value={dateValue || ''} onChange={e => onDate(e.target.value)} style={inputStyle} />
        <input type="time" value={timeValue || ''} onChange={e => onTime(e.target.value)} style={inputStyle} />
      </div>
    </div>
  )

  const DoubleRow = ({ label, left, right }) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#333', width: 72, flexShrink: 0, paddingTop: 10 }}>{label}</span>
      <div style={{ flex: 1, display: 'flex', gap: 8 }}>{left}{right}</div>
    </div>
  )

  const handleBooking = ({ name, phone, note, sessionId, customTime }) => {
    const booking = {
      id: `b_${Date.now()}`,
      user_id: 'u0',
      activity_id: activity.id,
      session_id: sessionId || null,
      name,
      phone,
      note,
      status: 'pending',
      created_at: new Date().toISOString(),
    }
    if (customTime) booking.custom_time = customTime
    mockStore.bookings.push(booking)

    // 创建预约请求通知（发布者视角）和预约结果记录（预约者视角）
    const now = new Date()
    const timeStr = now.toLocaleDateString('zh-CN') + ' ' + now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    const existing = mockStore.notifications.find(n => n.type === 'booking_request')
    if (existing) {
      existing.payload.items.push({
        user: '超级管理员', user_id: 'u0', avatar: 'https://picsum.photos/seed/admin/100/100',
        activity: activity.title, session: sessionId ? (selectedSession ? `第${selectedSession.session_number}期` : '') : null,
        name, phone, note: note || '', customTime: customTime || null,
        time: timeStr,
      })
      existing.unread_count = (existing.unread_count || 0) + 1
      existing.is_read = false
    }
    // 预约结果通知（预约者的流水记录）
    const resultNotif = mockStore.notifications.find(n => n.type === 'booking_result')
    if (resultNotif) {
      resultNotif.payload.items.push({
        activity: activity.title,
        session: sessionId ? (selectedSession ? `第${selectedSession.session_number}期` : '') : null,
        result: '待审核',
        customTime: customTime || null,
        name, phone, note: note || '', gender: '', age: '', withFamily: false,
        time: timeStr,
      })
      resultNotif.unread_count = (resultNotif.unread_count || 0) + 1
      resultNotif.is_read = false
      resultNotif.desc = `${timeStr} · 预约已发送，等待发布人确认`
    }
    showToast(customTime ? '已发送自定义时间预约，等待发布人确认' : '预约已发送，等待发布人确认')
    setShowBooking(false)
  }

  const statusLabel = activity.applicants_count >= activity.max_applicants ? '暂停申请' : '开放申请'

  // ── 封面轮播数据 ──
  const carouselImages = [activity.cover_url, ...(activity.images || [])]
  const totalSlides = carouselImages.length

  const handleTouchStart = (e) => {
    setTouchStartX(e.targetTouches[0].clientX)
  }
  const handleTouchEnd = (e) => {
    const dx = touchStartX - e.changedTouches[0].clientX
    if (Math.abs(dx) > 40) setCurSlide(c => (c + (dx > 0 ? 1 : -1) + totalSlides) % totalSlides)
  }

  const goSlide = (i) => setCurSlide(i)

  const handleSave = (recordId) => {
    const rec = records.find(r => r.id === recordId)
    if (rec) rec.saved = !rec.saved
    setRecords([...records])
  }

  return (
    <div className={styles.page}>
      {/* Cover Carousel */}
      <div
        className={'cover-carousel ' + styles.coverCarousel}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ width: '100%', height: 'calc(220px + var(--cover-safe-top, 0px))', background: '#e0e0e0', position: 'relative', overflow: 'hidden' }}
      >
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <img src={carouselImages[curSlide]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'opacity 0.3s' }} />

        {/* 指示点 */}
        {totalSlides > 1 && (
        <span style={{
          position: 'absolute', bottom: 10, right: 12, zIndex: 2,
          display: 'flex', gap: 5,
        }}>
          {carouselImages.map((_, i) => (
            <span key={i} onClick={e => { e.stopPropagation(); goSlide(i) }} style={{
              display: 'inline-block', width: i === curSlide ? 14 : 5, height: 5,
              borderRadius: 3, background: i === curSlide ? '#fff' : 'rgba(255,255,255,0.4)',
              cursor: 'pointer', transition: 'all 0.3s',
            }} />
          ))}
        </span>
        )}
      </div>


      <div className={styles.content}>
        <h1 className={styles.title}>{activity.title}</h1>

        {activity.industry && (
          <div className={styles.tags}>
            {activity.industry.split(/[,，、]/).filter(Boolean).map((t, i) => (
              <span key={i} className={styles.tag}>{t.trim()}</span>
            ))}
          </div>
        )}

        {/* Organization */}
        <div className={styles.orgCard}>
          <div className={styles.orgInfo}>
            <img src={activity.organizer_avatar || '/default-avatar.png'} alt="" className={styles.orgAvatar} onClick={() => showUserPopup({ id: activity.organizer_id || activity.id, name: activity.organizer_name, avatar: activity.organizer_avatar, bio: activity.organizer_bio || '长期活跃 · 诚信保障' })} style={{ cursor: 'pointer' }} />
            <div className={styles.orgText}>
              <div className={styles.orgName}>{activity.organizer_name}</div>
              <div className={styles.orgBio}>{activity.organizer_bio || '长期活跃 · 诚信保障'}</div>
            </div>
          </div>
        </div>

        <div className={styles.divider} />

        {/* 活动介绍 */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>活动介绍</h2>
          <p className={styles.sectionBody}>{activity.description}</p>
        </div>

        <div className={styles.divider} />

        {activity.requirements && (
          <>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>招募要求</h2>
              <p className={styles.sectionBody}>{activity.requirements}</p>
            </div>
            <div className={styles.divider} />
          </>
        )}

        {/* 途径地点 (研学路线) */}
        {activity.category_type === '研学路线' && activity.stops && activity.stops.length > 0 && (
          <>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>途径地点</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {activity.stops.map((stop, i) => (
                  <div key={i}>
                    <div
                      onClick={() => navigate(`/activity/${stop.activity_id}`)}
                      key={stop.activity_id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: 10,
                        background: '#fafafa', borderRadius: 3, cursor: 'pointer',
                        border: '1px solid #eee',
                      }}>
                      <img src={stop.cover_url} alt="" style={{ width: 48, height: 36, borderRadius: 3, objectFit: 'cover', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{stop.title}</div>
                        <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>第{i + 1}站 · 点击查看详情</div>
                      </div>
                      <span style={{ color: '#ccc', fontSize: 16 }}>→</span>
                    </div>
                    {i < activity.stops.length - 1 && (
                      <div style={{ display: 'flex', justifyContent: 'center', padding: '2px 0' }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2">
                          <line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.divider} />
          </>
        )}

        {/* 活动时间 — 发布人可切换 */}
        {canEdit && (
          <div className={styles.section} style={{ marginBottom: 16 }}>
            <h2 className={styles.sectionTitle}>活动时间</h2>
            {confirmedEventTime ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ flex: 1, fontSize: 13, color: '#333' }}>{new Date(confirmedEventTime).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })} {new Date(confirmedEventTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
                <span onClick={() => {
                  const s = mockStore.activity_sessions.filter(s => s.activity_id === activity.id)
                  if (s.length === 0) return
                  activity.application_notes = ''
                  setConfirmedEventTime('')
                  setEventTimeValue('')
                  setSessions(s)
                }} style={{ fontSize: 12, color: '#555', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: 3, padding: '6px 10px', cursor: 'pointer', whiteSpace: 'nowrap' }}>移除活动时间 设置期次</span>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="datetime-local" value={eventTimeValue} onChange={e => setEventTimeValue(e.target.value)}
                  style={{ flex: 1, padding: '10px 14px', fontSize: 14, border: '1px solid #e0e0e0', borderRadius: 3, color: eventTimeValue ? '#333' : '#ccc', background: '#fafafa', height: 40, boxSizing: 'border-box', outline: 'none' }} />
                {eventTimeValue && (
                  <span onClick={() => { activity.application_notes = eventTimeValue; setConfirmedEventTime(eventTimeValue); setSessions([]) }} style={{ padding: '10px 14px', fontSize: 14, color: '#fff', background: '#111', borderRadius: 3, cursor: 'pointer', whiteSpace: 'nowrap' }}>确定</span>
                )}
              </div>
            )}
            {!confirmedEventTime && sessions.length > 0 && (
              <div style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>当前为期次模式，活动时间未设置</div>
            )}
          </div>
        )}

        {/* 期次列表 — 有活动时间时收起 */}
        {!confirmedEventTime && (<>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>可选期次</h2>
          {sessions.length > 0 && (
            <div className={styles.sessionList}>
              {sessions.map(s => {
                const { label, cls, status } = computeSessionStatus(s)
                const isSelected = selectedSession?.id === s.id
                const canBook = ['upcoming', 'booking'].includes(status)
                const isEditing = editingSessionId === s.id
                return (
                  <div key={s.id}>
                    <div
                      className={`${styles.sessionItem} ${isSelected ? styles.sessionSelected : ''}`}
                      onClick={() => canBook && setSelectedSession(s)}
                    >
                      <div className={styles.sessionLeft}>
                        <span className={styles.sessionNum}>第{s.session_number}期</span>
                        <span className={`${styles.sessionStatus} ${styles[`session_${cls}`] || ''}`}>{label}</span>
                      </div>
                      <div className={styles.sessionRight}>
                        <div className={styles.sessionTime}>
                          {new Date(s.planned_start_time).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}
                          {' '}
                          {new Date(s.planned_start_time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                          {' — '}
                          {new Date(s.end_time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className={styles.sessionMeta}>
                          {s.price > 0 ? `¥${(s.price / 100).toFixed(0)}` : '免费'}
                          {' · '}
                          {s.booked_count}/{s.capacity}人
                        </div>
                      </div>
                      {isSelected && !canEdit && <span className={styles.sessionCheck}>✓</span>}
                      {canEdit && (
                        <span onClick={e => {
                          e.stopPropagation()
                          if (status === 'completed') {
                            if (window.confirm('此期次已经结束，是否继续编辑？')) {
                              openEditSession(s)
                            }
                          } else {
                            openEditSession(s)
                          }
                        }} style={{ flexShrink: 0, fontSize: 12, color: '#999', cursor: 'pointer', marginLeft: 8 }}>编辑</span>
                      )}
                    </div>
                    {/* 编辑表单 */}
                    {isEditing && (
                      <div style={{ marginTop: 12 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 8 }}>
                          编辑 {s.group_chat_name || `第${s.session_number}期`}
                        </div>
                        <FieldRow label="预约开始" dateValue={sessionForm.bookingStartDate} timeValue={sessionForm.bookingStartTime}
                          onDate={v => setSessionForm(p => ({...p, bookingStartDate: v}))} onTime={v => setSessionForm(p => ({...p, bookingStartTime: v}))} />
                        <FieldRow label="预约截止" dateValue={sessionForm.bookingEndDate} timeValue={sessionForm.bookingEndTime}
                          onDate={v => setSessionForm(p => ({...p, bookingEndDate: v}))} onTime={v => setSessionForm(p => ({...p, bookingEndTime: v}))} />
                        <FieldRow label="活动开始" dateValue={sessionForm.plannedStartDate} timeValue={sessionForm.plannedStartTime}
                          onDate={v => setSessionForm(p => ({...p, plannedStartDate: v}))} onTime={v => setSessionForm(p => ({...p, plannedStartTime: v}))} />
                        <FieldRow label="活动结束" dateValue={sessionForm.plannedEndDate} timeValue={sessionForm.plannedEndTime}
                          onDate={v => setSessionForm(p => ({...p, plannedEndDate: v}))} onTime={v => setSessionForm(p => ({...p, plannedEndTime: v}))} />
                        <DoubleRow label="人数上限"
                          left={<input type="number" min="1" value={sessionForm.capacity} onChange={e => setSessionForm(p => ({...p, capacity: e.target.value}))} placeholder="2" style={{...inputStyle, textAlign: 'center'}} />}
                          right={<ToggleBtn on={sessionForm.allowWaitlist} labelOn="支持候补" labelOff="是否支持候补" onClick={() => setSessionForm(p => ({...p, allowWaitlist: !p.allowWaitlist}))} />} />
                        <DoubleRow label="活动费用"
                          left={<input type="number" value={sessionForm.price} disabled={sessionForm.priceFree} onChange={e => setSessionForm(p => ({...p, price: e.target.value, priceFree: false}))} placeholder="0" style={{...inputStyle, textAlign: 'center'}} />}
                          right={<ToggleBtn on={sessionForm.priceFree} labelOn="已设免费" labelOff="免费" onClick={() => {
                            if (sessionForm.priceFree) { setSessionForm(p => ({...p, priceFree: false})) }
                            else { setSessionForm(p => ({...p, price: '', priceFree: true})) }
                          }} />} />
                        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                          <span onClick={() => {
                            if (!sessionForm.plannedStartDate) return
                            const startTime = new Date(`${sessionForm.plannedStartDate}T${sessionForm.plannedStartTime || '09:00'}:00+08:00`)
                            const endTime = new Date(`${sessionForm.plannedEndDate || sessionForm.plannedStartDate}T${sessionForm.plannedEndTime || '17:00'}:00+08:00`)
                            const bookingStart = sessionForm.bookingStartDate
                              ? new Date(`${sessionForm.bookingStartDate}T${sessionForm.bookingStartTime || '00:00'}:00+08:00`) : new Date()
                            const bookingEnd = sessionForm.bookingEndDate
                              ? new Date(`${sessionForm.bookingEndDate}T${sessionForm.bookingEndTime || '23:59'}:00+08:00`) : new Date(Date.now() + 7*86400000)
                            const data = {
                              booking_start_time: bookingStart.toISOString(), booking_end_time: bookingEnd.toISOString(),
                              planned_start_time: startTime.toISOString(), end_time: endTime.toISOString(),
                              capacity: parseInt(sessionForm.capacity) || 2,
                              price: sessionForm.priceFree ? 0 : (parseInt(sessionForm.price) * 100 || 0),
                            }
                            const idx = sessions.findIndex(ss => ss.id === s.id)
                            if (idx >= 0) {
                              const updated = sessions.map(ss => ss.id === s.id ? { ...ss, ...data } : ss)
                              const mockIdx = mockStore.activity_sessions.findIndex(ss => ss.id === s.id)
                              if (mockIdx >= 0) Object.assign(mockStore.activity_sessions[mockIdx], data)
                              setSessions(updated)
                            }
                            setEditingSessionId(null)
                          }} style={{
                            flex: 1, textAlign: 'center', padding: '10px 0', fontSize: 14, color: '#fff', background: '#111',
                            borderRadius: 3, cursor: 'pointer',
                          }}>确认修改</span>
                          <span onClick={() => setEditingSessionId(null)} style={{
                            flex: 1, textAlign: 'center', padding: '10px 0', fontSize: 14, color: '#999', background: '#f5f5f5',
                            borderRadius: 3, cursor: 'pointer',
                          }}>取消</span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
          {canEdit && (
            showAddSession ? (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 8 }}>
                  第{sessions.length + 1}期次
                </div>
                <FieldRow label="预约开始" dateValue={sessionForm.bookingStartDate} timeValue={sessionForm.bookingStartTime}
                  onDate={v => setSessionForm(p => ({...p, bookingStartDate: v}))} onTime={v => setSessionForm(p => ({...p, bookingStartTime: v}))} />
                <FieldRow label="预约截止" dateValue={sessionForm.bookingEndDate} timeValue={sessionForm.bookingEndTime}
                  onDate={v => setSessionForm(p => ({...p, bookingEndDate: v}))} onTime={v => setSessionForm(p => ({...p, bookingEndTime: v}))} />
                <FieldRow label="活动开始" dateValue={sessionForm.plannedStartDate} timeValue={sessionForm.plannedStartTime}
                  onDate={v => setSessionForm(p => ({...p, plannedStartDate: v}))} onTime={v => setSessionForm(p => ({...p, plannedStartTime: v}))} />
                <FieldRow label="活动结束" dateValue={sessionForm.plannedEndDate} timeValue={sessionForm.plannedEndTime}
                  onDate={v => setSessionForm(p => ({...p, plannedEndDate: v}))} onTime={v => setSessionForm(p => ({...p, plannedEndTime: v}))} />
                <DoubleRow label="人数上限"
                  left={<input type="number" min="1" value={sessionForm.capacity} onChange={e => setSessionForm(p => ({...p, capacity: e.target.value}))} placeholder="2" style={{...inputStyle, textAlign: 'center'}} />}
                  right={<ToggleBtn on={sessionForm.allowWaitlist} labelOn="支持候补" labelOff="是否支持候补" onClick={() => setSessionForm(p => ({...p, allowWaitlist: !p.allowWaitlist}))} />} />
                <DoubleRow label="活动费用"
                  left={<input type="number" value={sessionForm.price} disabled={sessionForm.priceFree} onChange={e => setSessionForm(p => ({...p, price: e.target.value, priceFree: false}))} placeholder="0" style={{...inputStyle, textAlign: 'center'}} />}
                  right={<ToggleBtn on={sessionForm.priceFree} labelOn="已设免费" labelOff="免费" onClick={() => {
                    if (sessionForm.priceFree) { setSessionForm(p => ({...p, priceFree: false})) }
                    else { setSessionForm(p => ({...p, price: '', priceFree: true})) }
                  }} />} />
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <span onClick={() => {
                    if (!sessionForm.plannedStartDate) return
                    const startTime = new Date(`${sessionForm.plannedStartDate}T${sessionForm.plannedStartTime || '09:00'}:00+08:00`)
                    const endTime = new Date(`${sessionForm.plannedEndDate || sessionForm.plannedStartDate}T${sessionForm.plannedEndTime || '17:00'}:00+08:00`)
                    const bookingStart = sessionForm.bookingStartDate
                      ? new Date(`${sessionForm.bookingStartDate}T${sessionForm.bookingStartTime || '00:00'}:00+08:00`) : new Date()
                    const bookingEnd = sessionForm.bookingEndDate
                      ? new Date(`${sessionForm.bookingEndDate}T${sessionForm.bookingEndTime || '23:59'}:00+08:00`) : new Date(Date.now() + 7*86400000)
                    const ns = addMockSession(activity.id, {
                      bookingStart: bookingStart.toISOString(), bookingEnd: bookingEnd.toISOString(),
                      startTime: startTime.toISOString(), endTime: endTime.toISOString(),
                      capacity: parseInt(sessionForm.capacity) || 2,
                      price: sessionForm.priceFree ? 0 : (parseInt(sessionForm.price) * 100 || 0),
                    })
                    activity.application_notes = ''  // 有期次则清除活动时间
                    setConfirmedEventTime('')
                    setSessions(prev => [...prev, ns])
                    setSelectedSession(ns)
                    setShowAddSession(false)
                    setSessionForm({ bookingStartDate: '', bookingStartTime: '', bookingEndDate: '', bookingEndTime: '', plannedStartDate: '', plannedStartTime: '', plannedEndDate: '', plannedEndTime: '', capacity: '2', allowWaitlist: false, price: '', priceFree: false })
                  }} style={{
                    flex: 1, textAlign: 'center', padding: '10px 0', fontSize: 14, color: '#fff', background: '#111',
                    borderRadius: 3, cursor: 'pointer',
                  }}>确认添加</span>
                  <span onClick={() => setShowAddSession(false)} style={{
                    flex: 1, textAlign: 'center', padding: '10px 0', fontSize: 14, color: '#999', background: '#f5f5f5',
                    borderRadius: 3, cursor: 'pointer',
                  }}>取消</span>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => setShowAddSession(true)} style={{
                marginTop: 10, width: '100%', padding: '8px 0', fontSize: 13, color: '#999',
                background: '#fff', border: '1px solid #e0e0e0', borderRadius: 3, cursor: 'pointer',
              }}>添加期次</button>
            )
          )}
        </div>
        </>)}
        <div className={styles.divider} />

        {/* 相关记录贴 */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            相关记录贴 <span className={styles.reviewTitleEn}>POSTS</span>
          </h2>
          {records.length === 0 ? (
            <p className={styles.emptyReview}>暂无记录</p>
          ) : (
            <div className={styles.reviewList}>
              {records.map(r => (
                <RecordCard key={r.id} record={r} onSave={() => handleSave(r.id)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className={styles.bottomBar}>
        <button className={styles.applyBtn} onClick={() => setShowBooking(true)}>
          立即预约
        </button>
      </div>

      {showBooking && (
        <BookingModal
          activity={activity}
          session={selectedSession}
          sessions={sessions}
          onSessionChange={(s) => setSelectedSession(s)}
          onSubmit={handleBooking}
          onClose={() => setShowBooking(false)}
        />
      )}
    </div>
  )
}
