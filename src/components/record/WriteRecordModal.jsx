import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import styles from './WriteRecordModal.module.css'

export default function WriteRecordModal({ experience, draft, onClose, onSubmit, onSaveDraft }) {
  const [title, setTitle] = useState(draft?.title || '')
  const [content, setContent] = useState(draft?.content || '')
  const [images, setImages] = useState(draft?.images || [])
  const fileRef = useRef(null)

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    const remaining = 6 - images.length
    const toProcess = files.slice(0, remaining)
    toProcess.forEach(file => {
      if (!file.type.startsWith('image/')) return
      const reader = new FileReader()
      reader.onload = ev => {
        setImages(prev => [...prev, ev.target.result])
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  const handleAddImage = () => {
    fileRef.current?.click()
  }

  const handleRemoveImage = (idx) => {
    setImages(prev => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = () => {
    if (!title.trim()) return
    if (!content.trim()) return
    onSubmit({ title: title.trim(), content: content.trim(), images })
    onClose()
  }

  const handleDraft = () => {
    onSaveDraft?.({ title: title.trim(), content: content.trim(), images })
    onClose()
  }

  const hasContent = title.trim().length > 0 || content.trim().length > 0 || images.length > 0

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.title}>写记录</span>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.body}>
          <div className={styles.activityInfo}>
            <img className={styles.cover} src={experience.cover} alt="" />
            <div className={styles.infoText}>
              <div className={styles.infoTitle}>{experience.title}</div>
              <div className={styles.infoDate}>{experience.date} 体验</div>
            </div>
          </div>

          <input
            className={styles.titleInput}
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="记录标题..."
          />
          <textarea
            className={styles.textarea}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="分享你的体验感受..."
          />

          <div className={styles.imageSection}>
            <div className={styles.sectionLabel}>添加图片 ({images.length}/6)</div>
            <div className={styles.imageGrid}>
              {images.map((img, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img className={styles.imageItem} src={img} alt="" />
                  <button
                    className={styles.removeBtn}
                    onClick={() => handleRemoveImage(i)}
                  >✕</button>
                </div>
              ))}
              {images.length < 6 && (
                <div className={styles.addImage} onClick={handleAddImage}>
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
        </div>

        <div className={styles.footer}>
          <button
            className={styles.draftBtn}
            disabled={!hasContent}
            onClick={handleDraft}
          >
            存草稿
          </button>
          <button
            className={styles.submitBtn}
            disabled={!content.trim()}
            onClick={handleSubmit}
          >
            发布记录
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
