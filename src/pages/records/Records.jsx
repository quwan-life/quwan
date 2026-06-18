import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'
import { showToast } from '../../lib/utils'
import RecordCard from '../../components/record/RecordCard'
import PageHeader from '../../components/shared/PageHeader'
import styles from './Records.module.css'

export default function Records() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [records, setRecords] = useState([])
  const [experiences, setExperiences] = useState([])
  const [selectedExpId, setSelectedExpId] = useState(null)
  const [activeFilter, setActiveFilter] = useState('全部')
  const [loading, setLoading] = useState(true)
  const [followingIds, setFollowingIds] = useState(new Set())
  const [userCity, setUserCity] = useState(() => {
    try { return localStorage.getItem('quwan_city') || '上海' } catch { return '上海' }
  })

  useEffect(() => {
    loadRecords()
    if (user) { loadExperiences(); loadFollowing() }
  }, [user])

  const loadRecords = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('records')
      .select('*, profiles:user_id(nickname, avatar, numeric_id)')
      .order('created_at', { ascending: false })

    if (!error && data) {
      const [savesRes, countsRes] = await Promise.all([
        user ? supabase.from('saves').select('record_id').eq('user_id', user.id) : Promise.resolve({ data: [] }),
        data.length > 0 ? supabase.from('saves').select('record_id').in('record_id', data.map(r => r.id)) : Promise.resolve({ data: [] }),
      ])
      const savedIds = new Set((savesRes.data || []).map(s => s.record_id))
      const saveCounts = {}
      ;(countsRes.data || []).forEach(c => { saveCounts[c.record_id] = (saveCounts[c.record_id] || 0) + 1 })

      // 批量获取活动城市
      const activityNames = [...new Set(data.map(r => r.activity_name).filter(Boolean))]
      const cityMap = {}
      if (activityNames.length > 0) {
        const { data: acts } = await supabase.from('activities').select('title, city').in('title', activityNames)
        ;(acts || []).forEach(a => { cityMap[a.title] = a.city || '' })
      }

      const mapped = data.map(r => ({
        ...r,
        user_nickname: r.profiles?.nickname || '用户',
        user_avatar: r.profiles?.avatar || '/default-avatar.png',
        user_numeric_id: r.profiles?.numeric_id,
        saved: savedIds.has(r.id),
        save_count: saveCounts[r.id] || 0,
        activity_city: cityMap[r.activity_name] || '',
      }))
      setRecords(mapped)
    }
    setLoading(false)
  }

  const loadExperiences = async () => {
    const { data: bookings } = await supabase
      .from('bookings')
      .select('session_id, activity_sessions(activity_id, session_number, end_time, activities(title, cover_url, id, city))')
      .eq('user_id', user.id)
      .in('status', ['confirmed'])

    if (bookings) {
      const seen = new Set()
      const exps = bookings
        .filter(b => {
          const a = b.activity_sessions?.activities
          if (!a || seen.has(a.id)) return false
          seen.add(a.id)
          return true
        })
        .map(b => ({
          id: b.activity_sessions?.activities?.id,
          title: b.activity_sessions?.activities?.title || '',
          cover: b.activity_sessions?.activities?.cover_url || '',
          city: b.activity_sessions?.activities?.city || '',
          session_label: `第${b.activity_sessions?.session_number || 1}期`,
          hasRecord: false,
        }))
      setExperiences(exps)
    }
  }

  const handleSelectExp = (exp) => {
    setSelectedExpId(exp.id === selectedExpId ? null : exp.id)
  }

  const loadFollowing = async () => {
    const { data } = await supabase.from('follows').select('user_id').eq('follower_id', user.id)
    setFollowingIds(new Set((data || []).map(f => f.user_id)))
  }

  const handleWriteClick = () => {
    const exp = selectedExpId ? experiences.find(e => e.id === selectedExpId) : experiences[0]
    if (exp) navigate('/records/create', { state: { experience: exp } })
  }

  const handleSave = async (id) => {
    await supabase.rpc('toggle_save', { p_record_id: id })
    setRecords(prev => prev.map(r =>
      r.id === id
        ? { ...r, saved: !r.saved, save_count: r.saved ? (r.save_count - 1) : (r.save_count + 1) }
        : r
    ))
  }

  const filters = ['全部', '热门', '关注', '附近', '我的收藏']

  const filteredRecords = useMemo(() => {
    let result
    switch (activeFilter) {
      case '我的收藏':
        result = records.filter(r => r.saved)
        break
      case '关注':
        result = records.filter(r => followingIds.has(r.user_id))
        break
      case '附近':
        result = records.filter(r => r.activity_city === userCity)
        break
      case '热门':
        result = [...records].sort((a, b) => (b.save_count || 0) - (a.save_count || 0))
        break
      default:
        result = [...records].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    }
    return result
  }, [records, activeFilter])

  if (loading) return <div className="page-container" style={{ padding: 0 }}><PageHeader title="记录" /><div className="empty-state">加载中...</div></div>

  return (
    <div className="page-container" style={{ padding: 0 }}>
      <PageHeader title="记录" />

      {/* 我完成的体验 */}
      <div className={styles.experienceSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>记录你的体验</div>
        </div>

        {experiences.length === 0 ? (
          <div className={styles.emptyExp}>你暂时没有体验完成的项目</div>
        ) : (
          <>
            <div className={styles.experienceScroll}>
          {experiences.map(exp => (
            <div
              key={exp.id}
              className={`${styles.expCard} ${exp.id === selectedExpId ? styles.selected : ''}`}
              onClick={() => handleSelectExp(exp)}
            >
              <img className={styles.expCover} src={exp.cover} alt="" loading="lazy" />
              <div className={styles.expLabel}>{exp.title}</div>
              {exp.id === selectedExpId && <div className={styles.checkMark}>✓</div>}
            </div>
          ))}
        </div>

        <button
          className={`${styles.writeRecordBtn} ${!selectedExpId ? styles.writeDisabled : ''}`}
          onClick={handleWriteClick}
          disabled={!selectedExpId}
        >
          <svg className={styles.penIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
          <span>{selectedExpId ? '写记录' : '请先选择一个体验'}</span>
        </button>
          </>
        )}
      </div>

      {/* 大家的记录 */}
      <div className={styles.feedHeader}>
        <div className={styles.filterTabs}>
          {filters.map(f => (
            <button
              key={f}
              className={`${styles.filterTab} ${activeFilter === f ? styles.active : ''}`}
              onClick={() => setActiveFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.feedList}>
        {filteredRecords.map(record => (
          <RecordCard
            key={record.id}
            record={record}
            onSave={() => handleSave(record.id)}
          />
        ))}
      </div>
    </div>
  )
}
