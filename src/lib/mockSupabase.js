/**
 * Mock Supabase Client — 拦截式 mock，让所有现有页面无需修改即可运行
 * 
 * 支持：.from().select().eq().order().single() / .rpc() / .auth / .storage
 * 行为：所有数据操作到内存 mockStore，模拟真实 Supabase 的 Promise 返回格式
 */
import { mockStore, mockProfiles } from './mockData.js'

// ── Realtime 事件总线 ──────────────────────────────────
const realtimeListeners = []

export function addRealtimeListener(table, callback) {
  const entry = { table, callback }
  realtimeListeners.push(entry)
  return () => {
    const idx = realtimeListeners.indexOf(entry)
    if (idx >= 0) realtimeListeners.splice(idx, 1)
  }
}

function notifyRealtime(table, event, payload) {
  realtimeListeners.forEach(l => {
    if (l.table === table || l.table === '*') {
      try { l.callback({ table, event, payload }) } catch {}
    }
  })
}

// ── 工具函数 ──────────────────────────────────────────

function clone(obj) { return JSON.parse(JSON.stringify(obj)) }

function matchesFilter(item, col, val) {
  const itemVal = item[col]
  if (itemVal === val) return true
  if (itemVal != null && val != null && String(itemVal) === String(val)) return true
  return false
}

function applySelect(data, selectStr) {
  if (!selectStr || selectStr === '*') return clone(data)
  
  // 处理嵌套关联: "*, profiles(*), activity_sessions(*)"
  const parts = selectStr.split(',').map(s => s.trim())
  const mainFields = parts.filter(p => !p.includes('('))
  const joins = parts.filter(p => p.includes('('))
  
  let result = clone(data)
  
  // 如果有 joins，需要关联数据
  for (const join of joins) {
    const match = join.match(/^(\w+)\((.+)?\)$/)
    if (!match) continue
    const joinTable = match[1]
    const joinSelect = match[2] || '*'
    
    result = result.map(item => {
      if (joinTable === 'activity_sessions' && item.id) {
        const sessions = mockStore.activity_sessions.filter(s => s.activity_id === item.id)
        return { ...item, [joinTable]: applySelect(sessions, joinSelect) }
      }
      if (joinTable === 'profiles' && item.user_id) {
        const profile = mockStore.profiles.find(p => p.id === item.user_id)
        return { ...item, [joinTable]: profile ? applySelect([profile], joinSelect)[0] : null }
      }
      if (joinTable === 'profiles' && item.follower_id) {
        const profile = mockStore.profiles.find(p => p.id === item.follower_id)
        return { ...item, [joinTable]: profile ? applySelect([profile], joinSelect)[0] : null }
      }
      if (joinTable === 'activities' && item.activity_id) {
        const activity = mockStore.activities.find(a => a.id === item.activity_id)
        return { ...item, [joinTable]: activity ? applySelect([activity], joinSelect) : null }
      }
      return item
    })
  }
  
  return result
}

// ── QueryBuilder ───────────────────────────────────────

class QueryBuilder {
  constructor(tableName, mockStoreRef) {
    this._table = tableName
    this._store = mockStoreRef
    this._filters = []
    this._orderCol = null
    this._orderAsc = true
    this._limitVal = null
    this._rangeVal = null
    this._selectStr = '*'
  }

  select(str) {
    this._selectStr = str || '*'
    return this
  }

  eq(col, val) {
    this._filters.push({ type: 'eq', col, val })
    return this
  }

  neq(col, val) {
    this._filters.push({ type: 'neq', col, val })
    return this
  }

  or(query) {
    // Parse Supabase or syntax: "col.op.val,col.op.val"
    const orConditions = query.split(',').map(s => s.trim()).filter(Boolean)
    this._filters.push({ type: 'or', conditions: orConditions })
    return this
  }

  neq(col, val) {
    this._filters.push({ type: 'neq', col, val })
    return this
  }

