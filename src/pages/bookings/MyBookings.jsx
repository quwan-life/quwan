import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'
import PageHeader from '../../components/shared/PageHeader'
import styles from './MyBookings.module.css'

const TABS = [
  { id: 'all', name: '全部' },
  { id: 'upcoming', name: '进行中' },
  { id: 'completed', name: '已完成' },
]

const STATUS_LABELS = {
  pending: '待确认',
  confirmed: '已确认',
  rejected: '已拒绝',
  cancelled: '已取消',
}

export default function MyBookings() {
  const [activeTab, setActiveTab] = useState('all')
  const [bookings, setBookings] = useState([])
  const [received, setReceived] = useState([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState('my') // my | received
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    if (!user) { setLoading(false); return }
    loadBookings()
  }, [user])

  const loadBookings = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('bookings')
      .select('*, activity_sessions(*, activities(*))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setBookings(data.map(b => ({
        id: b.id,
        activity_id: b.activity_sessions?.activity_id || b.activity_sessions?.activities?.id,
        title: b.activity_sessions?.activities?.title || '未知活动',
        cover: b.activity_sessions?.activities?.cover_url || '',
        status: b.status,
        statusText: STATUS_LABELS[b.status] || b.status,
        dateTime: b.activity_sessions?.planned_start_time
          ? new Date(b.activity_sessions.planned_start_time).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
          : '',
        location: b.activity_sessions?.activities?.location_name || '',
        session_number: b.activity_sessions?.session_number,
      })))
    }
    setLoading(false)
  }

  const loadReceived = async () => {
    setLoading(true)
    // 获取用户发布的所有活动的 session IDs
    const { data: acts } = await supabase.from('activities').select('id').eq('user_id', user.id)
    const activityIds = (acts || []).map(a => a.id)
    if (activityIds.length === 0) { setReceived([]); setLoading(false); return }

    const { data: sessions } = await supabase.from('activity_sessions').select('id').in('activity_id', activityIds)
    const sessionIds = (sessions || []).map(s => s.id)
    if (sessionIds.length === 0) { setReceived([]); setLoading(false); return }

    const { data: rData } = await supabase
      .from('bookings')
      .select('*, activity_sessions(*, activities(*))')
      .in('session_id', sessionIds)
      .order('created_at', { ascending: false })

    if (rData) {
      setReceived(rData.map(b => ({
        id: b.id,
        title: b.activity_sessions?.activities?.title || '',
        sessionNumber: b.activity_sessions?.session_number,
        status: b.status,
        statusText: STATUS_LABELS[b.status] || b.status,
        contact: b.contact || '',
        note: b.note || '',
        count: b.count || 1,
      })))
    }
    setLoading(false)
  }

  const handleApprove = async (id) => {
    await supabase.rpc('approve_booking', { p_booking_id: id, p_action: 'confirm' })
    setReceived(prev => prev.map(b => b.id === id ? { ...b, status: 'confirmed', statusText: '已确认' } : b))
  }
  const handleReject = async (id) => {
    await supabase.rpc('approve_booking', { p_booking_id: id, p_action: 'reject' })
    setReceived(prev => prev.map(b => b.id === id ? { ...b, status: 'rejected', statusText: '已拒绝' } : b))
  }

  const now = Date.now()
  const filtered = activeTab === 'all'
    ? bookings
    : activeTab === 'upcoming'
      ? bookings.filter(b => !['completed', 'cancelled'].includes(b.status))
      : bookings.filter(b => b.status === 'completed')

  if (loading) return <div className="page-container"><div className="empty-state">加载中...</div></div>

  return (
    <div className="page-container">
      <PageHeader title={mode === 'my' ? '我的预约' : '收到的预约'} onBack={() => navigate(-1)} />

      <div className={styles.modeRow}>
        <button className={`${styles.modeBtn} ${mode === 'my' ? styles.modeActive : ''}`} onClick={() => setMode('my')}>我的预约</button>
        <button className={`${styles.modeBtn} ${mode === 'received' ? styles.modeActive : ''}`} onClick={() => { setMode('received'); loadReceived() }}>收到的预约</button>
      </div>

      {mode === 'my' ? (<>
      <div className={styles.tabs}>
        {TABS.map(t => (
          <button
            key={t.id}
            className={`${styles.tab} ${activeTab === t.id ? styles.active : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.name}
          </button>
        ))}
      </div>

      <div className={styles.list}>
        {filtered.length === 0 ? (
          <div className="empty-state">暂无预约记录</div>
        ) : (
          filtered.map(b => (
            <div key={b.id} className={styles.item} onClick={() => navigate(`/activity/${b.activity_id}`)}>
              <img className={styles.cover} src={b.cover} alt="" loading="lazy" />
              <div className={styles.info}>
                <div className={styles.title}>{b.title}</div>
                <div className={styles.meta}>
                  <span className={`${styles.status} ${styles[b.status] || ''}`}>{b.statusText}</span>
                  <span className={styles.time}>{b.dateTime}</span>
                </div>
                <div className={styles.loc}>
                  <span className={styles.locIcon}>📍</span>
                  <span className={styles.locText}>{b.location}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      </>) : (
      <div className={styles.list}>
        {received.length === 0 ? <div className="empty-state">暂无收到的预约</div> :
          received.map(b => (
            <div key={b.id} className={styles.item}>
              <div className={styles.info} style={{ flex: 1 }}>
                <div className={styles.title}>{b.title} · 第{b.sessionNumber}期</div>
                <div className={styles.desc}>{b.contact} · {b.count}人{b.note ? ' · ' + b.note : ''}</div>
                <div className={styles.status}>{b.statusText}</div>
              </div>
              {b.status === 'pending' && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className={styles.approveBtn} onClick={() => handleApprove(b.id)}>通过</button>
                  <button className={styles.rejectBtn} onClick={() => handleReject(b.id)}>拒绝</button>
                </div>
              )}
            </div>
          ))}
      </div>
      )}
    </div>
  )
}
