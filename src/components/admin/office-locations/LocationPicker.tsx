'use client'

// ============================================================================
// LOCATION PICKER COMPONENT (SIMPLIFIED)
// src/components/admin/office-locations/LocationPicker.tsx
// ============================================================================

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Crosshair } from 'lucide-react'
import { toast } from 'sonner'

interface LocationPickerProps {
  latitude?: number
  longitude?: number
  radiusMeters?: number
  onLocationChange: (latitude: number, longitude: number) => void
  onRadiusChange?: (radius: number) => void
  disabled?: boolean
}

export function LocationPicker({
  latitude = 0.4647298976760957, // Default to Pekanbaru coordinates
  longitude = 101.41050382578146,
  radiusMeters = 100,
  onLocationChange,
  onRadiusChange,
  disabled = false
}: LocationPickerProps) {
  const [currentLat, setCurrentLat] = useState(latitude)
  const [currentLng, setCurrentLng] = useState(longitude)
  const [currentRadius, setCurrentRadius] = useState(radiusMeters)
  const [isGettingLocation, setIsGettingLocation] = useState(false)

  // Update coordinates when props change
  useEffect(() => {
    setCurrentLat(latitude)
    setCurrentLng(longitude)
    setCurrentRadius(radiusMeters)
  }, [latitude, longitude, radiusMeters])

  const handleLocationUpdate = (lat: number, lng: number) => {
    setCurrentLat(lat)
    setCurrentLng(lng)
    onLocationChange(lat, lng)
  }

  const handleRadiusUpdate = (radius: number) => {
    setCurrentRadius(radius)
    if (onRadiusChange) {
      onRadiusChange(radius)
    }
  }

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation tidak didukung oleh browser')
      return
    }

    setIsGettingLocation(true)

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 60000
        })
      })

      const lat = position.coords.latitude
      const lng = position.coords.longitude

      handleLocationUpdate(lat, lng)

      toast.success('Lokasi saat ini berhasil didapatkan')
    } catch (error) {
      console.error('Error getting current location:', error)
      toast.error('Gagal mendapatkan lokasi saat ini')
    } finally {
      setIsGettingLocation(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Coordinate Inputs */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-1 h-4 bg-blue-500 rounded"></div>
          <Label className="text-sm font-medium text-gray-700">Koordinat GPS</Label>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="latitude" className="text-sm">Latitude *</Label>
            <Input
              id="latitude"
              type="number"
              step="any"
              value={currentLat}
              onChange={(e) => {
                const lat = parseFloat(e.target.value) || 0
                setCurrentLat(lat)
                onLocationChange(lat, currentLng)
              }}
              disabled={disabled}
              placeholder="0.4647298976760957"
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Rentang: -90 hingga 90
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="longitude" className="text-sm">Longitude *</Label>
            <Input
              id="longitude"
              type="number"
              step="any"
              value={currentLng}
              onChange={(e) => {
                const lng = parseFloat(e.target.value) || 0
                setCurrentLng(lng)
                onLocationChange(currentLat, lng)
              }}
              disabled={disabled}
              placeholder="101.41050382578146"
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Rentang: -180 hingga 180
            </p>
          </div>
        </div>
      </div>

      {/* Radius Input */}
      {onRadiusChange && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-1 h-4 bg-green-500 rounded"></div>
            <Label className="text-sm font-medium text-gray-700">Radius Validasi</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="radius" className="text-sm">Radius Toleransi (meter) *</Label>
            <div className="flex items-center space-x-3">
              <Input
                id="radius"
                type="number"
                min="10"
                max="1000"
                step="10"
                value={currentRadius}
                onChange={(e) => {
                  const radius = parseInt(e.target.value) || 100
                  handleRadiusUpdate(radius)
                }}
                disabled={disabled}
                className="flex-1 font-mono text-sm"
                placeholder="100"
              />
              <Badge variant="outline" className="px-3 py-1 font-medium">
                {currentRadius}m
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Jarak maksimal yang diizinkan dari titik koordinat (10-1000 meter)
            </p>
          </div>
        </div>
      )}

      {/* Current Location Button */}
      {!disabled && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-1 h-4 bg-orange-500 rounded"></div>
            <Label className="text-sm font-medium text-gray-700">Deteksi Lokasi Otomatis</Label>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={getCurrentLocation}
            disabled={isGettingLocation}
            className="w-full h-12 text-sm"
          >
            <Crosshair className={`h-4 w-4 mr-2 ${isGettingLocation ? 'animate-spin' : ''}`} />
            {isGettingLocation ? 'Mendapatkan Lokasi...' : 'Gunakan Lokasi Saat Ini'}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Klik tombol di atas untuk menggunakan lokasi GPS perangkat Anda saat ini
          </p>
        </div>
      )}

      {/* Coordinate Information */}
      <Card className="bg-gray-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-blue-600" />
            <span>Ringkasan Koordinat</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Coordinates Display */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-3 bg-white rounded-lg border">
              <p className="text-xs text-gray-500 mb-1">Koordinat Saat Ini</p>
              <p className="text-sm font-mono text-gray-800">
                {currentLat.toFixed(8)}, {currentLng.toFixed(8)}
              </p>
            </div>
            {onRadiusChange && (
              <div className="p-3 bg-white rounded-lg border">
                <p className="text-xs text-gray-500 mb-1">Radius Validasi</p>
                <p className="text-sm font-medium text-gray-800">
                  {currentRadius} meter
                </p>
              </div>
            )}
          </div>

          {/* Format Information */}
          <div className="text-xs text-gray-500 space-y-1 p-3 bg-white rounded-lg border">
            <p className="font-medium text-gray-700 mb-2">📍 Panduan Format Koordinat:</p>
            <p>• Format: Decimal Degrees (DD)</p>
            <p>• Latitude: -90 hingga 90 (Utara/Selatan)</p>
            <p>• Longitude: -180 hingga 180 (Timur/Barat)</p>
            <p>• Contoh: 0.4647298976760957, 101.41050382578146 (Pekanbaru)</p>
          </div>
        </CardContent>
      </Card>


    </div>
  )
}
