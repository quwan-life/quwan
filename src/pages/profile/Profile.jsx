import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { mockProfiles, mockBookings, mockStore, mockFollowing, mockMyRecords } from '../../lib/mockData'
import PageHeader from '../../components/shared/PageHeader'
import FilterTabs from '../../components/shared/FilterTabs'
import AdminReview from '../admin/AdminReview'
import AdminInvites from '../admin/AdminInvites'
import AdminUsers from '../admin/AdminUsers'
import styles from './Profile.module.css'

const PROFILE_TABS = [
  { key: 'activity', label: '动态' },
  { key: 'bookings', label: '预约' },
  { key: 'following', label: '关注' },
  { key: 'published', label: '发布' },
  { key: 'records', label: '记录' },
]

const ACTIVITY_TYPES = {
  booking: { label: '预约', color: '#4a90d9' },
  follow: { label: '关注', color: '#f0a500' },
  publish: { label: '发布', color: '#4caf50' },
  record: { label: '发表记录', color: '#e57373' },
}

const MOCK_ACTIVITIES = [
  { id: 1, type: 'booking', text: '咖啡师一日体验', time: '6月13日', date: { month: '6', day: '13' }, year: '2026', detail: '上海市静安区 · ¥128/人', images: ['https://picsum.photos/seed/a1/200/120'] },
  { id: 2, type: 'follow', text: '小野同学', time: '6/12', date: { month: '6', day: '12' }, year: '2026', detail: '热爱自然与手工' },
  { id: 3, type: 'publish', text: '苍山徒步一日游', time: '6/10', date: { month: '6', day: '10' }, year: '2026', detail: '户外 · 大理', images: ['https://picsum.photos/seed/a3/200/120', 'https://picsum.photos/seed/a3b/200/120'] },
  { id: 4, type: 'record', text: '白族扎染的蓝，像大理的天', time: '6/9', date: { month: '6', day: '9' }, year: '2026', detail: '大理', images: ['https://picsum.photos/seed/a4/200/120', 'https://picsum.photos/seed/a4b/200/120', 'https://picsum.photos/seed/a4c/200/120'] },
  { id: 5, type: 'booking', text: '陶艺手作体验', time: '6/8', date: { month: '6', day: '8' }, year: '2026', detail: '上海市杨浦区 · ¥158/人' },
  { id: 6, type: 'follow', text: '烘焙达人David', time: '6/7', date: { month: '6', day: '7' }, year: '2026', detail: '用双手创造面包的魔法' },
  { id: 9, type: 'booking', text: '花艺设计师一日体验', time: '12/20', date: { month: '12', day: '20' }, year: '2025', detail: '上海市徐汇区 · ¥198/人', images: ['https://picsum.photos/seed/a9/200/120', 'https://picsum.photos/seed/a9b/200/120'] },
  { id: 10, type: 'record', text: '第一次做陶艺，手忙脚乱', time: '11/15', date: { month: '11', day: '15' }, year: '2025', detail: '大理', images: ['https://picsum.photos/seed/a10/200/120'] },
]

