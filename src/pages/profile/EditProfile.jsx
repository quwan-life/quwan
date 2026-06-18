import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { showToast } from '../../lib/utils'
import { supabase } from '../../lib/supabase'
import PageHeader from '../../components/shared/PageHeader'
import styles from './EditProfile.module.css'

export default function EditProfile({ user, onLogout, updateUser, changePassword }) {
  const navigate = useNavigate()
  const [avatar, setAvatar] = useState(user?.avatar || '/default-avatar.png')
  const [nickname, setNickname] = useState(user?.nickname || '')
  const [email, setEmail] = useState(user?.email || '')
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSave = async () => {
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return showToast('邮箱格式不正确')
    }
    if (user?.numeric_id === 10000 && nickname !== '超级管理员') {
      return showToast('超级管理员用户名不可更改')
    }
    const lastChange = localStorage.getItem(`quwan_name_change_${user?.numeric_id}`)
    if (lastChange && nickname !== user?.nickname) {
      const diff = Date.now() - parseInt(lastChange)
      if (diff < 10 * 60 * 1000) {
        const m = Math.ceil((10 * 60 * 1000 - diff) / 60000)
        return showToast(`用户名每10分钟可更改1次，${m}分钟后可改`)
      }
    }
    if (nickname !== user?.nickname) {
      localStorage.setItem(`quwan_name_change_${user?.numeric_id}`, String(Date.now()))
    }

    // 密码变更走 RPC
    if (newPassword) {
      if (!oldPassword) return showToast('请输入旧密码')
      const ok = await changePassword?.(oldPassword, newPassword)
      if (!ok) return showToast('旧密码错误')
    }

    updateUser?.({ nickname, avatar })
    showToast('保存成功')
    navigate(-1)
  }

  return (
    <div className="page-container">
      <PageHeader cn="编辑" en="EDIT" />

      <div className={styles.form}>
        <div className={styles.avatarRow}>
          <label className={styles.avatarLabel}>
            <img src={avatar} alt="" className={styles.avatar} />
            <div className={styles.avatarOverlay}>更换</div>
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
              const f = e.target.files?.[0]
              if (f) { const r = new FileReader(); r.onload = ev => setAvatar(ev.target.result); r.readAsDataURL(f) }
            }} />
          </label>
        </div>

        <div className={styles.card}>
          <div className={styles.field}>
            <span className={styles.label}>用户名</span>
            <input className={styles.input} value={nickname} onChange={e => setNickname(e.target.value)} />
          </div>
          <div className={styles.field}>
            <span className={styles.label}>用户ID</span>
            <div className={styles.input} style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ color: '#aaa', fontSize: 14 }}>{user?.numeric_id || '—'}</span>
            </div>
          </div>
          <div className={styles.field}>
            <span className={styles.label}>旧密码</span>
            <div className={styles.input} style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
              <input
                style={{ flex: 1, height: '100%', border: 'none', background: 'transparent', fontSize: 14, outline: 'none', padding: 0 }}
                type={showPassword ? 'text' : 'password'}
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                placeholder="留空则不修改密码"
              />
            </div>
          </div>
          <div className={styles.field}>
            <span className={styles.label}>新密码</span>
            <div className={styles.input} style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
              <input
                style={{ flex: 1, height: '100%', border: 'none', background: 'transparent', fontSize: 14, outline: 'none', padding: 0 }}
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="留空则不修改"
              />
              <button className={styles.eyeBtn} onClick={() => setShowPassword(!showPassword)} type="button">
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
          </div>
        </div>

        <button className={styles.saveBtn} onClick={handleSave}>保存</button>

        {onLogout && (
          <button className={styles.logoutBtn} onClick={async () => { await onLogout(); navigate('/profile') }}>退出登录</button>
        )}
      </div>
    </div>
  )
}
