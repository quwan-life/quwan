import { formatTime, formatPrice } from '../../lib/utils'
import styles from './SessionCard.module.css'

const STATUS_CONFIG = {
  upcoming: { label: '即将开启预约', cls: 'pending' },
  booking: { label: '预约中', cls: 'booking' },
  wait: { label: '活动即将开始', cls: 'pending' },
  ongoing: { label: '进行中', cls: 'ongoing' },
  completed: { label: '已完成', cls: 'completed' },
}

export function computeSessionStatus(session) {
  const now = Date.now()
  const bs = new Date(session.booking_start_time).getTime()
  const be = new Date(session.booking_end_time).getTime()
  const ps = new Date(session.planned_start_time).getTime()
  const pe = new Date(session.end_time).getTime()

  if (now >= pe) return { status: 'completed', ...STATUS_CONFIG.completed }
  if (now >= ps) return { status: 'ongoing', ...STATUS_CONFIG.ongoing }
  if (now > be) return { status: 'wait', ...STATUS_CONFIG.wait }
  if (now >= bs) return { status: 'booking', ...STATUS_CONFIG.booking }
  return { status: 'upcoming', ...STATUS_CONFIG.upcoming }
}

export default function SessionCard({ session, onEdit, onCancel }) {
  const { status, label, cls } = computeSessionStatus(session)

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.num}>第{session.session_number}期</span>
        <span className={`status-tag status-${cls}`}>
          {status === 'wait' ? (
            <><span style={{ color: '#999' }}>预约已结束</span> 活动即将开始</>
          ) : label}
        </span>
      </div>
      <div className={styles.info}>
        <div>📅 预约：{formatTime(session.booking_start_time)} — {formatTime(session.booking_end_time)}</div>
        <div>⏰ 活动：{formatTime(session.planned_start_time)} — {formatTime(session.end_time)}</div>
      </div>
      <div className={styles.footer}>
        <span className={styles.price}>{formatPrice(session.price)}</span>
        <span className={styles.count}>{(session.booked_count || 0)}/{session.capacity}人</span>
        <div className={styles.actions}>
          {onEdit && (
            <button className={styles.editBtn} onClick={e => { e.stopPropagation(); onEdit() }}>编辑</button>
          )}
          {onCancel && status !== 'cancelled' && (
            <button className={styles.cancelBtn} onClick={e => { e.stopPropagation(); onCancel() }}>取消本期</button>
          )}
        </div>
      </div>
    </div>
  )
}
