// 1. KONEKSI KE SUPABASE
const supabaseUrl = 'https://jqqdlngmusacrspjoyiy.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxcWRsbmdtdXNhY3JzcGpveWl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2Mjk0OTMsImV4cCI6MjA5NTIwNTQ5M30.ZuZuJhQ3l1_bFM02kHa8RmMH3trWS76ufXH5evUiY5Q'; 
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// 2. MODAL AWAL ARRAY PRODUK
let products = [];
let cart = {};

// 3. FUNGSI AMBIL DATA DARI DATABASE
async function muatProdukDariSupabase() {
  try {
    const { data, error } = await supabaseClient
      .from('produk')
      .select('*');

    if (error) throw error;

    // Mapping nama kolom database ke variabel card pembeli
    products = data.map(p => ({
      id: p.id,
      name: p.nama,
      cat: p.kategori,
      price: p.harga,
      desc: p.deskripsi,
      img: p.gambar_url || 'https://via.placeholder.com/250',
      unit: p.unit || 'kg',
      badge: p.badge || '',
      badgeClass: p.badge_class || ''
    }));

    // Cetak ke layar pembeli setelah data berhasil diambil
    renderProductGrid('product-grid', false);
    renderProductGrid('order-grid', true);

  } catch (error) {
    console.error('Gagal memuat produk:', error.message);
  }
}

function fmt(n) {
  return 'Rp ' + n.toLocaleString('id-ID');
}

function bgColor(cat) {
  return { sapi:'#FFF0EE', ayam:'#FFF8E8', kambing:'#F0F8F0', olahan:'#EEF0FF' }[cat] || '#FFF';
}

function renderProductGrid(containerId, showQty) {
  const g = document.getElementById(containerId);
  if (!g) return;
  g.innerHTML = '';
  products.forEach(p => {
    const qty = cart[p.id] || 0;
    if (showQty) {
      g.innerHTML += `
        <div class="order-card" data-cat="${p.cat}">
          <div class="order-emoji"><img src="${p.img}" width="50"></div>
          <div class="order-card-name">${p.name}</div>
          <div class="order-card-price">${fmt(p.price)} / ${p.unit}</div>
          <div class="qty-control">
            <button class="qty-btn" onclick="changeQty(${p.id}, -1)">−</button>
            <span class="qty-num" id="qty-${p.id}">${qty}</span>
            <button class="qty-btn" onclick="changeQty(${p.id}, 1)">+</button>
          </div>
        </div>`;
    } else {
      g.innerHTML += `
        <div class="product-card" data-cat="${p.cat}">
          <div class="product-img" style="background:${bgColor(p.cat)}">
            <img src="${p.img}" width="250" height="250" style="object-fit:contain;">
            ${p.badge ? `<span class="product-badge ${p.badgeClass}">${p.badge}</span>` : ''}
          </div>
          <div class="product-info">
            <div class="product-name">${p.name}</div>
            <div class="product-desc">${p.desc}</div>
            <div class="product-footer">
              <div>
                <div class="product-price">${fmt(p.price)}</div>
                <div class="product-unit">per ${p.unit}</div>
              </div>
              <button class="add-to-cart" onclick="addAndGoOrder(${p.id})">+ Pesan</button>
            </div>
          </div>
        </div>`;
    }
  });
}

function addAndGoOrder(id) {
  if (!cart[id]) cart[id] = 0;
  cart[id]++;
  updateCart();
  showPage('order');
}

function changeQty(id, delta) {
  if (!cart[id]) cart[id] = 0;
  cart[id] = Math.max(0, cart[id] + delta);
  const el = document.getElementById('qty-' + id);
  if (el) el.textContent = cart[id];
  updateCart();
}

function updateCart() {
  let total = 0, count = 0;
  const cartItems = [];
  products.forEach(p => {
    const qty = cart[p.id] || 0;
    if (qty > 0) {
      total += p.price * qty;
      count += qty;
      cartItems.push({ name: p.name, qty, price: p.price * qty, unit: p.unit });
    }
  });

  document.getElementById('cart-badge').textContent = count;

  const ci = document.getElementById('cart-items');
  const cs = document.getElementById('cart-summary');
  const cb = document.getElementById('checkout-btn');

  if (cartItems.length === 0) {
    ci.innerHTML = '<div class="cart-empty">Belum ada produk dipilih</div>';
    cs.style.display = 'none';
  } else {
    ci.innerHTML = cartItems.map(item =>
      `<div class="cart-item">
        <div><div class="cart-item-name">${item.name}</div><div class="cart-item-qty">${item.qty} ${item.unit}</div></div>
        <div style="display:flex;align-items:center;gap:8px">
          <div class="cart-item-price">${fmt(item.price)}</div>
        </div>
      </div>`
    ).join('');
    cs.style.display = 'block';

    const ongkir = 15000;
    document.getElementById('sum-sub').textContent = fmt(total);
    document.getElementById('sum-total').textContent = fmt(total + ongkir);
  }

  cb.disabled = (cartItems.length === 0);
}

