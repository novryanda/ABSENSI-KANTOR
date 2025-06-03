'use client'

// ============================================================================
// OFFICE LOCATIONS ADMIN PAGE
// src/app/(dashboard)/admin/office-locations/page.tsx
// ============================================================================

import { useState, useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  MapPin, 
  Loader2,
  Eye,
  ToggleLeft,
  ToggleRight
} from 'lucide-react'

import { OfficeLocationForm } from '@/components/admin/office-locations/OfficeLocationForm'
import { OfficeLocationDetails } from '@/components/admin/office-locations/OfficeLocationDetails'
import {toast} from "sonner";

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

interface OfficeLocationListResponse {
  locations: OfficeLocation[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export default function OfficeLocationsPage() {
  const [locations, setLocations] = useState<OfficeLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  
  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<OfficeLocation | null>(null)

  // Fetch office locations
  const fetchLocations = async (page = 1, search = '') => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search })
      })

      const response = await fetch(`/api/admin/office-locations?${params}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch office locations')
      }

      const data: OfficeLocationListResponse = result.data
      setLocations(data.locations)
      setCurrentPage(data.pagination.page)
      setTotalPages(data.pagination.totalPages)
      setTotal(data.pagination.total)
    } catch (error) {
      console.error('Error fetching office locations:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to fetch office locations')
    } finally {
      setLoading(false)
    }
  }

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
    fetchLocations(1, value)
  }

  // Handle delete
  const handleDelete = async () => {
    if (!selectedLocation) return

    try {
      const response = await fetch(`/api/admin/office-locations/${selectedLocation.id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete office location')
      }

      toast.success('Lokasi kantor berhasil dihapus')

      setShowDeleteDialog(false)
      setSelectedLocation(null)
      fetchLocations(currentPage, searchTerm)
    } catch (error) {
      console.error('Error deleting office location:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete office location')
    }
  }

  // Handle form success
  const handleFormSuccess = () => {
    setShowCreateDialog(false)
    setShowEditDialog(false)
    setSelectedLocation(null)
    fetchLocations(currentPage, searchTerm)
  }

  useEffect(() => {
    fetchLocations()
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lokasi Kantor</h1>
          <p className="text-muted-foreground">
            Kelola lokasi kantor untuk validasi absensi
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Lokasi
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Tambah Lokasi Kantor</DialogTitle>
              <DialogDescription>
                Tambahkan lokasi kantor baru untuk validasi absensi
              </DialogDescription>
            </DialogHeader>
            <OfficeLocationForm onSuccess={handleFormSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Stats */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Daftar Lokasi Kantor</CardTitle>
              <CardDescription>
                Total {total} lokasi kantor
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari lokasi..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Kode</TableHead>
                  <TableHead>Koordinat</TableHead>
                  <TableHead>Radius</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locations.map((location) => (
                  <TableRow key={location.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{location.name}</div>
                        {location.address && (
                          <div className="text-sm text-muted-foreground">
                            {location.address}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{location.code}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{location.radiusMeters}m</TableCell>
                    <TableCell>
                      <Badge variant={location.isActive ? 'default' : 'secondary'}>
                        {location.isActive ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedLocation(location)
                            setShowDetailsDialog(true)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedLocation(location)
                            setShowEditDialog(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedLocation(location)
                            setShowDeleteDialog(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => {
                  const newPage = currentPage - 1
                  setCurrentPage(newPage)
                  fetchLocations(newPage, searchTerm)
                }}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => {
                  const newPage = currentPage + 1
                  setCurrentPage(newPage)
                  fetchLocations(newPage, searchTerm)
                }}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Lokasi Kantor</DialogTitle>
            <DialogDescription>
              Edit informasi lokasi kantor
            </DialogDescription>
          </DialogHeader>
          {selectedLocation && (
            <OfficeLocationForm 
              location={selectedLocation} 
              onSuccess={handleFormSuccess} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Lokasi Kantor</DialogTitle>
          </DialogHeader>
          {selectedLocation && (
            <OfficeLocationDetails location={selectedLocation} />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Lokasi Kantor</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus lokasi kantor "{selectedLocation?.name}"? 
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
