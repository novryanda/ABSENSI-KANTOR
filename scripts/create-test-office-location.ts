// ============================================================================
// CREATE TEST OFFICE LOCATION SCRIPT
// scripts/create-test-office-location.ts
// ============================================================================

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createTestOfficeLocation() {
  try {
    console.log('🏢 Creating test office location...')

    // Check if any office locations exist
    const existingLocations = await prisma.officeLocation.findMany()
    console.log('📊 Existing office locations:', existingLocations.length)

    if (existingLocations.length > 0) {
      console.log('✅ Office locations already exist:')
      existingLocations.forEach(location => {
        console.log(`  - ${location.name} (${location.code}) - Active: ${location.isActive}`)
        console.log(`    Coordinates: ${location.latitude}, ${location.longitude}`)
        console.log(`    Radius: ${location.radiusMeters}m`)
      })
      return
    }

    // Create a test office location
    const testLocation = await prisma.officeLocation.create({
      data: {
        name: 'Kantor Pusat',
        code: 'KANTOR-PUSAT',
        address: 'Jl. Test No. 123, Jakarta',
        latitude: 0.4647298976760957, // Example coordinates from your specification
        longitude: 101.41050382578146,
        radiusMeters: 100,
        isActive: true
      }
    })

    console.log('✅ Test office location created successfully:')
    console.log(`  - ID: ${testLocation.id}`)
    console.log(`  - Name: ${testLocation.name}`)
    console.log(`  - Code: ${testLocation.code}`)
    console.log(`  - Coordinates: ${testLocation.latitude}, ${testLocation.longitude}`)
    console.log(`  - Radius: ${testLocation.radiusMeters}m`)
    console.log(`  - Active: ${testLocation.isActive}`)

  } catch (error) {
    console.error('❌ Error creating test office location:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
createTestOfficeLocation()
  .then(() => {
    console.log('🎉 Script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })
