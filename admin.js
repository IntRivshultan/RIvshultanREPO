// 1. KONEKSI KE SUPABASE
const supabaseUrl = 'https://jqqdlngmusacrspjoyiy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxcWRsbmdtdXNhY3JzcGpveWl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2Mjk0OTMsImV4cCI6MjA5NTIwNTQ5M30.ZuZuJhQ3l1_bFM02kHa8RmMH3trWS76ufXH5evUiY5Q';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// 2. FUNGSI NAVIGASI MENU ADMIN
function showSection(section) {
  document.getElementById('section-produk').style.display = 'none';
  document.getElementById('section-pesanan').style.display = 'none';
  document.getElementById('section-' + section).style.display = 'block';
}

// 3. FITUR KELOLA PRODUK (CRUD)
async function muatProduk() {
  const listDiv = document.getElementById('list-produk');
  const { data: semuaProduk, error } = await supabaseClient
    .from('produk')
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    listDiv.innerHTML = `<p style="color:red;">⚠️ Gagal memuat data: ${error.message}</p>`;
    return;
  }

  if (semuaProduk.length === 0) {
    listDiv.innerHTML = '<p style="color:gray; text-align:center; padding:20px;">Belum ada produk di etalase. Yuk tambah produk pertama!</p>';
    return;
  }

  listDiv.innerHTML = semuaProduk.map(p => `
    <div class="card" style="display:flex; justify-content:space-between; align-items:center;">
      <div>
        <strong>${p.nama}</strong> <span style="font-size:0.8rem; background:#eee; padding:2px 6px; border-radius:4px;">${p.kategori}</span><br>
        <span style="color:var(--red); font-weight:bold; font-size:0.95rem;">Rp ${Number(p.harga).toLocaleString('id-ID')}</span><br>
        <small style="color:gray;">${p.deskripsi || 'Tidak ada deskripsi'}</small>
      </div>
      <button onclick="hapusProduk(${p.id})" style="background:var(--red); color:white; border:none; padding:6px 12px; border-radius:5px; cursor:pointer; font-weight:bold;">Hapus</button>
    </div>
  `).join('');
}

async function tambahProduk() {
  const nama = document.getElementById('nama').value.trim();
  const kategori = document.getElementById('kategori').value.trim().toLowerCase();
  const harga = document.getElementById('harga').value;
  const deskripsi = document.getElementById('deskripsi').value.trim();
  const gambar_url = document.getElementById('gambar_url').value.trim();

  if (!nama || !kategori || !harga) {
    alert("⚠️ Nama, Kategori, dan Harga wajib diisi!");
    return;
  }

  const { error } = await supabaseClient.from('produk').insert([{ nama, kategori, harga: parseInt(harga), deskripsi, gambar_url }]);

  if (error) {
    alert("⚠️ Gagal menambah produk: " + error.message);
  } else {
    alert("🎉 Produk baru berhasil disimpan ke Supabase!");
    document.getElementById('nama').value = '';
    document.getElementById('kategori').value = '';
    document.getElementById('harga').value = '';
    document.getElementById('deskripsi').value = '';
    document.getElementById('gambar_url').value = '';
    muatProduk(); // Langsung update tampilan
  }
}

async function hapusProduk(id) {
  if (!confirm("Apakah kamu yakin ingin menghapus produk ini?")) return;
  const { error } = await supabaseClient.from('produk').delete().eq('id', id);
  if (error) alert("⚠️ Gagal menghapus produk: " + error.message);
  else muatProduk();
}

// Jalankan saat pertama kali dibuka
muatProduk();

// 4. FITUR KELOLA PESANAN MASUK
async function muatPesanan() {
  const listDiv = document.getElementById('list-pesanan');
  listDiv.innerHTML = '<i>Sedang mengambil data pesanan...</i>';

  // Ambil data pesanan, urutkan dari yang paling baru (id descending)
  const { data: semuaPesanan, error } = await supabaseClient
    .from('pesanan')
    .select('*')
    .order('id', { ascending: false });

  if (error) {
    listDiv.innerHTML = `<span style="color:red;">Gagal memuat pesanan: ${error.message}</span>`;
    return;
  }

  if (!semuaPesanan || semuaPesanan.length === 0) {
    listDiv.innerHTML = '<i>Belum ada pesanan masuk.</i>';
    return;
  }

  // Cetak data pesanan menjadi kartu HTML
  listDiv.innerHTML = semuaPesanan.map(p => {
    // Terjemahkan keranjang dari JSON ke format bacaan
    let daftarBelanja = '';
    try {
      const keranjangArr = typeof p.keranjang === 'string' ? JSON.parse(p.keranjang) : p.keranjang;
      daftarBelanja = keranjangArr.map(item => 
        `<li>${item.nama_produk} <b>(${item.jumlah}x)</b> - Rp ${item.subtotal.toLocaleString('id-ID')}</li>`
      ).join('');
    } catch (err) {
      daftarBelanja = '<li><i>Gagal memuat detail keranjang</i></li>';
    }

    return `
      <div class="card" style="border-left: 5px solid var(--red); margin-bottom: 20px;">
        <h3 style="margin-top: 0;">👤 ${p.nama} <span style="font-size: 14px; color: gray;">(${p.hp})</span></h3>
        <p style="margin: 5px 0;"><strong>📅 Tgl Kirim:</strong> ${p.tanggal_kirim}</p>
        <p style="margin: 5px 0;"><strong>📍 Alamat:</strong> ${p.alamat}</p>
        <p style="margin: 5px 0;"><strong>📝 Catatan:</strong> ${p.catatan || '-'}</p>
        <hr style="margin: 10px 0; border: 0.5px solid #eee;">
        <p style="margin: 5px 0;"><strong>🛒 Rincian Belanja:</strong></p>
        <ul style="margin: 5px 0; padding-left: 20px;">
          ${daftarBelanja}
        </ul>
        <div style="background: #FFF0EE; padding: 10px; margin-top: 10px; border-radius: 5px;">
          <strong style="color: var(--red);">💰 Total Tagihan: Rp ${p.total_harga.toLocaleString('id-ID')}</strong>
        </div>
      </div>
    `;
  }).join('');
}

// Panggil fungsi muatPesanan() secara otomatis bersama dengan muatProduk()
muatPesanan();