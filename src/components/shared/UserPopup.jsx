import { useState, useContext, createContext, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { mockFollows } from '../../lib/mockData'
import { useAuth } from '../../lib/AuthContext'
import styles from './UserPopup.module.css'

const UserPopupContext = createContext(null)

export function UserPopupProvider({ children }) {
  const [popup, setPopup] = useState(null) // { id, name, avatar, bio } | null

  const show = useCallback((user) => {
    setPopup(user)
  }, [])

  const hide = useCallback(() => {
    setPopup(null)
  }, [])

  return (
    <UserPopupContext.Provider value={{ showUserPopup: show, hideUserPopup: hide, popup }}>
      {children}
      {popup && <UserPopup user={popup} onClose={hide} />}
    </UserPopupContext.Provider>
  )
}

export function useUserPopup() {
  const ctx = useContext(UserPopupContext)
  if (!ctx) throw new Error('useUserPopup must be used within UserPopupProvider')
  return ctx
}

function UserPopup({ user, onClose }) {
  const navigate = useNavigate()
  const { user: me } = useAuth()
  const [following, setFollowing] = useState(false)

  useEffect(() => {
    if (!me) return
    const targetId = user.user_id || user.id
    supabase.from('follows').select('*').eq('follower_id', me.id).eq('user_id', targetId).single().then(({ data, error }) => {
      if (error || !data) {
        // mock 回退
        setFollowing(mockFollows.some(f => f.follower_id === me.id && f.user_id === targetId))
        return
      }
      setFollowing(!!data)
    })
  }, [user, me])

  const handleFollow = async () => {
    const targetId = user.user_id || user.id
    await supabase.rpc('toggle_follow', { p_user_id: targetId })
    // mock 回退
    if (following) {
      const idx = mockFollows.findIndex(f => f.follower_id === me.id && f.user_id === targetId)
      if (idx >= 0) mockFollows.splice(idx, 1)
    } else {
      mockFollows.push({ follower_id: me.id, user_id: targetId })
    }
    setFollowing(prev => !prev)
  }

  const handleMessage = () => {
    onClose()
    navigate(`/messages/chat/private/${user.id || user.user_id}`)
  }

  // 阻止内容区点击冒泡关闭弹窗
  const stopPropagation = (e) => e.stopPropagation()

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.popup} onClick={stopPropagation}>
        {/* 关闭按钮 */}
        <button className={styles.closeBtn} onClick={onClose}>✕</button>

        {/* 用户信息 */}
        <div className={styles.userInfo}>
          <img className={styles.avatar} src={user.avatar} alt="" onClick={() => { onClose(); navigate(`/user/${user.id || user.user_id}`) }} style={{ cursor: 'pointer' }} />
          <div className={styles.name}>{user.name}</div>
          {user.bio && <div className={styles.bio}>{user.bio}</div>}
        </div>

        {/* 操作按钮区 */}
        <div className={styles.actions}>
          {!following ? (
            <button className={styles.followBtn} onClick={handleFollow}>
              关注
            </button>
          ) : (
            <>
              <button className={styles.followingBtn} onClick={handleFollow}>
                已关注
              </button>
              <button className={styles.msgBtn} onClick={handleMessage}>
                私信
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
