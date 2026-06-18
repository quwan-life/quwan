import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { formatTime } from '../../lib/utils'
import { createMap, addMarker } from '../../lib/mapService'
import PageHeader from '../../components/shared/PageHeader'
import { useAuth } from '../../lib/AuthContext'
import styles from './MapView.module.css'

function getCity(loc) {
  if (!loc) return ''
  const m = loc.match(/^(.+?)[市]/)
  return m ? m[1] + '市' : loc.slice(0, 2)
}

export default function MapView() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])
  const [expandedId, setExpandedId] = useState(null)
  const [mapReady, setMapReady] = useState(false)
  const [visibleActivities, setVisibleActivities] = useState([])
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadActivities()
  }, [])

  const loadActivities = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('activities')
      .select('*, activity_sessions(*)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (data) {
      setActivities(data)
      setVisibleActivities(data)
    }
    setLoading(false)
  }

  const bounds = activities.length > 0
    ? {
        lat: activities.reduce((s, a) => s + (a.lat || 0), 0) / activities.length,
        lng: activities.reduce((s, a) => s + (a.lng || 0), 0) / activities.length,
      }
    : { lat: 31.2304, lng: 121.4737 }

  useEffect(() => {
    if (!mapRef.current || activities.length === 0) return
    const t = setTimeout(() => {
      if (!mapRef.current) return
      createMap(mapRef.current, { zoom: 13, center: [bounds.lat, bounds.lng] })
        .then(map => {
          mapInstanceRef.current = map
          setMapReady(true)
          setTimeout(() => { try { map.invalidateSize() } catch {} }, 300)

          const updateVisible = () => {
            try {
              const b = map.getBounds()
              const v = activities.filter(a => b.contains([a.lat, a.lng]))
              setVisibleActivities(v.length > 0 ? v : activities)
            } catch {}
          }
          map.on('moveend', updateVisible)
          map.on('zoomend', updateVisible)
          updateVisible()

          activities.forEach(a => {
            addMarker(map, { lat: a.lat, lng: a.lng, title: a.title, onClick: () => scrollToCard(a.id) })
              .then(m => markersRef.current.push(m)).catch(() => {})
          })
        })
        .catch(() => setMapReady(false))
    }, 300)
    return () => { clearTimeout(t); try { mapInstanceRef.current?.remove?.() } catch {} }
  }, [activities])

  const scrollToCard = (id) => {
    setExpandedId(id)
    setTimeout(() => document.getElementById(`map-card-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100)
  }

  if (loading) return <div className="page-container" style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100%' }}><PageHeader title="地图模式" onBack={() => navigate(-1)} /><div className="empty-state">加载中...</div></div>

  return (
    <div className="page-container" style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <PageHeader title="地图模式" onBack={() => navigate(-1)} />
      <div className={styles.mapArea}>
        <div ref={mapRef} className={styles.mapContainer} />
        {!mapReady && <div className={styles.mapFallback} />}
      </div>
      <div className={styles.listArea}>
        {visibleActivities.map(a => {
          const session = a.activity_sessions?.[0]
          const isExpanded = expandedId === a.id
          const statusText = { booking_open: '开放', active: '开放', upcoming: '即将开始', ongoing: '进行中', completed: '已结束', booking_closed: '截止' }[session?.status] || ''
          return (
            <div key={a.id} id={`map-card-${a.id}`} className={`${styles.mapCard} ${isExpanded ? styles.expanded : ''}`}>
              <div className={styles.cardRow} onClick={() => setExpandedId(isExpanded ? null : a.id)}>
                {a.images?.[0] && !isExpanded && <img className={styles.thumb} src={a.images[0]} alt="" />}
                <div className={styles.cardInfo}>
                  <div className={styles.cardTitleRow}>
                    <span className={styles.cardTitle}>{a.title}</span>
                    <button className={styles.bookBtn} onClick={e => { e.stopPropagation(); navigate(`/activity/${a.id}`) }}>预约</button>
                  </div>
                  <div className={styles.cardMeta}>
                    {a.organizer_avatar && <img className={styles.metaAvatar} src={a.organizer_avatar} alt="" />}
                    <span>{a.organizer_name}</span>
                  </div>
                  <div className={styles.cardLocRow}>
                    {statusText && <span className={`${styles.cardStatus} ${styles[`st_${session?.status}`] || ''}`}>{statusText}</span>}
                    {getCity(a.location_name) && <span className={styles.cardCity}>{getCity(a.location_name)}</span>}
                    <span className={styles.cardTime}>{formatTime(session?.planned_start_time || a.created_at)}</span>
                  </div>
                </div>
              </div>
              {isExpanded && a.images?.length > 0 && (
                <div className={styles.imageRow}>
                  {a.images.slice(0, 3).map((img, i) => (
                    <img key={i} className={styles.expandImg} src={img} alt="" />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
