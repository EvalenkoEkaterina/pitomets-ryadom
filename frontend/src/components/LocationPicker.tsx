import { useState } from 'react'

export type MapPoint = { latitude: number; longitude: number }

type Props = {
  value: MapPoint | null
  onChange: (point: MapPoint) => void
  disabled?: boolean
}

function project(point: MapPoint, zoom: number) {
  const size = 256 * 2 ** zoom
  const latitude = Math.max(-85, Math.min(85, point.latitude)) * Math.PI / 180
  return {
    x: (point.longitude + 180) / 360 * size,
    y: (1 - Math.log(Math.tan(latitude) + 1 / Math.cos(latitude)) / Math.PI) / 2 * size,
  }
}

function unproject(x: number, y: number, zoom: number): MapPoint {
  const size = 256 * 2 ** zoom
  return {
    longitude: ((x / size * 360 + 180) % 360 + 360) % 360 - 180,
    latitude: Math.max(-85, Math.min(85, Math.atan(Math.sinh(Math.PI * (1 - 2 * y / size))) * 180 / Math.PI)),
  }
}

export default function LocationPicker({ value, onChange, disabled = false }: Props) {
  const [center, setCenter] = useState<MapPoint>({ latitude: 55.75, longitude: 37.62 })
  const [zoom, setZoom] = useState(11)
  const [message, setMessage] = useState('')
  const [locating, setLocating] = useState(false)
  const [tilesFailed, setTilesFailed] = useState(false)
  const origin = project(center, zoom)
  const selected = value ? project(value, zoom) : null
  const tiles = []

  for (let row = -1; row <= 1; row++) {
    for (let column = -2; column <= 2; column++) {
      const x = Math.floor(origin.x / 256) + column
      const y = Math.floor(origin.y / 256) + row
      const count = 2 ** zoom
      if (y < 0 || y >= count) continue
      tiles.push(<img key={`${zoom}/${x}/${y}`}
        src={`https://tile.openstreetmap.org/${zoom}/${((x % count) + count) % count}/${y}.png`}
        alt="" draggable={false} onError={() => setTilesFailed(true)}
        style={{ left: `calc(50% + ${x * 256 - origin.x}px)`, top: `calc(50% + ${y * 256 - origin.y}px)` }} />)
    }
  }

  function locate() {
    if (!navigator.geolocation) {
      setMessage('Браузер не поддерживает определение места. Выберите точку вручную.')
      return
    }
    setLocating(true)
    setMessage('Определяем местоположение…')
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const point = { latitude: coords.latitude, longitude: coords.longitude }
      setCenter(point)
      onChange(point)
      setMessage('Точка выбрана. При необходимости измените её на карте.')
      setLocating(false)
    }, () => {
      setMessage('Не удалось определить место или доступ запрещён. Можно выбрать точку на карте вручную.')
      setLocating(false)
    }, { timeout: 12000, maximumAge: 60000 })
  }

  function pan(dx: number, dy: number) {
    setCenter(unproject(origin.x + dx, origin.y + dy, zoom))
  }

  return <div className="location-picker">
    <button type="button" className="button_2" onClick={locate} disabled={disabled || locating}>
      {locating ? 'Определяем место…' : 'Определить моё местоположение'}
    </button>
    <p>Нажмите на карту, чтобы выбрать точку. Для перемещения используйте стрелки.</p>
    <div className="location-map" role="button" tabIndex={disabled ? -1 : 0}
      aria-label="Карта выбора точки. Стрелки перемещают карту, Enter выбирает центр."
      aria-disabled={disabled}
      onKeyDown={(event) => {
        if (disabled) return
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', ' '].includes(event.key)) event.preventDefault()
        if (event.key === 'ArrowUp') pan(0, -100)
        if (event.key === 'ArrowDown') pan(0, 100)
        if (event.key === 'ArrowLeft') pan(-100, 0)
        if (event.key === 'ArrowRight') pan(100, 0)
        if (event.key === 'Enter' || event.key === ' ') onChange(center)
      }}
      onClick={(event) => {
        if (disabled) return
        const rect = event.currentTarget.getBoundingClientRect()
        onChange(unproject(origin.x + event.clientX - rect.left - rect.width / 2,
          origin.y + event.clientY - rect.top - rect.height / 2, zoom))
      }}>
      {tiles}
      <span className="map-crosshair" aria-hidden="true">+</span>
      {selected && <span className="map-pin" aria-hidden="true" style={{ left: `calc(50% + ${selected.x - origin.x}px)`, top: `calc(50% + ${selected.y - origin.y}px)` }}>●</span>}
    </div>
    <a className="map-attribution" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a>
    <div className="map-controls" aria-label="Управление картой">
      <button type="button" disabled={disabled} onClick={() => pan(-160, 0)} aria-label="Карта западнее">←</button>
      <button type="button" disabled={disabled} onClick={() => pan(0, -160)} aria-label="Карта севернее">↑</button>
      <button type="button" disabled={disabled} onClick={() => pan(0, 160)} aria-label="Карта южнее">↓</button>
      <button type="button" disabled={disabled} onClick={() => pan(160, 0)} aria-label="Карта восточнее">→</button>
      <button type="button" disabled={disabled || zoom >= 18} onClick={() => setZoom(zoom + 1)} aria-label="Приблизить">+</button>
      <button type="button" disabled={disabled || zoom <= 2} onClick={() => setZoom(zoom - 1)} aria-label="Отдалить">−</button>
    </div>
    {tilesFailed && <p role="status">Карта не загрузилась. Проверьте соединение; координаты можно указать ниже.</p>}
    <div className="coordinate-fields">
      <label>Широта<input type="number" step="any" min="-85" max="85" disabled={disabled} value={value?.latitude ?? ''}
        onChange={(event) => { if (event.target.value && event.target.validity.valid) onChange({ latitude: Number(event.target.value), longitude: value?.longitude ?? center.longitude }) }} /></label>
      <label>Долгота<input type="number" step="any" min="-180" max="180" disabled={disabled} value={value?.longitude ?? ''}
        onChange={(event) => { if (event.target.value && event.target.validity.valid) onChange({ longitude: Number(event.target.value), latitude: value?.latitude ?? center.latitude }) }} /></label>
    </div>
    <p role="status">{value ? `Выбрано: ${value.latitude.toFixed(5)}, ${value.longitude.toFixed(5)}` : 'Точка пока не выбрана.'} {message}</p>
    {value && <button className="button_2" type="button" disabled={disabled} onClick={() => setCenter(value)}>Показать выбранную точку</button>}
  </div>
}
