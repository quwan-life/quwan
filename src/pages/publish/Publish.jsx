import { useState, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import CityPicker from '../../components/shared/CityPicker'
import PageHeader from '../../components/shared/PageHeader'
import FilterTabs from '../../components/shared/FilterTabs'
import { mockStore } from '../../lib/mockData'
import { showToast } from '../../lib/utils'
import styles from './Publish.module.css'

const CONTENT_TYPES = [
  { key: '职业体验', label: '职业体验' },
  { key: '研学路线', label: '研学路线' },
  { key: '同城活动', label: 'HS同城' },
  { key: '共居社区', label: '共居社区' },
]

const INDUSTRY_OPTIONS = [
  '手作农业/食品', '非遗手工艺', '自然教育', '户外运动',
  '农耕/乡村', '环境教育', '生活体验', '音乐/艺术',
  '科技/编程', '语言/文化', '体育/体能', '其他',
]

const ROUTE_TYPE_OPTIONS = [
  '户外', '骑行', '摄影', '自然教育', '历史', '地质', '生物', '文化', '天文',
]

const EVENT_TYPE_OPTIONS = [
  '本地生活', '文化', '运动', '电影', '音乐', '文学', '艺术', '美食', '娱乐',
]

const COMMUNITY_TYPE_OPTIONS = [
  '农业', '农耕', '创意', '教育', '手工艺', '运动', '文学', '心灵', '建筑', '创业',
]

const DURATION_OPTIONS = ['半日', '1天', '2天1晚', '3天2晚', '5天以上']

const AGE_OPTIONS = ['不限', '3岁以上', '6岁以上', '8岁以上', '10岁以上', '12岁以上', '18岁以上', '成人', '6-12岁', '12-18岁', '18-35岁', '35岁以上']
const COMMUNITY_AGE_OPTIONS = ['数字游民', '创作者', '艺术家', '自由职业者', '学生', '家庭', '不限']

// ═══ 各分类的字段配置 ═══
const FORM_CONFIGS = {
  '职业体验': [
    { key: 'title', label: '岗位名称', type: 'text', placeholder: '请输入体验岗位的名称', required: true },
    { key: 'city', label: '所在地址', type: 'city' },
    { key: 'industry', label: '行业标签', type: 'tags', placeholder: '选择或自定义标签（1-6个）', required: true, options: INDUSTRY_OPTIONS },
    { key: 'ageRange', label: '适合年龄', type: 'ageRange', required: true },
    { key: 'description', label: '体验简介', type: 'textarea', placeholder: '简要描述体验的内容和亮点，让参与者在第一时间被打动...', rows: 4, required: true },
    { key: 'requirements', label: '招募要求', type: 'textarea', placeholder: '如：无需经验、需自备装备、体能要求等...', rows: 3 },
  ],
  '研学路线': [
    { key: 'title', label: '路线名称', type: 'text', placeholder: '请输入研学路线的名称', required: true },
    { key: 'city', label: '汇合地址', type: 'city' },
    { key: 'industry', label: '路线类型', type: 'tags', placeholder: '选择或自定义标签（1-6个）', required: true, options: ROUTE_TYPE_OPTIONS },
    { key: 'routeStops', label: '途径地点', type: 'routeStops' },
    { key: 'duration', label: '路线天数', type: 'duration' },
    { key: 'ageRange', label: '适合年龄', type: 'ageRange', required: true },
    { key: 'description', label: '路线简介', type: 'textarea', placeholder: '简要描述路线的特色和亮点，让更多人了解这次研学之旅...', rows: 4, required: true },
    { key: 'requirements', label: '装备要求', type: 'textarea', placeholder: '如：建议穿徒步鞋、带防晒用品、自备饮水等...', rows: 3 },
  ],
  '同城活动': [
    { key: 'title', label: '活动名称', type: 'text', placeholder: '请输入活动的名称', required: true },
    { key: 'city', label: '所在地址', type: 'city' },
    { key: 'industry', label: '活动类型', type: 'tags', placeholder: '选择或自定义标签（1-6个）', required: true, options: EVENT_TYPE_OPTIONS },
    { key: 'ageRange', label: '适合年龄', type: 'ageRange' },
    { key: 'description', label: '活动简介', type: 'textarea', placeholder: '简要描述活动内容和亮点，让大家了解这次聚会...', rows: 4, required: true },
    { key: 'requirements', label: '注意事项', type: 'textarea', placeholder: '如：请自带餐具、请勿迟到、活动费用AA等...', rows: 3 },
  ],
  '共居社区': [
    { key: 'title', label: '社区名称', type: 'text', placeholder: '请输入社区的名称', required: true },
    { key: 'city', label: '所在地址', type: 'city' },
    { key: 'industry', label: '社区类型', type: 'tags', placeholder: '选择或自定义标签（1-6个）', required: true, options: COMMUNITY_TYPE_OPTIONS },
    { key: 'stayDuration', label: '入住周期', type: 'stayDuration' },
    { key: 'ageRange', label: '适合年龄', type: 'ageRange', required: true },
    { key: 'description', label: '社区介绍', type: 'textarea', placeholder: '介绍社区的生活方式、日常安排和共同理念...', rows: 4, required: true },
    { key: 'requirements', label: '入住要求', type: 'textarea', placeholder: '如：需参与日常轮值、保持公共区域整洁等...', rows: 3 },
  ],
}

export default function Publish() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('edit')
  const isEdit = !!editId
  const [contentType, setContentType] = useState('职业体验')
  const [showCityPicker, setShowCityPicker] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [hasSession, setHasSession] = useState(false)
  const [routeActivityIds, setRouteActivityIds] = useState([{ id: '', title: '', isCustom: false }, { id: '', title: '', isCustom: false }, { id: '', title: '', isCustom: false }])
  const [routeSearchTexts, setRouteSearchTexts] = useState(['', '', ''])
  const [routeCustomMode, setRouteCustomMode] = useState([false, false, false])
  const [activeRouteIndex, setActiveRouteIndex] = useState(null)
  const [form, setForm] = useState({
    title: '', city: '大理', industry: [], ageRange: '不限',
    description: '', requirements: '',
    routeStops: '', duration: '', eventTime: '', location: '',
    maxPeople: '', capacity: '', stayDuration: '',
    ageFrom: '', ageTo: '', ageUnlimited: false,
    routeStopsList: ['', '', ''],
    durationDays: '', durationNights: '', durationTbd: false,
    stayMinDays: '', stayLongterm: false,
    sessionAllowWaitlist: false, sessionPriceFree: false,
    images: [],
    // 第一期期次
    sessionCapacity: '2',
    sessionPrice: '',
    bookingStartDate: '', bookingStartTime: '',
    bookingEndDate: '', bookingEndTime: '',
    plannedStartDate: '', plannedStartTime: '',
    plannedEndDate: '', plannedEndTime: '',
  })

  const addImage = () => {
    if (form.images.length >= 6) return showToast('最多上传6张图片')
    const seed = Math.random().toString(36).slice(2, 8)
    setForm(prev => ({ ...prev, images: [...prev.images, `https://picsum.photos/seed/${seed}/400/300`] }))
  }

  const removeImage = (idx) => {
    setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))
  }

  // 编辑模式：加载已有数据
  useEffect(() => {
    if (!isEdit) return
    // 草稿编辑
    if (editId.startsWith('draft_')) {
      const draftId = editId.replace('draft_', '')
      const draft = mockStore.drafts.find(d => d.id === draftId)
      if (draft) {
        setContentType(draft.contentType || '职业体验')
        setForm(prev => ({ ...prev, ...draft, sessionCapacity: draft.sessionCapacity || 2 }))
        setHasSession(true)
      }
      return
    }
    // 已发布活动编辑
    const act = mockStore.activities.find(a => a.id === editId)
    if (!act) return
    const sess = mockStore.activity_sessions.find(s => s.activity_id === act.id)
    setHasSession(true)
    setContentType(act.category_type || act.category || '职业体验')
    setForm(prev => ({ ...prev,
      title: act.title || '',
      city: act.city || '',
      industry: (act.industry || act.category || '').split(/[,、，]/).filter(Boolean).map(s => s.trim()),
      description: act.description || '',
      requirements: act.requirements || '',
      application_notes: act.application_notes || '',
      sessionCapacity: sess?.capacity || 2,
      bookingStartDate: sess?.booking_start_time ? new Date(sess.booking_start_time).toISOString().slice(0, 10) : '',
      bookingStartTime: sess?.booking_start_time ? new Date(sess.booking_start_time).toISOString().slice(11, 16) : '',
      bookingEndDate: sess?.booking_end_time ? new Date(sess.booking_end_time).toISOString().slice(0, 10) : '',
      bookingEndTime: sess?.booking_end_time ? new Date(sess.booking_end_time).toISOString().slice(11, 16) : '',
      plannedStartDate: sess?.planned_start_time ? new Date(sess.planned_start_time).toISOString().slice(0, 10) : '',
      plannedStartTime: sess?.planned_start_time ? new Date(sess.planned_start_time).toISOString().slice(11, 16) : '',
      plannedEndDate: sess?.end_time ? new Date(sess.end_time).toISOString().slice(0, 10) : '',
      plannedEndTime: sess?.end_time ? new Date(sess.end_time).toISOString().slice(11, 16) : '',
      sessionPrice: sess?.price || '',
      images: act.images || [],
    }))
  }, [isEdit, editId])

  const fields = FORM_CONFIGS[contentType] || FORM_CONFIGS['职业体验']

  // 获取已审核通过的职业体验活动（供研学路线选择）
  const approvedExperiences = mockStore.activities.filter(a =>
    a.category_type === '职业体验' && a.status === 'active'
  ).map(a => ({ id: a.id, title: a.title, organizer: a.organizer_name, organizerId: a.user_id }))

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

  const handleSubmit = async () => {
    const requiredFields = fields.filter(f => f.required)
    for (const f of requiredFields) {
      const val = form[f.key]
      const isEmpty = Array.isArray(val) ? val.length === 0 : !val?.trim?.()
      if (isEmpty) {
        const labels = { title: '名称', city: '城市', industry: '类别', ageRange: '年龄', description: '简介' }
        return showToast(`请填写${labels[f.key] || f.label}`)
      }
    }
    if (form.images.length < 3) return showToast('请至少添加3张活动图片')
    // 行业标签至少1个
    const tags = Array.isArray(form.industry) ? form.industry.filter(Boolean) : []
    if (tags.length < 1) return showToast('请至少添加1个行业标签')
    // 活动时间和期次设置二选一
    if (!hasSession && !form.eventTime) return showToast('请设置活动时间或添加期次')

    if (hasSession) {
      if (!form.bookingStartDate || !form.bookingStartTime) return showToast('请选择预约开始时间')
      if (!form.plannedStartDate || !form.plannedStartTime) return showToast('请选择活动开始时间')
    }

    const ageRange = form.ageUnlimited ? '不限' : (form.ageFrom && form.ageTo ? (form.ageTo === 'unlimited' ? `${form.ageFrom}岁以上` : `${form.ageFrom}-${form.ageTo}岁`) : form.ageFrom ? `${form.ageFrom}岁以上` : form.ageTo ? (form.ageTo === 'unlimited' ? '不限' : `${form.ageTo}岁以下`) : '')

    setSubmitting(true)

    if (isEdit) {
      // 编辑模式：更新已有活动，状态打回待审核
      const idx = mockStore.activities.findIndex(a => a.id === editId)
      if (idx >= 0) {
        mockStore.activities[idx] = { ...mockStore.activities[idx], ...{
          title: form.title, category: Array.isArray(form.industry) ? form.industry.join('、') : form.industry, city: form.city,
          age_range: ageRange, description: form.description,
          requirements: form.requirements, industry: Array.isArray(form.industry) ? form.industry.join('、') : form.industry,
          status: 'pending_review', cover_url: form.images[0] || mockStore.activities[idx].cover_url,
          images: form.images.slice(0, 3), location_name: form.location || form.city,
          application_notes: contentType === '研学路线' ? routeActivityIds.filter(s => s.title).map(s => s.title).join(' → ') : (form.routeStopsList?.filter(Boolean).join(' → ') || ''),
          duration: form.durationTbd ? '未定' : `${form.durationDays || 0}天${form.durationNights || 0}夜`,
        }}
        // 更新期次
        if (hasSession) {
          const sess = mockStore.activity_sessions.find(s => s.activity_id === editId)
          if (sess) {
            Object.assign(sess, {
              booking_start_time: `${form.bookingStartDate}T${form.bookingStartTime}:00+08:00`,
              booking_end_time: form.bookingEndDate ? `${form.bookingEndDate}T${form.bookingEndTime}:00+08:00` : `${form.plannedStartDate}T${form.plannedStartTime}:00+08:00`,
              planned_start_time: `${form.plannedStartDate}T${form.plannedStartTime}:00+08:00`,
              end_time: form.plannedEndDate ? `${form.plannedEndDate}T${form.plannedEndTime}:00+08:00` : `${form.plannedStartDate}T${form.plannedStartTime}:00+08:00`,
              capacity: parseInt(form.sessionCapacity) || 10,
              price: form.sessionPriceFree ? 0 : (parseInt(form.sessionPrice) || 0),
            })
          }
        }
      }
      await new Promise(r => setTimeout(r, 600))
      setSubmitting(false)
      showToast('已提交审核')
      navigate('/profile')
      return
    }

    const actId = `a_${Date.now()}`
    const now = new Date().toISOString()
    const newAct = {
      id: actId,
      user_id: 'u0',
      title: form.title,
      category: Array.isArray(form.industry) ? form.industry.join('、') : form.industry,
      category_type: contentType,
      city: form.city,
      age_range: ageRange,
      description: form.description,
      requirements: form.requirements,
      industry: Array.isArray(form.industry) ? form.industry.join('、') : form.industry,
      status: 'pending_review',
      created_at: now,
      cover_url: form.images[0] || 'https://picsum.photos/seed/new/750/400',
      images: form.images.slice(0, 3),
      location_name: form.location || form.city,
      lat: 25.7, lng: 100.2,
      organizer_name: '超级管理员',
      organizer_avatar: 'https://picsum.photos/seed/admin/200/200',
      organizer_bio: '',
      applicants_count: 0,
      max_applicants: parseInt(form.sessionCapacity) || 10,
      application_notes: contentType === '研学路线' ? routeActivityIds.filter(s => s.title).map(s => s.title).join(' → ') : (form.routeStopsList?.filter(Boolean).join(' → ') || (!hasSession ? form.eventTime : '') || (form.stayMinDays ? `${form.stayMinDays}天起` : '') + (form.stayLongterm ? '可长住' : '') || ''),
      duration: form.durationTbd ? '未定' : (form.durationDays || form.durationNights ? `${form.durationDays || 0}天${form.durationNights || 0}夜` : ''),
    }
    mockStore.activities.push(newAct)

    // 创建第一期期次
    if (hasSession) {
      const sessionId = `s_${actId}`
      const priceNum = form.sessionPriceFree ? 0 : (parseInt(form.sessionPrice) || 0)
      mockStore.activity_sessions.push({
        id: sessionId,
        activity_id: actId,
        session_number: 1,
        booking_start_time: `${form.bookingStartDate}T${form.bookingStartTime}:00+08:00`,
        booking_end_time: form.bookingEndDate ? `${form.bookingEndDate}T${form.bookingEndTime}:00+08:00` : `${form.plannedStartDate}T${form.plannedStartTime}:00+08:00`,
        planned_start_time: `${form.plannedStartDate}T${form.plannedStartTime}:00+08:00`,
        end_time: form.plannedEndDate ? `${form.plannedEndDate}T${form.plannedEndTime}:00+08:00` : `${form.plannedStartDate}T${form.plannedStartTime}:00+08:00`,
        capacity: parseInt(form.sessionCapacity) || 10,
        price: priceNum,
        status: 'booking_open',
        group_chat_name: `${form.title}·第1期`,
        booked_count: 0,
      })
    }

    // 创建群聊：审核通过后默认建群（加入 mockStore）
    const defaultGroupId = `g_${actId}`
    // 默认群（不带期次）：超级管理员 + 发布人
    mockStore.group_members.push(
      { group_id: defaultGroupId, user_id: 'u0', role: 'superadmin', order: 1 },
      { group_id: defaultGroupId, user_id: newAct.user_id, role: 'organizer', order: 2 },
    )
    mockStore.group_messages.push({
      id: `gm_${actId}_welcome`,
      group_id: defaultGroupId,
      user_id: 'u0',
      content: `欢迎加入「${form.title}」群聊`,
      created_at: new Date().toISOString(),
    })
    // 期次群（如果有期次）
    if (hasSession) {
      const sessionGroupId = `g_${actId}_s1`
      mockStore.group_members.push(
        { group_id: sessionGroupId, user_id: 'u0', role: 'superadmin', order: 1 },
        { group_id: sessionGroupId, user_id: newAct.user_id, role: 'organizer', order: 2 },
      )
      mockStore.group_messages.push({
        id: `gm_${actId}_s1_welcome`,
        group_id: sessionGroupId,
        user_id: 'u0',
        content: `欢迎加入「${form.title}·第1期」期次群`,
        created_at: new Date().toISOString(),
      })
    }

    // 研学路线：活动提报后需要管理员先审核，通过后再通知关联发布人
    // 此处不直接发送通知，待管理员审核后由 publish_review 流程触发
    await new Promise(r => setTimeout(r, 600))
    setSubmitting(false)
    showToast('已提交审核')
    navigate('/')
  }

  return (
    <div className={styles.page}>
      <PageHeader cn="发布" en="PUBLISH" right="把世界，教给世界" />
      <FilterTabs tabs={CONTENT_TYPES} active={contentType} onChange={setContentType} />

      <div className={styles.form}>
        {/* 图片上传 — 最顶部 */}
        <div className={styles.formGroup}>
          <label className={styles.label}>活动图片（3-6张）</label>
          <div className={styles.imageGrid}>
            {form.images.map((url, i) => (
              <div key={i} className={styles.imageSlot}>
                <img src={url} alt="" className={styles.uploadImg} />
                <button className={styles.imageRemove} onClick={() => removeImage(i)}>×</button>
              </div>
            ))}
            {form.images.length < 6 && (
              <button className={styles.imageAdd} onClick={addImage}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {fields.map(field => {
          if (field.type === 'city') {
            return (
              <div key={field.key} className={styles.formGroup}>
                <label className={styles.label}>{field.label}</label>
                <div style={{ flex: 1, display: 'flex', gap: 8, minWidth: 0 }}>
                  <div className={styles.cityInput} onClick={() => setShowCityPicker(true)} style={{ whiteSpace: 'nowrap' }}>
                    <span>{form.city || '大理'}市</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                  <input
                    className={styles.input}
                    value={form.location || ''}
                    onChange={e => update('location', e.target.value)}
                    placeholder="详细地址"
                  />
                </div>
              </div>
            )
          }
          if (field.type === 'tags') {
            const currentTags = Array.isArray(form.industry) ? form.industry : ['', '', '']
            // 确保至少显示3个空位
            const tagsToShow = currentTags.length < 3
              ? [...currentTags, ...Array(3 - currentTags.length).fill('')]
              : currentTags
            const setTag = (idx, val) => {
              const next = [...tagsToShow]
              next[idx] = val
              update('industry', next.filter(t => t).length > 0 ? next : ['', '', ''])
            }
            const addTag = () => {
              if (tagsToShow.length >= 6) return
              update('industry', [...tagsToShow, ''])
            }
            const removeTag = (idx) => {
              const next = tagsToShow.filter((_, i) => i !== idx)
              update('industry', next.length > 0 ? next : ['', '', ''])
            }
            return (
              <div key={field.key} className={styles.formGroup}>
                <label className={styles.label}>{field.label}</label>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                    {tagsToShow.map((tag, i) => (
                      <div key={i} style={{ position: 'relative', display: 'inline-flex' }}>
                        <input
                          className={styles.input}
                          value={tag}
                          onChange={e => setTag(i, e.target.value)}
                          placeholder=""
                          style={{ width: 80 }}
                        />
                        {tag && (
                          <span onClick={() => removeTag(i)} style={{
                            position: 'absolute', right: 3, top: '50%', transform: 'translateY(-50%)',
                            cursor: 'pointer', color: '#999', fontSize: 14, lineHeight: 1,
                          }}>×</span>
                        )}
                      </div>
                    ))}
                    {tagsToShow.length < 6 && (
                      <button type="button" onClick={addTag} style={{
                        width: 80, height: 40, border: '1px dashed #ccc', borderRadius: 3,
                        background: '#fafafa', color: '#999', fontSize: 18, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>+</button>
                    )}
                  </div>
                </div>
              </div>
            )
          }
          if (field.type === 'select') {
            return (
              <div key={field.key} className={styles.formGroup}>
                <label className={styles.label}>{field.label}</label>
                <div className={styles.selectRow}>
                  {field.options.map(opt => (
                    <button
                      key={opt}
                      className={`${styles.industryBtn} ${form[field.key] === opt ? styles.industryActive : ''}`}
                      onClick={() => update(field.key, opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )
          }
          if (field.type === 'routeStops') {
            const setStop = (idx, result) => {
              const nextActs = [...routeActivityIds]
              const nextTexts = [...routeSearchTexts]
              nextActs[idx] = result
              nextTexts[idx] = result.title
              setRouteActivityIds(nextActs)
              setRouteSearchTexts(nextTexts)
              setActiveRouteIndex(null)
            }
            const removeStop = (idx) => {
              if (routeActivityIds.length <= 1) return
              setRouteActivityIds(prev => prev.filter((_, i) => i !== idx))
              setRouteSearchTexts(prev => prev.filter((_, i) => i !== idx))
              setRouteCustomMode(prev => prev.filter((_, i) => i !== idx))
            }
            const addStop = () => {
              if (routeActivityIds.length >= 20) return showToast('最多添加20个途径点')
              setRouteActivityIds(prev => [...prev, { id: '', title: '', isCustom: false }])
              setRouteSearchTexts(prev => [...prev, ''])
              setRouteCustomMode(prev => [...prev, false])
            }
            const toggleCustomMode = (idx) => {
              const next = [...routeCustomMode]
              next[idx] = !next[idx]
              setRouteCustomMode(next)
              if (!next[idx]) {
                setActiveRouteIndex(null)
              }
            }
            const confirmCustom = (idx) => {
              const text = routeSearchTexts[idx]?.trim()
              if (!text) return
              setStop(idx, { id: '', title: text, isCustom: true })
            }

            const getSearchResults = (text, idx) => {
              if (!text.trim()) return []
              const lower = text.trim().toLowerCase()
              const filtered = approvedExperiences.filter(a =>
                !routeActivityIds.some((s, i) => i !== idx && s.id === a.id) &&
                (a.title.toLowerCase().includes(lower) || a.organizer?.toLowerCase().includes(lower))
              ).slice(0, 6)
              return filtered
            }

            return (
              <div key={field.key} className={styles.formGroup}>
                <label className={styles.label}>{field.label}</label>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0, position: 'relative' }}>
                  {routeActivityIds.map((stop, i) => {
                    const results = activeRouteIndex === i ? getSearchResults(routeSearchTexts[i] || '', i) : []
                    return (
                      <div key={`stop-${i}`} style={{ position: 'relative' }}>
                        {i > 0 && (
                          <span onClick={() => removeStop(i)} style={{ position: 'absolute', left: -20, top: 14, zIndex: 1, cursor: 'pointer' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e53935" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </span>
                        )}
                        <div style={{ position: 'relative' }}>
                          <input
                            type="text"
                            placeholder={`第${i + 1}站 搜索已发布或选自定点`}
                            value={stop.title ? stop.title : (routeSearchTexts[i] || '')}
                            readOnly={!!stop.title}
                            onChange={e => {
                              const nextTexts = [...routeSearchTexts]
                              nextTexts[i] = e.target.value
                              setRouteSearchTexts(nextTexts)
                              if (!routeCustomMode[i]) setActiveRouteIndex(i)
                            }}
                            onFocus={() => {
                              if (!routeCustomMode[i] && (routeSearchTexts[i] || stop.title)) setActiveRouteIndex(i)
                            }}
                            onBlur={() => {
                              if (routeCustomMode[i]) {
                                setTimeout(() => confirmCustom(i), 150)
                              }
                            }}
                            onKeyDown={e => {
                              if (e.key === 'Enter' && routeCustomMode[i]) {
                                e.preventDefault()
                                confirmCustom(i)
                              }
                            }}
                            className={styles.input}
                            style={{ width: '100%', boxSizing: 'border-box', paddingRight: stop.title ? 12 : 52 }}
                          />
                          {/* 自定义模式切换按钮（已确认的自定点不显示） */}
                          {!stop.title && (
                            <span onClick={() => toggleCustomMode(i)} style={{
                            position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)',
                            fontSize: 10, cursor: 'pointer', whiteSpace: 'nowrap',
                            borderRadius: 2, padding: '1px 5px',
                            background: routeCustomMode[i] ? '#111' : '#f5f5f5',
                            color: routeCustomMode[i] ? '#fff' : '#888',
                            border: routeCustomMode[i] ? '1px solid #111' : '1px solid #ddd',
                          }}>
                            {routeCustomMode[i] ? '自定点 ✓' : '自定点'}
                          </span>
                          )}
                          {/* 自定点标记（已确认） */}
                          {stop.isCustom && stop.title && (
                            <span onClick={() => {
                              setStop(i, { id: '', title: '', isCustom: false })
                            }} style={{
                              position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)',
                              fontSize: 10, color: '#fff', background: '#111',
                              padding: '1px 5px', borderRadius: 2, cursor: 'pointer',
                              border: '1px solid #111',
                            }}>
                              自定点 ✓
                            </span>
                          )}
                        </div>
                        {activeRouteIndex === i && !routeCustomMode[i] && (
                          <>
                            <div onClick={() => setActiveRouteIndex(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 }} />
                            <div style={{
                              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                              background: '#fff', border: '1px solid #e0e0e0', borderRadius: 3, maxHeight: 240, overflowY: 'auto',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            }}>
                              {results.map(a => (
                                <div key={a.id} onClick={() => setStop(i, { id: a.id, title: a.title, isCustom: false })} style={{
                                  padding: '10px 14px', fontSize: 13, cursor: 'pointer',
                                  borderBottom: '1px solid #f0f0f0',
                                  display: 'flex', justifyContent: 'space-between',
                                }}>
                                  <span>{a.title}</span>
                                  <span style={{ fontSize: 11, color: '#999' }}>{a.organizer}</span>
                                </div>
                              ))}
                              {results.length === 0 && !routeSearchTexts[i]?.trim() && (
                                <div style={{ padding: '12px 14px', fontSize: 13, color: '#999' }}>输入关键词搜索已发布体验</div>
                              )}
                              {results.length === 0 && routeSearchTexts[i]?.trim() && (
                                <div style={{ padding: '12px 14px', fontSize: 13, color: '#999' }}>未找到匹配体验，点击输入框右侧"自定"按钮添加自定义地点</div>
                              )}
                            </div>
                          </>
                        )}
                        {i < routeActivityIds.length - 1 ? (
                          <div style={{ display: 'flex', justifyContent: 'center', padding: '2px 0' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2">
                              <line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" />
                            </svg>
                          </div>
                        ) : null}
                      </div>
                    )
                  })}
                  {routeActivityIds.length < 20 && (
                    <div key="add-stop">
                      <div style={{ display: 'flex', justifyContent: 'center', padding: '2px 0' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" strokeDasharray="2 2">
                          <line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" />
                        </svg>
                      </div>
                      <button type="button" onClick={addStop} style={{
                        background: 'none', border: '1px dashed #ddd', borderRadius: 3, padding: '6px 0',
                        fontSize: 13, color: '#999', cursor: 'pointer', width: '100%',
                      }}>+ 添加途径点</button>
                    </div>
                  )}
                </div>
              </div>
            )
          }
          if (field.type === 'stayDuration') {
            const stayNums = Array.from({ length: 31 }, (_, i) => i + 1) // 1-30
            return (
              <div key={field.key} className={styles.formGroup}>
                <label className={styles.label}>{field.label}</label>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <select className={styles.input} style={{ width: 80, flex: 'none', background: '#fff', appearance: 'none', cursor: 'pointer', color: form.stayMinDays ? '#333' : '#999' }}
                    value={form.stayMinDays || ''}
                    onChange={e => update('stayMinDays', e.target.value)}>
                    <option value="" disabled>几天起</option>
                    {stayNums.map(n => <option key={n} value={n}>{n}天起</option>)}
                  </select>
                  <button type="button" onClick={() => update('stayLongterm', !form.stayLongterm)} style={{
                    flex: 1, background: form.stayLongterm ? '#111' : '#fff',
                    color: form.stayLongterm ? '#fff' : '#999', cursor: 'pointer',
                    padding: '10px 14px', textAlign: 'center', fontSize: 14,
                    border: form.stayLongterm ? '1px solid #111' : '1px solid #e0e0e0', borderRadius: 3,
                  }}>可长住</button>
                </div>
              </div>
            )
          }
          if (field.type === 'duration') {
            const nums = Array.from({ length: 31 }, (_, i) => i) // 0-30
            return (
              <div key={field.key} className={styles.formGroup}>
                <label className={styles.label}>{field.label}</label>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <select className={styles.input} style={{ width: 60, flex: 'none', background: '#fff', appearance: 'none', cursor: 'pointer', color: form.durationDays ? '#333' : '#999' }}
                    value={form.durationDays || ''}
                    onChange={e => { update('durationDays', e.target.value); update('durationTbd', false) }}
                    disabled={form.durationTbd}>
                    <option value="" disabled>几天</option>
                    {nums.map(n => <option key={n} value={n}>{n}天</option>)}
                  </select>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" style={{ flexShrink: 0 }}>
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <select className={styles.input} style={{ width: 60, flex: 'none', background: '#fff', appearance: 'none', cursor: 'pointer', color: form.durationNights ? '#333' : '#999' }}
                    value={form.durationNights || ''}
                    onChange={e => { update('durationNights', e.target.value); update('durationTbd', false) }}
                    disabled={form.durationTbd}>
                    <option value="" disabled>几夜</option>
                    {nums.map(n => <option key={n} value={n}>{n}夜</option>)}
                  </select>
                  <button type="button" onClick={() => {
                    if (form.durationTbd) { update('durationTbd', false) }
                    else { update('durationDays', ''); update('durationNights', ''); update('durationTbd', true) }
                  }} style={{
                    width: 'auto', flex: '1 1 auto', marginLeft: 10,
                    background: form.durationTbd ? '#111' : '#fff',
                    color: form.durationTbd ? '#fff' : '#999', cursor: 'pointer',
                    padding: '10px 14px', textAlign: 'center', fontSize: 14, lineHeight: 1,
                    border: form.durationTbd ? '1px solid #111' : '1px solid #e0e0e0', borderRadius: 3,
                  }}>未定</button>
                </div>
              </div>
            )
          }
          if (field.type === 'ageRange') {
            const ageNums1 = Array.from({ length: 18 }, (_, i) => i + 1) // 1-18
            const ageNums2 = Array.from({ length: 18 }, (_, i) => i + 3) // 3-20
            const selStyle1 = { width: 60, flex: 'none', background: '#fff', appearance: 'none', cursor: 'pointer', color: form.ageFrom ? '#333' : '#999' }
            const selStyle2 = { width: 60, flex: 'none', background: '#fff', appearance: 'none', cursor: 'pointer', color: form.ageTo ? '#333' : '#999' }
            return (
              <div key={field.key} className={styles.formGroup}>
                <label className={styles.label}>{field.label}</label>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <select className={styles.input} style={selStyle1}
                    value={form.ageFrom || ''}
                    onChange={e => { update('ageFrom', e.target.value); update('ageUnlimited', false) }}>
                    <option value="" disabled>几岁</option>
                    {ageNums1.map(n => <option key={n} value={n}>{n}岁</option>)}
                  </select>
                  <span style={{ flexShrink: 0, color: '#999', fontSize: 14 }}>至</span>
                  <select className={styles.input} style={selStyle2}
                    value={form.ageTo || ''}
                    onChange={e => { update('ageTo', e.target.value); update('ageUnlimited', false) }}>
                    <option value="" disabled>几岁</option>
                    {ageNums2.map(n => <option key={n} value={n}>{n}岁</option>)}
                    <option value="unlimited">不限</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      if (form.ageUnlimited) { update('ageUnlimited', false) }
                      else { update('ageFrom', ''); update('ageTo', ''); update('ageUnlimited', true) }
                    }}
                    style={{
                      width: 'auto', flex: '1 1 auto', marginLeft: 10,
                      background: form.ageUnlimited ? '#111' : '#fff',
                      color: form.ageUnlimited ? '#fff' : '#999', cursor: 'pointer',
                      padding: '10px 14px', textAlign: 'center', fontSize: 14, lineHeight: 1,
                      border: form.ageUnlimited ? '1px solid #111' : '1px solid #e0e0e0', borderRadius: 3,
                    }}
                  >不限年龄</button>
                </div>
              </div>
            )
          }
          if (field.type === 'textarea') {
            return (
              <div key={field.key} className={styles.formGroup}>
                <label className={styles.label}>{field.label}</label>
                <textarea
                  className={styles.textarea}
                  value={form[field.key] || ''}
                  onChange={e => update(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  rows={field.rows || 3}
                />
              </div>
            )
          }
          // default: text input
          return (
            <div key={field.key} className={styles.formGroup}>
              <label className={styles.label}>{field.label}</label>
              <input
                className={styles.input}
                value={form[field.key] || ''}
                onChange={e => update(field.key, e.target.value)}
                placeholder={field.placeholder}
              />
            </div>
          )
        })}

        {/* 活动开始时间 */}
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.label}>活动时间</label>
            <input className={styles.input} type="datetime-local" value={form.eventTime || ''} onChange={e => update('eventTime', e.target.value)}
              disabled={hasSession}
              style={{ flex: 1, minWidth: 0, color: hasSession ? '#ccc' : (form.eventTime ? '#333' : '#ccc'), background: hasSession ? '#f5f5f5' : undefined }} />
          </div>
        </div>

        {/* 期次开关 */}
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.label}>期次设置</label>
            <button
              type="button"
              className={styles.input}
              onClick={() => setHasSession(!hasSession)}
              style={{
                flex: 1, cursor: 'pointer', textAlign: 'center',
                background: hasSession ? '#111' : '#fff',
                color: hasSession ? '#fff' : '#999',
                borderColor: hasSession ? '#111' : '#e0e0e0',
              }}
            >{hasSession ? '已添加期次' : '添加期次'}</button>
          </div>
        </div>

        {hasSession && (<>
        <div className={styles.sectionTitle}>第一期次</div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.label}>预约开始</label>
            <div style={{ flex: 1, display: 'flex', gap: 8, minWidth: 0 }}>
              <input className={styles.input} type="date" placeholder="日期" value={form.bookingStartDate || ''} onChange={e => update('bookingStartDate', e.target.value)} style={{ flex: 1, minWidth: 0, color: form.bookingStartDate ? '#333' : '#ccc' }} />
              <input className={styles.input} type="time" placeholder="时间" value={form.bookingStartTime || ''} onChange={e => update('bookingStartTime', e.target.value)} style={{ flex: 1, minWidth: 0, color: form.bookingStartTime ? '#333' : '#ccc' }} />
            </div>
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.label}>预约截止</label>
            <div style={{ flex: 1, display: 'flex', gap: 8, minWidth: 0 }}>
              <input className={styles.input} type="date" placeholder="日期" value={form.bookingEndDate || ''} onChange={e => update('bookingEndDate', e.target.value)} style={{ flex: 1, minWidth: 0, color: form.bookingEndDate ? '#333' : '#ccc' }} />
              <input className={styles.input} type="time" placeholder="时间" value={form.bookingEndTime || ''} onChange={e => update('bookingEndTime', e.target.value)} style={{ flex: 1, minWidth: 0, color: form.bookingEndTime ? '#333' : '#ccc' }} />
            </div>
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.label}>活动开始</label>
            <div style={{ flex: 1, display: 'flex', gap: 8, minWidth: 0 }}>
              <input className={styles.input} type="date" placeholder="日期" value={form.plannedStartDate || ''} onChange={e => update('plannedStartDate', e.target.value)} required style={{ flex: 1, minWidth: 0, color: form.plannedStartDate ? '#333' : '#ccc' }} />
              <input className={styles.input} type="time" placeholder="时间" value={form.plannedStartTime || ''} onChange={e => update('plannedStartTime', e.target.value)} required style={{ flex: 1, minWidth: 0, color: form.plannedStartTime ? '#333' : '#ccc' }} />
            </div>
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.label}>活动结束</label>
            <div style={{ flex: 1, display: 'flex', gap: 8, minWidth: 0 }}>
              <input className={styles.input} type="date" placeholder="日期" value={form.plannedEndDate || ''} onChange={e => update('plannedEndDate', e.target.value)} style={{ flex: 1, minWidth: 0, color: form.plannedEndDate ? '#333' : '#ccc' }} />
              <input className={styles.input} type="time" placeholder="时间" value={form.plannedEndTime || ''} onChange={e => update('plannedEndTime', e.target.value)} style={{ flex: 1, minWidth: 0, color: form.plannedEndTime ? '#333' : '#ccc' }} />
            </div>
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup} style={{ flex: 1 }}>
            <label className={styles.label}>人数上限</label>
            <div style={{ flex: 1, display: 'flex', gap: 8, minWidth: 0 }}>
              <input className={styles.input} type="number" min={1} value={form.sessionCapacity || ''} onChange={e => update('sessionCapacity', e.target.value)} placeholder="2人" style={{ flex: 1, minWidth: 0, textAlign: 'center' }} />
              <button type="button" onClick={() => update('sessionAllowWaitlist', !form.sessionAllowWaitlist)} className={styles.input} style={{
                flex: 1, minWidth: 0, cursor: 'pointer', textAlign: 'center',
                background: form.sessionAllowWaitlist ? '#111' : '#fff',
                color: form.sessionAllowWaitlist ? '#fff' : '#999',
                borderColor: form.sessionAllowWaitlist ? '#111' : '#e0e0e0',
              }}>{form.sessionAllowWaitlist ? '支持候补' : '是否支持候补'}</button>
            </div>
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup} style={{ flex: 1 }}>
            <label className={styles.label}>活动费用</label>
            <div style={{ flex: 1, display: 'flex', gap: 8, minWidth: 0 }}>
              <input className={styles.input} type="number" value={form.sessionPrice || ''} onChange={e => { update('sessionPrice', e.target.value); update('sessionPriceFree', false) }}
                disabled={form.sessionPriceFree} placeholder="0"
                style={{ flex: 1, minWidth: 0, textAlign: 'center' }}
              />
              <button type="button" onClick={() => {
                if (form.sessionPriceFree) { update('sessionPriceFree', false) }
                else { update('sessionPrice', ''); update('sessionPriceFree', true) }
              }} className={styles.input} style={{
                flex: 1, minWidth: 0, cursor: 'pointer', textAlign: 'center',
                background: form.sessionPriceFree ? '#111' : '#fff',
                color: form.sessionPriceFree ? '#fff' : '#999',
                borderColor: form.sessionPriceFree ? '#111' : '#e0e0e0',
              }}>{form.sessionPriceFree ? '已设免费' : '免费'}</button>
            </div>
          </div>
        </div>
        </>)}

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button
            type="button"
            onClick={() => {
              const now = new Date().toLocaleDateString('zh-CN')
              mockStore.drafts.push({
                id: `draft_${Date.now()}`,
                title: form.title || '',
                contentType: contentType,
                city: form.city,
                industry: form.industry,
                description: form.description,
                requirements: form.requirements,
                images: form.images,
                updated_at: now,
                ...form,
              })
              showToast('已保存草稿')
            }}
            disabled={!form.title?.trim()}
            style={{
              flex: 1, height: 44, background: '#fff', color: '#111', fontSize: 15, fontWeight: 500,
              border: '1px solid #e0e0e0', borderRadius: 3,
              cursor: form.title?.trim() ? 'pointer' : 'not-allowed',
              opacity: form.title?.trim() ? 1 : 0.4,
            }}
          >
            存草稿
          </button>
          <button
            className={styles.submitBtn}
            onClick={handleSubmit}
            disabled={submitting || !form.title?.trim()}
            style={{ flex: 2 }}
          >
            {submitting ? '提交中...' : isEdit ? '修改并提交审核' : '发布审核'}
          </button>
        </div>
      </div>

      <CityPicker
        show={showCityPicker}
        currentCity={form.city}
        onSelect={(c) => { update('city', c); setShowCityPicker(false) }}
        onClose={() => setShowCityPicker(false)}
      />
    </div>
  )
}
