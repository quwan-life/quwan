import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'
import PageHeader from '../../components/shared/PageHeader'
import styles from './MyRecords.module.css'

export default function MyRecords() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [tab, setTab] = useState('published')
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    loadRecords()
  }, [user])

  const loadRecords = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('records')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setRecords(data.map(r => ({
        id: r.id,
        title: r.activity_name || '体验记录',
        content: r.content || '',
        images: r.images || [],
        status: r.status || 'published',
        date: r.created_at ? new Date(r.created_at).toLocaleDateString('zh-CN') : '',
      })))
    }
    setLoading(false)
  }

  const published = records.filter(r => r.status !== 'draft')
  const drafts = records.filter(r => r.status === 'draft')
  const list = tab === 'published' ? published : drafts

  return (
    <div className="page-container">
      <PageHeader title="我的记录" onBack={() => navigate(-1)} />

      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === 'published' ? styles.active : ''}`} onClick={() => setTab('published')}>已记录</button>
        <button className={`${styles.tab} ${tab === 'draft' ? styles.active : ''}`} onClick={() => setTab('draft')}>草稿</button>
      </div>

      <div className={styles.list}>
        {list.length === 0 ? (
          <div className={styles.empty}>{tab === 'draft' ? '暂无草稿' : '暂无记录'}</div>
        ) : (
          list.map(r => (
            <div key={r.id} className={styles.card} onClick={() => navigate(`/record/${r.id}`)}>
              {r.images.length > 0 && (
                <div className={styles.images}>
                  {r.images.slice(0, 3).map((img, i) => (
                    <img key={i} src={img} alt="" loading="lazy" />
                  ))}
                  {r.images.length > 3 && <span className={styles.more}>+{r.images.length - 3}</span>}
                </div>
              )}
              <div className={styles.body}>
                <div className={styles.title}>{r.title}</div>
                <div className={styles.content}>{r.content}</div>
                <div className={styles.meta}>
                  <span>{r.date}</span>
                  {r.status === 'draft' && <span className={styles.draftTag}>草稿</span>}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