  not(col, operator, val) {
    // Supabase not(column, operator, value) - inverse filter
    if (operator === 'is' && val === null) {
      this._filters.push({ type: 'neq', col, val })
    } else {
      this._filters.push({ type: 'not', col, val, operator })
    }
    return this
  }

  order(col, opts = {}) {
    this._orderCol = col
    this._orderAsc = opts.ascending !== false
    return this
  }

  limit(n) {
    this._limitVal = n
    return this
  }

  range(from, to) {
    this._rangeVal = [from, to]
    return this
  }

  _execute() {
    let data = clone(this._store[this._table] || [])
    
    // apply filters
    for (const f of this._filters) {
      if (f.type === 'eq') {
        data = data.filter(item => matchesFilter(item, f.col, f.val))
      } else if (f.type === 'neq') {
        data = data.filter(item => !matchesFilter(item, f.col, f.val))
      } else if (f.type === 'not') {
        if (f.operator === 'is' && f.val === null) {
          data = data.filter(item => item[f.col] !== null && item[f.col] !== undefined)
        }
      } else if (f.type === 'or') {
        data = data.filter(item => f.conditions.some(cond => {
          // Parse "col.op.val"
          const parts = cond.split('.')
          if (parts.length >= 3) {
            const col = parts.slice(0, -1).join('.')
            const op = parts[parts.length - 2]
            const val = parts[parts.length - 1]
            if (op === 'eq') return matchesFilter(item, col, val)
            if (op === 'neq') return !matchesFilter(item, col, val)
          }
          return false
        }))
      }
    }
    
    // apply select (joins)
    if (this._selectStr !== '*') {
      data = applySelect(data, this._selectStr)
    }
    
    // order
    if (this._orderCol) {
      data.sort((a, b) => {
        const va = a[this._orderCol], vb = b[this._orderCol]
        if (va == null) return 1
        if (vb == null) return -1
        if (va < vb) return this._orderAsc ? -1 : 1
        if (va > vb) return this._orderAsc ? 1 : -1
        return 0
      })
    }
    
    // limit / range
    if (this._rangeVal) {
      data = data.slice(this._rangeVal[0], this._rangeVal[1] + 1)
    } else if (this._limitVal) {
      data = data.slice(0, this._limitVal)
    }
    
    return data
  }

  // ── 读操作（返回 Promise<{data, error}>）
  then(resolve, reject) {
    // 支持 await queryBuilder — 作为 Promise
    try {
      const data = this._execute()
      resolve({ data, error: null })
    } catch (e) {
      resolve({ data: null, error: e })
    }
  }

  single() {
    const data = this._execute()
    if (data.length === 0) {
      return Promise.resolve({ data: null, error: { message: 'No rows found' } })
    }
    return Promise.resolve({ data: data[0], error: null })
  }

  maybeSingle() {
    const data = this._execute()
    return Promise.resolve({ data: data[0] || null, error: null })
  }

  // ── 写操作
  async insert(rows) {
    const items = Array.isArray(rows) ? rows : [rows]
    const withId = items.map(item => ({
      ...item,
      id: item.id || `${this._table}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      created_at: item.created_at || new Date().toISOString(),
    }))
    this._store[this._table].push(...clone(withId))
    // 通知 realtime 订阅者
    withId.forEach(item => {
      notifyRealtime(this._table, 'INSERT', { new: item })
    })
    return { data: withId.length === 1 ? withId[0] : withId, error: null }
  }

  async update(changes) {
    let data = this._execute()
    const ids = data.map(d => d.id)
    this._store[this._table] = this._store[this._table].map(item => {
      if (ids.includes(item.id)) {
        return { ...item, ...changes }
      }
      return item
    })
    return { data: null, error: null }
  }

  async delete() {
    let data = this._execute()
    const ids = new Set(data.map(d => d.id))
    this._store[this._table] = this._store[this._table].filter(item => !ids.has(item.id))
    return { data: null, error: null }
  }

  // count
  async count() {
    const data = this._execute()
    return { count: data.length, error: null }
  }
}

// ── RPC Mock ────────────────────────────────────────────

function mockRpc(name, params) {
  const data = clone(mockStore)
  
  switch (name) {
    case 'get_login_email': {
      const p = mockProfiles.find(u =>
        u.nickname === params.p_account ||
        String(u.numeric_id) === String(params.p_account)
      )
      if (!p) return Promise.resolve({ data: { error: '用户不存在', email: null }, error: null })
      return Promise.resolve({ data: { email: p.email, error: null }, error: null })
    }
    
    case 'complete_registration':
      return Promise.resolve({ data: { numeric_id: 10099, nickname: params.p_nickname, error: null }, error: null })
    
    case 'update_profile':
      return Promise.resolve({ data: { ok: true }, error: null })
    
    case 'set_user_role':
      return Promise.resolve({ data: { ok: true }, error: null })
    
    case 'generate_invite': {
      const code = 'QW' + Math.random().toString(36).slice(2, 8).toUpperCase()
      data.invite_codes.push({
        id: `ic_${Date.now()}`, code, max_uses: params.p_max_uses, used_count: 0,
        is_active: true, created_by: 'u0', note: params.p_note || '', created_at: new Date().toISOString(),
      })
      return Promise.resolve({ data: { code, error: null }, error: null })
    }
    
    case 'toggle_save': {
      const { p_record_id, p_user_id } = params
      const idx = data.saves.findIndex(s => s.user_id === p_user_id && s.record_id === p_record_id)
      if (idx >= 0) data.saves.splice(idx, 1)
      else data.saves.push({ user_id: p_user_id, record_id: p_record_id })
      return Promise.resolve({ data: { saved: idx < 0 }, error: null })
    }
    
    case 'toggle_follow': {
      const { p_target_user_id, p_follower_id } = params
      const idx = data.follows.findIndex(f => f.follower_id === p_follower_id && f.user_id === p_target_user_id)
      if (idx >= 0) data.follows.splice(idx, 1)
      else data.follows.push({ follower_id: p_follower_id, user_id: p_target_user_id })
      return Promise.resolve({ data: { following: idx < 0 }, error: null })
    }
    
    case 'approve_booking':
      return Promise.resolve({ data: { ok: true }, error: null })
    
    case 'review_activity':
      return Promise.resolve({ data: { ok: true }, error: null })
    
    case 'set_featured':
      return Promise.resolve({ data: { ok: true }, error: null })
    
    case 'close_activity':
      return Promise.resolve({ data: { ok: true }, error: null })
    
    case 'reopen_activity':
      return Promise.resolve({ data: { ok: true }, error: null })
    
    case 'cancel_session':
      return Promise.resolve({ data: { ok: true }, error: null })
    
    case 'cancel_booking':
      return Promise.resolve({ data: { ok: true }, error: null })
    
    case 'notify_booking_request':
      return Promise.resolve({ data: { ok: true }, error: null })
    
    case 'notify_activity_published':
      return Promise.resolve({ data: { ok: true }, error: null })
    
    case 'admin_reset_password':
      return Promise.resolve({ data: { ok: true }, error: null })
    
    default:
      console.warn(`[mockSupabase] Unknown RPC: ${name}`)
      return Promise.resolve({ data: null, error: null })
  }
}

// ── Mock Auth ────────────────────────────────────────────

let mockCurrentUser = null
const authListeners = []

function setMockUser(profile) {
  mockCurrentUser = profile ? { ...profile } : null
  const session = mockCurrentUser ? { user: { id: mockCurrentUser.id, email: mockCurrentUser.email } } : null
  authListeners.forEach(fn => fn('SIGNED_' + (session ? 'IN' : 'OUT'), session))
}

const mockAuth = {
  getSession() {
    if (!mockCurrentUser) return Promise.resolve({ data: { session: null }, error: null })
    return Promise.resolve({
      data: { session: { user: { id: mockCurrentUser.id, email: mockCurrentUser.email } } },
      error: null
    })
  },

  getUser() {
    if (!mockCurrentUser) return Promise.resolve({ data: { user: null }, error: null })
    return Promise.resolve({
      data: { user: { id: mockCurrentUser.id, email: mockCurrentUser.email } },
      error: null
    })
  },

  signInWithPassword({ email, password }) {
    const p = mockStore.profiles.find(u => u.email === email)
    if (!p) return Promise.resolve({ data: null, error: { message: 'Invalid login credentials' } })
    setMockUser(p)
    return Promise.resolve({ data: { user: { id: p.id, email: p.email } }, error: null })
  },

  signUp({ email, password }) {
    const newUser = {
      id: 'u_' + Date.now(),
      numeric_id: 10000 + mockStore.profiles.length,
      nickname: '新用户',
      role: 'user',
      avatar: '',
      bio: '',
      email,
      created_at: new Date().toISOString(),
    }
    mockStore.profiles.push(clone(newUser))
    setMockUser(newUser)
    return Promise.resolve({ data: { user: { id: newUser.id, email } }, error: null })
  },

  signOut() {
    setMockUser(null)
    return Promise.resolve({ error: null })
  },

  updateUser({ password }) {
    return Promise.resolve({ data: { user: mockCurrentUser }, error: null })
  },

  onAuthStateChange(callback) {
    authListeners.push(callback)
    // fire initial state
    if (mockCurrentUser) {
      setTimeout(() => callback('SIGNED_IN', { user: { id: mockCurrentUser.id, email: mockCurrentUser.email } }), 10)
    }
    return {
      data: {
        subscription: {
          unsubscribe() {
            const idx = authListeners.indexOf(callback)
            if (idx >= 0) authListeners.splice(idx, 1)
          }
        }
      }
    }
  },
}

// ── Mock Storage ─────────────────────────────────────────

const mockStorage = {
  from(bucket) {
    return {
      async upload(path, file) {
        return {
          data: { path },
          error: null,
        }
      },
      getPublicUrl(path) {
        return {
          data: {
            publicUrl: path.startsWith('http') ? path : `https://picsum.photos/seed/${path}/400/300`,
          }
        }
      },
    }
  },
}

