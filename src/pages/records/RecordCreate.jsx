import { useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'
import { showToast, timeAgo } from '../../lib/utils'
import PageHeader from '../../components/shared/PageHeader'
import styles from './RecordCreate.module.css'

export default function RecordCreate() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const editRecord = location.state?.editRecord
  const experience = location.state?.experience

  const exp = editRecord
    ? { cover: editRecord.images?.[0] || '', title: editRecord.activity_name, date: timeAgo(editRecord.created_at) }
    : experience

  const isEdit = !!editRecord
  const [content, setContent] = useState(editRecord?.content || '')
  const [images, setImages] = useState(editRecord?.images || [])
  const [submitting, setSubmitting] = useState(false)
  const fileRef = useRef(null)

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    const remaining = 6 - images.length
    const toProcess = files.slice(0, remaining)
    toProcess.forEach(file => {
      if (!file.type.startsWith('image/')) return
      const reader = new FileReader()
      reader.onload = ev => setImages(prev => [...prev, ev.target.result])
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  const handleRemoveImage = (idx) => setImages(prev => prev.filter((_, i) => i !== idx))

  const handleSubmit = async () => {
    if (!user) { showToast('请先登录'); return }
    if (!content.trim()) return
    setSubmitting(true)

    if (isEdit) {
      const { error } = await supabase
        .from('records')
        .update({ content: content.trim(), images })
        .eq('id', editRecord.id)
      if (error) { showToast('更新失败'); setSubmitting(false); return }
    } else {
      const { error } = await supabase
        .from('records')
        .insert({
          user_id: user.id,
          activity_name: exp?.title || '',
          session_label: exp?.session_label || '',
          city: exp?.city || '',
          content: content.trim(),
          images,
        })
      if (error) { showToast('发布失败'); setSubmitting(false); return }
    }

    showToast(isEdit ? '更新成功' : '发布成功')
    navigate(-1)
  }

  const handleDraft = async () => {
    if (!user) { showToast('请先登录'); return }
    setSubmitting(true)
    const { error } = await supabase
      .from('records')
      .insert({
        user_id: user.id,
        activity_name: exp?.title || '',
        session_label: exp?.session_label || '',
        city: exp?.city || '',
        content: content.trim(),
        images,
      })
    if (error) { showToast('保存失败'); setSubmitting(false); return }
    showToast('已保存草稿')
    navigate(-1)
  }

  const hasContent = content.trim().length > 0 || images.length > 0

  if (!exp) {
    return (
      <div className="page-container">
        <PageHeader title={isEdit ? '编辑记录' : '写记录'} onBack={() => navigate(-1)} />
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>请先选择体验活动</div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <PageHeader title={isEdit ? '编辑记录' : '写记录'} onBack={() => navigate(-1)} />

      {/* 活动信息 */}
      <div className={styles.activityInfo}>
        <img className={styles.cover} src={exp.cover} alt="" />
        <div className={styles.infoText}>
          <div className={styles.infoTitle}>{exp.title}</div>
          <div className={styles.infoDate}>{exp.date} 体验</div>
        </div>
      </div>

      {/* 文字输入 */}
      <textarea
        className={styles.textarea}
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="分享你的体验感受..."
        autoFocus
      />

      {/* 图片 */}
      <div className={styles.imageSection}>
        <div className={styles.sectionLabel}>添加图片 ({images.length}/6)</div>
        <div className={styles.imageGrid}>
          {images.map((img, i) => (
            <div key={i} style={{ position: 'relative' }}>
              <img className={styles.imageItem} src={img} alt="" />
              <button className={styles.removeBtn} onClick={() => handleRemoveImage(i)}>✕</button>
            </div>
          ))}
          {images.length < 6 && (
            <div className={styles.addImage} onClick={() => fileRef.current?.click()}>
              <span style={{ fontSize: 24, lineHeight: 1 }}>+</span>
            </div>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
      </div>

      {/* 底部按钮 */}
      <div className={styles.footer}>
        <button className={styles.draftBtn} disabled={!hasContent || submitting} onClick={handleDraft}>
          存草稿
        </button>
        <button className={styles.submitBtn} disabled={!content.trim() || submitting} onClick={handleSubmit}>
          {submitting ? '提交中...' : isEdit ? '保存修改' : '发布记录'}
        </button>
      </div>
    </div>
  )
}
