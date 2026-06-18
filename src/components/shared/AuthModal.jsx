import { useState, useRef, useEffect } from 'react'
import styles from './AuthModal.module.css'

export default function AuthModal({ mode, onClose, onSwitchMode, onLogin, onRegister, onSuccess, configured }) {
  const [tab, setTab] = useState(mode === 'register' ? 'register' : 'login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const emailRef = useRef(null)
  const overlayRef = useRef(null)

  useEffect(() => {
    // 弹窗打开时聚焦邮箱输入框
    if (emailRef.current) emailRef.current.focus()
  }, [tab])

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')

    if (!configured) {
      setError('Supabase 尚未配置，请在 .env 中填写 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY')
      return
    }

    if (!email || !password) {
      setError('请填写邮箱和密码')
      return
    }
    if (tab === 'register' && !nickname) {
      setError('请填写昵称')
      return
    }

    setLoading(true)
    try {
      if (tab === 'login') {
        const data = await onLogin(email, password)
        onSuccess(data?.user)
      } else {
        const data = await onRegister(email, password, nickname)
        if (data?.user && !data?.session) {
          setSuccessMsg('注册成功！请查收邮箱完成验证，然后登录')
          setTab('login')
        } else {
          onSuccess(data?.user)
        }
      }
    } catch (err) {
      // 友好错误信息
      const msg = err?.message || ''
      if (msg.includes('Invalid login')) {
        setError('邮箱或密码错误，请重试')
      } else if (msg.includes('User already registered') || msg.includes('already exists')) {
        setError('该邮箱已注册，请直接登录')
      } else if (msg.includes('Password')) {
        setError('密码长度至少6位')
      } else {
        setError(msg || '操作失败，请重试')
      }
    } finally {
      setLoading(false)
    }
  }

  const switchTab = (newTab) => {
    setTab(newTab)
    setError('')
    setSuccessMsg('')
  }

  return (
    <div className={styles.overlay} ref={overlayRef} onClick={handleOverlayClick} role="dialog" aria-modal="true" aria-label="登录或注册">
      <div className={styles.card}>
        {/* 关闭按钮 */}
        <button className={styles.closeBtn} onClick={onClose} aria-label="关闭">✕</button>

        {/* Logo / 标题 */}
        <div className={styles.header}>
          <div className={styles.logo}>去玩</div>
          <div className={styles.subtitle}>全国职业体验社区</div>
        </div>

        {/* Tab 切换 */}
        <div className={styles.tabBar}>
          <button
            className={`${styles.tab} ${tab === 'login' ? styles.tabActive : ''}`}
            onClick={() => switchTab('login')}
          >
            登录
          </button>
          <button
            className={`${styles.tab} ${tab === 'register' ? styles.tabActive : ''}`}
            onClick={() => switchTab('register')}
          >
            注册
          </button>
        </div>

        {/* 表单 */}
        <form className={styles.form} onSubmit={handleSubmit}>
          {tab === 'register' && (
            <div className={styles.field}>
              <label className={styles.label} htmlFor="auth-nickname">昵称</label>
              <input
                id="auth-nickname"
                type="text"
                className={styles.input}
                placeholder="你的昵称"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                autoComplete="nickname"
              />
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label} htmlFor="auth-email">邮箱</label>
            <input
              id="auth-email"
              ref={emailRef}
              type="email"
              className={styles.input}
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="auth-password">密码</label>
            <input
              id="auth-password"
              type="password"
              className={styles.input}
              placeholder="至少6位密码"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}
          {successMsg && <div className={styles.success}>{successMsg}</div>}

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? '处理中...' : tab === 'login' ? '登录' : '注册'}
          </button>
        </form>

        {!configured && (
          <div className={styles.tip}>
            ⚠️ Supabase 未配置，当前为演示模式
          </div>
        )}
      </div>
    </div>
  )
}
