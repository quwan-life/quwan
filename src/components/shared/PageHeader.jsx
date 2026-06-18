import styles from './PageHeader.module.css'

/**
 * 统一页面标题栏
 * cn/en — 左上角中文/英文标题（新 API）
 * title — 兼容旧 API，等价于 cn
 * right — 右侧文字（可选）
 * rightSlot — 右侧自定义内容（React 元素，优先级高于 right）
 * noDivider — 隐藏底部分割线（默认显示）
 */
export default function PageHeader({ cn, en, title, right, rightSlot, noDivider, onTitleClick }) {
  const displayCN = cn || title || ''
  const displayEN = en || ''
  return (
    <div className={`${styles.header} ${noDivider ? '' : styles.divider}`}>
      <div className={styles.row}>
        <div className={styles.left} onClick={onTitleClick} style={onTitleClick ? { cursor: 'pointer' } : undefined}>
          <h1 className={styles.cn}>{displayCN}</h1>
          {displayEN && <span className={styles.en}>/ {displayEN}</span>}
        </div>
        {rightSlot || (right && <p className={styles.right}>{right}</p>)}
      </div>
    </div>
  )
}