export default function Profile({ onLogout }) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem('profileTab') || 'activity')
  const [drawer, setDrawer] = useState(null) // 'invites' | 'audit' | 'users'
  const [pubSub, setPubSub] = useState('published')
  const [recSub, setRecSub] = useState('published')
  const [followSub, setFollowSub] = useState('following')
  const [bookingSub, setBookingSub] = useState('booked')
  const [unfollowTarget, setUnfollowTarget] = useState(null)

  const handleFollow = (f) => {
    // 添加到我关注列表
    setFollowing(prev => [...prev, { ...f, followed_at: '刚刚' }])
  }

  const handleUnfollow = (f) => {
    setUnfollowTarget(null)
    // 从关注列表移除
    setFollowing(prev => prev.filter(item => item.id !== f.id))
  }

  const closeDrawer = () => setDrawer(null)

  const user = mockProfiles[0]
  const bookings = mockBookings || []
  const followingState = useState(mockFollowing || [])
  const following = followingState[0]
  const setFollowing = followingState[1]
  const followers = [
    { id: 'f1', user_id: 'u1', name: '小野同学', avatar: 'https://picsum.photos/seed/user1/100/100', bio: '热爱自然与手工', followed_at: '6月12日' },
    { id: 'f2', user_id: 'u3', name: '烘焙达人David', avatar: 'https://picsum.photos/seed/user3/100/100', bio: '面包是我的语言', followed_at: '6月10日' },
    { id: 'f3', user_id: 'u4', name: '文艺青年小李', avatar: 'https://picsum.photos/seed/user4/100/100', bio: '用文字记录生活', followed_at: '6月8日' },
    { id: 'f4', user_id: 'u5', name: '摄影爱好者老张', avatar: 'https://picsum.photos/seed/user5/100/100', bio: '镜头下的世界', followed_at: '6月5日' },
  ]
  const published = mockStore.activities.filter(a => a.user_id === user.id)
  const drafts = mockStore.drafts
  const myRecords = mockMyRecords || []
  const draftRecords = [
    { id: 'rd1', title: '关于大理的生活碎片', updated_at: '6月13日', images: ['https://picsum.photos/seed/rdraft1/400/300'] },
    { id: 'rd2', title: '和孩子一起做陶艺', updated_at: '6月10日', images: [] },
  ]

  const tabs = PROFILE_TABS.map(t => ({ ...t }))

  const renderContent = () => {
    switch (activeTab) {
      case 'activity':
        return (
          <div style={{ padding: '0 0 20px' }}>
            {MOCK_ACTIVITIES.map((act, i) => {
              const prevYear = i > 0 ? MOCK_ACTIVITIES[i - 1].year : null
              const showYear = act.year !== '2026' && act.year !== prevYear
              return (
                <div key={act.id}>
                  {showYear && (
                    <div style={{ display: 'flex', alignItems: 'center', padding: '12px 20px 6px', gap: 8 }}>
                      <div style={{ flex: 1, height: 1, background: '#eee' }} />
                      <span style={{ fontSize: 11, color: '#bbb', flexShrink: 0 }}>{act.year}年</span>
                      <div style={{ flex: 1, height: 1, background: '#eee' }} />
                    </div>
                  )}
                  <div style={{ display: 'flex', padding: '10px 20px', gap: 5, alignItems: 'flex-start', cursor: 'pointer', borderBottom: '1px solid #f5f5f5' }} onClick={() => navigate('/discover')}>
                    <div style={{ width: 36, display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, marginLeft: 'calc((100vw - 40px) / 10 - 18px)' }}>
                      <div style={{ fontSize: 20, fontWeight: 300, color: '#111', fontFamily: 'Georgia, serif', lineHeight: 1 }}>{act.date.day}</div>
                      <div style={{ fontSize: 10, color: '#bbb', marginTop: 2 }}>{act.date.month}月</div>
                    </div>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: ACTIVITY_TYPES[act.type]?.color || '#999', flexShrink: 0, marginTop: 7 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: '#111', lineHeight: 1.5, fontWeight: 500 }}>
                        {ACTIVITY_TYPES[act.type]?.label}了 {act.text}
                      </div>
                      {act.detail && <div style={{ fontSize: 11, color: '#bbb', marginTop: 2 }}>{act.detail}</div>}
                      {act.images && (
                        <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                          {act.images.slice(0, 3).map((img, i) => (
                            <img key={i} src={img} alt="" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 2 }} />
                          ))}
                          {act.images.length > 3 && <div style={{ width: 60, height: 60, background: '#f0f0f0', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#999' }}>+{act.images.length - 3}</div>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )

      case 'bookings':
        return (
          <div className={styles.list}>
            <div style={{ display: 'flex', gap: 0, marginBottom: 12 }}>
              <button onClick={() => setBookingSub('booked')} style={{ flex: 1, padding: '6px 0', textAlign: 'center', fontSize: 12, fontWeight: 600, background: bookingSub === 'booked' ? '#111' : '#f5f5f5', color: bookingSub === 'booked' ? '#fff' : '#999', border: 'none', borderRadius: '2px 0 0 2px', cursor: 'pointer' }}>已预约</button>
              <button onClick={() => setBookingSub('done')} style={{ flex: 1, padding: '6px 0', textAlign: 'center', fontSize: 12, fontWeight: 600, background: bookingSub === 'done' ? '#111' : '#f5f5f5', color: bookingSub === 'done' ? '#fff' : '#999', border: 'none', borderRadius: '0 2px 2px 0', cursor: 'pointer' }}>已完成</button>
            </div>
            {bookings.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#999', padding: 40, fontSize: 13 }}>暂无预约</div>
            ) : bookings.filter(b => bookingSub === 'done' ? b.status === 'completed' : b.status !== 'completed').map(b => (
              <div key={b.id} className={styles.drawerItem} onClick={() => navigate(`/activity/${b.activity_id}`)}>
                <img src={b.cover || 'https://picsum.photos/seed/bk/300/300'} alt="" />
                <div style={{ flex: 1 }}>
                  <div className={styles.drawerTitle}>{b.title}</div>
                  <div className={styles.drawerMeta}>{b.dateTime} · {bookingSub === 'done' ? '已完成' : '即将开始'}</div>
                  <div className={styles.drawerMeta} style={{ color: '#bbb' }}>{b.location}</div>
                </div>
              </div>
            ))}
          </div>
        )

      case 'following':
        return (
          <div className={styles.list}>
            <div style={{ display: 'flex', gap: 0, marginBottom: 12 }}>
              <button onClick={() => setFollowSub('following')} style={{ flex: 1, padding: '6px 0', textAlign: 'center', fontSize: 12, fontWeight: 600, background: followSub === 'following' ? '#111' : '#f5f5f5', color: followSub === 'following' ? '#fff' : '#999', border: 'none', borderRadius: '2px 0 0 2px', cursor: 'pointer' }}>我关注</button>
              <button onClick={() => setFollowSub('followers')} style={{ flex: 1, padding: '6px 0', textAlign: 'center', fontSize: 12, fontWeight: 600, background: followSub === 'followers' ? '#111' : '#f5f5f5', color: followSub === 'followers' ? '#fff' : '#999', border: 'none', borderRadius: '0 2px 2px 0', cursor: 'pointer' }}>关注我</button>
            </div>
            {(followSub === 'followers' ? followers : following).map(f => {
              const isFollowing = following.some(m => m.id === f.id)
              return (
              <div key={f.id} className={styles.drawerItem} onClick={() => navigate(`/user/${f.user_id}`)}>
                <img src={f.avatar || '/default-avatar.png'} alt="" className={styles.avatar} />
                <div style={{ flex: 1 }}>
                  <div className={styles.drawerTitle}>{f.name}</div>
                  <div className={styles.drawerMeta}>{followSub === 'followers' ? (f.followed_at + ' 关注了你') : (f.followed_at || '6月') + ' 关注'}</div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  {followSub === 'following' ? (
                    <button onClick={e => { e.stopPropagation(); setUnfollowTarget(f) }} style={{ padding: '4px 8px', fontSize: 11, color: '#666', background: '#fff', border: '1px solid #ddd', borderRadius: 2, cursor: 'pointer' }}>取消关注</button>
                  ) : isFollowing ? (
                    <span style={{ padding: '4px 8px', fontSize: 11, color: '#999', background: '#fafafa', border: '1px solid #eee', borderRadius: 2 }}>互相关注</span>
                  ) : (
                    <button onClick={e => { e.stopPropagation(); handleFollow(f) }} style={{ padding: '4px 8px', fontSize: 11, color: '#666', background: '#fff', border: '1px solid #ddd', borderRadius: 2, cursor: 'pointer' }}>关注</button>
                  )}
                  <button onClick={e => { e.stopPropagation(); navigate(`/messages/chat/private/${f.user_id}`) }} style={{ padding: '4px 8px', fontSize: 11, color: '#666', background: '#fff', border: '1px solid #ddd', borderRadius: 2, cursor: 'pointer' }}>私信</button>
                </div>
              </div>
              )
            })}
          </div>
        )

      case 'published':
        return (
          <div className={styles.list}>
            <div style={{ display: 'flex', gap: 0, marginBottom: 12 }}>
              <button onClick={() => setPubSub('published')} style={{ flex: 1, padding: '6px 0', textAlign: 'center', fontSize: 12, fontWeight: 600, background: pubSub === 'published' ? '#111' : '#f5f5f5', color: pubSub === 'published' ? '#fff' : '#999', border: 'none', borderRadius: '2px 0 0 2px', cursor: 'pointer' }}>已发布</button>
              <button onClick={() => setPubSub('draft')} style={{ flex: 1, padding: '6px 0', textAlign: 'center', fontSize: 12, fontWeight: 600, background: pubSub === 'draft' ? '#111' : '#f5f5f5', color: pubSub === 'draft' ? '#fff' : '#999', border: 'none', borderRadius: '0 2px 2px 0', cursor: 'pointer' }}>草稿箱</button>
            </div>
            {(pubSub === 'draft' ? drafts : published).map(act => {
              const isDraft = pubSub === 'draft'
              return (
                <div key={act.id} className={styles.drawerItem} onClick={() => !isDraft && navigate(`/activity/${act.id}`)}>
                  <img src={act.cover_url || 'https://picsum.photos/seed/bk/300/300'} alt="" />
                  <div style={{ flex: 1 }}>
                    <div className={styles.drawerTitle}>{act.title}</div>
                    {isDraft ? (
                      <div className={styles.drawerMeta}>上次编辑 {act.updated_at}</div>
                    ) : (
                      <div className={styles.drawerMeta}>发布于 {act.created_at ? new Date(act.created_at).getMonth() + 1 + '月' + new Date(act.created_at).getDate() + '日' : '6月1日'} · 上次审核 6月15日</div>
                    )}
                  </div>
                  <button onClick={e => { e.stopPropagation(); isDraft ? navigate(`/publish?edit=draft_${act.id}`) : navigate(`/publish?edit=${act.id}`) }} style={{ padding: '4px 8px', fontSize: 11, color: '#666', background: '#fff', border: '1px solid #ddd', borderRadius: 2, cursor: 'pointer', flexShrink: 0 }}>修改</button>
                </div>
              )
            })}
          </div>
        )

      case 'records':
        return (
          <div className={styles.list}>
            <div style={{ display: 'flex', gap: 0, marginBottom: 12 }}>
              <button onClick={() => setRecSub('published')} style={{ flex: 1, padding: '6px 0', textAlign: 'center', fontSize: 12, fontWeight: 600, background: recSub === 'published' ? '#111' : '#f5f5f5', color: recSub === 'published' ? '#fff' : '#999', border: 'none', borderRadius: '2px 0 0 2px', cursor: 'pointer' }}>已记录</button>
              <button onClick={() => setRecSub('draft')} style={{ flex: 1, padding: '6px 0', textAlign: 'center', fontSize: 12, fontWeight: 600, background: recSub === 'draft' ? '#111' : '#f5f5f5', color: recSub === 'draft' ? '#fff' : '#999', border: 'none', borderRadius: '0 2px 2px 0', cursor: 'pointer' }}>草稿箱</button>
            </div>
            {(recSub === 'draft' ? draftRecords : myRecords).map(r => {
              const isDraft = recSub === 'draft'
              return (
                <div key={r.id} className={styles.drawerItem} onClick={() => !isDraft && navigate(`/discover/record/${r.id}`)}>
                  <img src={r.images?.[0] || 'https://picsum.photos/seed/rec1/300/300'} alt="" />
                  <div style={{ flex: 1 }}>
                    <div className={styles.drawerTitle}>{r.title}</div>
                    <div className={styles.drawerMeta}>{isDraft ? `上次编辑 ${r.updated_at}` : `记录于 ${r.date || '6月8日'}`}</div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); isDraft ? navigate('/discover/record/create') : navigate(`/discover/record/${r.id}/edit`) }} style={{ padding: '4px 8px', fontSize: 11, color: '#666', background: '#fff', border: '1px solid #ddd', borderRadius: 2, cursor: 'pointer', flexShrink: 0 }}>修改</button>
                </div>
              )
            })}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className={styles.page}>
      <PageHeader cn="主页" en="HOME" right="走过的路，都算数" />

      {/* 固定区域：用户信息 + 筛选 */}
      <div style={{ position: 'sticky', top: 44, zIndex: 50, background: '#fff' }}>
        <div style={{ position: 'relative' }}>
        {/* 用户信息 — 左2列头像+名称，右3列管理按钮 */}
        <div style={{ padding: '12px 20px 8px', display: 'flex', alignItems: 'center' }}>
          {/* 左侧：头像+名称 */}
          <div style={{ width: '40%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <div style={{ position: 'relative', width: 38, height: 38, borderRadius: '50%', overflow: 'hidden', cursor: 'pointer', flexShrink: 0 }} onClick={() => navigate('/profile/edit')}>
              <img src={user.avatar || '/default-avatar.png'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{user.nickname}</div>
          </div>

          {/* 右侧：管理按钮 — 对应关注、发布、记录三列宽度 */}
          <div style={{ width: '60%', display: 'flex', gap: 0, alignItems: 'center' }}>
            {(user.role === 'admin' || user.role === 'superadmin') ? (
              <>
                {user.role === 'superadmin' ? (
                  <button onClick={() => setDrawer(drawer === 'users' ? null : 'users')} className={styles.adminBtn} style={{ borderLeft: '1px solid #ddd', background: drawer === 'users' ? '#111' : '#fff', color: drawer === 'users' ? '#fff' : '#666', borderColor: drawer === 'users' ? '#111' : undefined }}>管理</button>
                ) : (
                  <div className={styles.adminBtn} style={{ color: '#ccc', borderLeft: '1px solid #ddd' }}>—</div>
                )}
                <button onClick={() => setDrawer(drawer === 'invites' ? null : 'invites')} className={styles.adminBtn} style={{ background: drawer === 'invites' ? '#111' : '#fff', color: drawer === 'invites' ? '#fff' : '#666', borderColor: drawer === 'invites' ? '#111' : undefined }}>邀请码</button>
                <button onClick={() => setDrawer(drawer === 'audit' ? null : 'audit')} className={styles.adminBtn} style={{ background: drawer === 'audit' ? '#111' : '#fff', color: drawer === 'audit' ? '#fff' : '#666', borderColor: drawer === 'audit' ? '#111' : undefined }}>审核</button>
              </>
            ) : (
              <div style={{ flex: 1 }} />
            )}
          </div>
        </div>

        <FilterTabs tabs={tabs} active={activeTab} onChange={key => { setActiveTab(key); sessionStorage.setItem('profileTab', key) }} />

        {/* 管理抽屉 */}
        {drawer && (
          <div className={styles.drawerOverlay} onClick={closeDrawer}>
            <div className={styles.drawer} onClick={e => e.stopPropagation()}>
              <div className={styles.drawerHeader}>
                <span className={styles.drawerTitleText}>{drawer === 'invites' ? '邀请码' : drawer === 'audit' ? '审核' : '用户管理'}</span>
                <button onClick={closeDrawer} className={styles.drawerClose}>✕</button>
              </div>
              <div className={styles.drawerBody}>
                {drawer === 'invites' && <AdminInvites />}
                {drawer === 'audit' && <AdminReview />}
                {drawer === 'users' && <AdminUsers />}
              </div>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* 选中标签的内容 */}
      {renderContent()}

      {/* 取消关注确认弹窗 */}
      {unfollowTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setUnfollowTarget(null)}>
          <div style={{ background: '#fff', borderRadius: 3, padding: 20, width: 280, maxWidth: '90vw' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>取消关注</div>
            <div style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>确认取消关注 {unfollowTarget.name}？</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ flex: 1, padding: '8px 0', fontSize: 14, border: '1px solid #ddd', borderRadius: 3, background: '#fff', cursor: 'pointer' }} onClick={() => setUnfollowTarget(null)}>取消</button>
              <button style={{ flex: 1, padding: '8px 0', fontSize: 14, border: 'none', borderRadius: 3, background: '#111', color: '#fff', cursor: 'pointer' }} onClick={() => handleUnfollow(unfollowTarget)}>确认取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
