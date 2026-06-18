import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { mockProfiles, mockActivities, mockRecords } from '../../lib/mockData'
import styles from './UserHome.module.css'

export default function UserHome() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [tab, setTab] = useState('publish')

  useEffect(() => {
    const u = mockProfiles.find(p => p.id === id || p.nickname === id)
    setUser(u || null)
  }, [id])

  if (!user) {
    return <div className={styles.page}><div className={styles.empty}>用户不存在</div></div>
  }

  const published = mockActivities.filter(a => a.user_id === user.id)
  const records = mockRecords.filter(r => r.user_id === user.id)

  return (
    <div className={styles.page}>
      {/* Top Bar */}
      <div className={styles.topBar}>
        <button className={styles.iconBtn} onClick={() => navigate(-1)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className={styles.topTitle}>主页</span>
        <button className={styles.iconBtn}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2">
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
        </button>
      </div>

      {/* User Info Card */}
      <div className={styles.userCard}>
        <img src={user.avatar || '/default-avatar.png'} alt="" className={styles.avatar} />
        <div className={styles.nameRow}>
          <h2 className={styles.nickname}>{user.nickname}</h2>
          <span className={styles.verified}>✓ 官方认证</span>
        </div>
        {user.bio && <p className={styles.bio}>{user.bio}</p>}

        <div className={styles.socialLinks}>
          <div className={styles.socialItem}>
            <span className={styles.socialIcon}>📕</span>
            <span className={styles.socialLabel}>小红书</span>
          </div>
          <div className={styles.socialItem}>
            <span className={styles.socialIcon}>▶</span>
            <span className={styles.socialLabel}>视频号</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === 'publish' ? styles.tabActive : ''}`}
          onClick={() => setTab('publish')}
        >
          TA发布的
        </button>
        <button
          className={`${styles.tab} ${tab === 'record' ? styles.tabActive : ''}`}
          onClick={() => setTab('record')}
        >
          日常动态
        </button>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {tab === 'publish' ? (
          published.length === 0 ? (
            <p className={styles.emptyText}>暂无发布</p>
          ) : (
            <div className={styles.list}>
              {published.map(act => (
                <div key={act.id} className={styles.card} onClick={() => navigate(`/activity/${act.id}`)}>
                  <div className={styles.cardLeft}>
                    <img src={act.cover_url} alt="" className={styles.cardImg} />
                  </div>
                  <div className={styles.cardBody}>
                    <h3 className={styles.cardTitle}>{act.title}</h3>
                    <div className={styles.cardTags}>
                      <span>{act.category}</span>
                      <span>·</span>
                      <span>{act.city}</span>
                      <span>·</span>
                      <span>{act.age_range}</span>
                    </div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              ))}
            </div>
          )
        ) : (
          records.length === 0 ? (
            <p className={styles.emptyText}>暂无动态</p>
          ) : (
            <div className={styles.grid}>
              {records.map(r => (
                <div key={r.id} className={styles.gridCard} onClick={() => navigate(`/discover/record/${r.id}`)}>
                  <img src={r.images?.[0] || 'https://picsum.photos/seed/default/300/300'} alt="" />
                  <span className={styles.gridTitle}>{r.activity_name}</span>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}
