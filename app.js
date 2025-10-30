// File: public/app.js
// Versi ini menambahkan Modal Validasi Error

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

    // --- Elemen Modal Validasi (BARU) ---
    const validationModal = document.getElementById('validation-modal');
    const closeValidationModalButton = document.getElementById('close-validation-modal-button');
    const validationMessageEl = document.getElementById('validation-message');
    const validationOkButton = document.getElementById('validation-ok-button');


    // --- Variabel Global ---
    let products = [];
    let cart = [];
    let currentOrderData = null;

    // --- 1. Ambil dan Tampilkan Produk ---
    // (Tidak berubah)
    function fetchProducts() { /* ... kode sama ... */
        products = [
            {id: 1, name: 'Mie Gacoan', description: 'Mie, Ayam Cincang, Pangsit Goreng.', price: 18000, image_url: 'images/mie-gacoan.png', requiresOptions: true},
            {id: 2, name: 'Mie Hompimpa', description: 'Mie (Asin Gurih).', price: 18000, image_url: 'images/mie-hompimpa.png', requiresOptions: true},
            {id: 3, name: 'Mie Suit', description: 'Mie (Asin Gurih).', price: 18000, image_url: 'images/mie-suit.png', requiresOptions: true},
            {id: 4, name: 'Udang Keju', description: 'Dimsum Udang isi Keju (isi 3)', price: 17000, image_url: 'images/udang-keju.png', requiresOptions: false},
            {id: 5, name: 'Udang Rambutan', description: 'Dimsum Udang balut kulit pangsit (isi 3)', price: 17000, image_url: 'images/udang-rambutan.png', requiresOptions: false},
            {id: 6, name: 'Pangsit Goreng', description: 'Pangsit Goreng isi Ayam (isi 5)', price: 14000, image_url: 'images/pangsit-goreng.png', requiresOptions: false}
        ];
        renderProducts();
     }
    // (Tidak berubah)
    function renderProducts() { /* ... kode sama ... */
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
    // (Tidak berubah, kecuali penambahan listener modal validasi)
    cartIconButton.addEventListener('click', () => { cartModal.style.display = 'flex'; renderCart(); });
    closeModalButton.addEventListener('click', () => { cartModal.style.display = 'none'; });
    cartModal.addEventListener('click', (event) => { if (event.target === cartModal) cartModal.style.display = 'none'; });
    closeOptionsModalButton.addEventListener('click', () => { productOptionsModal.style.display = 'none'; });
    productOptionsModal.addEventListener('click', (event) => { if (event.target === productOptionsModal) productOptionsModal.style.display = 'none'; });
    function handleProductClick(productId) { /* ... kode sama ... */
        const product = products.find(p => p.id === productId);
        if (!product) return;
        if (product.requiresOptions) {
            optionsProductName.textContent = product.name;
            productLevelSelect.value = "Lv 1";
            productNotesInput.value = "";
            addToCartOptionsButton.dataset.id = productId;
            productOptionsModal.style.display = 'flex';
        } else {
            addToCart(productId, null);
        }
     }
    addToCartOptionsButton.addEventListener('click', () => { /* ... kode sama ... */
        const productId = parseInt(addToCartOptionsButton.dataset.id);
        const options = { level: productLevelSelect.value, notes: productNotesInput.value || " " };
        addToCart(productId, options);
        productOptionsModal.style.display = 'none';
     });
    alertOkButton.addEventListener('click', () => { /* ... kode sama ... */
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

    // --- Listener Modal Validasi (BARU) ---
    closeValidationModalButton.addEventListener('click', () => { validationModal.style.display = 'none'; });
    validationOkButton.addEventListener('click', () => { validationModal.style.display = 'none'; });
    validationModal.addEventListener('click', (event) => { if (event.target === validationModal) validationModal.style.display = 'none'; });

    // --- 3. Logika Keranjang (Cart) ---
    // (Tidak berubah)
    function addToCart(productId, options) { /* ... kode sama ... */
        const product = products.find(p => p.id === productId);
        if (!product) return;
        const uniqueCartId = Date.now().toString();
        cart.push({ ...product, quantity: 1, options: options, uniqueCartId: uniqueCartId });
        cartModal.style.display = 'flex';
        renderCart();
     }
    function updateQuantity(uniqueCartId, newQuantity) { /* ... kode sama ... */
        const item = cart.find(i => i.uniqueCartId === uniqueCartId);
        if (item) item.quantity = newQuantity;
        renderCart();
     }
    function removeFromCart(uniqueCartId) { /* ... kode sama ... */
        cart = cart.filter(i => i.uniqueCartId !== uniqueCartId);
        renderCart();
     }
    function renderCart() { /* ... kode sama ... */
        modalCartItemsEl.innerHTML = '';
        let total = 0;
        if (cart.length === 0) { modalCartItemsEl.innerHTML = '<p style="text-align: center; padding: 20px 0;">Keranjang Anda kosong.</p>'; }
        cart.forEach(item => {
            let detailsHtml = '';
            if (item.options) { let notes = item.options.notes.trim() ? `, ${item.options.notes}` : ''; detailsHtml = `<div class="cart-item-details">${item.options.level}${notes}</div>`; }
            const itemRow = document.createElement('div');
            itemRow.className = 'cart-item-row';
            itemRow.innerHTML = `<img src="${item.image_url}" alt="${item.name}"><div class="cart-item-info"><b>${item.name}</b><span>${formatRupiah(item.price)}</span>${detailsHtml}</div><div class="quantity-controls"><button class="quantity-down" data-id="${item.uniqueCartId}">-</button><input type="number" value="${item.quantity}" min="1" data-id="${item.uniqueCartId}"><button class="quantity-up" data-id="${item.uniqueCartId}">+</button></div><span class="item-subtotal"><b>${formatRupiah(item.price * item.quantity)}</b></span><button class="remove-item-button" data-id="${item.uniqueCartId}">&times;</button>`;
            modalCartItemsEl.appendChild(itemRow);
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
        const customerName = customerNameInput.value.trim(); // Trim spasi
        const customerPhone = customerPhoneInput.value.trim();
        const customerClass = customerClassInput.value; // Dropdown tidak perlu trim

        // --- VALIDASI DI SINI ---
        let errorMessage = "";
        if (cart.length === 0) {
            errorMessage = 'Keranjang masih kosong!';
        } else if (!customerName) {
            errorMessage = 'Nama Pemesan belum diisi';
        } else if (!customerPhone) {
            errorMessage = 'No telp/ID Line belum diisi';
        } else if (!customerClass) {
            errorMessage = 'Kelas Belum diisi';
        }

        if (errorMessage) {
            showValidationError(errorMessage);
            return; // Hentikan proses checkout
        }
        // --- AKHIR VALIDASI ---

        const itemsString = cart.map(item => { let detail = `${item.name} (x${item.quantity})`; if (item.options) { let notes = item.options.notes.trim() ? `, Catatan: ${item.options.notes}` : ''; detail += ` [${item.options.level}${notes}]`; } return detail; }).join('; \n');
        const totalAsli = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const orderData = { nama: customerName, telepon: customerPhone, kelas: customerClass, itemsString: itemsString, totalAsli: totalAsli };

        try {
            checkoutButton.disabled = true;
            checkoutButton.textContent = 'Memproses...';
            if (GOOGLE_SCRIPT_URL === 'PASTE_WEB_APP_URL_BARU_ANDA_DI_SINI') { throw new Error('URL Google Script belum diisi di file app.js!'); }
            const response = await fetch(GOOGLE_SCRIPT_URL, { method: 'POST', body: JSON.stringify(orderData), headers: { "Content-Type": "text/plain;charset=utf-8" }, });
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
            showValidationError('Terjadi kesalahan: ' + err.message); // Tampilkan error di modal validasi
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