/**
 * Supabase 客户端 — 自动切换真实 / Mock 模式
 * 
 * - 如果 VITE_SUPABASE_URL 配置了真实地址 → 连真实库
 * - 否则 → 使用内存 mock 数据
 */
import { createClient } from '@supabase/supabase-js'
import { getMockSupabase, isSupabaseConfigured, initMockUser } from './mockSupabase.js'

const useReal = isSupabaseConfigured()

let supabase

if (useReal) {
  supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  )
  console.log('[supabase] 真实数据库模式:', import.meta.env.VITE_SUPABASE_URL)
} else {
  supabase = getMockSupabase()
  initMockUser()
  console.log('[supabase] Mock 数据模式 (未配置 VITE_SUPABASE_URL)')
}

const isConfigured = isSupabaseConfigured
export { supabase, isSupabaseConfigured, isConfigured }
