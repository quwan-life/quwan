import { useState } from 'react'
import styles from './FilterBar.module.css'

export default function FilterBar({ sameCity, onSameCityChange, onReservingChange, onMapClick }) {
  const [reservingOnly, setReservingOnly] = useState(false)

  const handleReserving = () => {
    setReservingOnly(!reservingOnly)
    onReservingChange?.(!reservingOnly)
  }

  return (
    <div className={styles.bar}>
      <button
        className={`${styles.item} ${!sameCity ? styles.active : ''}`}
        onClick={() => onSameCityChange?.(false)}
      >全部</button>
      <button
        className={`${styles.item} ${sameCity ? styles.active : ''}`}
        onClick={() => onSameCityChange?.(true)}
      >HS同城</button>
      <button
        className={`${styles.item} ${reservingOnly ? styles.active : ''}`}
        onClick={handleReserving}
      >
        <span className={`${styles.checkbox} ${reservingOnly ? styles.checked : ''}`}>
          {reservingOnly && <span className={styles.checkmark} />}
        </span>
        预约中
      </button>
      <button className={styles.item} onClick={onMapClick}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 2 }}>
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
        地图
      </button>
    </div>
  )
}
