import styles from './BottomDrawer.module.css'

export default function BottomDrawer({ children, onClose }) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.drawer} onClick={e => e.stopPropagation()}>
        <div className={styles.handle} />
        {children}
      </div>
    </div>
  )
}
