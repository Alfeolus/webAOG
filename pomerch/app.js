// File: pomerch/app.js
// Versi ini menambahkan TOAST NOTIFICATION

function renderQrCode(qrisString) {
  const qrContainer = document.getElementById("qris-image-container");
  qrContainer.innerHTML = "";
  if (!qrisString) {
    console.error("String QRIS kosong, tidak bisa menggambar.");
    qrContainer.innerHTML = "<p>Error: Gagal memuat QRIS.</p>";
    return;
  }
  new QRious({
    element: qrContainer.appendChild(document.createElement("canvas")),
    value: qrisString,
    size: 250, padding: 10, background: 'white', foreground: 'black'
  });
}

// ==========================================================
// === FUNGSI BARU UNTUK TOAST NOTIFICATION ===
// ==========================================================
let toastTimer; // Variabel untuk menyimpan timer
function showToast(message) {
    const toast = document.getElementById('toast-notification');
    toast.innerText = message;
    toast.classList.add('show');

    // Hapus timer sebelumnya jika ada
    if (toastTimer) {
        clearTimeout(toastTimer);
    }

    // Buat timer baru untuk menyembunyikan toast
    toastTimer = setTimeout(() => {
        toast.classList.remove('show');
    }, 3000); // Sembunyikan setelah 3 detik
}
// ==========================================================


