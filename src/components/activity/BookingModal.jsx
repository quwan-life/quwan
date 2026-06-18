import { useState } from 'react'
import { formatPrice, showToast } from '../../lib/utils'
import { computeSessionStatus } from './SessionCard'
import styles from './BookingModal.module.css'

const sessionLabels = {
  upcoming: '即将开启预约',
  booking: '预约中',
  wait: '活动即将开始',
  ongoing: '进行中',
  completed: '已完成',
}

export default function BookingModal({ activity, session, sessions, isPublisher, onClose, onSessionChange, onSubmit }) {
  const [name, setName] = useState('')
  const [gender, setGender] = useState('')
  const [phone, setPhone] = useState('')
  const [age, setAge] = useState('')
  const [withFamily, setWithFamily] = useState(false)
  const [note, setNote] = useState('')
  const [showPicker, setShowPicker] = useState(false)
  const [noSession, setNoSession] = useState(!session)
  const [customDate, setCustomDate] = useState('')
  const [customTime, setCustomTime] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (isPublisher) {
      showToast('活动发起人无法预约自己的活动')
      return
    }
    const nameVal = name.trim()
    if (!nameVal) return showToast('请填写姓名')
    if (!/^[\u4e00-\u9fff]+$/.test(nameVal) && !/^[a-zA-Z\s]+$/.test(nameVal)) {
      return showToast('姓名需为纯中文或纯英文')
    }
    const phoneVal = phone.trim()
    if (!phoneVal) return showToast('请填写电话')
    if (!/^1[3-9]\d{9}$/.test(phoneVal)) {
      return showToast('请输入正确的手机号码')
    }
    const noteVal = note.trim()
    if (noteVal.length > 50) {
      return showToast('个人说明不超过50字')
    }
    if (noSession && (!customDate || !customTime)) {
      return showToast('请选择期望体验时间')
    }
    if (onSubmit) {
      onSubmit({
        name: nameVal, phone: phoneVal, gender, age, withFamily, note: noteVal,
        sessionId: noSession ? null : session?.id,
        customTime: noSession ? `${customDate}T${customTime}` : null,
      })
    } else {
      showToast('预约已发送，等待发布人确认')
      onClose()
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>{activity?.title}</h3>
        <div
          className={styles.sessionSelector}
          onClick={() => setShowPicker(!showPicker)}
        >
          <span>{noSession ? '不选期次 · 自定义时间' : session ? `第${session.session_number}期 · ${formatPrice(session.price)}/人 · ${sessionLabels[computeSessionStatus(session).status]}` : '请选择期次'}</span>
          <span className={styles.arrow}>{showPicker ? '▾' : '▸'}</span>
        </div>

        {showPicker && (
          <div className={styles.sessionList}>
            <div
              className={`${styles.sessionItem} ${noSession ? styles.active : ''}`}
              onClick={() => {
                setNoSession(true)
                onSessionChange?.(null)
                setShowPicker(false)
              }}
            >
              <span>不选期次 · 自定义体验时间</span>
            </div>
            {sessions?.map(s => {
              const sStatus = computeSessionStatus(s)
              const canSelect = sStatus.status !== 'completed'
              return (
                <div
                  key={s.id}
                  className={`${styles.sessionItem} ${!canSelect ? styles.disabled : ''} ${s.id === session?.id && !noSession ? styles.active : ''}`}
                  onClick={() => {
                    if (!canSelect) return
                    setNoSession(false)
                    onSessionChange?.(s)
                    setShowPicker(false)
                  }}
                >
                  <span>第{s.session_number}期 · {formatPrice(s.price)}/人</span>
                  <span className={`${styles.sessionBadge} ${sStatus.status === 'booking' ? styles.badgeOpen : canSelect ? styles.badgeUpcoming : styles.badgeClosed}`}>
                    {sessionLabels[sStatus.status]}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {noSession && (
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <input type="date" value={customDate} onChange={e => setCustomDate(e.target.value)}
              style={{ flex: 1, padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: 3, fontSize: 14, color: customDate ? '#333' : '#ccc', background: '#fafafa' }}
              placeholder="选择日期" />
            <input type="time" value={customTime} onChange={e => setCustomTime(e.target.value)}
              style={{ flex: 1, padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: 3, fontSize: 14, color: customTime ? '#333' : '#ccc', background: '#fafafa' }}
              placeholder="选择时间" />
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <div className="form-field" style={{ flex: 2 }}>
              <label><span className="required">*</span> 姓名</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="你的名字" />
            </div>
            <div className="form-field" style={{ flex: 1 }}>
              <label>性别</label>
              <select value={gender} onChange={e => setGender(e.target.value)}>
                <option value="">请选择</option>
                <option value="男">男</option>
                <option value="女">女</option>
              </select>
            </div>
            <div className="form-field" style={{ flex: 1 }}>
              <label>年龄</label>
              <select value={age} onChange={e => setAge(e.target.value)}>
                <option value="">选择</option>
                {Array.from({ length: 58 }, (_, i) => i + 3).map(n => <option key={n} value={n}>{n}岁</option>)}
              </select>
            </div>
            <div className="form-field" style={{ flex: 1 }}>
              <label>陪同</label>
              <button type="button" onClick={() => setWithFamily(!withFamily)} className={withFamily ? 'btn-primary' : 'btn-outline'}
                style={{ width: '100%', fontSize: 14, padding: '10px 0' }}>{withFamily ? '家属陪同' : '无陪同'}</button>
            </div>
          </div>
          <div className="form-field" style={{ marginTop: 12 }}>
            <label><span className="required">*</span> 电话</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="手机号码" />
          </div>
          <div className="form-field">
            <label>个人说明</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="简单个人说明，限50字以内" rows={2} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button type="button" className="btn-outline" style={{ flex: 1 }} onClick={onClose}>取消</button>
            <button type="submit" className="btn-primary" style={{ flex: 2 }}>发送预约</button>
          </div>
        </form>
      </div>
    </div>
  )
}
