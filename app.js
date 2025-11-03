// QRIS DINAMIS GENERATOR
const qrisBase =
  "00020101021126610014COM.GO-JEK.WWW01189360091430425684560210G0425684560303UMI51440014ID.CO.QRIS.WWW0215ID10254504507270303UMI5204866153033605802ID5912Ark Of Grace6005BOGOR61051614362070703A01630470DE";

function crc16(str) {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function generateDynamicQris(nominal) {
  const qrContainer = document.getElementById("qris-image-container");
  qrContainer.innerHTML = ""; 

  if (!nominal || nominal <= 0) {
    console.error("Nominal tidak valid untuk QRIS");
    return;
  }

  const nominalStr = String(Math.round(nominal)); 
  const amountTag = "54" + String(nominalStr.length).padStart(2, "0") + nominalStr;
  let qrisNoCRC = qrisBase + amountTag + "5802ID6304";
  const crc = crc16(qrisNoCRC);
  const finalQris = qrisNoCRC + crc;


  new QRious({
    element: qrContainer.appendChild(document.createElement("canvas")),
    value: finalQris,
    size: 250, 
    padding: 10, 
    background: 'white',
    foreground: 'black'
  });

  console.log("QRIS String Dibuat:", finalQris);
}

//END QRIS GENERATOR

document.addEventListener('DOMContentLoaded', () => {
    
    const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwElRxf4Qu5VjtBJt89B5nS1H_jlWRVTdpmPEe7Ikx7dX6dFwj93drwefBUCNeXsHW45Q/exec';
    
    const productListEl = document.getElementById('product-list');
    const cartIconButton = document.getElementById('cart-icon-button');
    const cartCountEl = document.getElementById('cart-count');
    const cartModal = document.getElementById('cart-modal');
    const closeModalButton = document.getElementById('close-modal-button');
    const modalCartItemsEl = document.getElementById('modal-cart-items');
    const modalCartTotalEl = document.getElementById('modal-cart-total');
    const customerNameInput = document.getElementById('customer-name');
    const customerPhoneInput = document.getElementById('customer-phone');
    const customerClassInput = document.getElementById('customer-class');
    const checkoutButton = document.getElementById('checkout-button');
    const productOptionsModal = document.getElementById('product-options-modal');
    const closeOptionsModalButton = document.getElementById('close-options-modal-button');
    const optionsProductName = document.getElementById('options-product-name');
    const productLevelSelect = document.getElementById('product-level');
    const productNotesInput = document.getElementById('product-notes');
    const addToCartOptionsButton = document.getElementById('add-to-cart-options-button');
    const alertModal = document.getElementById('alert-modal');
    const alertAmountEl = document.getElementById('alert-amount');
    const alertOkButton = document.getElementById('alert-ok-button');
    const qrisModal = document.getElementById('qris-modal');
    const closeQrisModalButton = document.getElementById('close-qris-modal-button');
    const qrisAmountEl = document.getElementById('qris-amount');
    const qrisOrderIdEl = document.getElementById('qris-order-id');
    const confirmPaymentModalButton = document.getElementById('confirm-payment-modal-button');
    const validationModal = document.getElementById('validation-modal');
    const closeValidationModalButton = document.getElementById('close-validation-modal-button');
    const validationMessageEl = document.getElementById('validation-message');
    const validationOkButton = document.getElementById('validation-ok-button');

    let products = [];
    let cart = [];
    let currentOrderData = null;

    function fetchProducts() {
        products = [
            {id: 1, name: 'Mie Gacoan', description: 'Mie, Ayam Cincang, Pangsit Goreng.', price: 15500, image_url: 'images/mie-gacoan.png', requiresOptions: true},
            {id: 2, name: 'Mie Hompimpa', description: 'Mie (Asin Gurih).', price: 15500, image_url: 'images/mie-hompimpa.png', requiresOptions: true},
            {id: 3, name: 'Mie Suit', description: 'Mie (Asin Gurih).', price: 15500, image_url: 'images/mie-suit.png', requiresOptions: false},
            {id: 4, name: 'Udang Keju', description: 'Dimsum Udang isi Keju (isi 3)', price: 15000, image_url: 'images/udang-keju.png', requiresOptions: false},
            {id: 5, name: 'Udang Rambutan', description: 'Dimsum Udang balut kulit pangsit (isi 3)', price: 15000, image_url: 'images/udang-rambutan.png', requiresOptions: false},
            {id: 6, name: 'Pangsit Goreng', description: 'Pangsit Goreng isi Ayam (isi 5)', price: 15000, image_url: 'images/pangsit-goreng.png', requiresOptions: false}
        ];
        renderProducts();
     }
    function renderProducts() {
        productListEl.innerHTML = '';
        products.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';
            let displayPrice = product.price;
            if (product.requiresOptions) { displayPrice = 15500; }
            card.innerHTML = `<img src="${product.image_url}" alt="${product.name}"><div class="product-info"><h3>${product.name}</h3><div class="price">${formatRupiah(displayPrice)}</div><button data-id="${product.id}">Tambah ke Keranjang</button></div>`;
            card.querySelector('button').addEventListener('click', () => handleProductClick(product.id));
            productListEl.appendChild(card);
        });
     }

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
            addToCart(productId, null, undefined); 
        }
     }
    addToCartOptionsButton.addEventListener('click', () => {
        const productId = parseInt(addToCartOptionsButton.dataset.id);
        const level = productLevelSelect.value;
        const notes = productNotesInput.value || " ";
        const options = { level: level, notes: notes };
        const highLevels = ['Lv 5', 'Lv 6', 'Lv 7', 'Lv 8'];
        let finalPrice = 15500; 
        if (highLevels.includes(level)) { finalPrice = 16500; }
        addToCart(productId, options, finalPrice); 
        productOptionsModal.style.display = 'none';
     });
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


    function addToCart(productId, options, priceOverride) {
        const product = { ...products.find(p => p.id === productId) }; 
        if (!product) return;
        const finalPrice = priceOverride !== undefined ? priceOverride : product.price;
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
        cart.push({ ...product, price: finalPrice, quantity: 1, options: options, uniqueCartId: uniqueCartId });
        cartModal.style.display = 'flex';
        renderCart();
     }
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
            let priceDisplay = formatRupiah(item.price); 
            if (item.options) { let notes = item.options.notes.trim() ? `, ${item.options.notes}` : ''; detailsHtml = `<div class="cart-item-details">${item.options.level}${notes}</div>`; }
            const itemRow = document.createElement('div');
            itemRow.className = 'cart-item-row';
            itemRow.innerHTML = `<img src="${item.image_url}" alt="${item.name}"><div class="cart-item-info"><b>${item.name}</b><span>${priceDisplay}</span>${detailsHtml}</div><div class="quantity-controls"><button class="quantity-down" data-id="${item.uniqueCartId}">-</button><input type="number" value="${item.quantity}" min="1" data-id="${item.uniqueCartId}"><button class="quantity-up" data-id="${item.uniqueCartId}">+</button></div><span class="item-subtotal"><b>${formatRupiah(item.price * item.quantity)}</b></span><button class="remove-item-button" data-id="${item.uniqueCartId}">&times;</button>`;
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

    checkoutButton.addEventListener('click', () => { 
        try {
            const customerName = customerNameInput.value.trim();
            const customerPhone = customerPhoneInput.value.trim();
            const customerClass = customerClassInput.value;
            let errorMessage = "";
            if (cart.length === 0) { errorMessage = 'Keranjang kamu masih kosong nihh.'; }
            else if (!customerName) { errorMessage = 'Tolong masukkan Nama Pemesan.'; }
            else if (!customerPhone) { errorMessage = 'Tolong masukkan No. Telepon / ID Line.'; }
            else if (!customerClass) { errorMessage = 'Tolong pilih Kelas Anda.'; }
            if (errorMessage) { showValidationError(errorMessage); return; }

            const itemsString = cart.map(item => { let detail = `${item.name} (x${item.quantity}) - @${formatRupiah(item.price)}`; if (item.options) { let notes = item.options.notes.trim() ? `, Catatan: ${item.options.notes}` : ''; detail += ` [${item.options.level}${notes}]`; } return detail; }).join('\n');
            const totalAsli = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            
            const kodeUnik = Math.floor(Math.random() * 99) + 1;
            const totalFinal = totalAsli + kodeUnik;
            const orderId = Math.random().toString(36).substring(2, 8).toUpperCase();

            const orderData = {
                nama: customerName,
                telepon: customerPhone,
                kelas: customerClass,
                itemsString: itemsString,
                totalFinal: totalFinal 
            };
            
            const successData = {
                customerName: customerName,
                itemsString: itemsString,
                orderId: orderId
            };
            localStorage.setItem('lastOrderData', JSON.stringify(successData));
            
            checkoutButton.disabled = true;
            checkoutButton.textContent = 'Memproses...';
            if (GOOGLE_SCRIPT_URL === 'PASTE_WEB_APP_URL_BARU_ANDA_DI_SINI') { throw new Error('URL Google Script belum diisi di file app.js!'); }
            
            fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'cors', 
                body: JSON.stringify(orderData),
                headers: { "Content-Type": "text/plain;charset=utf-8" }, 
            }).catch(err => {
                console.warn("Fetch failed (this is expected, ignoring):", err.message);
            });
            
            cartModal.style.display = 'none';
            cart = [];
            renderCart();
            customerNameInput.value = '';
            customerPhoneInput.value = '';
            customerClassInput.value = '';


            currentOrderData = { orderId: orderId, finalAmount: totalFinal };
            generateDynamicQris(totalFinal);
            alertAmountEl.textContent = formatRupiah(totalFinal);
            alertModal.style.display = 'flex';

        } catch (err) {
            showValidationError('Terjadi kesalahan lokal: ' + err.message);
            checkoutButton.disabled = false;
            checkoutButton.textContent = 'Proses Pesanan';
        }
    });

    confirmPaymentModalButton.addEventListener('click', () => {
        qrisModal.style.display = 'none';
        let successUrl = 'payment-success.html';
        window.location.href = successUrl;
    });

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