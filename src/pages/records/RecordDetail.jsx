import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { mockRecords, mockProfiles, mockActivities } from '../../lib/mockData'
import { useUserPopup } from '../../components/shared/UserPopup'
import styles from './RecordDetail.module.css'

export default function RecordDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showUserPopup } = useUserPopup()
  const [record, setRecord] = useState(null)
  const [activity, setActivity] = useState(null)

  useEffect(() => {
    const rec = mockRecords.find(r => r.id === id)
    if (rec) {
      const user = mockProfiles.find(p => p.id === rec.user_id)
      setRecord({ ...rec, user_nickname: user?.nickname || rec.user_nickname, user_avatar: user?.avatar || rec.user_avatar })
      const act = mockActivities.find(a => a.id === rec.activity_id)
      if (act) setActivity(act)
    }
  }, [id])

  if (!record) {
    return <div className={styles.page}><div className={styles.empty}>记录不存在</div></div>
  }

  const timeStr = new Date(record.created_at).toLocaleDateString('zh-CN', {
    month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })

  return (
    <div className={styles.page}>
      {/* Top bar */}
      <div className={styles.topBar}>
        <button className={styles.closeBtn} onClick={() => navigate(-1)}>关闭</button>
        <span className={styles.topTitle}>动态详情</span>
        <button className={styles.shareBtn}>分享</button>
      </div>

      {/* Image */}
      <div className={styles.coverImg}>
        <img src={record.images?.[0] || 'https://picsum.photos/seed/default/750/400'} alt="" />
      </div>

      {/* Content */}
      <div className={styles.content}>
        {/* User info */}
        <div className={styles.userRow}>
          <img src={record.user_avatar || '/default-avatar.png'} alt="" className={styles.avatar} onClick={() => showUserPopup({ id: record.user_id, name: record.user_nickname, avatar: record.user_avatar })} style={{ cursor: 'pointer' }} />
          <div className={styles.userInfo}>
            <span className={styles.userName}>{record.user_nickname}</span>
            <span className={styles.time}>{timeStr}</span>
          </div>
          <button className={styles.profileBtn} onClick={() => navigate(`/user/${record.user_id}`)}>进主页</button>
        </div>

        {/* Title */}
        <h1 className={styles.title}>{record.activity_name}</h1>

        {/* Text */}
        <div className={styles.text}>{record.content}</div>

        {/* Associated Activity */}
        {activity && (
          <div className={styles.relatedCard}>
            <div className={styles.relatedInfo}>
              <span className={styles.relatedLabel}>关联活动</span>
              <span className={styles.relatedName}>{activity.title}</span>
            </div>
            <button className={styles.goBtn} onClick={() => navigate(`/activity/${activity.id}`)}>
              去看看
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