function filterProduct(cat, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('#product-grid .product-card').forEach(c => {
    c.style.display = (cat === 'semua' || c.dataset.cat === cat) ? '' : 'none';
  });
}

// ==========================================
// FUNGSI CHECKOUT & WHATSAPP
// ==========================================
let linkWA = ''; 

function goToWA() {
  if (linkWA) {
    window.open(linkWA, '_blank');
  }
  closeModal(); 
}

async function checkout() {
  const nama = document.getElementById('nama').value.trim();
  const hp = document.getElementById('hp').value.trim();
  const tgl = document.getElementById('tgl').value;
  const alamat = document.getElementById('alamat').value.trim();
  
  // Ambil elemen catatan kalau ada di HTML
  const catatanEl = document.getElementById('catatan');
  const catatan = catatanEl ? catatanEl.value.trim() : '';

  if (!nama || !hp || !tgl || !alamat) {
    alert('⚠️ Harap lengkapi semua data pengiriman terlebih dahulu!');
    return;
  }

  let total_harga = 0;
  const itemKeranjang = [];

  for (const id in cart) {
    if (cart[id] > 0) {
      const p = products.find(prod => prod.id == id);
      if (p) {
        total_harga += p.price * cart[id];
        itemKeranjang.push({
          id_produk: p.id,
          nama_produk: p.name,
          jumlah: cart[id],
          harga_satuan: p.price,
          subtotal: p.price * cart[id]
        });
      }
    }
  }

  if (itemKeranjang.length === 0) {
    alert('⚠️ Keranjang belanja kamu masih kosong!');
    return;
  }

  const ongkir = 15000;
  total_harga += ongkir;

  try {
    const { data, error } = await supabaseClient
      .from('pesanan')
      .insert([
        {
          nama: nama,
          hp: hp,
          tanggal_kirim: tgl,
          alamat: alamat,
          catatan: catatan,
          keranjang: JSON.stringify(itemKeranjang),
          total_harga: total_harga
        }
      ]);

    if (error) throw error;

    // --- MERAKIT PESAN WHATSAPP ---
    const teksWA = `Halo Admin Bunda Raya Kitchen! 😁\nSaya ingin konfirmasi pesanan saya:\n\n*Nama:* ${nama}\n*No HP:* ${hp}\n*Tgl Kirim:* ${tgl}\n*Total Tagihan:* Rp ${total_harga.toLocaleString('id-ID')}\n\nMohon info untuk pembayarannya. Terima kasih!`;
    
    // UBAH 6287882339338 DENGAN NOMOR WA KAMU (Gunakan awalan 62)
    linkWA = `https://wa.me/+6287882339338?text=${encodeURIComponent(teksWA)}`;
    // ------------------------------

    document.getElementById('modal-sukses').classList.add('open');

  } catch (error) {
    console.error('Gagal mengirim pesanan:', error.message);
    alert('⚠️ Waduh, gagal mengirim pesanan ke server: ' + error.message);
  }
}

function closeModal() {
  document.getElementById('modal-sukses').classList.remove('open');
  cart = {};
  updateCart();
  document.getElementById('nama').value = '';
  document.getElementById('hp').value = '';
  document.getElementById('tgl').value = '';
  document.getElementById('alamat').value = '';
  if(document.getElementById('catatan')) document.getElementById('catatan').value = '';
  renderProductGrid('order-grid', true);
  showPage('home');
}

function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const targetPage = document.getElementById('page-' + name);
  if (targetPage) targetPage.classList.add('active');

  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
  const targetNav = document.getElementById('nav-' + name);
  if (targetNav) targetNav.classList.add('active');

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function scrollToCart() {
  setTimeout(() => {
    const el = document.getElementById('cart-panel');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

// Set min date to today
if (document.getElementById('tgl')) {
  document.getElementById('tgl').min = new Date().toISOString().split('T')[0];
}

// Jalankan fungsi penarik data otomatis saat web dibuka
muatProdukDariSupabase();