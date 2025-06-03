import { createClient, SupabaseClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env' })

const supabaseUrl: string | undefined = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey: string | undefined = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables')
    process.exit(1)
}

const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

type User = {
    nip: string
    name: string
    email: string
    role?: string
    status?: string
}

async function checkAndCreateTestUsers(): Promise<void> {
    console.log('🔍 Checking test users in database...')

    try {
        // Check existing users
        const { data, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .in('nip', ['199001010001', '199002020002', '199001001'])

        const existingUsers = data as User[] | null;

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
        const testUsers: User[] = [
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
