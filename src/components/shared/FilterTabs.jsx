import styles from './FilterTabs.module.css'

/**
 * 统一筛选标签栏 — 圆角矩形连排
 * tabs: [{ key, label }]
 * active: 当前选中 key
 * onChange: 切换回调
 */
export default function FilterTabs({ tabs, active, onChange, top }) {
  return (
    <div className={styles.tabs} style={top !== undefined ? { top: `${top}px` } : undefined}>
      {tabs.map(t => (
        <button
          key={t.key}
          className={`${styles.tab} ${active === t.key ? styles.active : ''}`}
          onClick={() => onChange(t.key)}
        >
          {t.count !== undefined && (
            <span style={{
              fontSize: 11, fontWeight: 700, color: active === t.key ? '#111' : '#fff',
              background: active === t.key ? 'rgba(255,255,255,0.9)' : '#111',
              minWidth: 18, height: 18, borderRadius: '50%', display: 'inline-flex',
              alignItems: 'center', justifyContent: 'center', marginRight: 4,
            }}>{t.count > 99 ? '99+' : t.count}</span>
          )}
          {t.label}
        </button>
      ))}
    </div>
  )
}
