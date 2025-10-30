// File: public/app.js
// Versi ini menerapkan HARGA DINAMIS berdasarkan level mie

document.addEventListener('DOMContentLoaded', () => {
    
    // =================================================================
    const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwElRxf4Qu5VjtBJt89B5nS1H_jlWRVTdpmPEe7Ikx7dX6dFwj93drwefBUCNeXsHW45Q/exec';
    // =================================================================

    // --- Ambil Elemen DOM ---
    const productListEl = document.getElementById('product-list');

    // --- Elemen Modal Keranjang ---
    const cartIconButton = document.getElementById('cart-icon-button');
    const cartCountEl = document.getElementById('cart-count');
    const cartModal = document.getElementById('cart-modal');
    const closeModalButton = document.getElementById('close-modal-button');
    const modalCartItemsEl = document.getElementById('modal-cart-items');
    const modalCartTotalEl = document.getElementById('modal-cart-total');

    // --- Elemen Form Checkout ---
    const customerNameInput = document.getElementById('customer-name');
    const customerPhoneInput = document.getElementById('customer-phone');
    const customerClassInput = document.getElementById('customer-class');
    const checkoutButton = document.getElementById('checkout-button');

    // --- Elemen Modal Opsi Produk ---
    const productOptionsModal = document.getElementById('product-options-modal');
    const closeOptionsModalButton = document.getElementById('close-options-modal-button');
    const optionsProductName = document.getElementById('options-product-name');
    const productLevelSelect = document.getElementById('product-level');
    const productNotesInput = document.getElementById('product-notes');
    const addToCartOptionsButton = document.getElementById('add-to-cart-options-button');

    // --- Elemen Modal Alert Pembayaran ---
    const alertModal = document.getElementById('alert-modal');
    const alertAmountEl = document.getElementById('alert-amount');
    const alertOkButton = document.getElementById('alert-ok-button');

    // --- Elemen Modal QRIS ---
    const qrisModal = document.getElementById('qris-modal');
    const closeQrisModalButton = document.getElementById('close-qris-modal-button');
    const qrisAmountEl = document.getElementById('qris-amount');
    const qrisOrderIdEl = document.getElementById('qris-order-id');
    const confirmPaymentModalButton = document.getElementById('confirm-payment-modal-button');

    // --- Elemen Modal Validasi ---
    const validationModal = document.getElementById('validation-modal');
    const closeValidationModalButton = document.getElementById('close-validation-modal-button');
    const validationMessageEl = document.getElementById('validation-message');
    const validationOkButton = document.getElementById('validation-ok-button');


    // --- Variabel Global ---
    let products = [];
    let cart = [];
    let currentOrderData = null;

    // --- 1. Ambil dan Tampilkan Produk ---
    function fetchProducts() {
        
        // --- PERUBAHAN HARGA DASAR DI SINI ---
        products = [
            // Harga Mie Gacoan adalah harga level rendah (Lv 0-4)
            {id: 1, name: 'Mie Gacoan', description: 'Mie, Ayam Cincang, Pangsit Goreng.', price: 15500, image_url: 'images/mie-gacoan.png', requiresOptions: true},
            // Harga Mie Hompimpa (dianggap Lv 0)
            {id: 2, name: 'Mie Hompimpa', description: 'Mie (Asin Gurih).', price: 15500, image_url: 'images/mie-hompimpa.png', requiresOptions: true},
            {id: 3, name: 'Mie Suit', description: 'Mie (Asin Gurih).', price: 15500, image_url: 'images/mie-suit.png', requiresOptions: false},
            // Harga Dimsum
            {id: 4, name: 'Udang Keju', description: 'Dimsum Udang isi Keju (isi 3)', price: 15000, image_url: 'images/udang-keju.png', requiresOptions: false},
            {id: 5, name: 'Udang Rambutan', description: 'Dimsum Udang balut kulit pangsit (isi 3)', price: 15000, image_url: 'images/udang-rambutan.png', requiresOptions: false},
            {id: 6, name: 'Pangsit Goreng', description: 'Pangsit Goreng isi Ayam (isi 5)', price: 15000, image_url: 'images/pangsit-goreng.png', requiresOptions: false}
        ];
        // --- AKHIR PERUBAHAN HARGA DASAR ---
        
        renderProducts();
     }
    function renderProducts() {
        productListEl.innerHTML = '';
        products.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `<img src="${product.image_url}" alt="${product.name}"><div class="product-info"><h3>${product.name}</h3><div class="price">${formatRupiah(product.price)}</div><button data-id="${product.id}">Tambah ke Keranjang</button></div>`;
            card.querySelector('button').addEventListener('click', () => handleProductClick(product.id));
            productListEl.appendChild(card);
        });
     }

    // --- 2. Logika Modal ---
    cartIconButton.addEventListener('click', () => { cartModal.style.display = 'flex'; renderCart(); });
    closeModalButton.addEventListener('click', () => { cartModal.style.display = 'none'; });
    cartModal.addEventListener('click', (event) => { if (event.target === cartModal) cartModal.style.display = 'none'; });
    closeOptionsModalButton.addEventListener('click', () => { productOptionsModal.style.display = 'none'; });
    productOptionsModal.addEventListener('click', (event) => { if (event.target === productOptionsModal) productOptionsModal.style.display = 'none'; });
    
    function handleProductClick(productId) {
        const product = products.find(p => p.id === productId);
        if (!product) return;
        if (product.requiresOptions) {
            optionsProductName.textContent = product.name;
            productLevelSelect.value = "Lv 1";
            productNotesInput.value = "";
            addToCartOptionsButton.dataset.id = productId;
            productOptionsModal.style.display = 'flex';
        } else {
            // Untuk Dimsum & Mie Hompimpa, 'priceOverride' tidak diisi,
            // jadi akan pakai harga dasar dari 'products' (15000 atau 15500)
            addToCart(productId, null, undefined); 
        }
     }
    
    // --- PERUBAHAN LOGIKA HARGA DI SINI ---
    addToCartOptionsButton.addEventListener('click', () => {
        const productId = parseInt(addToCartOptionsButton.dataset.id);
        const level = productLevelSelect.value;
        const notes = productNotesInput.value || " ";
        
        const options = {
            level: level,
            notes: notes
        };

        // Tentukan harga berdasarkan level
        const highLevels = ['Lv 5', 'Lv 6', 'Lv 7', 'Lv 8'];
        let finalPrice = 15500; // Harga dasar untuk Lv 0-4

        if (highLevels.includes(level)) {
            finalPrice = 16500; // Harga untuk Lv 5-8
        }
        
        // Kirim harga yang sudah dihitung ke fungsi addToCart
        addToCart(productId, options, finalPrice); 
        
        productOptionsModal.style.display = 'none';
     });
    // --- AKHIR PERUBAHAN ---
    
    alertOkButton.addEventListener('click', () => {
        alertModal.style.display = 'none';
        if (currentOrderData) {
            qrisAmountEl.textContent = formatRupiah(currentOrderData.finalAmount);
            qrisOrderIdEl.textContent = currentOrderData.orderId;
            qrisModal.style.display = 'flex';
        }
        checkoutButton.disabled = false;
        checkoutButton.textContent = 'Proses Pesanan';
     });
    closeQrisModalButton.addEventListener('click', () => { qrisModal.style.display = 'none'; });
    qrisModal.addEventListener('click', (event) => { if (event.target === qrisModal) qrisModal.style.display = 'none'; });

    closeValidationModalButton.addEventListener('click', () => { validationModal.style.display = 'none'; });
    validationOkButton.addEventListener('click', () => { validationModal.style.display = 'none'; });
    validationModal.addEventListener('click', (event) => { if (event.target === validationModal) validationModal.style.display = 'none'; });

    // --- 3. Logika Keranjang (Cart) ---
    
    // --- FUNGSI INI DIMODIFIKASI ---
    function addToCart(productId, options, priceOverride) {
        // 'priceOverride' adalah harga final yg dikirim (misal 16500)
        // Jika 'priceOverride' tidak ada (undefined), ia akan pakai harga dari 'products'
        
        const product = { ...products.find(p => p.id === productId) }; // Clone product
        if (!product) return;

        // Tentukan harga final untuk item ini
        // Jika priceOverride ada, pakai itu. Jika tidak, pakai harga dasar produk.
        const finalPrice = priceOverride !== undefined ? priceOverride : product.price;

        // Cek item yang ada (HANYA untuk yg tidak butuh opsi)
        if (!product.requiresOptions) {
            const existingItem = cart.find(item => item.id === productId);
            if (existingItem) {
                updateQuantity(existingItem.uniqueCartId, existingItem.quantity + 1);
                cartModal.style.display = 'flex';
                renderCart();
                return; 
            }
        }
        
        const uniqueCartId = Date.now().toString();
        cart.push({ 
            ...product,
            price: finalPrice, // Simpan harga final di keranjang
            quantity: 1, 
            options: options, 
            uniqueCartId: uniqueCartId 
        });
        
        cartModal.style.display = 'flex';
        renderCart();
     }
    // --- AKHIR PERUBAHAN ---

    function updateQuantity(uniqueCartId, newQuantity) {
        const item = cart.find(i => i.uniqueCartId === uniqueCartId);
        if (item) item.quantity = newQuantity;
        renderCart();
     }
    function removeFromCart(uniqueCartId) {
        cart = cart.filter(i => i.uniqueCartId !== uniqueCartId);
        renderCart();
     }
    function renderCart() {
        modalCartItemsEl.innerHTML = '';
        let total = 0;
        if (cart.length === 0) { modalCartItemsEl.innerHTML = '<p style="text-align: center; padding: 20px 0;">Keranjang Anda kosong.</p>'; }
        
        cart.forEach(item => {
            let detailsHtml = '';
            // Tampilkan harga per item (yang mungkin beda-beda)
            let priceDisplay = formatRupiah(item.price); 

            if (item.options) { 
                let notes = item.options.notes.trim() ? `, ${item.options.notes}` : ''; 
                detailsHtml = `<div class="cart-item-details">${item.options.level}${notes}</div>`; 
            }

            const itemRow = document.createElement('div');
            itemRow.className = 'cart-item-row';
            itemRow.innerHTML = `<img src="${item.image_url}" alt="${item.name}"><div class="cart-item-info"><b>${item.name}</b><span>${priceDisplay}</span>${detailsHtml}</div><div class="quantity-controls"><button class="quantity-down" data-id="${item.uniqueCartId}">-</button><input type="number" value="${item.quantity}" min="1" data-id="${item.uniqueCartId}"><button class="quantity-up" data-id="${item.uniqueCartId}">+</button></div><span class="item-subtotal"><b>${formatRupiah(item.price * item.quantity)}</b></span><button class="remove-item-button" data-id="${item.uniqueCartId}">&times;</button>`;
            modalCartItemsEl.appendChild(itemRow);
            
            // Kalkulasi total berdasarkan harga item di keranjang
            total += item.price * item.quantity;
        });
        
        modalCartTotalEl.textContent = formatRupiah(total);
        cartCountEl.textContent = cart.length;
        modalCartItemsEl.querySelectorAll('.quantity-down').forEach(btn => btn.addEventListener('click', () => { const id = btn.dataset.id; const item = cart.find(i => i.uniqueCartId === id); if (item.quantity > 1) updateQuantity(id, item.quantity - 1); else removeFromCart(id); }));
        modalCartItemsEl.querySelectorAll('.quantity-up').forEach(btn => btn.addEventListener('click', () => { const id = btn.dataset.id; updateQuantity(id, cart.find(i => i.uniqueCartId === id).quantity + 1); }));
        modalCartItemsEl.querySelectorAll('.quantity-controls input').forEach(input => input.addEventListener('change', (e) => { const id = input.dataset.id; let newQty = parseInt(e.target.value); if (isNaN(newQty) || newQty < 1) newQty = 1; updateQuantity(id, newQty); }));
        modalCartItemsEl.querySelectorAll('.remove-item-button').forEach(btn => btn.addEventListener('click', () => removeFromCart(btn.dataset.id)));
     }

    // --- 4. Proses Checkout (Kirim ke Google Sheet) ---
    checkoutButton.addEventListener('click', async () => {
        const customerName = customerNameInput.value.trim();
        const customerPhone = customerPhoneInput.value.trim();
        const customerClass = customerClassInput.value;

        let errorMessage = "";
        if (cart.length === 0) { errorMessage = 'Keranjang Anda masih kosong.'; }
        else if (!customerName) { errorMessage = 'Mohon masukkan Nama Pemesan.'; }
        else if (!customerPhone) { errorMessage = 'Mohon masukkan No. Telepon / ID Line.'; }
        else if (!customerClass) { errorMessage = 'Mohon pilih Kelas Anda.'; }

        if (errorMessage) {
            showValidationError(errorMessage);
            return;
        }

        // --- PERUBAHAN DETAIL PESANAN ---
        const itemsString = cart.map(item => { 
            let detail = `${item.name} (x${item.quantity}) - @${formatRupiah(item.price)}`; // Tampilkan harga per item
            if (item.options) { 
                let notes = item.options.notes.trim() ? `, Catatan: ${item.options.notes}` : ''; 
                detail += ` [${item.options.level}${notes}]`; 
            } 
            return detail; 
        }).join('; \n');
        
        // Total asli dihitung dari harga final di keranjang
        const totalAsli = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        // --- AKHIR PERUBAHAN ---
        
        const orderData = { nama: customerName, telepon: customerPhone, kelas: customerClass, itemsString: itemsString, totalAsli: totalAsli };

        try {
            checkoutButton.disabled = true;
            checkoutButton.textContent = 'Memproses...';
            if (GOOGLE_SCRIPT_URL === 'PASTE_WEB_APP_URL_BARU_ANDA_DI_SINI') { throw new Error('URL Google Script belum diisi di file app.js!'); }
            const response = await fetch(GOOGLE_SCRIPT_URL, { method: 'POST', body: JSON.stringify(orderData), headers: { "Content-Type": "text-plain;charset=utf-8" }, });
            if (!response.ok) throw new Error('Gagal menghubungi server.');
            const data = await response.json();
            if (data.status !== "success") throw new Error(data.message);

            // --- SUKSES ---
            cartModal.style.display = 'none';
            cart = [];
            renderCart();
            customerNameInput.value = '';
            customerPhoneInput.value = '';
            customerClassInput.value = '';

            currentOrderData = { orderId: data.orderId, finalAmount: data.finalAmount };
            alertAmountEl.textContent = formatRupiah(data.finalAmount);
            alertModal.style.display = 'flex';

        } catch (err) {
            showValidationError('Terjadi kesalahan: ' + err.message);
            checkoutButton.disabled = false;
            checkoutButton.textContent = 'Proses Pesanan';
        }
    });

    // --- 5. Listener untuk Tombol "Saya Sudah Bayar" DI DALAM MODAL QRIS ---
    confirmPaymentModalButton.addEventListener('click', () => {
        qrisModal.style.display = 'none';
        let successUrl = 'payment-success.html';
        window.location.href = successUrl;
    });

    // --- 6. Fungsi Baru: Menampilkan Modal Validasi Error ---
    function showValidationError(message) {
        validationMessageEl.textContent = message;
        validationModal.style.display = 'flex';
    }

    // --- Helper ---
    function formatRupiah(number) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(number);
    }

    // --- Mulai aplikasi ---
    fetchProducts();
    cartCountEl.textContent = '0';
});