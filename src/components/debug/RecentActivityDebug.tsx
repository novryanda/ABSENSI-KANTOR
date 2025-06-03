// ============================================================================
// RECENT ACTIVITY DEBUG COMPONENT
// src/components/debug/RecentActivityDebug.tsx
// ============================================================================

'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Bug, 
  Play, 
  AlertTriangle, 
  CheckCircle,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react'
import RecentActivity from '@/components/dashboard/RecentActivity'
import { AttendanceStatus, RequestStatus } from '@prisma/client'

interface RecentActivityDebugProps {
  isVisible?: boolean
  onToggle?: () => void
}

export default function RecentActivityDebug({ 
  isVisible = false, 
  onToggle 
}: RecentActivityDebugProps) {
  const [testScenario, setTestScenario] = useState<string>('normal')
  const [testResults, setTestResults] = useState<{
    scenario: string
    success: boolean
    error?: string
    renderTime: number
  } | null>(null)

  // Test data scenarios
  const getTestData = (scenario: string) => {
    switch (scenario) {
      case 'normal':
        return {
          attendanceTrend: [
            {
              date: new Date('2024-01-15'),
              status: AttendanceStatus.PRESENT,
              checkInTime: new Date('2024-01-15T08:00:00'),
              checkOutTime: new Date('2024-01-15T17:00:00'),
              workingHours: 8
            },
            {
              date: new Date('2024-01-14'),
              status: AttendanceStatus.ABSENT,
              checkInTime: null,
              checkOutTime: null,
              workingHours: 0
            }
          ],
          recentRequests: [
            {
              id: 'req-1',
              type: 'leave',
              status: RequestStatus.PENDING,
              title: 'Cuti Tahunan',
              createdAt: new Date('2024-01-15'),
              startDate: new Date('2024-01-20'),
              endDate: new Date('2024-01-22')
            }
          ]
        }

      case 'undefined_dates':
        return {
          attendanceTrend: [
            {
              date: undefined,
              status: AttendanceStatus.PRESENT,
              checkInTime: new Date('2024-01-15T08:00:00'),
              workingHours: 8
            },
            {
              date: null,
              status: AttendanceStatus.ABSENT,
              workingHours: 0
            }
          ],
          recentRequests: [
            {
              id: 'req-1',
              type: 'leave',
              status: RequestStatus.PENDING,
              createdAt: undefined,
              startDate: null,
              endDate: null
            }
          ]
        }

      case 'null_arrays':
        return {
          attendanceTrend: null,
          recentRequests: null
        }

      case 'invalid_data':
        return {
          attendanceTrend: [
            null,
            undefined,
            {},
            {
              date: 'invalid-date',
              status: 'invalid-status'
            }
          ],
          recentRequests: [
            null,
            undefined,
            {},
            {
              id: null,
              type: 'invalid-type',
              status: 'invalid-status'
            }
          ]
        }

      case 'empty':
        return {
          attendanceTrend: [],
          recentRequests: []
        }

      case 'large_dataset':
        return {
          attendanceTrend: Array.from({ length: 50 }, (_, i) => ({
            date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
            status: i % 2 === 0 ? AttendanceStatus.PRESENT : AttendanceStatus.ABSENT,
            checkInTime: i % 2 === 0 ? new Date(Date.now() - i * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000) : null,
            workingHours: i % 2 === 0 ? 8 : 0
          })),
          recentRequests: Array.from({ length: 20 }, (_, i) => ({
            id: `req-${i}`,
            type: ['leave', 'permission', 'work_letter'][i % 3],
            status: [RequestStatus.PENDING, RequestStatus.APPROVED, RequestStatus.REJECTED][i % 3],
            title: `Request ${i}`,
            createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000)
          }))
        }

      default:
        return { attendanceTrend: [], recentRequests: [] }
    }
  }

  const runTest = (scenario: string) => {
    const startTime = performance.now()
    
    try {
      setTestScenario(scenario)
      const endTime = performance.now()
      
      setTestResults({
        scenario,
        success: true,
        renderTime: endTime - startTime
      })
    } catch (error) {
      const endTime = performance.now()
      
      setTestResults({
        scenario,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        renderTime: endTime - startTime
      })
    }
  }

  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onToggle}
        className="fixed bottom-16 right-4 z-50"
      >
        <Bug className="h-4 w-4 mr-2" />
        Debug RecentActivity
      </Button>
    )
  }

  const testData = getTestData(testScenario)

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-auto bg-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            RecentActivity Debug Panel
          </CardTitle>
          <div className="flex items-center gap-2">
            {testResults && (
              <Badge variant={testResults.success ? "default" : "destructive"}>
                {testResults.success ? "✅ Success" : "❌ Failed"}
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={onToggle}>
              <EyeOff className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="test" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="test">Test Scenarios</TabsTrigger>
              <TabsTrigger value="preview">Live Preview</TabsTrigger>
              <TabsTrigger value="results">Test Results</TabsTrigger>
            </TabsList>

            <TabsContent value="test" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'normal', label: 'Normal Data', desc: 'Valid attendance and request data' },
                  { key: 'undefined_dates', label: 'Undefined Dates', desc: 'Missing date fields' },
                  { key: 'null_arrays', label: 'Null Arrays', desc: 'Null input arrays' },
                  { key: 'invalid_data', label: 'Invalid Data', desc: 'Corrupted data structures' },
                  { key: 'empty', label: 'Empty Data', desc: 'Empty arrays' },
                  { key: 'large_dataset', label: 'Large Dataset', desc: '50+ records' }
                ].map((scenario) => (
                  <Card key={scenario.key} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{scenario.label}</h4>
                      <Button
                        size="sm"
                        onClick={() => runTest(scenario.key)}
                        className="gap-2"
                      >
                        <Play className="h-3 w-3" />
                        Test
                      </Button>
                    </div>
                    <p className="text-xs text-gray-600">{scenario.desc}</p>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm font-medium">Current Scenario:</span>
                <Badge variant="outline">{testScenario}</Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => runTest(testScenario)}
                  className="gap-2"
                >
                  <RefreshCw className="h-3 w-3" />
                  Refresh
                </Button>
              </div>

              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium mb-2">Live Component Preview:</h4>
                <div className="bg-white rounded border">
                  <RecentActivity
                    attendanceTrend={testData.attendanceTrend}
                    recentRequests={testData.recentRequests}
                    userRole="EMPLOYEE"
                  />
                </div>
              </div>

              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium">
                  View Test Data
                </summary>
                <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">
                  {JSON.stringify(testData, null, 2)}
                </pre>
              </details>
            </TabsContent>

            <TabsContent value="results" className="space-y-4">
              {testResults ? (
                <div className="space-y-4">
                  <Alert variant={testResults.success ? "default" : "destructive"}>
                    <div className="flex items-center gap-2">
                      {testResults.success ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      )}
                      <AlertDescription>
                        Test "{testResults.scenario}" {testResults.success ? 'passed' : 'failed'} 
                        in {testResults.renderTime.toFixed(2)}ms
                      </AlertDescription>
                    </div>
                  </Alert>

                  {testResults.error && (
                    <Card className="border-red-200 bg-red-50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-red-700">Error Details</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <pre className="text-xs text-red-600 whitespace-pre-wrap">
                          {testResults.error}
                        </pre>
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Performance Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <strong>Render Time:</strong> {testResults.renderTime.toFixed(2)}ms
                        </div>
                        <div>
                          <strong>Status:</strong> {testResults.success ? 'Success' : 'Failed'}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Alert>
                  <AlertDescription>
                    No test results yet. Run a test scenario to see results.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
