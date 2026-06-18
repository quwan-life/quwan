import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { mockStore, mockFollowing, mockFollows, mockGroups } from '../../lib/mockData'
import { addRealtimeListener } from '../../lib/mockSupabase'
import { useAuth } from '../../lib/AuthContext'
import { showToast } from '../../lib/utils'
import { useUserPopup } from '../../components/shared/UserPopup'
import ConfirmDialog from '../../components/shared/ConfirmDialog'
import styles from './Chat.module.css'

export default function Chat() {
  const { type, id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { showUserPopup } = useUserPopup()
  const fromTab = location.state?.fromTab || '系统'

  const MY_AVATAR = user?.avatar || '/default-avatar.png'
  const SYSTEM_AVATAR = '/default-avatar.png'

  const handleBack = () => navigate('/messages', { state: { tab: fromTab } })
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [info, setInfo] = useState({ title: '', avatar: SYSTEM_AVATAR, name: '' })
  const [confirmMsg, setConfirmMsg] = useState(null)
  const [showGroupInfo, setShowGroupInfo] = useState(false)
  const [showPrivateInfo, setShowPrivateInfo] = useState(false)
  const [groupMembers, setGroupMembers] = useState([])
  const [sending, setSending] = useState(false)
  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  // 自动滚底
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // 加载消息和会话信息
  useEffect(() => {
    if (!user) return
    if (type === 'system') loadSystemMessage()
    else if (type === 'group') { loadGroupMessages(); loadGroupInfo() }
    else if (type === 'private') loadPrivateMessages()
  }, [type, id, user])

  // 实时订阅（群聊和私信，使用 mock realtime）
  useEffect(() => {
    if (!type || type === 'system') return
    const table = type === 'group' ? 'group_messages' : 'messages'
    const cleanup = addRealtimeListener(table, ({ payload }) => {
      const msg = payload.new
      if (!msg) return
      if (type === 'group') {
        if (msg.session_id !== id) return
        if (msg.user_id === user?.id) return
        setMessages(prev => [...prev, {
          id: msg.id, from: 'other', text: msg.content || '',
          time: new Date(msg.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          name: '', uid: msg.user_id,
        }])
      } else {
        const relevant = (msg.from_user === user?.id && msg.to_user === id) ||
                         (msg.to_user === user?.id && msg.from_user === id)
        if (!relevant || msg.from_user === user?.id) return
        setMessages(prev => [...prev, {
          id: msg.id, from: 'other', text: msg.content || '', time: '刚刚',
        }])
      }
    })
    return cleanup
  }, [type, id, user])

  // ── 数据加载 ──

  const loadSystemMessage = () => {
    setLoading(true)
    const data = mockStore.notifications.filter(n => n.id === id)
    const typeLabels = {
      publish_review: '发布审核', booking_request: '预约请求', booking_result: '预约结果',
      follow_notify: '关注提醒', save_notify: '收藏提醒', featured_notify: '推荐提醒',
      route_notify: '研学路线',
    }
    if (data.length > 0) {
      const first = data[0]
      setInfo({ title: '【' + (typeLabels[first.type] || first.type) + '】', avatar: SYSTEM_AVATAR, name: '系统' })
      setMessages(data.flatMap(n => {
        const p = n.payload || {}
        const timeStr = n.created_at ? new Date(n.created_at).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''

        if (n.type === 'publish_review' && p.items) {
          return p.items.map(item => ({
            id: n.id + '_' + item.activity, from: 'other',
            text: item.activity,
            subtext: `${item.time || ''} · ${item.result === '审核通过' ? '审核通过' : '未通过'}`,
            time: timeStr, notifyType: n.type,
            activityId: item.activity_id, approved: item.result === '审核通过',
            rejectReason: item.reason,
          }))
        }
        if (n.type === 'booking_request' && p.items) {
          return p.items.map(item => ({
            id: n.id + '_' + (item.user || item.activity), from: 'other', notifId: n.id,
            text: item.activity,
            subtext: item.session ? `预约了${item.session} · ${item.activityTime || ''}` : `自定日期: ${item.customTime || item.time || ''}`,
            time: timeStr, notifyType: n.type,
            userName: item.user || item.name, userId: item.user_id, avatar: item.avatar,
            phone: item.phone, gender: item.gender, age: item.age, withFamily: item.withFamily, note: item.note, name: item.name,
            activityId: item.activity_id,
          }))
        }
        if (n.type === 'booking_result' && p.items) {
          return p.items.map(item => ({
            id: n.id + '_' + item.activity, from: 'other',
            text: item.activity + (item.session ? ' · ' + item.session : ''),
            subtext: (item.session ? `预约了${item.session} · ${item.activityTime || ''}` : `自定日期: ${item.customTime || ''}`) + '  ·  ' + item.time,
            time: timeStr, notifyType: n.type,
            result: item.result,
            name: item.name, phone: item.phone, gender: item.gender, age: item.age, withFamily: item.withFamily, note: item.note,
          }))
        }
        if (n.type === 'route_notify' && p.my_activities) {
          return [{
            id: n.id, from: 'other',
            text: p.route_title || '',
            subtext: p.route_time || '',
            time: timeStr, notifyType: n.type,
            stops: p.stops || [],
          }]
        }

        let text = ''
        if (n.type === 'follow_notify' && p.items) {
          return p.items.map(item => ({
            id: n.id + '_' + item.user_id, from: 'other',
            text: item.name,
            subtext: item.time || '',
            time: timeStr, notifyType: n.type,
            avatar: item.avatar, userId: item.user_id, userName: item.name,
          }))
        }
        if (n.type === 'save_notify' && p.items) {
          return p.items.map(item => ({
            id: n.id + '_' + item.user, from: 'other',
            text: item.record,
            subtext: item.time || '',
            time: timeStr, notifyType: n.type,
            avatar: item.avatar, userId: item.user_id, userName: item.user,
            recordText: item.record, images: item.images || [], recordId: item.recordId,
          }))
        }
        if (n.type === 'featured_notify' && p.activity) {
          return [{
            id: n.id, from: 'other',
            text: p.activity,
            subtext: `${p.time || ''} · 被推荐到${p.position || '首页'}`,
            time: timeStr, notifyType: n.type,
            activityId: p.activity_id, images: p.images || [],
          }]
        }
        return [{ id: n.id, from: 'other', text, time: timeStr, notifyType: n.type }]
      }))
    }
    setLoading(false)
  }

  const loadGroupMessages = () => {
    setLoading(true)
    // 先查 mockGroups（群聊级别 ID）
    const group = mockGroups.find(g => g.id === id)
    if (group) {
      setInfo({ title: group.name, avatar: '', name: group.name })
      const data = mockStore.group_messages.filter(m => m.group_id === id)
      setMessages(data.map(m => {
        const sender = mockStore.profiles.find(p => p.id === m.user_id)
        return {
          id: m.id, from: m.user_id === user?.id ? 'me' : 'other',
          text: m.content || '',
          time: m.created_at ? new Date(m.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '',
          name: sender?.nickname || '', avatar: sender?.avatar || '/default-avatar.png', uid: m.user_id,
        }
      }))
      setLoading(false)
      return
    }
    // 回退：session_id 查询
    const data = mockStore.group_messages.filter(m => m.session_id === id)
    const session = mockStore.activity_sessions.find(s => s.id === id)
    if (session) {
      setInfo({ title: session.group_chat_name || '体验群', avatar: '', name: session.group_chat_name || '体验群' })
    } else {
      setInfo({ title: '体验群', avatar: '', name: '体验群' })
    }
    setMessages(data.map(m => {
      const sender = mockStore.profiles.find(p => p.id === m.user_id)
      return {
        id: m.id, from: m.user_id === user?.id ? 'me' : 'other',
        text: m.content || '',
        time: m.created_at ? new Date(m.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '',
        name: sender?.nickname || '', avatar: sender?.avatar || '/default-avatar.png', uid: m.user_id,
      }
    }))
    setLoading(false)
  }

  const loadGroupInfo = () => {
    const members = mockStore.group_members
      .filter(m => m.group_id === id || m.session_id === id)
      .sort((a, b) => (a.order || 99) - (b.order || 99))
      .map(m => {
        const p = mockStore.profiles.find(pr => pr.id === m.user_id)
        return { id: m.user_id, nickname: p?.nickname || '用户', avatar: p?.avatar || '/default-avatar.png', role: m.role || 'member', order: m.order || 99 }
      })
    setGroupMembers(members)
  }

  // ── 踢人 ──
  const canKick = (targetRole) => {
    if (!user) return false
    const me = groupMembers.find(m => m.id === user.id)
    if (!me) return false
    const roleRank = { superadmin: 4, admin: 3, organizer: 2, member: 1 }
    return roleRank[me.role] >= roleRank.admin && roleRank[me.role] > (roleRank[targetRole] || 0) && targetRole === 'member'
  }

  const handleKickMember = (memberId) => {
    const member = groupMembers.find(m => m.id === memberId)
    if (!member) return
    // 从群成员中移除
    const idx = mockStore.group_members.findIndex(m => m.user_id === memberId && (m.group_id === id || m.session_id === id))
    if (idx >= 0) {
      mockStore.group_members.splice(idx, 1)
    }
    // 合并到现有【预约结果】通知（每种通知只有一条）
    const existingNotif = mockStore.notifications.find(n => n.type === 'booking_result')
    const group = mockGroups.find(g => g.id === id) || {}
    const kickItem = { activity: group.name || info.title || '', session: '', result: '预约已取消（被移出群聊）', time: new Date().toLocaleDateString('zh-CN') }
    if (existingNotif) {
      existingNotif.payload.items.push(kickItem)
      existingNotif.unread_count = (existingNotif.unread_count || 0) + 1
      existingNotif.desc = `${kickItem.time} · 你已被移出群聊，预约已取消`
      existingNotif.time = kickItem.time
      existingNotif.is_read = false
    } else {
      mockStore.notifications.push({
        id: `booking_result_n`,
        type: 'booking_result',
        title: '【预约结果】',
        desc: `${kickItem.time} · 你已被移出群聊「${group.name || info.title}」`,
        time: kickItem.time,
        is_read: false,
        unread_count: 1,
        created_at: new Date().toISOString(),
        payload: { items: [kickItem] },
      })
    }
    // 更新本地状态
    setGroupMembers(prev => prev.filter(m => m.id !== memberId))
    showToast(`已将${member.nickname}移出群聊`)
  }

  const loadPrivateMessages = () => {
    setLoading(true)
    const profile = mockStore.profiles.find(p => p.id === id)
    setInfo({ title: profile?.nickname || '私信', avatar: profile?.avatar || '/default-avatar.png', name: profile?.nickname || '私信' })
    const data = mockStore.messages.filter(m =>
      (m.from_user === user?.id && m.to_user === id) ||
      (m.from_user === id && m.to_user === user?.id)
    )
    setMessages(data.map(m => ({
      id: m.id, from: m.from_user === user?.id ? 'me' : 'other',
      text: m.content || '',
      time: m.created_at ? new Date(m.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '',
      name: '',
    })))
    setLoading(false)
  }

  // ── 发送消息 ──

  const handleSend = async () => {
    if (!input.trim() || !user || sending) return
    const text = input.trim()
    setInput('')
    if (inputRef.current) inputRef.current.value = ''
    setSending(true)

    const newMsg = {
      id: `msg_${Date.now()}`,
      created_at: new Date().toISOString(),
      content: text,
    }

    setMessages(prev => [...prev, { id: newMsg.id, from: 'me', text, time: '刚刚', name: '' }])

    if (type === 'group') {
      mockStore.group_messages.push({ ...newMsg, session_id: id, user_id: user.id })
    } else {
      mockStore.messages.push({ ...newMsg, from_user: user.id, to_user: id })
    }

    await new Promise(r => setTimeout(r, 300))
    setSending(false)
  }

  // ── 预约审批 ──

  const handleApprove = (msgId, notifId) => {
    const actualNotifId = notifId || msgId
    const notif = mockStore.notifications.find(n => n.id === actualNotifId)
    if (!notif) return
    if (notif.type === 'booking_request' && !notif.payload?.items) return
    if (notif.type === 'booking_request') {
      notif.payload.items.forEach(i => { i.result = '已通过' })
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, acted: true } : m))
      // 同步写入预约结果通知
      const resultNotif = mockStore.notifications.find(n => n.type === 'booking_result')
      if (resultNotif) {
        resultNotif.payload.items.push({
          activity: notif.payload.items[0]?.activity || '',
          session: notif.payload.items[0]?.session || '',
          result: '已通过',
          time: new Date().toLocaleDateString('zh-CN'),
        })
        resultNotif.unread_count = (resultNotif.unread_count || 0) + 1
      }
    } else if (notif.type === 'route_notify') {
      notif.payload.my_approval = 'approved'
      notif.payload.approved_count = (notif.payload.approved_count || 0) + 1
      notif.payload.all_approved = notif.payload.approved_count >= (notif.payload.total_organizers || 1)
      notif.title = notif.payload.all_approved ? '【研学路线】全员已同意 · 已上线' : '【研学路线】已同意关联'
      notif.desc = notif.payload.all_approved ? '所有发布人已同意，研学路线已上线' : `已同意关联（${notif.payload.approved_count}/${notif.payload.total_organizers}）`
      if (notif.payload.all_approved && notif.payload.route_id) {
        const routeAct = mockStore.activities.find(a => a.id === notif.payload.route_id)
        if (routeAct) routeAct.status = 'active'
      }
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, acted: true } : m))
    }
    showToast('已通过')
  }

  const handleReject = (msgId, notifId) => {
    const actualNotifId = notifId || msgId
    const notif = mockStore.notifications.find(n => n.id === actualNotifId)
    if (!notif) return
    setConfirmMsg({
      msg: notif.type === 'route_notify' ? '拒绝关联理由' : '拒绝理由',
      onOk: (reason) => {
        setConfirmMsg(null)
        if (!reason) return
        if (notif) {
          if (notif.type === 'booking_request' && notif.payload?.items) {
            notif.payload.items.forEach(i => { i.result = '未通过：' + reason })
            setMessages(prev => prev.map(m => m.id === msgId ? { ...m, acted: true, actedResult: '已拒绝: ' + reason } : m))
            // 同步写入预约结果通知
            const resultNotif = mockStore.notifications.find(n => n.type === 'booking_result')
            if (resultNotif) {
              resultNotif.payload.items.push({
                activity: notif.payload.items[0]?.activity || '',
                session: notif.payload.items[0]?.session || '',
                result: '未通过（' + reason + '）',
                time: new Date().toLocaleDateString('zh-CN'),
              })
              resultNotif.unread_count = (resultNotif.unread_count || 0) + 1
            }
          } else if (notif.type === 'route_notify') {
            notif.payload.my_approval = reason
            notif.title = '【研学路线】已拒绝关联'
            notif.desc = '已拒绝：' + reason
            setMessages(prev => prev.map(m => m.id === msgId ? { ...m, acted: true, actedResult: '已拒绝: ' + reason } : m))
          }
        }
        showToast('已拒绝')
      },
      options: notif.type === 'route_notify' ? ['时间冲突', '不相关活动', '其他原因'] : ['条件不满足', '请补充说明'],
    })
  }

  const getAvatar = (msg) => {
    if (msg.from === 'me') return MY_AVATAR
    if (msg.from === 'system') return SYSTEM_AVATAR
    if (msg.avatar) return msg.avatar
    if (type === 'private') return info.avatar || '/default-avatar.png'
    return '/default-avatar.png'
  }

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin'
  const isGroupMember = groupMembers.some(m => m.id === user?.id)
  const canSend = type !== 'system' && (type !== 'group' || isAdmin || isGroupMember)

  // ── 私信对方关注状态 ──
  const privateProfile = type === 'private' ? mockStore.profiles.find(p => p.id === id) : null
  const [isFollowingPrivate, setIsFollowingPrivate] = useState(
    () => mockFollows.some(f => f.follower_id === user?.id && f.user_id === id)
  )

  const handleFollowPrivate = () => {
    if (isFollowingPrivate) {
      // 取消关注
      const idx = mockFollows.findIndex(f => f.follower_id === user?.id && f.user_id === id)
      if (idx >= 0) mockFollows.splice(idx, 1)
      setIsFollowingPrivate(false)
      showToast('已取消关注')
    } else {
      mockFollows.push({ follower_id: user?.id, user_id: id })
      setIsFollowingPrivate(true)
      showToast('已关注')
    }
  }

  if (loading) return <div className={styles.container}><div className={styles.chatHeader}><button className={styles.backBtn} onClick={handleBack}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg></button><span className={styles.chatTitle}>加载中...</span><div className={styles.chatSpacer} /></div></div>

  return (
    <div className={styles.container}>
      <div className={styles.chatHeader}>
        <button className={styles.backBtn} onClick={handleBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <span className={styles.chatTitle} onClick={() => {
          if (type === 'group') setShowGroupInfo(true)
          else if (type === 'private') setShowPrivateInfo(true)
        }}>{info.title}</span>
        <div className={styles.chatSpacer} />
      </div>

      <div className={styles.messageList} ref={scrollRef}>
        {type === 'system' ? (
          <div className={styles.timeline}>
            {messages.map(msg => (
              <div key={msg.id} className={styles.timeItem}>
                <div className={styles.timeDot} />
                <div className={styles.timeBody}>
                  {msg.notifyType === 'publish_review' || msg.notifyType === 'booking_request' || msg.notifyType === 'booking_result' || msg.notifyType === 'follow_notify' || msg.notifyType === 'save_notify' || msg.notifyType === 'featured_notify' || msg.notifyType === 'route_notify' ? (
                    <div className={styles.timeContent}>
                      {msg.notifyType === 'booking_request' && msg.activityId ? (
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#111', marginBottom: 4, cursor: 'pointer', textDecoration: 'underline' }}
                          onClick={() => navigate(`/activity/${msg.activityId}`)}>{msg.text}</div>
                      ) : msg.notifyType === 'featured_notify' && msg.activityId ? (
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#111', marginBottom: 4, cursor: 'pointer', textDecoration: 'underline' }}
                          onClick={() => navigate(`/activity/${msg.activityId}`)}>{msg.text}</div>
                      ) : msg.notifyType !== 'follow_notify' && msg.notifyType !== 'save_notify' && msg.notifyType !== 'route_notify' ? (
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#111', marginBottom: 4 }}>{msg.text}</div>
                      ) : null}
                      {msg.notifyType === 'publish_review' && <div style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>{msg.subtext}{msg.rejectReason ? ' · ' + msg.rejectReason : ''}</div>}
                      {msg.notifyType === 'featured_notify' && <div style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>{msg.subtext}</div>}
                      {msg.notifyType === 'featured_notify' && msg.images && msg.images.length > 0 && (
                        <div style={{ display: 'flex', gap: 4, marginBottom: 6, cursor: 'pointer' }}
                          onClick={() => navigate(`/activity/${msg.activityId}`)}>
                          {msg.images.slice(0, 3).map((img, i) => (
                            <img key={i} src={img} alt="" style={{ width: 60, height: 44, borderRadius: 3, objectFit: 'cover' }} />
                          ))}
                        </div>
                      )}
                      {msg.notifyType === 'route_notify' && (
                        <>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#111', marginBottom: 4, cursor: 'pointer', textDecoration: 'underline' }}
                            onClick={() => navigate(`/activity/${info.routeId || msg.stops?.[0]?.activity_id}`)}>{msg.text}</div>
                          <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>{msg.subtext}</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                            {(msg.stops || []).map((stop, i) => (
                              <div key={i}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span style={{ fontSize: 11, color: '#ccc', minWidth: 14, textAlign: 'center' }}>{i + 1}</span>
                                  <span
                                    onClick={(e) => { e.stopPropagation(); navigate(`/activity/${stop.activity_id}`) }}
                                    style={{
                                      fontSize: 12, padding: '4px 10px', borderRadius: 3, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4,
                                      background: stop.mine && !stop.status ? 'rgba(76,175,80,0.15)' : stop.status === '已同意' ? '#f0fdf0' : stop.status?.includes('拒绝') ? '#fef0f0' : '#f5f5f5',
                                      color: stop.mine && !stop.status ? '#2e7d32' : stop.status === '已同意' ? '#4caf50' : stop.status?.includes('拒绝') ? '#e53935' : '#666',
                                      fontWeight: stop.mine ? 600 : 400,
                                      border: stop.mine && !stop.status ? '1px solid rgba(76,175,80,0.3)' : stop.status === '已同意' ? '1px solid rgba(76,175,80,0.2)' : stop.status?.includes('拒绝') ? '1px solid rgba(229,57,53,0.2)' : '1px solid #eee',
                                    }}
                                  >{stop.activity}{stop.status && <span style={{ fontSize: 10, opacity: 0.8 }}>({stop.status})</span>}</span>
                                </div>
                                {i < (msg.stops || []).length - 1 && (
                                  <div style={{ paddingLeft: 20, lineHeight: 0 }}>
                                    <svg width="10" height="12" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2">
                                      <line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                          {!msg.acted ? (
                            <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                              <button onClick={(e) => { e.stopPropagation(); handleApprove(msg.notifId || msg.id) }} style={{ padding: '4px 16px', fontSize: 12, border: 'none', borderRadius: 3, background: '#111', color: '#fff', cursor: 'pointer' }}>同意关联</button>
                              <button onClick={(e) => { e.stopPropagation(); handleReject(msg.notifId || msg.id) }} style={{ padding: '4px 16px', fontSize: 12, border: '1px solid #ddd', borderRadius: 3, background: '#fff', color: '#666', cursor: 'pointer' }}>拒绝关联</button>
                            </div>
                          ) : msg.actedResult?.startsWith('已拒绝') ? (
                            <div style={{ marginBottom: 4, fontSize: 12, color: '#e53935', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e53935" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                              {msg.actedResult}
                            </div>
                          ) : (
                            <div style={{ marginBottom: 4, fontSize: 12, color: '#4caf50', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4caf50" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                              已同意
                            </div>
                          )}
                        </>
                      )}
                      {msg.notifyType === 'booking_request' && <div style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>{msg.subtext}</div>}
                      {msg.notifyType === 'follow_notify' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <img src={msg.avatar || '/default-avatar.png'} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', cursor: 'pointer' }}
                            onClick={() => showUserPopup({ id: msg.userId, user_id: msg.userId, name: msg.userName, avatar: msg.avatar })} />
                          <span style={{ fontSize: 13, color: '#111' }}>
                            <b>{msg.userName}</b>
                            <span style={{ color: '#999', marginLeft: 4 }}>{msg.subtext} 关注了你</span>
                          </span>
                        </div>
                      )}
                      {msg.notifyType === 'save_notify' && (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                            <img src={msg.avatar || '/default-avatar.png'} alt="" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', cursor: 'pointer' }}
                              onClick={() => showUserPopup({ id: msg.userId, user_id: msg.userId, name: msg.userName, avatar: msg.avatar })} />
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#111' }}>{msg.userName}</span>
                          </div>
                          <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>{msg.subtext} 收藏了</div>
                          <div style={{ fontSize: 13, color: '#111', marginBottom: 4, cursor: 'pointer', textDecoration: 'underline' }}
                            onClick={() => navigate(`/discover/record/${msg.recordId}`)}>{msg.recordText}</div>
                          {msg.images && msg.images.length > 0 && (
                            <div style={{ display: 'flex', gap: 4, cursor: 'pointer' }}
                              onClick={() => navigate(`/discover/record/${msg.recordId}`)}>
                              {msg.images.slice(0, 3).map((img, i) => (
                                <img key={i} src={img} alt="" style={{ width: 60, height: 44, borderRadius: 3, objectFit: 'cover' }} />
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      {msg.notifyType === 'booking_result' && (
                        <div style={{ fontSize: 12, marginBottom: 6 }}>
                          <span style={{ color: '#999' }}>{msg.subtext}</span>
                          {msg.result && (
                            <span style={{
                              color: msg.result === '已通过' || msg.result.includes('已通过') ? '#4caf50' : msg.result === '待审核' ? '#ff9800' : '#e53935',
                              marginLeft: 8,
                            }}>
                              {msg.result === '已通过' || msg.result.includes('已通过') ? '✓ ' : msg.result === '待审核' ? '⏳ ' : '✕ '}
                              {msg.result}
                            </span>
                          )}
                        </div>
                      )}
                      {msg.notifyType === 'publish_review' ? (
                        msg.approved ? (
                          <a onClick={() => navigate(`/activity/${msg.activityId}`)} style={{ fontSize: 12, color: '#4caf50', cursor: 'pointer', textDecoration: 'underline' }}>查看活动详情 →</a>
                        ) : (
                          <div>
                            <div style={{ fontSize: 12, color: '#e53935', marginBottom: 4 }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#e53935" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                未通过：{msg.rejectReason || '未说明原因'}
                              </span>
                            </div>
                            <a onClick={() => {
                            const act = mockStore.activities.find(a => a.id === msg.activityId)
                            if (act && !mockStore.drafts.some(d => d.id === `draft_${act.id}`)) {
                              mockStore.drafts.push({ id: `draft_${act.id}`, title: act.title, contentType: act.category_type, city: act.city, industry: act.industry, description: act.description, requirements: act.requirements, images: act.images || [], updated_at: new Date().toLocaleDateString('zh-CN') })
                            }
                            navigate(`/publish?edit=${msg.activityId}`)
                          }} style={{ fontSize: 12, color: '#ff9800', cursor: 'pointer', textDecoration: 'underline' }}>重新编辑 →</a>
                          </div>
                          )
                      ) : null}
                    </div>
                  ) : (
                    <div className={styles.timeContent}>{msg.text.split('\n').map((line, i) => <div key={i}>{line}</div>)}</div>
                  )}
                  {msg.notifyType !== 'booking_request' && msg.notifyType !== 'booking_result' && msg.notifyType !== 'follow_notify' && msg.notifyType !== 'save_notify' && msg.notifyType !== 'featured_notify' && msg.notifyType !== 'route_notify' && <div className={styles.timeStamp}>{msg.time}</div>}
                  {msg.notifyType === 'booking_result' && msg.name ? (
                    <div style={{ marginTop: 8, background: '#fafafa', borderRadius: 3, padding: 10, border: '1px solid #eee' }}>
                      <div style={{ fontSize: 12, color: '#666', lineHeight: 2 }}>
                        <span>预约人：{msg.name}</span>
                        <span style={{ marginLeft: 12 }}>电话：{msg.phone}</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#666', lineHeight: 2 }}>
                        {msg.gender && <span>性别：{msg.gender}</span>}
                        {msg.age && <span style={{ marginLeft: 12 }}>年龄：{msg.age}岁</span>}
                        {msg.withFamily && <span style={{ marginLeft: 12, color: '#e53935' }}>🚩家属陪同</span>}
                      </div>
                      {msg.note && <div style={{ fontSize: 12, color: '#999', marginTop: 2, borderTop: '1px solid #eee', paddingTop: 4 }}>备注：{msg.note}</div>}
                    </div>
                  ) : null}
                  {msg.notifyType === 'booking_request' ? (
                    <div style={{ marginTop: 10, background: '#fafafa', borderRadius: 3, padding: 10, border: '1px solid #eee' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <img src={msg.avatar || '/default-avatar.png'} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', cursor: 'pointer' }}
                          onClick={() => showUserPopup({ id: msg.userId, user_id: msg.userId, name: msg.userName, avatar: msg.avatar })} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{msg.userName}</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#666', lineHeight: 2 }}>
                        <span>预约人：{msg.name}</span>
                        <span style={{ marginLeft: 12 }}>电话：{msg.phone}</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#666', lineHeight: 2 }}>
                        {msg.gender && <span>性别：{msg.gender}</span>}
                        {msg.age && <span style={{ marginLeft: 12 }}>年龄：{msg.age}岁</span>}
                        {msg.withFamily && <span style={{ marginLeft: 12, color: '#e53935' }}>🚩家属陪同</span>}
                      </div>
                      {msg.note && <div style={{ fontSize: 12, color: '#999', marginTop: 2, borderTop: '1px solid #eee', paddingTop: 4 }}>备注：{msg.note}</div>}
                      {!msg.acted ? (
                        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                          <button onClick={() => handleApprove(msg.id, msg.notifId)} style={{ flex: 1, padding: '6px 0', fontSize: 12, border: 'none', borderRadius: 3, background: '#111', color: '#fff', cursor: 'pointer' }}>同意</button>
                          <button onClick={() => handleReject(msg.id, msg.notifId)} style={{ flex: 1, padding: '6px 0', fontSize: 12, border: '1px solid #ddd', borderRadius: 3, background: '#fff', color: '#666', cursor: 'pointer' }}>拒绝</button>
                        </div>
                      ) : msg.actedResult?.startsWith('已拒绝') ? (
                        <div style={{ marginTop: 8, fontSize: 12, color: '#e53935', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e53935" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          {msg.actedResult}
                        </div>
                      ) : (
                        <div style={{ marginTop: 8, fontSize: 12, color: '#4caf50', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4caf50" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                          已同意
                        </div>
                      )}
                    </div>
                  ) : null}
                  {msg.notifyType === 'route_notify_result' && (
                    <div style={{ marginTop: 4, fontSize: 11, color: '#999' }}>处理完毕</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : messages.map(msg => {
          const isMe = msg.from === 'me'
          const avatar = getAvatar(msg)
          const handleAvatarClick = () => {
            if (isMe) return
            if (type === 'group' && msg.uid) {
              const p = mockStore.profiles.find(pr => pr.id === msg.uid)
              showUserPopup({ id: msg.uid, user_id: msg.uid, name: msg.name || p?.nickname || '用户', avatar: msg.avatar || p?.avatar || '/default-avatar.png' })
            } else if (type === 'private') {
              showUserPopup({ id, user_id: id, name: info.name, avatar: info.avatar })
            }
          }
          return (
            <div key={msg.id} className={`${styles.msgRow} ${isMe ? styles.me : styles.other}`}>
              <img className={styles.avatar} src={avatar} alt="" onClick={handleAvatarClick} style={{ cursor: isMe ? 'default' : 'pointer' }} />
              <div className={styles.bubbleWrap}>
                {msg.name && msg.from !== 'me' && <span className={styles.name}>{msg.name}</span>}
                <div className={styles.bubble}>{msg.text}</div>
                <span className={styles.time}>{msg.time}</span>
              </div>
            </div>
          )
        })}
        {messages.length === 0 && <div style={{ textAlign: 'center', color: '#999', padding: 40 }}>暂无消息</div>}
        <div id="chat-bottom-anchor" />
      </div>

      {canSend ? (
        <div className={styles.inputBar}>
          <input className={styles.input} ref={inputRef} value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSend() } }}
            placeholder="输入消息..." />
          <button className={styles.sendBtn} onClick={handleSend} disabled={!input.trim()} style={input.trim() ? {} : { background: '#fff', color: '#111', border: '1px solid #111' }}>发送</button>
        </div>
      ) : type === 'group' ? (
        <div className={styles.inputBar} style={{ justifyContent: 'center', color: '#999', fontSize: 13 }}>你不在群聊中，无法发言</div>
      ) : null}

      {showGroupInfo && (
        <div className={styles.infoOverlay} onClick={() => setShowGroupInfo(false)}>
          <div className={styles.infoSheet} onClick={e => e.stopPropagation()}>
            <div className={styles.infoHeader}>
              <span className={styles.infoTitle}>群聊信息</span>
              <button className={styles.infoClose} onClick={() => setShowGroupInfo(false)}>✕</button>
            </div>
            <div className={styles.infoName}>{info.title}</div>
            <div className={styles.infoSection}>
              <div className={styles.infoLabel}>群成员（{groupMembers.length}人）</div>
              <div className={styles.memberList}>
                {groupMembers.map(m => {
                  const roleLabel = m.role === 'superadmin' ? '超管' : m.role === 'admin' ? '管理员' : m.role === 'organizer' ? '发布人' : ''
                  const showKick = canKick(m.role) && m.id !== user?.id
                  return (
                    <div key={m.id} className={styles.memberItem}>
                      <div onClick={() => { setShowGroupInfo(false); showUserPopup({ id: m.id, user_id: m.id, name: m.nickname, avatar: m.avatar }) }} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, cursor: 'pointer' }}>
                        <img className={styles.memberAvatar} src={m.avatar} alt="" />
                        <span className={styles.memberName}>{m.nickname}</span>
                        {roleLabel && <span style={{ fontSize: 10, color: '#fff', background: '#111', padding: '1px 5px', borderRadius: 3 }}>{roleLabel}</span>}
                      </div>
                      {showKick && (
                        <button onClick={() => handleKickMember(m.id)} style={{
                          background: 'none', border: '1px solid #e53935', borderRadius: 3, color: '#e53935', fontSize: 11,
                          padding: '2px 8px', cursor: 'pointer',
                        }}>移出</button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {showPrivateInfo && privateProfile && (
        <div className={styles.infoOverlay} onClick={() => setShowPrivateInfo(false)}>
          <div className={styles.infoSheet} onClick={e => e.stopPropagation()}>
            <div className={styles.infoHeader}>
              <span className={styles.infoTitle}>用户信息</span>
              <button className={styles.infoClose} onClick={() => setShowPrivateInfo(false)}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0' }}>
              <img src={privateProfile.avatar || '/default-avatar.png'} alt="" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover' }} />
              <div style={{ fontSize: 15, fontWeight: 600, marginTop: 8 }}>{privateProfile.nickname}</div>
              {privateProfile.bio && <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{privateProfile.bio}</div>}
            </div>
            <div style={{ display: 'flex', gap: 8, padding: '0 20px 20px', justifyContent: 'center' }}>
              {!isFollowingPrivate ? (
                <button onClick={handleFollowPrivate} style={{ flex: 1, padding: '8px 0', fontSize: 14, border: 'none', borderRadius: 3, background: '#111', color: '#fff', cursor: 'pointer' }}>关注</button>
              ) : (
                <>
                  <button onClick={handleFollowPrivate} style={{ flex: 1, padding: '8px 0', fontSize: 14, border: '1px solid #ddd', borderRadius: 3, background: '#f5f5f5', color: '#999', cursor: 'pointer' }}>已关注</button>
                  <button onClick={() => { setShowPrivateInfo(false); /* already in chat */ }} style={{ flex: 1, padding: '8px 0', fontSize: 14, border: '1px solid #ddd', borderRadius: 3, background: '#fff', color: '#666', cursor: 'pointer' }}>私信</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {confirmMsg && <ConfirmDialog message={confirmMsg.msg} options={confirmMsg.options} onConfirm={confirmMsg.onOk} onCancel={() => setConfirmMsg(null)} />}
    </div>
  )
}
