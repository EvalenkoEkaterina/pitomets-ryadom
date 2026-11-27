import { useEffect, useRef, useState } from 'react'

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
    longitude: ((x / size * 360) % 360 + 360) % 360 - 180,
    latitude: Math.max(-85, Math.min(85, Math.atan(Math.sinh(Math.PI * (1 - 2 * y / size))) * 180 / Math.PI)),
  }
}

export default function LocationPicker({ value, onChange, disabled = false }: Props) {
  const [viewCenter, setCenter] = useState<MapPoint | null>(null)
  const [zoom, setZoom] = useState(11)
  const [message, setMessage] = useState('')
  const [locating, setLocating] = useState(false)
  const [failedTile, setFailedTile] = useState('')
  const [tileAttempt, setTileAttempt] = useState(0)
  const locationRequest = useRef(0)
  const center = viewCenter ?? value ?? { latitude: 55.75, longitude: 37.62 }
  const origin = project(center, zoom)
  const selected = value ? project(value, zoom) : null
  const worldSize = 256 * 2 ** zoom
  const markerX = selected
    ? ((selected.x - origin.x + worldSize * 1.5) % worldSize) - worldSize / 2
    : 0
  const visibleTileKeys = new Set<string>()
  const tiles = []

  useEffect(() => () => { locationRequest.current += 1 }, [])

  for (let row = -1; row <= 1; row++) {
    for (let column = -2; column <= 2; column++) {
      const x = Math.floor(origin.x / 256) + column
      const y = Math.floor(origin.y / 256) + row
      const count = 2 ** zoom
      if (y < 0 || y >= count) continue
      const tileKey = `${tileAttempt}/${zoom}/${x}/${y}`
      visibleTileKeys.add(tileKey)
      tiles.push(<img key={tileKey}
        src={`https://tile.openstreetmap.org/${zoom}/${((x % count) + count) % count}/${y}.png`}
        alt="" draggable={false} onError={() => setFailedTile(tileKey)}
        style={{ left: `calc(50% + ${x * 256 - origin.x}px)`, top: `calc(50% + ${y * 256 - origin.y}px)` }} />)
    }
  }

  function locate() {
    if (!navigator.geolocation) {
      setMessage('Геолокация недоступна. Нажмите на карту, чтобы отметить место вручную.')
      return
    }
    setLocating(true)
    const request = ++locationRequest.current
    setMessage('Определяем местоположение…')
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      if (request !== locationRequest.current) return
      const point = { latitude: coords.latitude, longitude: coords.longitude }
      setCenter(point)
      onChange(point)
      setMessage('')
      setLocating(false)
    }, (error) => {
      if (request !== locationRequest.current) return
      if (error.code === error.PERMISSION_DENIED) {
        setMessage('Браузер не разрешил доступ к местоположению. Нажмите на карту, чтобы отметить место вручную.')
      } else {
        setMessage('Не удалось определить местоположение. Попробуйте снова или отметьте место на карте вручную.')
      }
      setLocating(false)
    }, { timeout: 12000, maximumAge: 60000 })
  }

  function selectPoint(point: MapPoint) {
    locationRequest.current += 1
    setLocating(false)
    setMessage('')
    setCenter(center)
    onChange(point)
  }

  function pan(dx: number, dy: number) {
    setCenter(unproject(origin.x + dx, origin.y + dy, zoom))
  }

  return <div className="location-picker">
    <button type="button" className="button_2" onClick={locate} disabled={disabled || locating}>
      {locating ? 'Определяем место…' : 'Моё местоположение'}
    </button>
    <p>Нажмите на карту, чтобы отметить место. Нажмите в другом месте, чтобы перенести метку.</p>
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
        if (event.key === 'Enter' || event.key === ' ') selectPoint(center)
      }}
      onClick={(event) => {
        if (disabled) return
        const map = event.currentTarget
        const rect = map.getBoundingClientRect()
        const x = event.clientX - rect.left - map.clientLeft - map.clientWidth / 2
        const y = event.clientY - rect.top - map.clientTop - map.clientHeight / 2
        selectPoint(unproject(origin.x + x, origin.y + y, zoom))
      }}>
      {tiles}
      {!selected && <span className="map-crosshair" aria-hidden="true">+</span>}
      {selected && (
        <span className="map-pin" aria-hidden="true" style={{
          left: `calc(50% + ${markerX}px)`,
          top: `calc(50% + ${selected.y - origin.y}px)`,
        }} />
      )}
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
    <p className={value ? 'map-selection map-selection-picked' : 'map-selection'} role="status">
      {value ? 'Место выбрано' : 'Место пока не выбрано'}
    </p>
    {message && <p role="status">{message}</p>}
    {visibleTileKeys.has(failedTile) && (
      <div className="location-picker">
        <p role="status">Часть карты не загрузилась. Проверьте соединение и попробуйте загрузить карту снова.</p>
        <button type="button" className="button_2" disabled={disabled}
          onClick={() => { setFailedTile(''); setTileAttempt(tileAttempt + 1) }}>
          Загрузить карту снова
        </button>
      </div>
    )}
    <details>
    <summary>Указать координаты вручную</summary>
    <div className="coordinate-fields">
      <label>Широта<input type="number" step="any" min="-85" max="85" disabled={disabled} value={value?.latitude ?? ''}
        onChange={(event) => { if (event.target.value && event.target.validity.valid) selectPoint({ latitude: Number(event.target.value), longitude: value?.longitude ?? center.longitude }) }} /></label>
      <label>Долгота<input type="number" step="any" min="-180" max="180" disabled={disabled} value={value?.longitude ?? ''}
        onChange={(event) => { if (event.target.value && event.target.validity.valid) selectPoint({ longitude: Number(event.target.value), latitude: value?.latitude ?? center.latitude }) }} /></label>
    </div>
    </details>
    {value && <button className="button_2" type="button" disabled={disabled} onClick={() => setCenter(value)}>Показать выбранную точку</button>}
  </div>
}