document.addEventListener('DOMContentLoaded', () => {
    
    const BACKEND_API_URL = '/api/submitmerch';
    
    // === Ambil Elemen DOM ===
    const productListEl = document.getElementById('product-list');
    const multiStepModal = document.getElementById('multi-step-modal');
    const modalTitle = document.getElementById('modal-title');
    const closeModalButton = document.getElementById('close-modal-button');
    const backModalButton = document.getElementById('modal-back-button');
    const step1 = document.querySelector('.modal-step[data-step="1"]');
    const step1Title = document.getElementById('step-1-title');
    const designGridContainer = document.getElementById('design-grid-container');
    const step2 = document.querySelector('.modal-step[data-step="2"]');
    const step2Title = document.getElementById('step-2-title');
    const sizeOptionsContainer = document.getElementById('size-options-container');
    const sizeSelector = document.getElementById('size-selector');
    const modelOptionsContainer = document.getElementById('model-options-container');
    const modelSelector = document.getElementById('model-selector');
    const bundleOptionsContainer = document.getElementById('bundle-options-container');
    const addToCartButton = document.getElementById('add-to-cart-button');
    
    // (Elemen helper dan catatan sudah dihapus)

    const cartIconButton = document.getElementById('cart-icon-button');
    const cartCountEl = document.getElementById('cart-count');
    const cartModal = document.getElementById('cart-modal');
    const closeCartModalButton = document.querySelector('#cart-modal .close-modal-button');
    const modalCartItemsEl = document.getElementById('modal-cart-items');
    const modalCartTotalEl = document.getElementById('modal-cart-total');
    const customerNameInput = document.getElementById('customer-name');
    const customerPhoneInput = document.getElementById('customer-phone');
    const customerClassInput = document.getElementById('customer-class');
    const checkoutButton = document.getElementById('checkout-button');
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

    let cart = [];
    let currentOrderData = null; 
    let currentSelection = {
        product: null,
        basePrice: 0,
        type: 'satuan',
        design: null,
        size: null, 
        bundleOptions: [] 
    };

    // === Database Produk ===
    const KAOS_DESIGNS = Array.from({length: 14}, (_, i) => `Desain ${i + 1}`);
    const KAOS_SIZES = ["S", "M", "L", "XL", "XXL", "Lengan Panjang (+Rp 10rb)"]; 
    const JERSEY_DESIGNS = Array.from({length: 4}, (_, i) => `Desain ${i + 1}`);
    const JERSEY_SIZES = ["S", "M", "L", "XL", "XXL", "Lengan Panjang (+Rp 10rb)"]; 
    const STIKER_MODELS = ["Stiker A", "Stiker B", "Stiker C"];
    const KEYCHAIN_MODELS = ["Model A", "Model B", "Model C", "Model D"]; 

    const productDatabase = {
        "Kaos": {
            basePrice: 97000,
            type: 'satuan',
            designs: KAOS_DESIGNS,
            sizes: [...KAOS_SIZES, "3XL", "4XL", "5XL", "6XL", "7XL", "8XL"] 
        },
        "Jersey": {
            basePrice: 95000,
            type: 'satuan',
            designs: JERSEY_DESIGNS,
            sizes: [...JERSEY_SIZES, "3XL", "4XL", "5XL", "6XL", "7XL", "8XL"] 
        },
        "Stiker": { basePrice: 5000, type: 'satuan', models: STIKER_MODELS },
        "Keychain": { basePrice: 45000, type: 'satuan', models: KEYCHAIN_MODELS },
        "Bundle of Blessings": {
            basePrice: 285000,
            type: 'bundle',
            items: [
                { name: "Kaos I", type: "Kaos", designs: KAOS_DESIGNS, sizes: KAOS_SIZES },
                { name: "Kaos II", type: "Kaos", designs: KAOS_DESIGNS, sizes: KAOS_SIZES },
                { name: "Kaos III", type: "Kaos", designs: KAOS_DESIGNS, sizes: KAOS_SIZES }
            ]
        },
        "Santa’s Safe Haven": {
            basePrice: 170000,
            type: 'bundle',
            items: [
                { name: "Kaos", type: "Kaos", designs: KAOS_DESIGNS, sizes: KAOS_SIZES },
                { name: "Jersey", type: "Jersey", designs: JERSEY_DESIGNS, sizes: JERSEY_SIZES }
            ]
        },
        "A December to Remember": {
            basePrice: 185000,
            type: 'bundle',
            items: [
                { name: "Kaos", type: "Kaos", designs: KAOS_DESIGNS, sizes: KAOS_SIZES },
                { name: "Jersey", type: "Jersey", designs: JERSEY_DESIGNS, sizes: JERSEY_SIZES },
                { name: "Stiker", type: "Stiker", models: STIKER_MODELS },
                { name: "Keychain", type: "Keychain", models: KEYCHAIN_MODELS }
            ]
        },
        "Mistletoe Mavericks": {
            basePrice: 245000,
            type: 'bundle',
            items: [
                { name: "Jersey I", type: "Jersey", designs: JERSEY_DESIGNS, sizes: JERSEY_SIZES },
                { name: "Jersey II", type: "Jersey", designs: JERSEY_DESIGNS, sizes: JERSEY_SIZES },
                { name: "Jersey III", type: "Jersey", designs: JERSEY_DESIGNS, sizes: JERSEY_SIZES }
            ]
        }
    };
    
    function createDropdown(id, label, options) {
        let optionsHtml = `<option value="" disabled selected>Pilih ${label}</option>`;
        options.forEach(opt => {
            optionsHtml += `<option value="${opt}">${opt}</option>`;
        });
        return `
            <div class="bundle-option">
                <label for="${id}">${label}:</label>
                <select id="${id}">${optionsHtml}</select>
            </div>
        `;
    }

    function goToModalStep(stepNumber) {
        document.querySelectorAll('#multi-step-modal .modal-step').forEach(step => step.classList.remove('active'));
        document.querySelector(`#multi-step-modal .modal-step[data-step="${stepNumber}"]`).classList.add('active');
        
        if (stepNumber === 1) {
            modalTitle.innerText = `Pilih Desain ${currentSelection.product}`;
            backModalButton.style.display = 'none';
        } else {
            modalTitle.innerText = 'Pilih Opsi';
            backModalButton.style.display = (currentSelection.type === 'satuan' && productDatabase[currentSelection.product].designs) ? 'block' : 'none';
        }
    }

    function resetModal() {
        currentSelection = { product: null, basePrice: 0, type: 'satuan', design: null, size: null, bundleOptions: [] };
        designGridContainer.innerHTML = '';
        sizeSelector.innerHTML = '';
        modelSelector.innerHTML = '';
        bundleOptionsContainer.innerHTML = '';
    }

    function openModalForProduct(productName) {
        resetModal();
        const productData = productDatabase[productName];
        if (!productData) return;

        currentSelection.product = productName;
        currentSelection.basePrice = productData.basePrice;
        currentSelection.type = productData.type;

        sizeOptionsContainer.style.display = 'none';
        modelOptionsContainer.style.display = 'none';
        bundleOptionsContainer.style.display = 'none';

        if (productData.type === 'satuan') {
            if (productData.designs) {
                step1Title.innerText = `Pilih Desain ${productName}`;
                designGridContainer.innerHTML = ''; 
                productData.designs.forEach((designName, i) => {
                    const imgName = `${productName.toLowerCase()}-desain-${i + 1}.png`; 
                    const item = document.createElement('div');
                    item.className = 'design-item';
                    item.dataset.design = designName;
                    item.innerHTML = `<img src="images/designs/${imgName}" alt="${designName}">`;
                    item.addEventListener('click', () => selectDesign(item, designName));
                    designGridContainer.appendChild(item);
                });
                
                sizeOptionsContainer.style.display = 'block';
                step2Title.innerText = "Pilih Ukuran & Opsi";
                sizeSelector.innerHTML = '';
                productData.sizes.forEach(size => {
                    const btn = document.createElement('button');
                    btn.className = 'size-btn';
                    btn.dataset.size = size;
                    btn.innerText = size;
                    if (size.includes("Lengan Panjang")) {
                        btn.classList.add('lengan-panjang');
                    }
                    btn.addEventListener('click', () => selectSize(btn, size));
                    sizeSelector.appendChild(btn);
                });

                goToModalStep(1); 
                
            } else if (productData.models) {
                modelOptionsContainer.style.display = 'block';
                step2Title.innerText = `Pilih Model ${productName}`;
                modelSelector.innerHTML = '';
                productData.models.forEach(model => {
                    const btn = document.createElement('button');
                    btn.className = 'model-btn';
                    btn.dataset.model = model;
                    btn.innerText = model;
                    btn.addEventListener('click', () => selectModel(btn, model));
                    modelSelector.appendChild(btn);
                });
                
                goToModalStep(2); 
            }
        } else if (productData.type === 'bundle') {
            bundleOptionsContainer.style.display = 'block';
            step2Title.innerText = `Pilih Opsi ${productName}`;
            bundleOptionsContainer.innerHTML = ''; 
            
            productData.items.forEach((item, index) => {
                const itemGroupId = `bundle-item-${index}`;
                let itemHtml = `<div class="bundle-item-group" id="${itemGroupId}"><strong>${item.name}</strong>`;
                
                if (item.designs) {
                    itemHtml += createDropdown(`${itemGroupId}-design`, 'Desain', item.designs);
                }
                if (item.sizes) {
                    itemHtml += createDropdown(`${itemGroupId}-size`, 'Ukuran', item.sizes);
                }
                if (item.models) {
                    itemHtml += createDropdown(`${itemGroupId}-model`, 'Model', item.models);
                }
                
                itemHtml += '</div>';
                bundleOptionsContainer.innerHTML += itemHtml;
            });
            
            goToModalStep(2); 
        }
        
        multiStepModal.style.display = 'flex';
    }

    function selectDesign(element, designName) {
        document.querySelectorAll('.design-item.selected').forEach(el => el.classList.remove('selected'));
        element.classList.add('selected');
        currentSelection.design = designName;
        setTimeout(() => goToModalStep(2), 200); 
    }

    function selectSize(element, sizeName) {
        document.querySelectorAll('.size-btn.selected').forEach(el => el.classList.remove('selected'));
        element.classList.add('selected');
        currentSelection.size = sizeName;
    }
    
    function selectModel(element, modelName) {
        document.querySelectorAll('.model-btn.selected').forEach(el => el.classList.remove('selected'));
        element.classList.add('selected');
        currentSelection.size = modelName; 
    }

    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', () => {
            const productName = card.dataset.product;
            openModalForProduct(productName);
        });
    });

    closeModalButton.addEventListener('click', () => multiStepModal.style.display = 'none');
    backModalButton.addEventListener('click', () => goToModalStep(1));
    multiStepModal.addEventListener('click', (e) => {
        if (e.target === multiStepModal) multiStepModal.style.display = 'none';
    });


    addToCartButton.addEventListener('click', () => {
        const productData = productDatabase[currentSelection.product];
        // currentSelection.notes = productNotesInput.value || " "; // Dihapus
        let finalPrice = currentSelection.basePrice;
        let optionsSummary = ""; 
        let validationError = false;
        
        if (currentSelection.type === 'satuan') {
            if ((productData.designs && !currentSelection.design) || !currentSelection.size) {
                validationError = true;
            }
            if (currentSelection.design) optionsSummary += `${currentSelection.design}, `;
            optionsSummary += currentSelection.size;
            
            if (currentSelection.size.includes("Lengan Panjang")) {
                finalPrice += 10000;
            }
            
        } else if (currentSelection.type === 'bundle') {
            currentSelection.bundleOptions = []; 
            let bundleOptionsStrings = [];
            
            productData.items.forEach((item, index) => {
                const itemGroupId = `bundle-item-${index}`;
                let design = document.getElementById(`${itemGroupId}-design`)?.value;
                let size = document.getElementById(`${itemGroupId}-size`)?.value;
                let model = document.getElementById(`${itemGroupId}-model`)?.value;

                if ((item.designs && !design) || (item.sizes && !size) || (item.models && !model)) {
                    validationError = true;
                }
                
                let itemSummary = `${item.name}: `;
                if (design) itemSummary += `${design}, `;
                if (size) itemSummary += `${size}`;
                if (model) itemSummary += `${model}`;

                bundleOptionsStrings.push(itemSummary);
                
                if (size && size.includes("Lengan Panjang")) {
                    finalPrice += 10000;
                }
            });
            optionsSummary = bundleOptionsStrings.join(' | ');
        }
        
        if (validationError) {
            alert("Mohon lengkapi semua pilihan (desain, ukuran, atau model)!");
            return;
        }
        
        const uniqueCartId = Date.now().toString();
        
        const imgPath = `images/${currentSelection.product.toLowerCase().split(' ')[0]}-preview.png`;
        
        cart.push({
            id: uniqueCartId,
            name: currentSelection.product,
            price: finalPrice,
            quantity: 1,
            options: {
                size: optionsSummary, 
                notes: " " // Tidak ada catatan
            },
            image_url: imgPath
        });
        
        renderCart();
        // cartModal.style.display = 'flex'; // <-- DIHAPUS
        showToast(`${currentSelection.product} ditambahkan!`); // <-- DITAMBAHKAN
        multiStepModal.style.display = 'none'; 
    });

    cartIconButton.addEventListener('click', () => { cartModal.style.display = 'flex'; renderCart(); });
    closeCartModalButton.addEventListener('click', () => { cartModal.style.display = 'none'; });
    cartModal.addEventListener('click', (e) => { if (e.target === cartModal) cartModal.style.display = 'none'; });
    
    function renderCart() {
        modalCartItemsEl.innerHTML = '';
        let total = 0;
        if (cart.length === 0) { modalCartItemsEl.innerHTML = '<p style="text-align: center; padding: 20px 0; color: #aaa;">Keranjang Anda kosong.</p>'; }
        
        cart.forEach(item => {
            let detailsHtml = '';
            if (item.options) { 
                let notes = (item.options.notes && item.options.notes.trim() && item.options.notes !== " ") ? `, ${item.options.notes}` : ''; 
                detailsHtml = `<div class="cart-item-details">${item.options.size}${notes}</div>`; 
            }
            
            const itemRow = document.createElement('div');
            itemRow.className = 'cart-item-row';
            itemRow.innerHTML = `<img src="${item.image_url}" alt="${item.name}"><div class="cart-item-info"><b>${item.name}</b><span>${formatRupiah(item.price)}</span>${detailsHtml}</div><div class="quantity-controls"><button class="quantity-down" data-id="${item.id}">-</button><input type="number" value="${item.quantity}" min="1" data-id="${item.id}"><button class="quantity-up" data-id="${item.id}">+</button></div><span class="item-subtotal"><b>${formatRupiah(item.price * item.quantity)}</b></span><button class="remove-item-button" data-id="${item.id}">&times;</button>`;
            modalCartItemsEl.appendChild(itemRow);
            total += item.price * item.quantity;
        });
        
        modalCartTotalEl.textContent = formatRupiah(total);
        cartCountEl.textContent = cart.length;
        
        modalCartItemsEl.querySelectorAll('.quantity-down').forEach(btn => btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const item = cart.find(i => i.id === id);
            if (item.quantity > 1) updateQuantity(id, item.quantity - 1);
            else removeFromCart(id);
        }));
        modalCartItemsEl.querySelectorAll('.quantity-up').forEach(btn => btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            updateQuantity(id, cart.find(i => i.id === id).quantity + 1);
        }));
        modalCartItemsEl.querySelectorAll('.quantity-controls input').forEach(input => input.addEventListener('change', (e) => {
            const id = input.dataset.id;
            let newQty = parseInt(e.target.value);
            if (isNaN(newQty) || newQty < 1) newQty = 1;
            updateQuantity(id, newQty);
        }));
        modalCartItemsEl.querySelectorAll('.remove-item-button').forEach(btn => btn.addEventListener('click', () => removeFromCart(btn.dataset.id)));
    }
    
    function updateQuantity(id, newQuantity) {
        const item = cart.find(i => i.id === id);
        if (item) item.quantity = newQuantity;
        renderCart();
    }
    function removeFromCart(id) {
        cart = cart.filter(i => i.id !== id);
        renderCart();
    }
    
    checkoutButton.addEventListener('click', async () => { 
        try {
            const customerName = customerNameInput.value.trim();
            const customerPhone = customerPhoneInput.value.trim();
            const customerClass = customerClassInput.value;
            let errorMessage = "";
            if (cart.length === 0) { errorMessage = 'Keranjang kamu masih kosong.'; }
            else if (!customerName) { errorMessage = 'Tolong masukkan Nama Pemesan.'; }
            else if (!customerPhone) { errorMessage = 'Tolong masukkan No. Telepon / ID Line.'; }
            else if (!customerClass) { errorMessage = 'Tolong pilih Kelas Anda.'; }
            if (errorMessage) { showValidationError(errorMessage); return; }

            checkoutButton.disabled = true;
            checkoutButton.textContent = 'Memproses...';

            const itemsString = cart.map(item => { 
                let detail = `${item.name} (x${item.quantity}) - @${formatRupiah(item.price)}`; 
                if (item.options) { 
                    let notes = (item.options.notes && item.options.notes.trim() && item.options.notes !== " ") ? `, Catatan: ${item.options.notes}` : ''; 
                    detail += ` [Opsi: ${item.options.size}${notes}]`; 
                } 
                return detail; 
            }).join('\n');
            const totalAsli = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            
            const orderData = {
                nama: customerName,
                telepon: customerPhone,
                kelas: customerClass,
                itemsString: itemsString,
                totalAsli: totalAsli
            };
            
            const response = await fetch(BACKEND_API_URL, { 
                method: 'POST',
                body: JSON.stringify(orderData),
                headers: { "Content-Type": "application/json" },
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || `Gagal menghubungi server. Status: ${response.statusText}`);
            }

            const data = await response.json(); 

            if (data.status !== "success") {
                throw new Error(data.message);
            }
            
            cartModal.style.display = 'none';
            cart = [];
            renderCart();
            customerNameInput.value = '';
            customerPhoneInput.value = '';
            customerClassInput.value = '';

            currentOrderData = { 
                orderId: data.orderId, 
                finalAmount: data.finalAmount,
                customerName: customerName,
                itemsString: itemsString
            };
            
            renderQrCode(data.qrisString); 
            
            alertAmountEl.textContent = formatRupiah(data.finalAmount);
            alertModal.style.display = 'flex';

        } catch (err) {
            showValidationError('Terjadi kesalahan: ' + err.message);
            checkoutButton.disabled = false;
            checkoutButton.textContent = 'Proses Pesanan';
        }
    });

    confirmPaymentModalButton.addEventListener('click', () => {
        qrisModal.style.display = 'none';
        
        if (currentOrderData) {
             const successData = {
                customerName: currentOrderData.customerName,
                itemsString: currentOrderData.itemsString,
                orderId: currentOrderData.orderId
            };
            localStorage.setItem('lastOrderData', JSON.stringify(successData));
        }
        
        let successUrl = 'payment-success.html';
        window.location.href = successUrl;
    });

    function showValidationError(message) {
        validationMessageEl.textContent = message;
        validationModal.style.display = 'flex';
    }

    function formatRupiah(number) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(number);
    }

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
    qrisModal.addEventListener('click', (e) => { if (e.target === qrisModal) qrisModal.style.display = 'none'; });
    closeValidationModalButton.addEventListener('click', () => { validationModal.style.display = 'none'; });
    validationOkButton.addEventListener('click', () => { validationModal.style.display = 'none'; });
    validationModal.addEventListener('click', (e) => { if (e.target === validationModal) validationModal.style.display = 'none'; });

    // --- (PENTING) Menjalankan AOS setelah semua dimuat ---
    AOS.init({
        duration: 600, // Durasi animasi
        once: true, // Hanya animasi sekali
    });

});