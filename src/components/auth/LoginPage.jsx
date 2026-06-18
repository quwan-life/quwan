import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/AuthContext'
import { supabase } from '../../lib/supabase'
import { showToast } from '../../lib/utils'
import PageHeader from '../../components/shared/PageHeader'
import styles from './LoginPage.module.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, register } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  // 注册成功弹窗
  const [successInfo, setSuccessInfo] = useState(null)
  const [countdown, setCountdown] = useState(5)
  const [submitting, setSubmitting] = useState(false)
  const [resetMode, setResetMode] = useState(false)

  const validateUsername = (name) => {
    return /^[\u4e00-\u9fa5a-zA-Z]{1,12}$/.test(name)
  }

  const handleSubmit = async () => {
    if (submitting) return
    setSubmitting(true)
    if (!nickname.trim()) { setSubmitting(false); return showToast(isLogin ? '请输入用户名' : '请输入用户名（中文或英文）') }
    if (!password.trim()) { setSubmitting(false); return showToast('请输入密码') }

    if (isLogin) {
      const ok = await login(nickname.trim(), password)
      if (ok) {
        showToast('登录成功')
        navigate('/profile')
      } else {
        showToast('用户名或密码错误')
        setSubmitting(false)
      }
    } else {
      if (!validateUsername(nickname.trim())) {
        setSubmitting(false); return showToast('用户名仅支持中文或英文，1-12字符') }
      if (nickname.trim().includes('管理员')) {
        setSubmitting(false); return showToast('用户名不可包含"管理员"') }
      if (password.length < 6) {
        setSubmitting(false); return showToast('密码至少6位') }
      if (!inviteCode.trim()) {
        setSubmitting(false); return showToast('请输入邀请码') }
      const newUser = await register(nickname.trim(), password, inviteCode.trim())
      if (!newUser || newUser.error) {
        setSubmitting(false); return showToast(newUser?.error || '邀请码无效或已用完')
      }
      setSuccessInfo({ nickname: newUser.nickname, id: newUser.id, password })
      setCountdown(5)
      setSubmitting(false)
      // 倒计时
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) { clearInterval(timer); return 0 }
          return prev - 1
        })
      }, 1000)
    }
  }

  const handleResetPassword = async () => {
    showToast('请联系管理员重置密码')
  }

  const closeSuccess = () => {
    setSuccessInfo(null)
    navigate('/profile')
  }

  return (
    <div className="page-container">
      <PageHeader title={isLogin ? '登录' : '注册'} onBack={() => navigate(-1)} />

      <div className={styles.form}>
        <div className={styles.avatar}>
          <img src="/default-avatar.png" alt="" className={styles.avatarImg} />
        </div>

        {!isLogin && (
          <div className={styles.hint}>设置用户名和密码，ID和密码注册后不可变更</div>
        )}

        <div className={styles.field}>
          <label className={styles.label}>{isLogin ? '用户名 / ID' : '用户名（中文或英文）'}</label>
          <input
            className={styles.input}
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            placeholder={isLogin ? '用户名 / ID' : '仅支持中文和英文，1-12字符'}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>密码</label>
          <input
            className={styles.input}
            type="text"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder={isLogin ? '输入密码' : '设置密码（至少6位）'}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        {!isLogin && (
          <div className={styles.field}>
            <label className={styles.label}>邀请码</label>
            <input
              className={styles.input}
              value={inviteCode}
              onChange={e => setInviteCode(e.target.value)}
              placeholder="输入邀请码"
            />
          </div>
        )}

        {isLogin && (
          <div className={styles.forgotPwd} onClick={handleResetPassword}>忘记密码？</div>
        )}
        <button className={styles.submitBtn} onClick={handleSubmit} disabled={submitting}>
          {isLogin ? '登录' : '注册'}
        </button>

        <button className={styles.toggleBtn} onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? '没有账号？去注册' : '已有账号？去登录'}
        </button>
      </div>

      {/* 注册成功弹窗 */}
      {successInfo && (
        <div className={styles.successOverlay}>
          <div className={styles.successCard}>
            <div className={styles.successTitle}>🎉 注册成功</div>
            <div className={styles.successBody}>
              请截图保存以下信息，密码和ID无法找回
            </div>
            <div className={styles.infoList}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>用户名</span>
                <span className={styles.infoValue}>{successInfo.nickname}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>ID</span>
                <span className={styles.infoValue} style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{successInfo.id}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>密码</span>
                <span className={styles.infoValue} style={{ fontFamily: 'monospace', letterSpacing: 1 }}>{successInfo.password}</span>
              </div>
            </div>
            <button
              className={styles.successBtn}
              onClick={closeSuccess}
              disabled={countdown > 0}
            >
              {countdown > 0 ? `${countdown}秒后可关闭` : '我知道了'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
