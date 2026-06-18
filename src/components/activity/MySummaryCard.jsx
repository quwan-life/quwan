import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'
import styles from './MySummaryCard.module.css'

export default function MySummaryCard() {
  const { user } = useAuth()
  const [tab, setTab] = useState('booking')
  const [summary, setSummary] = useState({
    bookings: { count: 0, nextDate: '', nextLocation: '' },
    posts: { count: 0, nextDate: '', nextLocation: '' },
  })

  useEffect(() => {
    if (!user) return
    loadSummary()
  }, [user])

  const loadSummary = async () => {
    // 预约总数
    const { count: bookingsCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .in('status', ['confirmed'])

    // 最近一次预约
    const { data: bookings } = await supabase
      .from('bookings')
      .select('*, activity_sessions(*, activities(*))')
      .eq('user_id', user.id)
      .in('status', ['confirmed'])
      .order('created_at', { ascending: false })
      .limit(1)

    // 发布总数
    const { count: postsCount } = await supabase
      .from('activities')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    // 最近一次发布
    const { data: nextActivity } = await supabase
      .from('activities')
      .select('*, activity_sessions(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)

    const nextBooking = bookings?.[0]
    const nextPost = nextActivity?.[0]
    const postSession = nextPost?.activity_sessions?.[0]

    const fmtDate = (iso) => {
      if (!iso) return { date: '', weekday: '', daysLeft: 0, time: '' }
      const d = new Date(iso)
      const weekdays = ['周日','周一','周二','周三','周四','周五','周六']
      return {
        date: d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
        weekday: weekdays[d.getDay()],
        daysLeft: Math.max(0, Math.ceil((d - new Date()) / 86400000)),
        time: d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0'),
      }
    }

    const bookingDate = fmtDate(nextBooking?.activity_sessions?.planned_start_time)
    const postDate = fmtDate(postSession?.planned_start_time)

    setSummary({
      bookings: {
        count: bookingsCount || 0,
        date: bookingDate.date,
        time: bookingDate.time,
        weekday: bookingDate.weekday,
        daysLeft: bookingDate.daysLeft,
        location: nextBooking?.activity_sessions?.activities?.location_name || '',
      },
      posts: {
        count: postsCount || 0,
        date: postDate.date,
        time: postDate.time,
        weekday: postDate.weekday,
        daysLeft: postDate.daysLeft,
        location: nextPost?.location_name || '',
      },
    })
  }

  const d = tab === 'booking' ? summary.bookings : summary.posts

  return (
    <div className={styles.card}>
      <div className={styles.tabs}>
        <div className={`${styles.tab} ${tab === 'booking' ? styles.tabActive : ''}`} onClick={() => setTab('booking')}>我的预约</div>
        <div className={`${styles.tab} ${tab === 'post' ? styles.tabActive : ''}`} onClick={() => setTab('post')}>我的发布</div>
      </div>
      <div className={styles.info}>
        {d.date && (
          <>
            <div className={styles.row}>
              <span>{d.date} {d.weekday} {d.time}</span>
              {d.daysLeft > 0 && <span className={styles.badge}>{d.daysLeft}天后</span>}
            </div>
            <div className={styles.loc}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              {d.location || '暂无'}
            </div>
          </>
        )}
      </div>
      <div className={styles.right}>
        <div className={styles.num}>{d.count}</div>
        <div className={styles.label}>{tab === 'booking' ? '总预约' : '总发布'}</div>
      </div>
    </div>
  )
}
