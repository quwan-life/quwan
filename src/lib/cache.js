// 简单的内存缓存，减少 Supabase 重复请求
const store = new Map()
const DEFAULT_TTL = 30_000 // 30秒

export function cacheGet(key) {
  const item = store.get(key)
  if (!item) return null
  if (Date.now() > item.expiry) { store.delete(key); return null }
  return item.value
}

export function cacheSet(key, value, ttl = DEFAULT_TTL) {
  store.set(key, { value, expiry: Date.now() + ttl })
}

export function cacheClear() { store.clear() }
