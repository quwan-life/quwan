export function formatTime(dateStr) {
  const d = new Date(dateStr)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getMonth()+1}月${d.getDate()}日 ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins}分钟前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}小时前`
  return `${Math.floor(hours / 24)}天前`
}

export function formatPrice(cents) {
  if (!cents || cents === 0) return '免费'
  return `¥${(cents / 100).toFixed(0)}`
}

/**
 * 计算两点距离（Haversine 公式），返回公里数
 */
export function calcDistance(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return (R * c).toFixed(1)
}

export function formatDistance(km) {
  const n = parseFloat(km)
  return n < 1 ? `${Math.round(n * 1000)}m` : `${n}km`
}

export function showToast(msg) {
  const el = document.createElement('div')
  el.className = 'toast'
  el.textContent = msg
  document.body.appendChild(el)
  setTimeout(() => {
    if (el.parentNode) el.remove()
  }, 2000)
}

export function compressImage(file, maxSize = 500 * 1024) {
  return new Promise(resolve => {
    const reader = new FileReader()
    reader.onload = e => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img
        if (width > 1200) { height = (height / width) * 1200; width = 1200 }
        canvas.width = width; canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)
        let quality = 0.8
        let result = canvas.toDataURL('image/jpeg', quality)
        while (result.length > maxSize && quality > 0.2) { quality -= 0.1; result = canvas.toDataURL('image/jpeg', quality) }
        const arr = result.split(',')
        const bstr = atob(arr[1]), u8 = new Uint8Array(bstr.length)
        for (let i = 0; i < bstr.length; i++) u8[i] = bstr.charCodeAt(i)
        resolve(new File([u8], file.name, { type: 'image/jpeg' }))
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}