// ── Mock Realtime ────────────────────────────────────────

const mockRealtime = {
  channel(name) {
    let tableFilter = '*'
    let eventFilter = '*'
    const cleanups = []

    return {
      on(event, filter, callback) {
        // Parse table name from filter: filter is like { table: 'group_messages', ... } or similar
        // The actual Supabase filter is an object with event/schema/table
        if (filter && typeof filter === 'object' && filter.table) {
          tableFilter = filter.table
        }
        if (event && event !== '*') {
          eventFilter = event
        }
        const cleanup = addRealtimeListener(tableFilter, ({ table, event: evt, payload }) => {
          if (eventFilter !== '*' && evt !== eventFilter) return
          callback(payload)
        })
        cleanups.push(cleanup)
        return this
      },
      subscribe(callback) {
        if (callback) {
          callback('SUBSCRIBED')
        }
        return {
          unsubscribe() {
            cleanups.forEach(fn => fn())
          },
        }
      },
    }
  },
  removeChannel() {},
  removeAllChannels() {},
}

// ── 组装 Mock Client ───────────────────────────────────

function createMockSupabase() {
  return {
    from(table) {
      return new QueryBuilder(table, mockStore)
    },

    rpc(name, params) {
      return mockRpc(name, params || {})
    },

    auth: mockAuth,
    storage: mockStorage,
    channel: (name) => mockRealtime.channel(name),
    removeChannel: mockRealtime.removeChannel,
    removeAllChannels: mockRealtime.removeAllChannels,
  }
}

// ── 导出 ────────────────────────────────────────────────

// 检查是否配置了真实 Supabase
export function isSupabaseConfigured() {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  return !!(url && key && url !== 'your-supabase-project-url' && key !== 'your-supabase-anon-key')
}

// 获取 mock client
export function getMockSupabase() {
  return createMockSupabase()
}

// 初始化 mock 用户（开发模式默认登录为管理员）
export function initMockUser() {
  const admin = mockStore.profiles.find(p => p.role === 'superadmin')
  if (admin) setMockUser(admin)
}

export { mockStore, setMockUser }
