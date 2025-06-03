const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')

// Load environment variables
require('dotenv').config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

async function checkAndCreateTestUsers() {
    console.log('🔍 Checking test users in database...')

    try {
        // Check existing users
        const { data: existingUsers, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .in('nip', ['199001010001', '199002020002', '199001001'])

        if (fetchError) {
            console.error('❌ Error fetching users:', fetchError)
            return
        }

        console.log(`📊 Found ${existingUsers?.length || 0} existing test users`)

        if (existingUsers && existingUsers.length > 0) {
            console.log('👥 Existing test users:')
            existingUsers.forEach(user => {
                console.log(`  - NIP: ${user.nip}, Email: ${user.email}, Name: ${user.name}, Status: ${user.status}`)
            })
        } else {
            console.log('ℹ️ No test users found in the database')
        }

        // List expected test users (for reference only)
        const testUsers = [
            {
                nip: '199001010001',
                name: 'Super Admin',
                email: 'superadmin@test.com',
                role: 'Super Admin'
            },
            {
                nip: '199002020002', 
                name: 'HR Admin',
                email: 'hradmin@test.com',
                role: 'HR Admin'
            },
            {
                nip: '199001001',
                name: 'Pegawai Test',
                email: 'pegawai@test.com', 
                role: 'Pegawai'
            }
        ]

        // Check which expected users exist
        testUsers.forEach(testUser => {
            const exists = existingUsers?.some(u => u.nip === testUser.nip)
            console.log(`${exists ? '✅' : '❌'} ${testUser.name} (${testUser.nip}): ${exists ? 'Exists' : 'Not found'}`)
        })
        
        console.log('✅ Test user check completed successfully')
    } catch (error) {
        console.error('❌ Unexpected error occurred:', error)
    }
}

// Execute the function
checkAndCreateTestUsers()
    .then(() => console.log('✅ Script completed'))
    .catch(err => console.error('❌ Script failed:', err));
