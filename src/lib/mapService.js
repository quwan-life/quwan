/**
 * 地图抽象层
 * 使用本地 Leaflet + OpenStreetMap
 * 上线后替换为高德/腾讯
 */

import L from 'leaflet'

export async function createMap(container, options = {}) {
  const map = L.map(container, {
    center: options.center || [31.2304, 121.4737],
    zoom: options.zoom || 13,
    zoomControl: false,
    attributionControl: false,
  })

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
  }).addTo(map)

  return map
}

export async function addMarker(map, opts) {
  const marker = L.marker([opts.lat, opts.lng], {
    title: opts.title,
  })
  marker.addTo(map)
  if (opts.onClick) marker.on('click', opts.onClick)
  return marker
}

export async function addCircle(map, opts) {
  const circle = L.circle([opts.lat, opts.lng], {
    radius: opts.radius || 500,
    fillColor: opts.fillColor || '#c6613f',
    fillOpacity: 0.15,
    color: opts.strokeColor || '#c6613f',
    weight: 1,
  })
  circle.addTo(map)
  return circle
}
