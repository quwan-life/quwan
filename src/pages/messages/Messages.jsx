import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { mockStore, mockSystemMessages, mockGroups, mockConversations } from '../../lib/mockData'
import { useRefresh } from '../../lib/RefreshContext'
import { useUserPopup } from '../../components/shared/UserPopup'
import PageHeader from '../../components/shared/PageHeader'
import FilterTabs from '../../components/shared/FilterTabs'
import styles from './Messages.module.css'

const MESSAGE_TABS = [
  { key: '系统通知', label: '系统通知' },
  { key: '私信', label: '私信' },
  { key: '活动群聊', label: '活动群聊' },
]

export default function Messages() {
  const navigate = useNavigate()
  const { showUserPopup } = useUserPopup()
  const [tab, setTab] = useState(() => sessionStorage.getItem('messagesTab') || '系统通知')



  const { refreshKey } = useRefresh()

  const systemMessages = useMemo(() => mockStore.notifications.map(m => ({
    ...m,
    unread: m.is_read !== true,
  })), [refreshKey])

  const groups = useMemo(() => [...mockGroups], [refreshKey])
  const conversations = useMemo(() => [...mockConversations], [refreshKey])

  const unreads = {
    '系统通知': systemMessages.filter(m => m.unread).length,
    '私信': conversations.filter(c => c.unread > 0).length,
    '活动群聊': groups.filter(g => g.unread > 0).length,
  }

  const notifyIcon = (type) => {
    const s = { width: 18, height: 18, flexShrink: 0 }
    switch (type) {
      case 'publish_review': return <svg {...s} viewBox="0 0 24 24" fill="none" stroke="#ff9800" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      case 'booking_request': return <svg {...s} viewBox="0 0 24 24" fill="none" stroke="#e53935" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
      case 'booking_result': return <svg {...s} viewBox="0 0 24 24" fill="none" stroke="#4caf50" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      case 'follow_notify': return <svg {...s} viewBox="0 0 24 24" fill="none" stroke="#2196f3" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
      case 'save_notify': return <svg {...s} viewBox="0 0 24 24" fill="none" stroke="#9c27b0" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
      case 'featured_notify': return <svg {...s} viewBox="0 0 24 24" fill="none" stroke="#ffc107" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      case 'route_notify': return <svg {...s} viewBox="0 0 24 24" fill="none" stroke="#00bcd4" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
      default: return <svg {...s} viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
    }
  }

  const notifyColor = (type) => {
    switch (type) {
      case 'publish_review': return '#ff9800'
      case 'booking_request': return '#e53935'
      case 'booking_result': return '#4caf50'
      case 'follow_notify': return '#2196f3'
      case 'save_notify': return '#9c27b0'
      case 'featured_notify': return '#ffc107'
      case 'route_notify': return '#00bcd4'
      default: return '#999'
    }
  }

  return (
    <div className={styles.page}>
      <PageHeader cn="消息" en="MESSAGES" right="以对话，见彼此" />
      <FilterTabs tabs={MESSAGE_TABS} active={tab} onChange={key => { setTab(key); sessionStorage.setItem('messagesTab', key) }} />

      <div className={styles.list}>
        {tab === '系统通知' && systemMessages.map(m => (
          <div key={m.id} className={`${styles.card} ${m.unread ? styles.unread : ''}`} onClick={() => navigate(`/messages/chat/system/${m.id}`)}>
            <div className={styles.icon} style={{ background: 'transparent' }}>{notifyIcon(m.type)}</div>
            <div className={styles.body}>
              <div className={styles.title}>{m.title}</div>
              <div className={styles.desc}>{m.desc}</div>
            </div>
            {m.unread_count > 0 && (
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 18, height: 18, borderRadius: '50%', background: notifyColor(m.type), color: '#fff', fontSize: 10, fontWeight: 600, padding: '0 5px', flexShrink: 0, marginTop: 2 }}>{m.unread_count}</span>
            )}
          </div>
        ))}
        {tab === '系统通知' && systemMessages.length === 0 && <div className="empty-state">暂无系统消息</div>}

        {tab === '私信' && conversations.map(c => (
          <div key={c.id} className={styles.item} onClick={() => navigate(`/messages/chat/private/${c.user_id}`)}>
            <img className={styles.privAvatar} src={c.user_avatar || '/default-avatar.png'} alt="" onError={e => { e.target.src = 'https://picsum.photos/seed/av' + c.id + '/100/100' }} />
            <div className={styles.body}>
              <div className={styles.title}>{c.user_nickname}</div>
              <div className={styles.desc}>{c.last_time} · {c.last_message}</div>
            </div>
            {c.unread > 0 && <span className={styles.unreadBadge}>{c.unread}</span>}
          </div>
        ))}
        {tab === '私信' && conversations.length === 0 && <div className="empty-state">暂无私信</div>}

        {tab === '活动群聊' && (
          <>
            {groups.map(g => {
              const activity = mockStore.activities.find(a => a.id === g.activityId)
              const organizer = mockStore.profiles.find(p => p.id === activity?.created_by)
              return (
              <div key={g.id} className={styles.item} onClick={() => navigate(`/messages/chat/group/${g.id}`)}>
                <img className={styles.cover} src={activity?.cover_url || '/default-avatar.png'} alt="" onClick={e => { e.stopPropagation(); if (organizer) showUserPopup({ id: organizer.id, user_id: organizer.id, name: organizer.nickname, avatar: organizer.avatar, bio: organizer.bio }) }} />
                <div className={styles.body}>
                  <div className={styles.title}>{g.name}（{g.members}人）</div>
                  <div className={styles.desc}>{g.time} {g.lastMsg}</div>
                </div>
                <div className={styles.meta}>
                  {g.unread > 0 && <span className={styles.unreadBadge}>{g.unread}</span>}
                </div>
              </div>
              )
            })}
            {groups.length === 0 && <div className="empty-state">暂无活动群聊</div>}
          </>
        )}
      </div>
    </div>
  )
}
