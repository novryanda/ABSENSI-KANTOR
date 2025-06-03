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
import { Loader2, MapPin } from 'lucide-react'
import {toast} from "sonner";

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
}

export function OfficeLocationForm({ location, onSuccess }: OfficeLocationFormProps) {
  const [loading, setLoading] = useState(false)
  const [gettingLocation, setGettingLocation] = useState(false)

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
      latitude: location?.latitude || 0,
      longitude: location?.longitude || 0,
      radiusMeters: location?.radiusMeters || 100,
      isActive: location?.isActive ?? true
    }
  })

  const isActive = watch('isActive')

  // Get current location
  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation tidak didukung oleh browser')
      return
    }

    setGettingLocation(true)
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        })
      })

      setValue('latitude', position.coords.latitude)
      setValue('longitude', position.coords.longitude)
      
      toast.success('Lokasi berhasil didapatkan')
    } catch (error) {
      console.error('Error getting location:', error)
      toast.error('Gagal mendapatkan lokasi. Pastikan GPS aktif dan izin lokasi diberikan.')
    } finally {
      setGettingLocation(false)
    }
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Nama Lokasi *</Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="Contoh: Kantor Pusat"
        />
        {errors.name && (
          <p className="text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      {/* Code */}
      <div className="space-y-2">
        <Label htmlFor="code">Kode Lokasi *</Label>
        <Input
          id="code"
          {...register('code')}
          placeholder="Contoh: KANTOR-PUSAT"
          style={{ textTransform: 'uppercase' }}
        />
        {errors.code && (
          <p className="text-sm text-red-600">{errors.code.message}</p>
        )}
        <p className="text-sm text-muted-foreground">
          Hanya huruf besar, angka, underscore (_), dan dash (-) yang diizinkan
        </p>
      </div>

      {/* Address */}
      <div className="space-y-2">
        <Label htmlFor="address">Alamat</Label>
        <Textarea
          id="address"
          {...register('address')}
          placeholder="Alamat lengkap lokasi kantor"
          rows={3}
        />
        {errors.address && (
          <p className="text-sm text-red-600">{errors.address.message}</p>
        )}
      </div>

      {/* Coordinates */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label>Koordinat GPS *</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={getCurrentLocation}
            disabled={gettingLocation}
          >
            {gettingLocation ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <MapPin className="h-4 w-4 mr-2" />
            )}
            Gunakan Lokasi Saat Ini
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="latitude">Latitude</Label>
            <Input
              id="latitude"
              type="number"
              step="any"
              {...register('latitude', { valueAsNumber: true })}
              placeholder="0.4647298976760957"
            />
            {errors.latitude && (
              <p className="text-sm text-red-600">{errors.latitude.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="longitude">Longitude</Label>
            <Input
              id="longitude"
              type="number"
              step="any"
              {...register('longitude', { valueAsNumber: true })}
              placeholder="101.41050382578146"
            />
            {errors.longitude && (
              <p className="text-sm text-red-600">{errors.longitude.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Radius */}
      <div className="space-y-2">
        <Label htmlFor="radiusMeters">Radius Toleransi (meter) *</Label>
        <Input
          id="radiusMeters"
          type="number"
          {...register('radiusMeters', { valueAsNumber: true })}
          placeholder="100"
        />
        {errors.radiusMeters && (
          <p className="text-sm text-red-600">{errors.radiusMeters.message}</p>
        )}
        <p className="text-sm text-muted-foreground">
          Jarak maksimal yang diizinkan dari titik koordinat (10-1000 meter)
        </p>
      </div>

      {/* Active Status */}
      <div className="flex items-center space-x-2">
        <Switch
          id="isActive"
          checked={isActive}
          onCheckedChange={(checked) => setValue('isActive', checked)}
        />
        <Label htmlFor="isActive">Lokasi Aktif</Label>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {location ? 'Update' : 'Simpan'}
        </Button>
      </div>
    </form>
  )
}
