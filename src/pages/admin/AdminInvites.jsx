import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'
import PageHeader from '../../components/shared/PageHeader'
import styles from './AdminInvites.module.css'

export default function AdminInvites() {
  const navigate = useNavigate()
  const { generateInviteCode, getInvites, deactivateInvite } = useAuth()
  const [invites, setInvites] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [maxUses, setMaxUses] = useState('1')
  const [note, setNote] = useState('')
  const [copiedCode, setCopiedCode] = useState(null)
  const [genLocked, setGenLocked] = useState(false)

  useEffect(() => { refresh() }, [])

  const refresh = async () => {
    const [invList, userList, creatorList] = await Promise.all([
      getInvites(),
      supabase.from('profiles').select('numeric_id,nickname,invited_by_code,id').neq('invited_by_code', ''),
      supabase.from('profiles').select('id,nickname').not('numeric_id', 'is', null)
    ])
    // 把创建者昵称附到邀请码上
    const creatorMap = {}
    creatorList.data?.forEach(p => { creatorMap[p.id] = p.nickname })
    const enriched = (invList || []).map(inv => ({ ...inv, creator_nickname: creatorMap[inv.created_by] || '—' }))
    setInvites(enriched.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)))
    setUsers(userList.data || [])
    setLoading(false)
  }

  // 每个邀请码的使用者
  const getUsersForCode = (code) => users.filter(u => u.invited_by_code === code)

  const handleGenerate = async () => {
    if (genLocked) return
    setGenLocked(true)
    setTimeout(() => setGenLocked(false), 3000)
    const code = await generateInviteCode(parseInt(maxUses) || 1, note)
    if (code) {
      // 添加到本地列表
      setInvites(prev => [{ id: 'ic_' + Date.now(), code, max_uses: parseInt(maxUses) || 1, used_count: 0, is_active: true, created_by: 'u0', note, created_at: new Date().toISOString(), creator_nickname: '超级管理员' }, ...prev])
      setNote('')
      setCopiedCode(code)
      navigator.clipboard.writeText(code).catch(() => {})
      setTimeout(() => setCopiedCode(null), 3000)
    }
  }

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code).catch(() => {})
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const handleToggle = async (inv) => {
    // 先更新本地状态
    setInvites(prev => prev.map(i => i.id === inv.id ? { ...i, is_active: !i.is_active } : i))
    // 尝试同步到后端
    try { await deactivateInvite(inv.id, !inv.is_active) } catch {}
  }

  if (loading) return <div className="page-container"><PageHeader title="邀请码管理" onBack={() => navigate(-1)} /><div className="empty-state">加载中...</div></div>

  return (
    <div className="page-container">
      <PageHeader title="邀请码管理" onBack={() => navigate(-1)} />

      <div className={styles.generateSection}>
        <div className={styles.formRow}>
          <div className={styles.formField} style={{ flex: '0 0 auto', minWidth: 0 }}>
            <label className={styles.label}>最大次数</label>
            <input className={styles.input} type="number" min={1} max={50} value={maxUses} onChange={e => {
              const v = e.target.value
              if (v === '') { setMaxUses(''); return }
              setMaxUses(Math.min(50, Math.max(1, parseInt(v) || 1)))
            }} />
          </div>
          <div className={styles.formField} style={{ flex: 1 }}>
            <label className={styles.label}>备注</label>
            <input className={styles.input} placeholder="用途说明" value={note} onChange={e => setNote(e.target.value)} />
          </div>
        </div>
        <button className={styles.generateBtn} onClick={handleGenerate} disabled={genLocked}>
          {genLocked ? '3秒后可再次生成' : '生成邀请码'}
        </button>
        {copiedCode && (
          <div className={styles.copiedTip}>✓ {copiedCode} 已复制到剪贴板</div>
        )}
      </div>

      <div className={styles.listSection}>
        <div className={styles.listTitle}>邀请码列表</div>
        {invites.map(inv => (
          <div key={inv.id} className={`${styles.inviteCard} ${!inv.is_active ? styles.disabled : ''}`}>
            <div className={styles.inviteRow}>
              <span className={styles.code}>{inv.code}</span>
              <span className={styles.usage}>已用 {inv.used_count} / 最大 {inv.max_uses}</span>
              <span className={`${styles.statusBadge} ${inv.is_active ? styles.valid : styles.invalid}`}>
                {inv.is_active ? '有效' : inv.used_count >= inv.max_uses ? '已用完' : '已停用'}
              </span>
            </div>
            {inv.note && <div className={styles.inviteMeta} style={{ margin: '4px 0' }}>{inv.note}</div>}
            <div className={styles.inviteMeta} style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <span>{inv.creator_nickname} · {new Date(inv.created_at).toLocaleDateString('zh-CN')}</span>
              <span style={{ display: 'flex', gap: 6 }}>
                <button className={styles.copyBtn} onClick={() => handleCopy(inv.code)}>复制</button>
                {inv.used_count < inv.max_uses && (
                  <button className={inv.is_active ? styles.disableBtn : styles.enableBtn} onClick={() => handleToggle(inv)}>
                    {inv.is_active ? '停用' : '启用'}
                  </button>
                )}
              </span>
            </div>
            {getUsersForCode(inv.code).length > 0 && (
              <div className={styles.usersList}>
                {getUsersForCode(inv.code).map(u => (
                  <span key={u.numeric_id} className={styles.userTag}>#{u.numeric_id} {u.nickname}</span>
                ))}
              </div>
            )}
          </div>
        ))}
        {invites.length === 0 && <div className={styles.empty}>暂无邀请码</div>}
      </div>
    </div>
  )
}
