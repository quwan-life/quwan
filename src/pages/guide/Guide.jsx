import { useNavigate } from 'react-router-dom'
import PageHeader from '../../components/shared/PageHeader'
import styles from './Guide.module.css'

export default function Guide() {
  const navigate = useNavigate()

  return (
    <div className="page-container">
      <PageHeader title="项目介绍" onBack={() => navigate(-1)} />
      <div className={styles.content}>
        <h2 className={styles.title}>去玩｜全国职业体验社区</h2>
        <p className={styles.desc}>
          「去玩」是一个专注于职业体验的平台，帮助用户发现各种有趣的职业体验活动。
          无论你是想了解咖啡师的一天，还是想体验摄影师的工作，这里都能找到适合你的活动。
        </p>

        <div className={styles.section}>
          <h3>我们能做什么</h3>
          <ul>
            <li>发现并预约各类职业体验活动</li>
            <li>记录你的体验经历，分享感受</li>
            <li>关注感兴趣的体验项目</li>
            <li>与其他体验者交流互动</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h3>如何使用</h3>
          <ul>
            <li>在首页浏览推荐活动，搜索你感兴趣的职业</li>
            <li>点击活动卡片查看详情并预约</li>
            <li>完成体验后，在记录页写下你的感受</li>
            <li>关注喜欢的发布者，不错过新活动</li>
          </ul>
        </div>

        <div className={styles.placeholder}>
          更多介绍内容敬请期待...
        </div>
      </div>
    </div>
  )
}
