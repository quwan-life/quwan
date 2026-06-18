import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext(null)

export function useAuth() { return useContext(AuthContext) }

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // 启动时恢复会话
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session) {
        // 拿到 Supabase 用户后查 profiles 补全昵称/角色/numeric_id
        supabase.from('profiles').select('*').eq('id', data.session.user.id).single()
          .then(({ data: p }) => {
            if (p) setUser({ ...p, email: p.email?.includes('@quwan.local') ? '' : p.email, numeric_id: p.numeric_id })
            setLoading(false)
          })
          .catch(() => {
            setUser({ id: data.session.user.id, email: data.session.user.email, nickname: '用户', role: 'user', numeric_id: null, avatar: '' })
            setLoading(false)
          })
      } else {
        setLoading(false)
      }
    }).catch(() => setLoading(false))

    // 监听登录状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        const { data: p } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
        if (p) setUser(prev => {
          const merged = { ...p, email: p.email?.includes('@quwan.local') ? '' : p.email, numeric_id: p.numeric_id }
          // 兜底：profile 查询有时返回不完整，保留已有的 nickname/role
          if (!merged.nickname || merged.nickname === '用户') merged.nickname = prev?.nickname || merged.nickname
          if (!merged.role) merged.role = prev?.role || 'user'
          return merged
        })
      } else {
        setUser(null)
      }
    })
    return () => subscription?.unsubscribe()
  }, [])

  // 登录：昵称/ID → 邮箱 → signInWithPassword
  const login = useCallback(async (account, password) => {
    // 先查邮箱
    const { data, error } = await supabase.rpc('get_login_email', { p_account: account })
    if (error || data?.error) return false
    // 邮箱登录
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: data.email, password })
    return !signInError
  }, [])

  // 注册：signUp 虚拟邮箱 + complete_registration
  const register = useCallback(async (nickname, password, inviteCode) => {
    const email = crypto.randomUUID() + '@quwan.local'
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) return { error: error.message }
    // 等待会话建立，最多重试 3 次
    let result
    for (let i = 0; i < 3; i++) {
      await new Promise(r => setTimeout(r, 600))
      const { data, error: rpcError } = await supabase.rpc('complete_registration', { p_nickname: nickname, p_invite_code: inviteCode })
      if (rpcError || data?.error === '请先完成邮箱注册') continue
      result = data
      break
    }
    if (!result || result.error) {
      await supabase.auth.signOut()
      return { error: result?.error || '注册失败' }
    }
    await supabase.auth.signOut()
    return { id: result.numeric_id, nickname, numeric_id: result.numeric_id }
  }, [])

  // 退出
  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
  }, [])

  // 更新用户资料
  const updateUser = useCallback(async (updates) => {
    if (!user) return
    const { data, error } = await supabase.rpc('update_profile', {
      p_nickname: updates.nickname || null,
      p_email: updates.email || null,
      p_avatar: updates.avatar || null
    })
    if (!error && data?.ok) {
      const newUser = { ...user, ...updates }
      setUser(newUser)
    }
  }, [user])

  // 修改密码（Supabase 原生）
  const changePassword = useCallback(async (oldPw, newPw) => {
    let email = user?.email
    if (!email) email = (await supabase.auth.getUser()).data?.user?.email
    if (!email) return false
    const { error: checkErr } = await supabase.auth.signInWithPassword({ email, password: oldPw })
    if (checkErr) return false
    const { error } = await supabase.auth.updateUser({ password: newPw })
    return !error
  }, [user])

  // 设置角色（RPC）
  const setUserRole = useCallback(async (targetNumericId, role) => {
    const { data, error } = await supabase.rpc('set_user_role', { p_target_numeric_id: targetNumericId, p_new_role: role })
    if (error || data?.error) return []
    const { data: users } = await supabase.from('profiles').select('*').order('numeric_id')
    return (users || []).map(u => ({ ...u, id: u.numeric_id }))
  }, [])

  // 获取所有用户
  const getAllUsers = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('*').order('numeric_id')
    return (data || []).map(u => ({ ...u, id: u.numeric_id }))
  }, [])

  // 邀请码管理
  const getInvites = useCallback(async () => {
    const { data } = await supabase.from('invite_codes').select('*').order('created_at', { ascending: false })
    return data || []
  }, [])

  const generateInviteCode = useCallback(async (maxUses, note) => {
    const { data, error } = await supabase.rpc('generate_invite', { p_max_uses: maxUses, p_note: note || '' })
    if (error || data?.error) return null
    return data.code
  }, [])

  const verifyInviteCode = useCallback(async (code) => {
    const { data } = await supabase.from('invite_codes').select('*').eq('code', code).single()
    return data && data.is_active && data.used_count < data.max_uses
  }, [])

  const deactivateInvite = useCallback(async (id, active) => {
    await supabase.from('invite_codes').update({ is_active: active }).eq('id', id)
  }, [])

  return (
    <AuthContext.Provider value={{
      user, loading, login, register, logout, updateUser, changePassword,
      setUserRole, getAllUsers,
      getInvites, generateInviteCode, verifyInviteCode, deactivateInvite,
    }}>
      {children}
    </AuthContext.Provider>
  )
}
