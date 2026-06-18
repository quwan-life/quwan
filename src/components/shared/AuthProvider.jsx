import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { supabase, isConfigured } from '../../lib/supabase'
import AuthModal from './AuthModal'

const AuthContext = createContext()

/**
 * 全局 Auth Modal 控制
 * - showAuthModal()  — 打开登录/注册弹窗
 * - hideAuthModal()  — 关闭
 * - user           — 当前登录用户（null = 未登录）
 * - login()        — 直接调用登录（非弹窗场景）
 * - logout()       — 退出登录
 *
 * 用法：
 *   const { showAuthModal, user, logout } = useAuth()
 *   showAuthModal()  // 打开弹窗
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [mode, setMode] = useState('login') // 'login' | 'register'

  // 挂载时恢复会话（仅在 supabase 可用时）
  useEffect(() => {
    if (!isConfigured() || !supabase) return

    let sub = null

    // getSession
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.user) {
        fetchProfile(data.session.user)
      }
    }).catch(() => {})

    // onAuthStateChange
    try {
      const result = supabase.auth.onAuthStateChange(
        (_event, session) => {
          if (session?.user) {
            fetchProfile(session.user)
          } else {
            setUser(null)
          }
        }
      )
      sub = result.data?.subscription
    } catch (e) {}

    return () => { if (sub?.unsubscribe) sub.unsubscribe() }
  }, [])

  // 获取用户资料（profiles 表）
  async function fetchProfile(authUser) {
    if (!supabase) return
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()
      setUser({
        id: authUser.id,
        email: authUser.email,
        nickname: data?.nickname || authUser.email?.split('@')[0] || '用户',
        avatar: data?.avatar_url || null,
        bio: data?.bio || '',
        role: data?.role || 'user',
        ...data,
      })
    } catch (e) {}
  }

  const showAuthModal = useCallback((initialMode = 'login') => {
    setMode(initialMode)
    setShowModal(true)
  }, [])

  const hideAuthModal = useCallback(() => {
    setShowModal(false)
  }, [])

  const login = useCallback(async (email, password) => {
    if (!supabase) throw new Error('Supabase 未配置')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }, [])

  const register = useCallback(async (email, password, nickname) => {
    if (!supabase) throw new Error('Supabase 未配置')
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nickname },
      },
    })
    if (error) throw error

    // 注册后自动创建 profiles 记录（数据库 trigger 应该做这个，这里是兜底）
    if (data.user && supabase) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        nickname,
        email,
        role: 'user',
      })
    }
    return data
  }, [])

  const logout = useCallback(async () => {
    if (supabase) await supabase.auth.signOut()
    setUser(null)
  }, [])

  // 登录/注册成功后的回调
  const handleAuthSuccess = useCallback((userData) => {
    setUser(userData)
    setShowModal(false)
  }, [])

  return (
    <AuthContext.Provider value={{ user, showAuthModal, hideAuthModal, login, register, logout, isConfigured: isConfigured() }}>
      {children}
      {showModal && (
        <AuthModal
          mode={mode}
          onClose={hideAuthModal}
          onSwitchMode={setMode}
          onLogin={login}
          onRegister={register}
          onSuccess={handleAuthSuccess}
          configured={isConfigured()}
        />
      )}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
