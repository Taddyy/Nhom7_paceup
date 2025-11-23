'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { GoogleMap, Marker, DirectionsRenderer, useJsApiLoader, Autocomplete } from '@react-google-maps/api'

const containerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '12px'
}

const defaultCenter = {
  lat: 10.7769, // TP.HCM default
  lng: 106.7009
}

const libraries: ("places" | "drawing" | "geometry" | "localContext" | "visualization")[] = ["places"];

interface Point {
  lat: number
  lng: number
}

interface RouteSelectorProps {
  onPointsChange: (start: Point | null, end: Point | null) => void
}

export default function RouteSelector({ onPointsChange }: RouteSelectorProps) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: libraries as any
  })

  const [startPoint, setStartPoint] = useState<Point | null>(null)
  const [endPoint, setEndPoint] = useState<Point | null>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null)
  
  const [startInput, setStartInput] = useState('')
  const [endInput, setEndInput] = useState('')

  const startAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const endAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

  // Calculate directions when both points are set
  useEffect(() => {
    if (startPoint && endPoint && window.google) {
      const directionsService = new google.maps.DirectionsService()
      directionsService.route({
        origin: startPoint,
        destination: endPoint,
        travelMode: google.maps.TravelMode.WALKING, // Chế độ đi bộ/chạy
        provideRouteAlternatives: true,
      }, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          setDirections(result)
        }
      })
    } else {
      setDirections(null)
    }
  }, [startPoint, endPoint])

  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMap(map)
  }, [])

  const updatePoint = (type: 'start' | 'end', point: Point) => {
    if (type === 'start') {
      setStartPoint(point)
      setStartInput(`${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`)
      onPointsChange(point, endPoint)
    } else {
      setEndPoint(point)
      setEndInput(`${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`)
      onPointsChange(startPoint, point)
    }
    map?.panTo(point)
  }

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return

    const newPoint = {
      lat: e.latLng.lat(),
      lng: e.latLng.lng()
    }

    if (!startPoint) {
      updatePoint('start', newPoint)
    } else if (!endPoint) {
      updatePoint('end', newPoint)
    } else {
      // Reset logic: click again to move start, then end... 
      // Or maybe clearer to just reset both? 
      // Let's stick to: if full, reset and start new
      setStartPoint(newPoint)
      setEndPoint(null)
      setStartInput(`${newPoint.lat.toFixed(5)}, ${newPoint.lng.toFixed(5)}`)
      setEndInput('')
      setDirections(null)
      onPointsChange(newPoint, null)
    }
  }, [startPoint, endPoint, onPointsChange, map])

  const onPlaceChanged = (type: 'start' | 'end', autocompleteRef: React.MutableRefObject<google.maps.places.Autocomplete | null>) => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace()
      if (place.geometry && place.geometry.location) {
        const newPoint = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        }
        updatePoint(type, newPoint)
        // Update input text to address name if available, else coords
        const text = place.formatted_address || `${newPoint.lat.toFixed(5)}, ${newPoint.lng.toFixed(5)}`
        if (type === 'start') setStartInput(text)
        else setEndInput(text)
      }
    }
  }

  const handleInputChange = (type: 'start' | 'end', value: string) => {
    if (type === 'start') setStartInput(value)
    else setEndInput(value)

    // Try to parse coordinates manually
    const coords = value.split(',').map(s => parseFloat(s.trim()))
    if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
      const newPoint = { lat: coords[0], lng: coords[1] }
      // Basic validation for lat/lng ranges could go here
      if (Math.abs(newPoint.lat) <= 90 && Math.abs(newPoint.lng) <= 180) {
        if (type === 'start') {
          setStartPoint(newPoint)
          onPointsChange(newPoint, endPoint)
        } else {
          setEndPoint(newPoint)
          onPointsChange(startPoint, newPoint)
        }
        map?.panTo(newPoint)
      }
    }
  }

  const handleDirectionsChanged = () => {
     // This callback can be used if we want to capture the modified route (via drag)
     // For now, the visual update is handled by the DirectionsRenderer internal state
     // To save the new path, we would need to access the directionsResult object here.
  }

  if (!isLoaded) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center rounded-[12px] bg-neutral-100 text-neutral-500">
        Đang tải bản đồ...
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {/* Start Input */}
        <div className="relative">
          <div className="mb-1 flex items-center gap-2">
            <span className="flex h-3 w-3 items-center justify-center rounded-full bg-green-500" />
            <label className="text-sm font-medium text-neutral-700">Điểm xuất phát</label>
          </div>
          <Autocomplete
            onLoad={(autocomplete) => { startAutocompleteRef.current = autocomplete }}
            onPlaceChanged={() => onPlaceChanged('start', startAutocompleteRef)}
          >
            <input
              type="text"
              value={startInput}
              onChange={(e) => handleInputChange('start', e.target.value)}
              placeholder="Nhập địa chỉ hoặc tọa độ (lat, lng)"
              className="w-full rounded-[8px] border border-neutral-300 px-3 py-2 text-sm outline-none text-[#000] placeholder:text-neutral-400 focus:text-[#212121] focus:border-[#1c1c1c] focus:ring-1 focus:ring-[#1c1c1c]"
            />
          </Autocomplete>
        </div>

        {/* End Input */}
        <div className="relative">
          <div className="mb-1 flex items-center gap-2">
            <span className="flex h-3 w-3 items-center justify-center rounded-full bg-red-500" />
            <label className="text-sm font-medium text-neutral-700">Điểm về đích</label>
          </div>
          <Autocomplete
            onLoad={(autocomplete) => { endAutocompleteRef.current = autocomplete }}
            onPlaceChanged={() => onPlaceChanged('end', endAutocompleteRef)}
          >
            <input
              type="text"
              value={endInput}
              onChange={(e) => handleInputChange('end', e.target.value)}
              placeholder="Nhập địa chỉ hoặc tọa độ (lat, lng)"
              className="w-full rounded-[8px] border border-neutral-300 px-3 py-2 text-sm outline-none text-[#000] placeholder:text-neutral-400 focus:text-[#212121] focus:border-[#1c1c1c] focus:ring-1 focus:ring-[#1c1c1c]"
            />
          </Autocomplete>
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <p className="text-xs text-neutral-500 italic">
          * Kéo thả đường kẻ xanh để thay đổi lộ trình chạy.
        </p>
        <button 
          type="button"
          onClick={() => {
            setStartPoint(null); 
            setEndPoint(null);
            setStartInput('');
            setEndInput('');
            setDirections(null);
            onPointsChange(null, null);
          }}
          className="text-xs text-red-500 underline hover:text-red-700"
        >
          Xóa tất cả markers
        </button>
      </div>

      <div className="overflow-hidden rounded-[12px] border border-neutral-200">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={defaultCenter}
          zoom={13}
          onLoad={onMapLoad}
          onClick={onMapClick}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false
          }}
        >
          {/* Display Start/End Markers only if directions NOT showing (to avoid double markers) */}
          {(!directions && startPoint) && (
            <Marker 
              position={startPoint} 
              label={{ text: "S", color: "white", fontWeight: "bold" }}
            />
          )}
          {(!directions && endPoint) && (
            <Marker 
              position={endPoint} 
              label={{ text: "E", color: "white", fontWeight: "bold" }}
            />
          )}

          {/* Directions Renderer - Displays the route */}
          {directions && (
            <DirectionsRenderer
              directions={directions}
              options={{
                draggable: true, // Allow user to change route
                suppressMarkers: false, // Show default A/B markers
                polylineOptions: {
                  strokeColor: '#0099FF', // Default Google Maps Blue
                  strokeOpacity: 0.8,
                  strokeWeight: 6
                }
              }}
              onDirectionsChanged={handleDirectionsChanged}
            />
          )}
        </GoogleMap>
      </div>
    </div>
  )
}
