import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'
import { showToast } from '../../lib/utils'
import PageHeader from '../../components/shared/PageHeader'
import styles from './AdminUsers.module.css'

export default function AdminUsers() {
  const navigate = useNavigate()
  const { user, getAllUsers, setUserRole } = useAuth()
  const [searchId, setSearchId] = useState('')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchResult, setSearchResult] = useState(null)
  const [searchResults, setSearchResults] = useState(null)
  const [resetTarget, setResetTarget] = useState(null)
  const [adminTarget, setAdminTarget] = useState(null)
  const [newPwd, setNewPwd] = useState('')

  useEffect(() => {
    if (user?.role !== 'superadmin') {
      setLoading(false)
      return
    }
    loadUsers()
  }, [user])

  const loadUsers = async () => {
    const data = await getAllUsers()
    setUsers(data)
    setLoading(false)
  }

  if (loading) return <div className="page-container"><PageHeader title="加载中..." onBack={() => navigate(-1)} /><div className="empty-state">加载中...</div></div>
  if (user?.role !== 'superadmin') return <div className="page-container"><PageHeader title="权限不足" onBack={() => navigate(-1)} /><div style={{ textAlign: 'center', padding: 40, color: '#999' }}>仅超级管理员可访问</div></div>

  const admins = users.filter(u => u.role === 'admin')
  const superadmin = users.find(u => u.role === 'superadmin')

  const handleResetPwd = async (u) => {
    if (!newPwd || newPwd.length < 6) return showToast('密码至少6位')
    const { data, error } = await supabase.rpc('admin_reset_password', { p_numeric_id: u.numeric_id, p_new_password: newPwd })
    if (error || data?.error) return showToast(data?.error || error?.message || '重置失败')
    showToast('密码已重置为 ' + newPwd)
    setResetTarget(null)
    setNewPwd('')
  }

  const handleSearch = () => {
    const q = searchId.trim()
    if (!q) return showToast('请输入用户ID或用户名')
    const numericId = parseInt(q)
    const found = users.filter(u => {
      if (!isNaN(numericId) && String(u.numeric_id).includes(String(numericId))) return true
      if (!isNaN(numericId) && String(u.numeric_id).includes(String(numericId))) return true
      if (u.nickname?.includes(q)) return true
      return false
    })
    if (!found.length) return showToast('未找到相关用户')
    if (found.length === 1) {
      if (found[0].role === 'superadmin') return showToast('超管不可修改')
      // 再次搜索同一用户时取消选中
      if (searchResult && searchResult.id === found[0].id) {
        setSearchResult(null)
        return
      }
      setSearchResult(found[0])
      return
    }
    setSearchResult(null)
    setSearchResults(found)
  }

  const handleAdd = async (found) => {
    if (found.role === 'admin') return showToast('该用户已是管理员')
    // 先更新本地状态
    setUsers(prev => prev.find(u => u.id === found.id)
      ? prev.map(u => u.id === found.id ? { ...u, role: 'admin' } : u)
      : [...prev, { ...found, role: 'admin' }]
    )
    setSearchResult(prev => prev?.id === found.id ? { ...prev, role: 'admin' } : prev)
    // 尝试同步到后端
    try { await setUserRole(found.numeric_id, 'admin') } catch {}
  }

  const handleRemove = async (numericId, name) => {
    const updated = await setUserRole(numericId, 'user')
    if (updated) setUsers(updated)
  }

  return (
    <div className="page-container">
      <PageHeader title="管理员管理" onBack={() => navigate(-1)} />

      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f5f5f5' }}>
      {/* 搜索区域 */}
      <div className={styles.addRow}>
        <input
          className={styles.searchInput}
          value={searchId}
          onChange={e => setSearchId(e.target.value)}
          placeholder="输入用户ID或用户名搜索"
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
        />
        <button className={styles.addBtn} onClick={handleSearch}>查找</button>
      </div>

      {/* 选中用户卡片：显示搜索或列表选中的用户 */}
      {searchResult && (
      <div className={styles.adminCard} onClick={() => setSearchResult(null)} style={{ cursor: 'pointer' }}>
            <img className={styles.avatar} src={searchResult.avatar || '/default-avatar.png'} alt="" />
            <div className={styles.info}>
              <div className={styles.name}>{searchResult.nickname}</div>
              <div className={styles.id}>ID: {searchResult.numeric_id}</div>
            </div>
            <button className={styles.actionBtn}
              onClick={(e) => { e.stopPropagation(); setAdminTarget(searchResult) }}>
              {searchResult.role === 'admin' ? '取消管理' : '添加管理'}
            </button>
            <button className={styles.actionBtn} onClick={(e) => { e.stopPropagation(); setResetTarget(searchResult) }}>改密码</button>
      </div>
      )}

      {/* 改密码弹窗 */}
      {resetTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => { setResetTarget(null); setNewPwd('') }}>
          <div style={{ background: '#fff', borderRadius: 3, padding: 20, width: 280, maxWidth: '90vw' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>修改密码 — {resetTarget.nickname}</div>
            <input style={{ width: '100%', padding: '8px 12px', fontSize: 14, border: '1px solid #ddd', borderRadius: 3, marginBottom: 12, boxSizing: 'border-box' }} placeholder="输入新密码（至少6位）" value={newPwd} onChange={e => setNewPwd(e.target.value)} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ flex: 1, padding: '8px 0', fontSize: 14, border: '1px solid #ddd', borderRadius: 3, background: '#fff', cursor: 'pointer' }} onClick={() => { setResetTarget(null); setNewPwd('') }}>取消</button>
              <button style={{ flex: 1, padding: '8px 0', fontSize: 14, border: 'none', borderRadius: 3, background: '#111', color: '#fff', cursor: 'pointer' }} onClick={() => handleResetPwd(resetTarget)}>确认修改</button>
            </div>
          </div>
        </div>
      )}

      {/* 设置/取消管理员弹窗 */}
      {adminTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setAdminTarget(null)}>
          <div style={{ background: '#fff', borderRadius: 3, padding: 20, width: 280, maxWidth: '90vw' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>
              {adminTarget.role === 'admin' ? '取消管理' : '添加管理'} — {adminTarget.nickname}
            </div>
            <div style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
              {adminTarget.role === 'admin' ? '确认取消该用户的管理权限？' : '确认将该用户设为管理员？'}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ flex: 1, padding: '8px 0', fontSize: 14, border: '1px solid #ddd', borderRadius: 3, background: '#fff', cursor: 'pointer' }} onClick={() => setAdminTarget(null)}>取消</button>
              <button style={{ flex: 1, padding: '8px 0', fontSize: 14, border: 'none', borderRadius: 3, background: '#111', color: '#fff', cursor: 'pointer' }} onClick={() => {
                const target = adminTarget
                setAdminTarget(null)
                if (target.role === 'admin') {
                  handleRemove(target.numeric_id, target.nickname)
                  setSearchResult(prev => prev?.id === target.id ? null : prev)
                } else {
                  handleAdd(target)
                }
              }}>确认</button>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* 管理员列表 */}
      <div className={styles.sectionTitle}>管理员列表</div>

      {/* 超管 — 也能点击切换 */}
      {superadmin && (
        <div className={styles.adminCard}
          onClick={() => setSearchResult(searchResult?.id === superadmin.id ? null : superadmin)}
          style={{ cursor: 'pointer' }}>
          <img className={styles.avatar} src={superadmin.avatar || '/default-avatar.png'} alt="" />
          <div className={styles.info}>
            <div className={styles.name}>{superadmin.nickname}</div>
            <div className={styles.id}>ID: {superadmin.numeric_id}</div>
          </div>
          <span className={styles.roleTag}>超管</span>
        </div>
      )}

      {admins.map(a => (
          <div key={a.id} className={styles.adminCard}
            onClick={() => setSearchResult(searchResult?.id === a.id ? null : a)}
            style={{ cursor: 'pointer' }}>
            <img className={styles.avatar} src={a.avatar || '/default-avatar.png'} alt="" />
            <div className={styles.info}>
              <div className={styles.name}>{a.nickname}</div>
              <div className={styles.id}>ID: {a.id}</div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 10px', background: '#fff8e1', color: '#c79100', borderRadius: 3 }}>管理</span>
          </div>
        ))}

      {/* 所有用户列表 */}
      <div className={styles.sectionTitle}>所有用户 ({users.length})</div>
      <div className={styles.userListWrap}>
        {users.sort((a, b) => a.numeric_id - b.numeric_id).map(u => (
          <div key={u.numeric_id} className={styles.userRow} onClick={() => {
            if (u.role === 'superadmin') return showToast('超管不可修改')
            setSearchResult(u)
            setSearchResults(null)
          }}>
            <span style={{ fontWeight: 500, marginRight: 10 }}>#{u.numeric_id}</span>
            <span style={{ flex: 1 }}>{u.nickname}</span>
            <span style={{ color: '#999', fontSize: 12, marginRight: 8 }}>
              {u.created_at ? new Date(u.created_at).toLocaleDateString('zh-CN') : ''}
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 3, flexShrink: 0,
              background: u.role === 'superadmin' ? '#ffebee' : u.role === 'admin' ? '#fff8e1' : '#e3f2fd',
              color: u.role === 'superadmin' ? '#d32f2f' : u.role === 'admin' ? '#c79100' : '#1565c0'
            }}>{u.role === 'superadmin' ? '超管' : u.role === 'admin' ? '管理' : '用户'}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
