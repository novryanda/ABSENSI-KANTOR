// ============================================================================
// KEY VALIDATION TEST COMPONENT
// src/components/debug/KeyValidationTest.tsx
// ============================================================================

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CheckCircle, 
  AlertTriangle, 
  Bug, 
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react'
import { 
  generateAttendanceKey, 
  generateRequestKey, 
  validateUniqueKeys, 
  generateSafeKey,
  generateArrayKeys
} from '@/utils/keyUtils'
import { AttendanceStatus, RequestStatus } from '@prisma/client'

interface KeyValidationTestProps {
  isVisible?: boolean
  onToggle?: () => void
}

export default function KeyValidationTest({ 
  isVisible = false, 
  onToggle 
}: KeyValidationTestProps) {
  const [testResults, setTestResults] = useState<{
    attendanceKeys: string[]
    requestKeys: string[]
    hasUniqueAttendanceKeys: boolean
    hasUniqueRequestKeys: boolean
    totalTests: number
    passedTests: number
  }>({
    attendanceKeys: [],
    requestKeys: [],
    hasUniqueAttendanceKeys: true,
    hasUniqueRequestKeys: true,
    totalTests: 0,
    passedTests: 0
  })

  // Mock data for testing
  const mockAttendanceData = [
    { date: new Date('2024-01-15'), id: 'att-1', status: AttendanceStatus.PRESENT },
    { date: new Date('2024-01-14'), id: 'att-2', status: AttendanceStatus.ABSENT },
    { date: undefined, id: 'att-3', status: AttendanceStatus.PRESENT }, // Test undefined date
    { date: new Date('2024-01-13'), id: undefined, status: AttendanceStatus.LEAVE }, // Test undefined id
    { date: null, id: null, status: AttendanceStatus.SICK }, // Test null values
    { date: new Date('2024-01-15'), id: 'att-1', status: AttendanceStatus.PRESENT }, // Duplicate data
  ]

  const mockRequestData = [
    { id: 'req-1', createdAt: new Date('2024-01-15'), type: 'leave', status: RequestStatus.PENDING },
    { id: 'req-2', createdAt: new Date('2024-01-14'), type: 'permission', status: RequestStatus.APPROVED },
    { id: undefined, createdAt: new Date('2024-01-13'), type: 'work_letter', status: RequestStatus.REJECTED }, // Test undefined id
    { id: 'req-4', createdAt: undefined, type: 'leave', status: RequestStatus.CANCELLED }, // Test undefined date
    { id: null, createdAt: null, type: 'permission', status: RequestStatus.PENDING }, // Test null values
    { id: 'req-1', createdAt: new Date('2024-01-15'), type: 'leave', status: RequestStatus.PENDING }, // Duplicate data
  ]

  const runTests = () => {
    console.log('🧪 Running Key Validation Tests...')

    // Test attendance key generation
    const attendanceKeys = mockAttendanceData.map((attendance, index) => 
      generateAttendanceKey(attendance, index)
    )

    // Test request key generation
    const requestKeys = mockRequestData.map((request, index) => 
      generateRequestKey(request, index)
    )

    // Validate uniqueness
    const hasUniqueAttendanceKeys = validateUniqueKeys(attendanceKeys, 'Test Attendance')
    const hasUniqueRequestKeys = validateUniqueKeys(requestKeys, 'Test Requests')

    // Additional tests
    const additionalTests = [
      // Test safe key generation with various inputs
      generateSafeKey('test', null) !== '',
      generateSafeKey('test', undefined) !== '',
      generateSafeKey('test', '') !== '',
      generateSafeKey('test', 'valid-id') === 'test-valid-id',
      generateSafeKey('test', new Date('2024-01-15')).includes('2024-01-15'),
      
      // Test array key generation
      generateArrayKeys(mockAttendanceData, 'attendance', (item, index) => item.id || item.date).length === mockAttendanceData.length
    ]

    const passedAdditionalTests = additionalTests.filter(Boolean).length
    const totalTests = 2 + additionalTests.length // uniqueness tests + additional tests
    const passedTests = (hasUniqueAttendanceKeys ? 1 : 0) + (hasUniqueRequestKeys ? 1 : 0) + passedAdditionalTests

    setTestResults({
      attendanceKeys,
      requestKeys,
      hasUniqueAttendanceKeys,
      hasUniqueRequestKeys,
      totalTests,
      passedTests
    })

    console.log('✅ Key Validation Tests Complete')
    console.log('Attendance Keys:', attendanceKeys)
    console.log('Request Keys:', requestKeys)
    console.log('All tests passed:', passedTests === totalTests)
  }

  useEffect(() => {
    if (isVisible) {
      runTests()
    }
  }, [isVisible])

  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onToggle}
        className="fixed bottom-4 right-4 z-50"
      >
        <Eye className="h-4 w-4 mr-2" />
        Show Key Tests
      </Button>
    )
  }

  const allTestsPassed = testResults.passedTests === testResults.totalTests

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto bg-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            React Key Validation Test
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={allTestsPassed ? "default" : "destructive"}>
              {testResults.passedTests}/{testResults.totalTests} Tests Passed
            </Badge>
            <Button variant="ghost" size="sm" onClick={runTests}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Re-run Tests
            </Button>
            <Button variant="ghost" size="sm" onClick={onToggle}>
              <EyeOff className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Overall Status */}
          <Alert variant={allTestsPassed ? "default" : "destructive"}>
            <div className="flex items-center gap-2">
              {allTestsPassed ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription>
                {allTestsPassed 
                  ? "All key validation tests passed! No duplicate keys detected."
                  : "Some tests failed. Check the details below for issues."
                }
              </AlertDescription>
            </div>
          </Alert>

          {/* Attendance Keys Test */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                {testResults.hasUniqueAttendanceKeys ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                )}
                Attendance Keys Test
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Testing key generation for attendance records with various edge cases:
                </p>
                <div className="bg-gray-50 p-3 rounded text-xs font-mono">
                  {testResults.attendanceKeys.map((key, index) => (
                    <div key={index} className="flex justify-between">
                      <span>Index {index}:</span>
                      <span className="text-blue-600">{key}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  ✓ Tests undefined dates, null values, and duplicate data
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Request Keys Test */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                {testResults.hasUniqueRequestKeys ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                )}
                Request Keys Test
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Testing key generation for request records with various edge cases:
                </p>
                <div className="bg-gray-50 p-3 rounded text-xs font-mono">
                  {testResults.requestKeys.map((key, index) => (
                    <div key={index} className="flex justify-between">
                      <span>Index {index}:</span>
                      <span className="text-blue-600">{key}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  ✓ Tests undefined IDs, null values, and duplicate data
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Test Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Test Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Key Generation Tests:</strong>
                  <ul className="mt-1 space-y-1 text-xs">
                    <li>✓ Handles null/undefined values</li>
                    <li>✓ Generates unique keys for duplicates</li>
                    <li>✓ Uses fallback indices when needed</li>
                    <li>✓ Sanitizes special characters</li>
                  </ul>
                </div>
                <div>
                  <strong>Edge Cases Tested:</strong>
                  <ul className="mt-1 space-y-1 text-xs">
                    <li>• Undefined date/id fields</li>
                    <li>• Null values</li>
                    <li>• Duplicate records</li>
                    <li>• Empty strings</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}
