import { useNavigate } from 'react-router-dom'
import { formatTime, formatPrice, showToast } from '../../lib/utils'
import { useUserPopup } from '../shared/UserPopup'
import styles from './ActivityCard.module.css'

export default function ActivityCard({ activity, session }) {
  const navigate = useNavigate()
  const { showUserPopup } = useUserPopup()
  const statusKey = activity.computedStatusKey || 'open'
  const statusLabel = activity.computedStatus || '开放'

  const statusClass = {
    upcoming: 'booking', booking: 'open', wait: 'pending',
    ongoing: 'ongoing', completed: 'completed', open: 'open',
  }[statusKey] || 'open'

  const city = activity.city || ''

  const isCompleted = statusKey === 'completed'

  return (
    <div className={styles.card} onClick={() => navigate(`/activity/${activity.id}`)}>
      {/* 标题 + 预约按钮 */}
      <div className={styles.titleRow}>
        <div className={styles.title}>{activity.title}</div>
        <button
          className={`${styles.bookBtn} ${isCompleted ? styles.bookDisabled : ''}`}
          onClick={e => {
            e.stopPropagation()
            if (isCompleted) {
              showToast('活动已结束，可私信发布者单独预约')
            } else {
              navigate(`/activity/${activity.id}`)
            }
          }}
        >预约</button>
      </div>

      {/* 信息行：发起者头像+名称 + 状态 + 城市 + 时间 + 距离 */}
      <div className={styles.infoRow}>
        <img className={styles.avatar} src={activity.organizer_avatar} alt="" onClick={(e) => { e.stopPropagation(); showUserPopup({ id: activity.organizer_id || activity.id, name: activity.organizer_name, avatar: activity.organizer_avatar, bio: '活动发起者' }) }} />
        <span className={styles.orgName}>{activity.organizer_name}</span>
        <span className={`status-tag status-${statusClass}`}>{statusLabel}</span>
        {city && <span className={styles.city}>{city}</span>}
        {session?.planned_start_time && <span className={styles.time}>{formatTime(session.planned_start_time)}</span>}
        {activity.distance && <span className={styles.distance}>{activity.distance}</span>}
      </div>

      {/* 三张小图 */}
      {activity.images?.length > 0 && (
        <div className={styles.gallery}>
          {activity.images.slice(0, 3).map((img, i) => (
            <img key={i} className={styles.galleryImg} src={img} alt="" loading="lazy" />
          ))}
        </div>
      )}
    </div>
  )
}
