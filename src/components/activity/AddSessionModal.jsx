import { useState, useEffect } from 'react'
import { showToast } from '../../lib/utils'
import styles from './AddSessionModal.module.css'

export default function AddSessionModal({ activityId, activityTitle, sessions, onClose, onAdd, editSession }) {
  const isEdit = !!editSession
  const maxNumber = editSession
    ? editSession.session_number
    : (sessions.length > 0 ? Math.max(...sessions.map(s => s.session_number)) : 0) + 1

  const toLocal = (iso) => {
    if (!iso) return ''
    const d = new Date(iso)
    const p = n => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
  }

  const [form, setForm] = useState({
    session_number: maxNumber,
    booking_start_time: toLocal(editSession?.booking_start_time),
    booking_end_time: toLocal(editSession?.booking_end_time),
    planned_start_time: toLocal(editSession?.planned_start_time),
    end_time: toLocal(editSession?.end_time),
    capacity: editSession?.capacity || 2,
    price: 0,
    group_chat_name: editSession?.group_chat_name || `${activityTitle}·第${maxNumber}期`,
  })

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = () => {
    if (!form.planned_start_time || !form.end_time) return
    const now = new Date()
    if (new Date(form.planned_start_time) <= now || new Date(form.end_time) <= now) {
      return showToast('活动时间必须大于当前时间')
    }
    if (form.booking_start_time && new Date(form.booking_start_time) <= now) {
      return showToast('预约开始时间必须大于当前时间')
    }
    if (form.booking_start_time && form.booking_end_time && new Date(form.booking_start_time) >= new Date(form.booking_end_time)) {
      return showToast('预约开始时间必须在预约结束之前')
    }
    if (new Date(form.planned_start_time) >= new Date(form.end_time)) {
      return showToast('活动开始时间必须在活动结束之前')
    }
    if (form.booking_end_time && form.planned_start_time && new Date(form.booking_end_time) >= new Date(form.planned_start_time)) {
      return showToast('预约结束时间必须在活动开始之前')
    }
    onAdd({
      id: editSession?.id || `s${Date.now()}`,
      activity_id: activityId,
      ...form,
      booked_count: editSession?.booked_count || 0,
      status: editSession?.status || 'upcoming',
      price: 0,
    }, isEdit)
    onClose()
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.title}>{isEdit ? '编辑期次' : '添加期次'}</span>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.body}>
          <div className={styles.field}>
            <label>期次</label>
            <span className={styles.readonly}>第 {form.session_number} 期</span>
          </div>

          <div className={styles.field}>
            <label>报名时间</label>
            <div className={styles.row}>
              <input type="datetime-local" value={form.booking_start_time} onChange={e => handleChange('booking_start_time', e.target.value)} placeholder="开始" />
              <span>至</span>
              <input type="datetime-local" value={form.booking_end_time} onChange={e => handleChange('booking_end_time', e.target.value)} placeholder="结束" />
            </div>
          </div>

          <div className={styles.field}>
            <label>活动时间</label>
            <div className={styles.row}>
              <input type="datetime-local" value={form.planned_start_time} onChange={e => handleChange('planned_start_time', e.target.value)} placeholder="开始" />
              <span>至</span>
              <input type="datetime-local" value={form.end_time} onChange={e => handleChange('end_time', e.target.value)} placeholder="结束" />
            </div>
          </div>

          <div className={styles.field}>
            <label>人数上限</label>
            <input type="number" min={1} value={form.capacity} onChange={e => handleChange('capacity', parseInt(e.target.value) || 1)} />
          </div>

          <div className={styles.field}>
            <label>群聊名称</label>
            <div className={styles.groupName}>{form.group_chat_name}</div>
          </div>
          <div className={styles.freeTag}>💰 免费活动</div>
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>取消</button>
          <button className={styles.submitBtn} onClick={handleSubmit}>{isEdit ? '保存' : '添加'}</button>
        </div>
      </div>
    </div>
  )
}
