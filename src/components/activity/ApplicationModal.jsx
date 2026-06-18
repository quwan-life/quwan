import { useState } from 'react'
import BottomDrawer from '../shared/BottomDrawer'
import styles from './ApplicationModal.module.css'

const DURATION_OPTIONS = [
  { key: '1天以内', label: '1天以内' },
  { key: '3天体验', label: '3天体验' },
  { key: '1周研学', label: '1周研学' },
  { key: '长期学徒', label: '长期学徒' },
]

const ACCOMPANY_OPTIONS = [
  { key: '全程陪同', label: '全程陪同' },
  { key: '独立参与', label: '独立参与' },
]

export default function ApplicationModal({ activity, onSubmit, onClose }) {
  const [date, setDate] = useState('')
  const [duration, setDuration] = useState('')
  const [count, setCount] = useState(1)
  const [ageRange, setAgeRange] = useState('')
  const [accompany, setAccompany] = useState('')
  const [intro, setIntro] = useState('')

  const handleSubmit = () => {
    if (!date) return
    if (!duration) return
    onSubmit?.({
      activity_id: activity?.id,
      date,
      duration,
      count,
      age_range: ageRange,
      accompany,
      intro,
    })
    onClose?.()
  }

  return (
    <BottomDrawer onClose={onClose}>
      <div className={styles.container}>
        <h2 className={styles.title}>发送申请</h2>
        {activity && (
          <p className={styles.activityName}>{activity.title}</p>
        )}

        {/* [1] 日期 */}
        <div className={styles.field}>
          <label className={styles.label}>
            <span className={styles.step}>[1]</span> 预订参与日期
          </label>
          <input
            type="date"
            className={styles.input}
            value={date}
            onChange={e => setDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        {/* [2] 体验时长 */}
        <div className={styles.field}>
          <label className={styles.label}>
            <span className={styles.step}>[2]</span> 计划体验时长
          </label>
          <div className={styles.optionGroup}>
            {DURATION_OPTIONS.map(opt => (
              <button
                key={opt.key}
                className={`${styles.option} ${duration === opt.key ? styles.optionActive : ''}`}
                onClick={() => setDuration(opt.key)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* [3] 人数 */}
        <div className={styles.field}>
          <label className={styles.label}>
            <span className={styles.step}>[3]</span> 报名总人数
          </label>
          <div className={styles.counter}>
            <button className={styles.counterBtn} onClick={() => setCount(Math.max(1, count - 1))}>−</button>
            <span className={styles.counterVal}>{count}</span>
            <button className={styles.counterBtn} onClick={() => setCount(Math.min(10, count + 1))}>+</button>
          </div>
        </div>

        {/* [4] 儿童年龄 */}
        <div className={styles.field}>
          <label className={styles.label}>
            <span className={styles.step}>[4]</span> 儿童年龄区间
          </label>
          <input
            className={styles.input}
            value={ageRange}
            onChange={e => setAgeRange(e.target.value)}
            placeholder="如：8岁、5-10岁"
          />
        </div>

        {/* [5] 家长陪同 */}
        <div className={styles.field}>
          <label className={styles.label}>
            <span className={styles.step}>[5]</span> 家长是否全程陪同
          </label>
          <div className={styles.optionGroup}>
            {ACCOMPANY_OPTIONS.map(opt => (
              <button
                key={opt.key}
                className={`${styles.option} ${accompany === opt.key ? styles.optionActive : ''}`}
                onClick={() => setAccompany(opt.key)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* [6] 自我介绍 */}
        <div className={styles.field}>
          <label className={styles.label}>
            <span className={styles.step}>[6]</span> 详细说明/自我介绍
          </label>
          <textarea
            className={styles.textarea}
            value={intro}
            onChange={e => setIntro(e.target.value)}
            maxLength={800}
            rows={5}
            placeholder="介绍一下自己或同行者，让发起人更好地了解你..."
          />
          <span className={styles.charCount}>{intro.length}/800</span>
        </div>

        <button className={styles.submitBtn} onClick={handleSubmit}>
          确认提交
        </button>
      </div>
    </BottomDrawer>
  )
}
