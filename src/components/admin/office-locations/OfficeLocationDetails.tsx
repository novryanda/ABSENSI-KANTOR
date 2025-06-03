'use client'

// ============================================================================
// OFFICE LOCATION DETAILS COMPONENT
// src/components/admin/office-locations/OfficeLocationDetails.tsx
// ============================================================================

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, Clock, CheckCircle, XCircle } from 'lucide-react'

interface OfficeLocation {
  id: string
  name: string
  code: string
  address?: string
  latitude: number
  longitude: number
  radiusMeters: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface OfficeLocationDetailsProps {
  location: OfficeLocation
}

export function OfficeLocationDetails({ location }: OfficeLocationDetailsProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const openInMaps = () => {
    const url = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`
    window.open(url, '_blank')
  }

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Informasi Dasar
            <Badge variant={location.isActive ? 'default' : 'secondary'}>
              {location.isActive ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Aktif
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3 mr-1" />
                  Nonaktif
                </>
              )}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nama Lokasi</label>
              <p className="text-sm font-medium">{location.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Kode Lokasi</label>
              <p className="text-sm font-medium">
                <Badge variant="outline">{location.code}</Badge>
              </p>
            </div>
          </div>
          
          {location.address && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Alamat</label>
              <p className="text-sm">{location.address}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Location Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            Informasi Lokasi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Latitude</label>
              <p className="text-sm font-mono">{location.latitude.toFixed(8)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Longitude</label>
              <p className="text-sm font-mono">{location.longitude.toFixed(8)}</p>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-muted-foreground">Radius Toleransi</label>
            <p className="text-sm">{location.radiusMeters} meter</p>
          </div>

          <div className="pt-2">
            <button
              onClick={openInMaps}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Buka di Google Maps
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Timestamps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Riwayat
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Dibuat</label>
            <p className="text-sm">{formatDate(location.createdAt)}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-muted-foreground">Terakhir Diupdate</label>
            <p className="text-sm">{formatDate(location.updatedAt)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Usage Information */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Penggunaan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            <p>• Lokasi ini digunakan untuk validasi absensi karyawan</p>
            <p>• Karyawan harus berada dalam radius {location.radiusMeters} meter dari koordinat yang ditentukan</p>
            <p>• Status aktif/nonaktif menentukan apakah lokasi dapat digunakan untuk absensi</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
