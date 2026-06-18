import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'
import { showToast } from '../../lib/utils'
import PageHeader from '../../components/shared/PageHeader'
import styles from './MyFollowing.module.css'

export default function MyFollowing() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [follows, setFollows] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirmUnfollow, setConfirmUnfollow] = useState(null)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    loadFollows()
  }, [user])

  const loadFollows = async () => {
    setLoading(true)
    // 从 follows 表加载关注的用户
    const { data, error } = await supabase
      .from('follows')
      .select('user_id, profiles:user_id(nickname, avatar, numeric_id)')
      .eq('follower_id', user.id)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setFollows(data.map(f => ({
        id: f.profiles?.numeric_id || f.user_id,
        uuid: f.user_id,
        nickname: f.profiles?.nickname || '用户',
        avatar: f.profiles?.avatar || '/default-avatar.png',
      })))
    }
    setLoading(false)
  }

  const handleUnfollow = async (userId) => {
    const { error } = await supabase.rpc('toggle_follow', { p_user_id: userId })
    if (error) { showToast('操作失败'); return }
    setFollows(prev => prev.filter(f => f.id !== id))
    setConfirmUnfollow(null)
  }

  if (loading) return <div className="page-container"><PageHeader title="我的关注" onBack={() => navigate(-1)} /><div className="empty-state">加载中...</div></div>

  return (
    <div className="page-container">
      <PageHeader title="我的关注" onBack={() => navigate(-1)} />

      <div className={styles.list}>
        {follows.length === 0 ? (
          <div className="empty-state">还没有关注任何人</div>
        ) : (
          follows.map(f => (
            <div key={f.id} className={styles.item}>
              <img className={styles.avatar} src={f.avatar} alt="" loading="lazy" />
              <div className={styles.info}>
                <div className={styles.name}>{f.nickname}</div>
              </div>
              <button className={styles.msgBtn} onClick={(e) => { e.stopPropagation(); navigate(`/messages/chat/private/${f.uuid}`) }}>
                私信
              </button>
              <button className={styles.unfollowBtn} onClick={(e) => { e.stopPropagation(); setConfirmUnfollow({ id: f.uuid, name: f.nickname }) }}>
                取消关注
              </button>
            </div>
          ))
        )}
      </div>

      {confirmUnfollow && (
        <div className={styles.overlay} onClick={() => setConfirmUnfollow(null)}>
          <div className={styles.dialog} onClick={e => e.stopPropagation()}>
            <div className={styles.dialogTitle}>取消关注</div>
            <div className={styles.dialogBody}>确定取消关注「{confirmUnfollow.name}」？</div>
            <div className={styles.dialogBtns}>
              <button className={styles.cancelBtn} onClick={() => setConfirmUnfollow(null)}>取消</button>
              <button className={styles.confirmBtn} onClick={() => handleUnfollow(confirmUnfollow.id)}>确认</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
