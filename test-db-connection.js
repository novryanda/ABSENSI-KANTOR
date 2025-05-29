// Tambahkan comment untuk menunjukkan jenis modul
// @ts-check
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const { createClient } = require('@supabase/supabase-js');

// Log variabel environment untuk debugging (sensor untuk keamanan)
console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ?
  `${process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 15)}...` : 'Tidak ada');
console.log('SUPABASE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ?
  `${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 5)}...` : 'Tidak ada');

// Coba koneksi ke Supabase
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('ERROR: Variabel lingkungan Supabase tidak ditemukan!');
  console.log('Pastikan file .env.local memiliki NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Buat klient Supabase dengan opsi tambahan
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  db: {
    schema: 'public'
  },
  global: {
    fetch: (url, options) => {
      console.log(`Connecting to: ${url.toString().substring(0, 50)}...`);
      return fetch(url, { ...options, cache: 'no-store' });
    }
  }
});

async function testConnection() {
  console.log('Menguji koneksi ke Supabase...');

  try {
    // Cek koneksi dasar
    const { data, error } = await supabase.from('users').select('count(*)', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Koneksi gagal:', error);
      return;
    }

    console.log('✅ Koneksi berhasil!');
    console.log('Total pengguna dalam database:', data?.count || 0);

    // Tampilkan 5 user pertama
    console.log('\nDaftar 5 pengguna pertama:');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, nip, status')
      .limit(5);

    if (usersError) {
      console.error('❌ Error saat mengambil daftar pengguna:', usersError);
      return;
    }

    if (!users || users.length === 0) {
      console.log('Tidak ada pengguna di database!');
      return;
    }

    users.forEach((user, index) => {
      console.log(`\nPengguna ${index + 1}:`);
      console.log('ID:', user.id);
      console.log('Nama:', user.name);
      console.log('Email:', user.email);
      console.log('NIP:', user.nip);
      console.log('Status:', user.status);
    });

    // Cek pengguna spesifik jika identifier diberikan
    const testIdentifier = process.argv[2]; // Ambil identifier dari command line

    if (testIdentifier) {
      console.log(`\nMencari pengguna dengan identifier: ${testIdentifier}`);

      // Cek apakah format email
      const isEmail = testIdentifier.includes('@');
      let query;

      if (isEmail) {
        console.log('Mencari berdasarkan email (case-insensitive)...');
        const { data: emailUser, error: emailError } = await supabase
          .from('users')
          .select('id, name, email, nip, status')
          .ilike('email', testIdentifier.trim().toLowerCase())
          .single();

        if (emailError) {
          console.error('❌ Pencarian email gagal:', emailError);
        } else if (emailUser) {
          console.log('✅ Pengguna ditemukan!');
          console.log('ID:', emailUser.id);
          console.log('Nama:', emailUser.name);
          console.log('Email:', emailUser.email);
          console.log('NIP:', emailUser.nip);
          console.log('Status:', emailUser.status);
        } else {
          console.log('❌ Tidak ditemukan pengguna dengan email ini.');
        }
      } else {
        console.log('Mencari berdasarkan NIP...');
        const { data: nipUser, error: nipError } = await supabase
          .from('users')
          .select('id, name, email, nip, status')
          .eq('nip', testIdentifier.trim())
          .single();

        if (nipError) {
          console.error('❌ Pencarian NIP gagal:', nipError);
        } else if (nipUser) {
          console.log('✅ Pengguna ditemukan!');
          console.log('ID:', nipUser.id);
          console.log('Nama:', nipUser.name);
          console.log('Email:', nipUser.email);
          console.log('NIP:', nipUser.nip);
          console.log('Status:', nipUser.status);
        } else {
          console.log('❌ Tidak ditemukan pengguna dengan NIP ini.');
        }
      }
    }

  } catch (error) {
    console.error('Error tidak terduga:', error);
  }
}

testConnection();
