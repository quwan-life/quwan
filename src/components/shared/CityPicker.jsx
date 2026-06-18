import { useState, useRef, useEffect, useCallback } from 'react'
import { cityList, validLetters, hotCities } from '../../../mock/cityData'
import styles from './CityPicker.module.css'

export default function CityPicker({ show, currentCity, onSelect, onClose }) {
  const [keyword, setKeyword] = useState('')
  const [searchResult, setSearchResult] = useState([])
  const [activeLetter, setActiveLetter] = useState('')
  const [visible, setVisible] = useState(false)
  const [animating, setAnimating] = useState(false)
  const scrollRef = useRef(null)
  const letterTimer = useRef(null)

  // 打开/关闭动画 + 锁定滚动
  useEffect(() => {
    if (show) {
      setVisible(true)
      requestAnimationFrame(() => setAnimating(true))
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.width = '100%'
    } else {
      setAnimating(false)
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
      const timer = setTimeout(() => {
        setVisible(false)
        setKeyword('')
        setSearchResult([])
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [show])

  // 搜索
  const handleInput = useCallback((e) => {
    const val = e.target.value.trim()
    setKeyword(val)
    if (!val) { setSearchResult([]); return }
    const result = []
    cityList.forEach(group => {
      group.cities.forEach(city => {
        if (city.includes(val) && !result.includes(city)) result.push(city)
      })
    })
    setSearchResult(result)
  }, [])

  const handleClear = useCallback(() => {
    setKeyword('')
    setSearchResult([])
  }, [])

  // 选择城市
  const handleSelect = useCallback((city) => {
    onSelect(city)
  }, [onSelect])

  // 字母索引点击
  const handleLetterTap = useCallback((letter) => {
    setActiveLetter(letter)
    const el = document.getElementById('letter-' + letter)
    if (el && scrollRef.current) {
      const container = scrollRef.current
      const offset = el.offsetTop - container.offsetTop - 60
      container.scrollTo({ top: offset, behavior: 'smooth' })
    }
    clearTimeout(letterTimer.current)
    letterTimer.current = setTimeout(() => setActiveLetter(''), 1000)
  }, [])

  // 遮罩关闭
  const handleMaskClick = useCallback((e) => {
    if (e.target === e.currentTarget) onClose()
  }, [onClose])

  if (!visible) return null

  return (
    <div className={`${styles.mask} ${animating ? styles.maskShow : ''}`} onClick={handleMaskClick}>
      <div className={`${styles.panel} ${animating ? styles.panelShow : ''}`}>
        {/* 搜索框 */}
        <div className={styles.searchWrap}>
          <div className={styles.searchBox}>
            <span className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              placeholder="搜索城市"
              value={keyword}
              onChange={handleInput}
            />
            {keyword && <button className={styles.clearBtn} onClick={handleClear}>×</button>}
          </div>
        </div>

        {/* 字母索引（无搜索时显示） */}
        {!keyword && (
          <div className={styles.letterIndex}>
            {validLetters.map(letter => (
              <button
                key={letter}
                className={`${styles.letterItem} ${activeLetter === letter ? styles.letterActive : ''}`}
                onClick={() => handleLetterTap(letter)}
              >{letter}</button>
            ))}
          </div>
        )}

        {/* 城市列表 */}
        <div className={styles.scroll} ref={scrollRef}>
          {/* 热门城市 */}
          {!keyword && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>热门城市</div>
              <div className={styles.hotList}>
                {hotCities.map(city => (
                  <button
                    key={city}
                    className={`${styles.hotItem} ${currentCity === city ? styles.hotItemActive : ''}`}
                    onClick={() => handleSelect(city)}
                  >{city}</button>
                ))}
              </div>
            </div>
          )}

          {/* 搜索结果 */}
          {keyword && searchResult.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>搜索结果</div>
              {searchResult.map(city => (
                <div
                  key={city}
                  className={`${styles.cityItem} ${currentCity === city ? styles.cityItemActive : ''}`}
                  onClick={() => handleSelect(city)}
                >{city}</div>
              ))}
            </div>
          )}

          {/* 无搜索结果 */}
          {keyword && searchResult.length === 0 && (
            <div className={styles.empty}>未找到相关城市</div>
          )}

          {/* 按字母分组 */}
          {!keyword && cityList.map(group => (
            <div key={group.letter} className={styles.section} id={`letter-${group.letter}`}>
              <div className={styles.sectionTitle}>{group.letter}</div>
              {group.cities.map(city => (
                <div
                  key={city}
                  className={`${styles.cityItem} ${currentCity === city ? styles.cityItemActive : ''}`}
                  onClick={() => handleSelect(city)}
                >{city}</div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
