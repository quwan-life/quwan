import { useNavigate } from 'react-router-dom'
import styles from './TabBar.module.css'

const tabs = [
  {
    path: '/', label: '去玩',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#111' : '#999'} strokeWidth={active ? '2' : '1.5'} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    path: '/discover', label: '发现',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#111' : '#999'} strokeWidth={active ? '2' : '1.5'} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    path: '/publish', label: '发布',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#111' : '#999'} strokeWidth={active ? '2' : '1.5'} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
  },
  {
    path: '/messages', label: '消息',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#111' : '#999'} strokeWidth={active ? '2' : '1.5'} strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    path: '/profile', label: '我的',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#111' : '#999'} strokeWidth={active ? '2' : '1.5'} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
]

export default function TabBar({ activeTab, onNavigate }) {
  return (
    <nav className={styles.tabBar}>
      {tabs.map(tab => {
        const key = tab.path === '/' ? 'home' : tab.path.slice(1)
        const active = activeTab === key
        return (
          <button key={tab.path} className={`${styles.tab} ${active ? styles.active : ''}`} onClick={() => onNavigate(tab.path)}>
            <span className={styles.iconWrap}>{tab.icon(active)}</span>
            <span className={styles.label}>{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
