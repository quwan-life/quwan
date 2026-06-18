import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { mockStore } from '../../lib/mockData'
import styles from './AdminReview.module.css'

const statusMap = {
  pending_review: { label: '待审核', color: '#f0a500' },
  active: { label: '已通过', color: '#4caf50' },
  rejected: { label: '已拒绝', color: '#e53935' },
}

const featuredLabels = { 1: '位置1', 2: '位置2', 3: '位置3' }

export default function AdminReview() {
  const navigate = useNavigate()
  const [activities, setActivities] = useState([])
  const [filter, setFilter] = useState('pending_review')
  const [rejectId, setRejectId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [featuredId, setFeaturedId] = useState(null)

  useEffect(() => {
    loadActivities()
  }, [])

  const loadActivities = () => {
    // mock 数据：给活动加上不同审核状态
    const data = mockStore.activities.map((a, i) => ({
      ...a,
      organizer_name: a.organizer_name || '发布人',
      date: '2026-06-' + (10 + i),
      featured: i === 0 ? 1 : null,
      status: i === 0 ? 'pending_review' : i === 1 ? 'active' : i === 2 ? 'rejected' : i < 5 ? 'pending_review' : 'active',
    }))
    setActivities(data)
  }

  const filtered = activities.filter(a => filter === 'all' || a.status === filter)

  const handleApprove = (id) => {
    setActivities(prev => prev.map(a => a.id === id ? { ...a, status: 'active' } : a))
  }

  const handleReject = (id) => {
    setActivities(prev => prev.map(a => a.id === id ? { ...a, status: 'rejected' } : a))
    setRejectId(null); setRejectReason('')
  }

  const handleFeature = (id, pos) => {
    setActivities(prev => {
      const next = prev.map(a => {
        if (a.id === id) return { ...a, featured: a.featured === pos ? null : pos }
        if (a.featured === pos) return { ...a, featured: null }
        return a
      })
      window.__featuredActivities = next.filter(a => a.featured)
      return next
    })
    setFeaturedId(null)
  }

  return (
    <div className="page-container">

      <div className={styles.toolbar}>
        <div className={styles.filters}>
          {[
            { id: 'pending_review', label: '待审核' },
            { id: 'active', label: '已通过' },
            { id: 'rejected', label: '已拒绝' },
            { id: 'all', label: '全部' },
          ].map(f => (
            <button
              key={f.id}
              className={`${styles.filterBtn} ${filter === f.id ? styles.active : ''}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.list}>
        {filtered.map(a => {
          const st = statusMap[a.status] || { label: a.status, color: '#999' }
          return (
            <div key={a.id} className={styles.card} onClick={() => navigate(`/activity/${a.id}`)}>
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>{a.title}</span>
                <span className={styles.statusTag} style={{ background: st.color }}>{st.label}</span>
              </div>
              <div className={styles.cardBody}>
                <span>{a.organizer_name}</span>
                <span>{a.date}</span>
                {a.featured && <span className={styles.featuredBadge}>轮播{featuredLabels[a.featured]}</span>}
              </div>
              {a.status === 'active' && (
                <div className={styles.cardActions} onClick={e => e.stopPropagation()}>
                  <button className={styles.featureBtn} onClick={() => setFeaturedId(featuredId === a.id ? null : a.id)}>
                    {a.featured ? `轮播${featuredLabels[a.featured]}` : '推荐轮播'}
                  </button>
                </div>
              )}
              {a.status === 'pending_review' && (
                <div className={styles.cardActions} onClick={e => e.stopPropagation()}>
                  <button className={styles.approveBtn} onClick={() => handleApprove(a.id)}>通过</button>
                  <button className={styles.rejectBtn} onClick={() => { setRejectId(a.id); setRejectReason('') }}>拒绝</button>
                  {rejectId === a.id && (
                    <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                      <input style={{ flex: 1, padding: '3px 8px', fontSize: 12, border: '1px solid #ddd', borderRadius: 4 }} placeholder="拒绝原因" value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
                      <button style={{ padding: '3px 8px', fontSize: 12, background: '#e55', color: '#fff', border: 'none', borderRadius: 4 }} onClick={() => handleReject(a.id)}>确认</button>
                    </div>
                  )}
                </div>
              )}
              {featuredId === a.id && (
                <div className={styles.featurePanel} onClick={e => e.stopPropagation()}>
                  <span className={styles.featureLabel}>选择轮播位置</span>
                  <div className={styles.featureOptions}>
                    {[1, 2, 3].map(pos => (
                      <button
                        key={pos}
                        className={`${styles.featurePos} ${a.featured === pos ? styles.posActive : ''}`}
                        onClick={() => handleFeature(a.id, pos)}
                      >位置{pos}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className={styles.empty}>暂无{filter === 'pending_review' ? '待审核' : ''}活动</div>
        )}
      </div>
    </div>
  )
}
