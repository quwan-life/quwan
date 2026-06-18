import { useNavigate } from 'react-router-dom'
import { timeAgo } from '../../lib/utils'
import { useUserPopup } from '../shared/UserPopup'
import styles from './RecordCard.module.css'

function StarIcon({ filled }) {
  return (
    <svg className={styles.starIcon} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  )
}

export default function RecordCard({ record, onSave }) {
  const navigate = useNavigate()
  const { showUserPopup } = useUserPopup()
  return (
    <div className={styles.card} onClick={() => navigate(`/record/${record.id}`)}>
      <div className={styles.header}>
        <img className={styles.avatar} src={record.user_avatar} alt="" loading="lazy" onClick={(e) => { e.stopPropagation(); showUserPopup({ id: record.user_id || record.id, name: record.user_nickname, avatar: record.user_avatar }) }} />
        <div className={styles.userInfo}>
          <div className={styles.nameRow}>
            <span className={styles.name}>{record.user_nickname}</span>
          </div>
          <div className={styles.time}>{timeAgo(record.created_at)}</div>
        </div>
        <button className={`${styles.collectBtn} ${record.saved ? styles.collected : ''}`} onClick={e => { e.stopPropagation(); onSave() }}>
          <StarIcon filled={record.saved} />
          <span>{record.saved ? '已收藏' : '收藏'} {record.save_count || ''}</span>
        </button>
      </div>

      <div className={styles.title}>{record.activity_name}</div>
      {record.experience_date && (
        <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>{record.experience_date}</div>
      )}
      <div className={styles.content}>{record.content}</div>

      <div className={styles.images}>
        {record.images?.slice(0, 3).map((img, i) => (
          <img key={i} src={img} alt="" loading="lazy" />
        ))}
      </div>
    </div>
  )
}
