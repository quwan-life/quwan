import { useState } from 'react'
import { createPortal } from 'react-dom'
import styles from './ConfirmDialog.module.css'

export default function ConfirmDialog({ message, onConfirm, onCancel, options }) {
  const [selected, setSelected] = useState('')
  const [custom, setCustom] = useState('')

  return createPortal(
    <div className={styles.overlay}>
      <div style={{ flex: 1, pointerEvents: 'auto' }} onClick={onCancel} />
      <div className={styles.dialog} onClick={e => e.stopPropagation()}>
        <div className={styles.msg}>{message}</div>
        {options && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {options.map((o, i) => (
              <label key={i}
                onClick={() => { setSelected(o); setCustom('') }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                  fontSize: 14, cursor: 'pointer', borderRadius: 3,
                  background: selected === o ? '#f5f5f5' : '#fff',
                  border: selected === o ? '1px solid #111' : '1px solid #eee',
                }}>
                <span style={{
                  width: 16, height: 16, borderRadius: '50%', border: selected === o ? '5px solid #111' : '2px solid #ccc',
                  background: '#fff', display: 'inline-block', flexShrink: 0,
                }} />
                {o}
              </label>
            ))}
            <label
              onClick={() => { setSelected('__custom__'); setCustom('') }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                fontSize: 14, cursor: 'pointer', borderRadius: 3,
                background: selected === '__custom__' ? '#f5f5f5' : '#fff',
                border: selected === '__custom__' ? '1px solid #111' : '1px solid #eee',
              }}>
              <span style={{
                width: 16, height: 16, borderRadius: '50%', border: selected === '__custom__' ? '5px solid #111' : '2px solid #ccc',
                background: '#fff', display: 'inline-block', flexShrink: 0,
              }} />
              其他原因（自行填写）
            </label>
            {selected === '__custom__' && (
              <input
                value={custom}
                onChange={e => setCustom(e.target.value)}
                placeholder="请输入拒绝理由"
                style={{
                  marginTop: 4, padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: 3,
                  fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box',
                }}
                autoFocus
              />
            )}
          </div>
        )}
        <div className={styles.actions}>
          <button className={styles.cancel} onClick={onCancel}>取消</button>
          <button className={styles.ok}
            onClick={() => onConfirm(selected === '__custom__' ? custom : selected)}
            disabled={!selected || (selected === '__custom__' && !custom.trim())}>确定</button>
        </div>
      </div>
    </div>,
    document.body
  )
}
