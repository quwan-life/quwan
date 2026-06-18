import { useMemo, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { mockStore } from '../../lib/mockData'
import styles from './MapPage.module.css'

// Leaflet 默认图标修复
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

export default function MapPage() {
  const navigate = useNavigate()
  const mapRef = useRef(null)
  const mapContainerRef = useRef(null)
  const listRef = useRef(null)
  const [mapReady, setMapReady] = useState(false)
  const [selectedMapId, setSelectedMapId] = useState(null)

  const activities = useMemo(() =>
    mockStore.activities.filter(a => a.status === 'active' && a.lat && a.lng),
  [])

  // 按活动数量排序的城市列表
  const cities = useMemo(() => {
    const count = {}
    activities.forEach(a => {
      if (a.city) count[a.city] = (count[a.city] || 0) + 1
    })
    return ['全部', ...Object.entries(count).sort((a, b) => b[1] - a[1]).map(([city]) => city)]
  }, [activities])

  const [activeCity, setActiveCity] = useState('全部')

  // 按城市筛选
  const filtered = useMemo(() => {
    const list = activeCity === '全部' ? activities : activities.filter(a => a.city === activeCity)
    if (selectedMapId) {
      const idx = list.findIndex(a => a.id === selectedMapId)
      if (idx > 0) {
        const item = list.splice(idx, 1)[0]
        list.unshift(item)
      }
    }
    return list
  }, [activities, activeCity, selectedMapId])

  // 初始化地图（仅一次）
  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current || activities.length === 0) return

    const map = L.map(mapContainerRef.current, {
      center: [35.5, 105],
      zoom: 4,
      zoomControl: false,
    })

    L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
      subdomains: '1234',
      attribution: '&copy; 高德地图',
      maxZoom: 18,
    }).addTo(map)

    mapRef.current = map
    window.__map = map
    setMapReady(true)

    return () => {
      map.remove()
      mapRef.current = null
      window.__map = null
    }
  }, [])

  // 地图标记更新：按城市筛选
  useEffect(() => {
    const map = window.__map
    if (!map) return

    // 清除旧标记
    map.eachLayer(layer => {
      if (layer instanceof L.Marker) map.removeLayer(layer)
    })

    const cityCoords = {
      上海: [31.23, 121.47], 广州: [23.13, 113.26], 深圳: [22.54, 114.06],
      杭州: [30.27, 120.15], 厦门: [24.48, 118.09], 青岛: [36.07, 120.38],
      大连: [38.91, 121.61], 天津: [39.08, 117.20], 宁波: [29.87, 121.55],
      三亚: [18.25, 109.51], 海口: [20.02, 110.35], 福州: [26.07, 119.30],
      大理: [25.68, 100.17], 成都: [30.57, 104.07],
    }

    if (activeCity !== '全部') {
      const coords = cityCoords[activeCity]
      if (coords) map.flyTo(coords, 9, { duration: 0.5 })
    } else {
      map.flyTo([35, 105], 3, { duration: 0.5 })
    }

    // 添加当前城市的活动标记（定位图标）
    const markerIcon = L.divIcon({
      className: styles.marker,
      html: '<svg width="16" height="22" viewBox="0 0 16 22" fill="none" style="display:block"><path d="M8 0C3.58 0 0 3.58 0 8c0 6.5 8 14 8 14s8-7.5 8-14c0-4.42-3.58-8-8-8z" fill="#e53935"/><circle cx="8" cy="7.5" r="2.5" fill="#fff"/></svg>',
      iconSize: [16, 22],
      iconAnchor: [8, 20],
    })

    filtered.forEach(act => {
      const marker = L.marker([act.lat, act.lng], { icon: markerIcon }).addTo(map)
      marker.bindPopup(act.title, { closeButton: false, offset: [0, -20], className: styles.mapPopup })
      marker.on('click', () => {
        setSelectedMapId(act.id)
        // scroll to top of drawer list
        requestAnimationFrame(() => {
          if (listRef.current) listRef.current.scrollTo({ top: 0, behavior: 'smooth' })
        })
      })
    })
  }, [activeCity, filtered.length])

  return (
    <div className={styles.page}>
      {/* 上半屏：地图 */}
      <div className={styles.mapArea}>
        <button className={styles.backBtn} onClick={() => navigate(-1)} aria-label="返回">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div ref={mapContainerRef} className={styles.mapContainer} />
        {!mapReady && (
          <div className={styles.mapLoading}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="1.5">
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
              <line x1="8" y1="2" x2="8" y2="18" />
              <line x1="16" y1="6" x2="16" y2="22" />
            </svg>
            <p className={styles.mapHint}>加载地图中</p>
          </div>
        )}
      </div>

      {/* 下半屏：活动抽屉列表 */}
      <div className={styles.drawer}>
        <div className={styles.drawerHandle} />

        {/* 城市标签筛选 */}
        <div className={styles.cityRow}>
          {cities.map(city => (
            <span key={city}
              className={city === activeCity ? styles.cityTagActive : styles.cityTag}
              onClick={() => setActiveCity(city)}
            >{city}</span>
          ))}
        </div>

        <div ref={listRef} className={styles.list}>
          {filtered.map(act => (
            <div key={act.id} id={`map-item-${act.id}`} className={`${styles.item} ${selectedMapId === act.id ? styles.itemSelected : ''}`} onClick={() => navigate(`/activity/${act.id}`)}>
              <img src={act.cover_url} alt="" className={styles.itemCover} />
              <div className={styles.itemInfo}>
                <div className={styles.itemTitleRow}>
                  <span className={styles.catTag}>{act.category_type === '同城活动' ? 'HS同城' : act.category_type}</span>
                  <span className={styles.itemTitle}>{act.title}</span>
                </div>
                <div className={styles.itemBottom}>
                  <span>{act.created_at ? new Date(act.created_at).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) + ' ' + new Date(act.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                  <span>·</span>
                  <span>{act.city ? act.city + '市' : ''} {act.location_name}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
