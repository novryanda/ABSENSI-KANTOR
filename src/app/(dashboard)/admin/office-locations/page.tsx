'use client'

// ============================================================================
// OFFICE LOCATIONS ADMIN PAGE
// src/app/(dashboard)/admin/office-locations/page.tsx
// ============================================================================

import { useState, useEffect } from 'react'
import '@/styles/office-location-dialog.css'

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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  MapPin,
  Loader2,
  Eye,
  ToggleLeft,
  ToggleRight,
  Shield
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
  const [activeLocationsCount, setActiveLocationsCount] = useState(0)
  
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

      // Count active locations
      const activeCount = data.locations.filter((loc: OfficeLocation) => loc.isActive).length
      setActiveLocationsCount(activeCount)
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

  // Check if location can be deleted
  const canDeleteLocation = (location: OfficeLocation): { canDelete: boolean; reason?: string } => {
    // Cannot delete if it's the last active location
    if (location.isActive && activeLocationsCount === 1) {
      return {
        canDelete: false,
        reason: 'Tidak dapat menghapus lokasi kantor aktif terakhir. Sistem memerlukan minimal satu lokasi aktif untuk validasi absensi.'
      }
    }

    return { canDelete: true }
  }

  // Handle delete
  const handleDelete = async () => {
    if (!selectedLocation) return

    // Check if location can be deleted locally first
    const validation = canDeleteLocation(selectedLocation)
    if (!validation.canDelete) {
      toast.error(validation.reason || 'Lokasi tidak dapat dihapus')
      return
    }

    try {
      const response = await fetch(`/api/admin/office-locations/${selectedLocation.id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!response.ok) {
        // Show more user-friendly error messages
        if (result.error === 'Tidak dapat menghapus lokasi kantor terakhir yang aktif') {
          toast.error('Tidak dapat menghapus lokasi kantor aktif terakhir. Sistem memerlukan minimal satu lokasi aktif untuk validasi absensi.')
        } else {
          toast.error(result.error || 'Gagal menghapus lokasi kantor')
        }
        return
      }

      toast.success('Lokasi kantor berhasil dihapus')

      setShowDeleteDialog(false)
      setSelectedLocation(null)
      fetchLocations(currentPage, searchTerm)
    } catch (error) {
      console.error('Error deleting office location:', error)
      toast.error('Terjadi kesalahan saat menghapus lokasi kantor')
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
          <DialogContent className="office-location-dialog max-w-4xl max-h-[90vh] flex flex-col">
            <DialogHeader className="flex-shrink-0 pb-4 border-b bg-white z-10">
              <DialogTitle className="text-xl font-semibold">Tambah Lokasi Kantor</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Tambahkan lokasi kantor baru untuk validasi absensi
              </DialogDescription>
            </DialogHeader>

            {/* Scrollable Content Area */}
            <div className="office-location-dialog-content flex-1 overflow-y-auto py-4 px-1">
              <OfficeLocationForm onSuccess={handleFormSuccess} />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Stats */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Daftar Lokasi Kantor</CardTitle>
              <CardDescription className="space-y-1">
                <div>Total {total} lokasi kantor</div>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>{activeLocationsCount} Aktif</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span>{total - activeLocationsCount} Nonaktif</span>
                  </span>
                  {activeLocationsCount === 1 && (
                    <span className="flex items-center space-x-1 text-amber-600">
                      <Shield className="h-3 w-3" />
                      <span className="text-xs">Minimal 1 lokasi aktif diperlukan</span>
                    </span>
                  )}
                </div>
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
                {locations.map((location) => {
                  const deleteValidation = canDeleteLocation(location)
                  const isProtected = !deleteValidation.canDelete

                  return (
                    <TableRow
                      key={location.id}
                      className={isProtected ? 'bg-amber-50/50 border-l-4 border-l-amber-400' : ''}
                    >
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{location.name}</span>
                              {isProtected && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Shield className="h-4 w-4 text-amber-500" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-sm">Lokasi terproteksi - tidak dapat dihapus</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                            {location.address && (
                              <div className="text-sm text-muted-foreground">
                                {location.address}
                              </div>
                            )}
                          </div>
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

                        {/* Delete Button with Conditional Rendering */}
                        {(() => {
                          const deleteValidation = canDeleteLocation(location)

                          if (!deleteValidation.canDelete) {
                            return (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        disabled
                                        className="opacity-50 cursor-not-allowed"
                                      >
                                        <div className="flex items-center space-x-1">
                                          <Shield className="h-3 w-3" />
                                          <Trash2 className="h-4 w-4" />
                                        </div>
                                      </Button>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-xs">
                                    <p className="text-sm">{deleteValidation.reason}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )
                          }

                          return (
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
                          )
                        })()}
                      </div>
                    </TableCell>
                  </TableRow>
                  )
                })}
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
        <DialogContent className="office-location-dialog max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0 pb-4 border-b bg-white z-10">
            <DialogTitle className="text-xl font-semibold">Edit Lokasi Kantor</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Edit informasi lokasi kantor untuk validasi absensi
            </DialogDescription>
          </DialogHeader>

          {/* Scrollable Content Area */}
          <div className="office-location-dialog-content flex-1 overflow-y-auto py-4 px-1">
            {selectedLocation && (
              <OfficeLocationForm
                location={selectedLocation}
                onSuccess={handleFormSuccess}
              />
            )}
          </div>
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
            <AlertDialogTitle className="flex items-center space-x-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              <span>Hapus Lokasi Kantor</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Apakah Anda yakin ingin menghapus lokasi kantor <strong>"{selectedLocation?.name}"</strong>?
              </p>
              <p className="text-red-600 font-medium">
                ⚠️ Tindakan ini tidak dapat dibatalkan.
              </p>
              {selectedLocation && (() => {
                const validation = canDeleteLocation(selectedLocation)
                if (!validation.canDelete) {
                  return (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4 text-red-500" />
                        <span className="text-red-700 font-medium">Tidak dapat dihapus</span>
                      </div>
                      <p className="text-red-600 text-sm mt-1">
                        {validation.reason}
                      </p>
                    </div>
                  )
                }
                return null
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              disabled={selectedLocation ? !canDeleteLocation(selectedLocation).canDelete : false}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
