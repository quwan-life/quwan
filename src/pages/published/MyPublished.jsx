import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'
import PageHeader from '../../components/shared/PageHeader'
import styles from './MyPublished.module.css'

const TABS = [
  { id: 'published', name: '已发布' },
  { id: 'draft', name: '草稿箱' },
]

export default function MyPublished() {
  const [activeTab, setActiveTab] = useState('published')
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    if (!user) { setLoading(false); return }
    loadActivities()
  }, [user])

  const loadActivities = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('activities')
      .select('*, activity_sessions(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setActivities(data.map(a => ({
        id: a.id,
        title: a.title,
        cover: a.cover_url || '',
        desc: a.description?.substring(0, 50) || '',
        status: a.status,
        rejectReason: a.reject_reason || '',
        category: a.city || '',
        date: a.created_at
          ? new Date(a.created_at).toLocaleDateString('zh-CN')
          : '',
        joinCount: a.activity_sessions?.reduce((sum, s) => sum + (s.booked_count || 0), 0) || 0,
      })))
    }
    setLoading(false)
  }

  const filtered = activeTab === 'published'
    ? activities.filter(a => !['draft', 'rejected'].includes(a.status))
    : activities.filter(a => ['draft', 'rejected'].includes(a.status))

  if (loading) return <div className="page-container"><div className="empty-state">加载中...</div></div>

  return (
    <div className="page-container">
      <PageHeader title="我的发布" onBack={() => navigate(-1)} />

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
          <div className="empty-state">
            {activeTab === 'draft' ? '暂无草稿' : '暂无发布的体验'}
          </div>
        ) : (
          filtered.map(p => (
            <div key={p.id} className={styles.item} onClick={() => {
              if (p.status === 'rejected' || p.status === 'draft') {
                navigate(`/publish?edit=${p.id}`)
              } else {
                navigate(`/activity/${p.id}`)
              }
            }}>
              <img className={styles.cover} src={p.cover} alt="" loading="lazy" />
              <div className={styles.info}>
                <div className={styles.title}>
                  {p.title}
                  {p.status === 'rejected' && <span className={styles.tagRejected}>已拒绝</span>}
                  {p.status === 'draft' && <span className={styles.tagDraft}>草稿</span>}
                  {p.status === 'pending_review' && <span className={styles.tagPending}>审核中</span>}
                  {p.status === 'active' && <span className={styles.tagActive}>已上线</span>}
                  {p.status === 'closed' && <span className={styles.tagClosed}>已关闭</span>}
                </div>
                {p.status === 'rejected' && p.rejectReason && (
                  <div className={styles.rejectMsg}>拒绝理由：{p.rejectReason}</div>
                )}
                <div className={styles.desc}>{p.desc}</div>
                <div className={styles.meta}>
                  <span className={styles.category}>{p.category}</span>
                  <span className={styles.date}>{p.date}</span>
                  <span className={styles.count}>{p.joinCount}人预约</span>
                </div>
              </div>
              {p.status !== 'draft' && p.status !== 'rejected' && (
                <button className={styles.editBtn} onClick={e => { e.stopPropagation(); navigate(`/publish?edit=${p.id}`) }}>修改</button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
