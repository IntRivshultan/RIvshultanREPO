// 1. KONEKSI KE SUPABASE
const supabaseUrl = 'https://jqqdlngmusacrspjoyiy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxcWRsbmdtdXNhY3JzcGpveWl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2Mjk0OTMsImV4cCI6MjA5NTIwNTQ5M30.ZuZuJhQ3l1_bFM02kHa8RmMH3trWS76ufXH5evUiY5Q';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// 2. HELPERS
function fmt(n) {
  return 'Rp ' + Number(n).toLocaleString('id-ID');
}
function catClass(cat) {
  const map = { sapi: 'cat-sapi', ayam: 'cat-ayam', 'sliced beef': 'cat-sapi', olahan: 'cat-olahan' };
  return map[cat] || 'cat-default';
}

// 3. MUAT PRODUK
async function muatProduk() {
  const listDiv = document.getElementById('list-produk');
  listDiv.innerHTML = `
    <div class="loading-skeleton">
      <div class="skeleton-box"></div>
      <div class="skeleton-box"></div>
      <div class="skeleton-box"></div>
    </div>`;

  const { data: semuaProduk, error } = await supabaseClient
    .from('produk').select('*').order('id', { ascending: true });

  if (error) {
    listDiv.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><p>Gagal memuat data: ${error.message}</p></div>`;
    return;
  }

  // Update stats
  document.getElementById('stat-total-produk').textContent = semuaProduk.length;
  const kategoriUnik = [...new Set(semuaProduk.map(p => p.kategori))].filter(Boolean);
  document.getElementById('stat-kategori').textContent = kategoriUnik.length;
  document.getElementById('produk-count-label').textContent = `(${semuaProduk.length} produk)`;

  if (semuaProduk.length === 0) {
    listDiv.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🛒</div>
        <p>Belum ada produk di etalase.<br>Yuk tambah produk pertama!</p>
      </div>`;
    return;
  }

  listDiv.innerHTML = `<div class="produk-grid">` + semuaProduk.map(p => `
    <div class="produk-item">
      <div class="produk-img-thumb">
        ${p.gambar_url
          ? `<img src="${p.gambar_url}" alt="${p.nama}" onerror="this.parentNode.innerHTML='<span class=no-img>🥩</span>'">`
          : `<span class="no-img">🥩</span>`
        }
      </div>
      <div class="produk-info">
        <div class="produk-name" title="${p.nama}">${p.nama}</div>
        <span class="produk-cat ${catClass(p.kategori)}">${p.kategori || 'lainnya'}</span>
        <div class="produk-price">${fmt(p.harga)}</div>
        <div class="produk-actions">
          <button class="btn btn-red btn-sm" onclick="window.__openModalHapus(${p.id}, '${p.nama.replace(/'/g, "\\'")}')">🗑️ Hapus</button>
        </div>
      </div>
    </div>
  `).join('') + `</div>`;
}

// 4. TAMBAH PRODUK
async function tambahProduk() {
  const nama = document.getElementById('nama').value.trim();
  const kategori = document.getElementById('kategori').value.trim().toLowerCase();
  const harga = document.getElementById('harga').value;
  const deskripsi = document.getElementById('deskripsi').value.trim();
  const gambar_url = document.getElementById('gambar_url').value.trim();

  if (!nama || !kategori || !harga) {
    window.__showToast('Nama, Kategori, dan Harga wajib diisi!', 'warning');
    return;
  }

  const { error } = await supabaseClient.from('produk').insert([
    { nama, kategori, harga: parseInt(harga), deskripsi, gambar_url }
  ]);

  if (error) {
    window.__showToast('Gagal menambah produk: ' + error.message, 'error');
  } else {
    window.__showToast(`"${nama}" berhasil ditambahkan ke etalase! 🎉`, 'success');
    ['nama','harga','deskripsi','gambar_url'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('kategori').value = '';
    muatProduk();
  }
}

// 5. HAPUS PRODUK
async function hapusProduk(id) {
  const { error } = await supabaseClient.from('produk').delete().eq('id', id);
  if (error) {
    window.__showToast('Gagal menghapus produk: ' + error.message, 'error');
  } else {
    window.__showToast('Produk berhasil dihapus.', 'success');
    muatProduk();
  }
}

// 6. MUAT PESANAN
async function muatPesanan() {
  const listDiv = document.getElementById('list-pesanan');
  listDiv.innerHTML = `
    <div class="loading-skeleton">
      <div class="skeleton-box" style="height:160px;"></div>
      <div class="skeleton-box" style="height:160px;"></div>
    </div>`;

  const { data: semuaPesanan, error } = await supabaseClient
    .from('pesanan').select('*').order('id', { ascending: false });

  if (error) {
    listDiv.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><p>Gagal memuat pesanan: ${error.message}</p></div>`;
    return;
  }

  // Update stats
  const jumlah = semuaPesanan ? semuaPesanan.length : 0;
  document.getElementById('stat-total-pesanan').textContent = jumlah;
  document.getElementById('pesanan-count').textContent = jumlah;
  document.getElementById('pesanan-count-label').textContent = `(${jumlah} pesanan)`;

  const totalOmset = semuaPesanan ? semuaPesanan.reduce((sum, p) => sum + (p.total_harga || 0), 0) : 0;
  document.getElementById('stat-total-omset').textContent = fmt(totalOmset);

  if (!semuaPesanan || semuaPesanan.length === 0) {
    listDiv.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <p>Belum ada pesanan masuk hari ini.</p>
      </div>`;
    return;
  }

  listDiv.innerHTML = `<div class="pesanan-list">` + semuaPesanan.map(p => {
    let daftarItems = '';
    try {
      const keranjangArr = typeof p.keranjang === 'string' ? JSON.parse(p.keranjang) : p.keranjang;
      daftarItems = keranjangArr.map(item => `
        <div class="pesanan-item-row">
          <span>${item.nama_produk} <span class="pesanan-item-qty">(${item.jumlah}x)</span></span>
          <span class="pesanan-item-subtotal">${fmt(item.subtotal)}</span>
        </div>
      `).join('');
    } catch (err) {
      daftarItems = `<div class="pesanan-item-row"><span>Gagal memuat detail</span></div>`;
    }

    return `
      <div class="pesanan-card">
        <div class="pesanan-header">
          <div>
            <div class="pesanan-customer">👤 ${p.nama}</div>
            <div class="pesanan-hp">📱 ${p.hp}</div>
          </div>
          <div class="pesanan-meta">
            <span class="meta-chip">📅 ${p.tanggal_kirim}</span>
            <span class="meta-chip">🆔 #${p.id}</span>
          </div>
        </div>
        <div class="pesanan-body">
          <div class="pesanan-items">${daftarItems}</div>
          <div class="pesanan-total-box">
            <div class="pesanan-total-label">Total Tagihan</div>
            <div class="pesanan-total-val">${fmt(p.total_harga)}</div>
          </div>
        </div>
        <div class="pesanan-footer">
          <div class="pesanan-alamat">📍 <span>${p.alamat}</span></div>
          ${p.catatan ? `<div class="pesanan-catatan">📝 Catatan: ${p.catatan}</div>` : ''}
        </div>
      </div>
    `;
  }).join('') + `</div>`;
}

// 7. INIT
muatProduk();
muatPesanan();
