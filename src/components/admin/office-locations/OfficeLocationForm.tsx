'use client'

// ============================================================================
// OFFICE LOCATION FORM COMPONENT
// src/components/admin/office-locations/OfficeLocationForm.tsx
// ============================================================================

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Loader2 } from 'lucide-react'
import { LocationPicker } from './LocationPicker'
import {toast} from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const officeLocationSchema = z.object({
  name: z.string().min(1, 'Nama lokasi wajib diisi').max(100, 'Nama maksimal 100 karakter'),
  code: z.string().min(1, 'Kode lokasi wajib diisi').max(20, 'Kode maksimal 20 karakter')
    .regex(/^[A-Z0-9_-]+$/, 'Kode hanya boleh mengandung huruf besar, angka, underscore, dan dash'),
  address: z.string().max(500, 'Alamat maksimal 500 karakter').optional(),
  latitude: z.number().min(-90, 'Latitude tidak valid').max(90, 'Latitude tidak valid'),
  longitude: z.number().min(-180, 'Longitude tidak valid').max(180, 'Longitude tidak valid'),
  radiusMeters: z.number().min(10, 'Radius minimal 10 meter').max(1000, 'Radius maksimal 1000 meter'),
  isActive: z.boolean()
})

type OfficeLocationFormData = z.infer<typeof officeLocationSchema>

interface OfficeLocation {
  id: string
  name: string
  code: string
  address?: string
  latitude: number
  longitude: number
  radiusMeters: number
  isActive: boolean
}

interface OfficeLocationFormProps {
  location?: OfficeLocation
  onSuccess: () => void
  onCancel?: () => void
}

export function OfficeLocationForm({ location, onSuccess, onCancel }: OfficeLocationFormProps) {
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<OfficeLocationFormData>({
    resolver: zodResolver(officeLocationSchema),
    defaultValues: {
      name: location?.name || '',
      code: location?.code || '',
      address: location?.address || '',
      latitude: location?.latitude || 0.4647298976760957,
      longitude: location?.longitude || 101.41050382578146,
      radiusMeters: location?.radiusMeters || 100,
      isActive: location?.isActive ?? true
    }
  })

  const isActive = watch('isActive')
  const currentLatitude = watch('latitude')
  const currentLongitude = watch('longitude')
  const currentRadius = watch('radiusMeters')

  // Handle location change from LocationPicker
  const handleLocationChange = (latitude: number, longitude: number) => {
    setValue('latitude', latitude)
    setValue('longitude', longitude)
  }

  // Handle radius change from LocationPicker
  const handleRadiusChange = (radius: number) => {
    setValue('radiusMeters', radius)
  }

  const onSubmit = async (data: OfficeLocationFormData) => {
    try {
      setLoading(true)

      const url = location 
        ? `/api/admin/office-locations/${location.id}`
        : '/api/admin/office-locations'
      
      const method = location ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...data,
          code: data.code.toUpperCase()
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save office location')
      }

      toast.success(location
        ? 'Lokasi kantor berhasil diupdate'
        : 'Lokasi kantor berhasil dibuat')

      onSuccess()
    } catch (error) {
      console.error('Error saving office location:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save office location')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="office-location-form space-y-8">
        {/* Basic Information Section */}
        <Card className="location-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Informasi Dasar</span>
            </CardTitle>
            <CardDescription>
              Informasi umum tentang lokasi kantor
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Name and Code in Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Lokasi *</Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="Contoh: Kantor Pusat Jakarta"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-600 flex items-center space-x-1">
                    <span>⚠️</span>
                    <span>{errors.name.message}</span>
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">Kode Lokasi *</Label>
                <Input
                  id="code"
                  {...register('code')}
                  placeholder="Contoh: JKT-PUSAT"
                  className={errors.code ? 'border-red-500' : ''}
                  style={{ textTransform: 'uppercase' }}
                />
                {errors.code && (
                  <p className="text-sm text-red-600 flex items-center space-x-1">
                    <span>⚠️</span>
                    <span>{errors.code.message}</span>
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Gunakan huruf besar, angka, underscore (_), dan dash (-)
                </p>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address">Alamat Lengkap</Label>
              <Textarea
                id="address"
                {...register('address')}
                placeholder="Masukkan alamat lengkap lokasi kantor..."
                rows={3}
                className={errors.address ? 'border-red-500' : ''}
              />
              {errors.address && (
                <p className="text-sm text-red-600 flex items-center space-x-1">
                  <span>⚠️</span>
                  <span>{errors.address.message}</span>
                </p>
              )}
            </div>

            {/* Status Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="space-y-1">
                <Label htmlFor="isActive" className="text-sm font-medium">
                  Status Lokasi
                </Label>
                <p className="text-xs text-muted-foreground">
                  {isActive
                    ? 'Lokasi aktif dan dapat digunakan untuk validasi absensi'
                    : 'Lokasi nonaktif dan tidak dapat digunakan untuk validasi absensi'
                  }
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={(checked) => setValue('isActive', checked)}
                />
                <Label htmlFor="isActive" className="text-sm">
                  {isActive ? 'Aktif' : 'Nonaktif'}
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location & GPS Section */}
        <Card className="location-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Koordinat GPS & Radius Validasi</span>
            </CardTitle>
            <CardDescription>
              Tentukan lokasi GPS dan radius untuk validasi absensi karyawan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LocationPicker
              latitude={currentLatitude}
              longitude={currentLongitude}
              radiusMeters={currentRadius}
              onLocationChange={handleLocationChange}
              onRadiusChange={handleRadiusChange}
            />

            {/* Error Messages for Location Fields */}
            {(errors.latitude || errors.longitude || errors.radiusMeters) && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-800 mb-2">Kesalahan Validasi:</p>
                <div className="space-y-1">
                  {errors.latitude && (
                    <p className="text-sm text-red-600 flex items-center space-x-1">
                      <span>•</span>
                      <span>Latitude: {errors.latitude.message}</span>
                    </p>
                  )}
                  {errors.longitude && (
                    <p className="text-sm text-red-600 flex items-center space-x-1">
                      <span>•</span>
                      <span>Longitude: {errors.longitude.message}</span>
                    </p>
                  )}
                  {errors.radiusMeters && (
                    <p className="text-sm text-red-600 flex items-center space-x-1">
                      <span>•</span>
                      <span>Radius: {errors.radiusMeters.message}</span>
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons - Fixed at Bottom */}
        <div className="sticky-buttons sticky bottom-0 bg-white border-t pt-4 mt-6">
          <div className="button-group flex flex-col sm:flex-row gap-3 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel || onSuccess}
              className="sm:w-auto w-full mobile-full-width"
              disabled={loading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="sm:w-auto w-full min-w-[120px] mobile-full-width"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {location ? 'Update Lokasi' : 'Simpan Lokasi'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
