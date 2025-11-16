// File: pomerch/app.js
// VERSI FINAL: FIX TIMING RENDER QRIS

let toastTimer; 
function showToast(message) {
    const toast = document.getElementById('toast-notification');
    toast.innerText = message;
    toast.classList.add('show');
    if (toastTimer) {
        clearTimeout(toastTimer);
    }
    toastTimer = setTimeout(() => {
        toast.classList.remove('show');
    }, 3000); 
}

/**
 * Fungsi ini menggambar QR code di dalam container.
 * PENTING: Container harus TERLIHAT (display != none) sebelum fungsi ini dipanggil
 * agar library QRious bisa menghitung ukuran canvas dengan benar.
 */
function renderQrCode(qrisString) {
    const container = document.getElementById('qris-image-container');
    container.innerHTML = ''; // Bersihkan container lama

    if (!qrisString) {
        container.innerHTML = '<p>Error: Data QRIS tidak ditemukan.</p>';
        return;
    }
    
    try {
        // Buat elemen canvas baru
        const canvas = document.createElement('canvas');
        container.appendChild(canvas);

        // Render QR Code ke canvas tersebut
        new QRious({
            element: canvas,
            value: qrisString,
            size: 230, 
            padding: 10,
            level: 'M' 
        });
    } catch (e) {
        console.error("Gagal membuat QRIS:", e);
        container.innerHTML = '<p>Error: Gagal membuat gambar QRIS.</p>';
    }
}


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
    
    const cartIconButton = document.getElementById('cart-icon-button');
    const cartCountEl = document.getElementById('cart-count');
    const cartModal = document.getElementById('cart-modal');
    const closeCartModalButton = document.querySelector('#cart-modal .close-modal-button');
    const modalCartItemsEl = document.getElementById('modal-cart-items');
    const modalCartTotalEl = document.getElementById('modal-cart-total');
    const customerNameInput = document.getElementById('customer-name');
    const customerPhoneInput = document.getElementById('customer-phone');
    const customerClassInput = document.getElementById('customer-class');
    
    // === ELEMEN REFERRAL BARU ===
    const customerReferralInput = document.getElementById('customer-referral');
    const referralSuggestions = document.getElementById('referral-suggestions');
    
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
    
    // === DAFTAR KODE REFERRAL ===
    const REFERRAL_CODES = [
        "Lion", "Peacock", "Camel", "Owl", 
        "Elephant", "Dove", "Ox", "Deer"
    ];

    // === Database Produk ===
    const KAOS_DESIGNS = [
        { name: "Desain 1", image: "pomerch/images/kaos/justfine.png" }, 
        { name: "Desain 2", image: "images/designs/kaos-desain-2.png" },
        { name: "Desain 3", image: "images/designs/kaos-desain-3.png" },
        { name: "Desain 4", image: "images/designs/kaos-desain-4.png" },
        { name: "Desain 5", image: "images/designs/kaos-desain-5.png" },
        { name: "Desain 6", image: "images/designs/kaos-desain-6.png" },
        { name: "Desain 7", image: "images/designs/kaos-desain-7.png" },
        { name: "Desain 8", image: "images/designs/kaos-desain-8.png" },
        { name: "Desain 9", image: "images/designs/kaos-desain-9.png" },
        { name: "Desain 10", image: "images/designs/kaos-desain-10.png" },
        { name: "Desain 11", image: "images/designs/kaos-desain-11.png" },
        { name: "Desain 12", image: "images/designs/kaos-desain-12.png" },
        { name: "Desain 13", image: "images/designs/kaos-desain-13.png" },
        { name: "Desain 14", image: "images/designs/kaos-desain-14.png" }
    ];
    const KAOS_SIZES = ["S", "M", "L", "XL", "XXL"]; 
    
    const DRYFIT_DESIGNS = [
        { name: "Desain 1", image: "images/designs/dryfit-desain-1.png" },
        { name: "Desain 2", image: "images/designs/dryfit-desain-2.png" },
        { name: "Desain 3", image: "images/designs/dryfit-desain-3.png" },
        { name: "Desain 4", image: "images/designs/dryfit-desain-4.png" }
    ];
    const DRYFIT_SIZES = ["S", "M", "L", "XL", "XXL"]; 
    
    const STIKER_MODELS = [
        { name: "Model A", image: "images/designs/stiker-1.png" },
        { name: "Model B", image: "images/designs/stiker-2.png" },
        { name: "Model C", image: "images/designs/stiker-3.png" },
        { name: "Model D", image: "images/designs/stiker-4.png" },
        { name: "Model E", image: "images/designs/stiker-5.png" }
    ];
    
    const KEYCHAIN_MODELS = [
        { name: "Model A", image: "images/designs/keychain-1.png" },
        { name: "Model B", image: "images/designs/keychain-2.png" },
        { name: "Model C", image: "images/designs/keychain-3.png" },
        { name: "Model D", image: "images/designs/keychain-4.png" },
        { name: "Model E", image: "images/designs/keychain-5.png" }
    ]; 

    const productDatabase = {
        "Kaos": { basePrice: 97000, type: 'satuan', designs: KAOS_DESIGNS, sizes: KAOS_SIZES },
        "Dryfit": { basePrice: 95000, type: 'satuan', designs: DRYFIT_DESIGNS, sizes: DRYFIT_SIZES },
        "Stiker": { basePrice: 5000, type: 'satuan', models: STIKER_MODELS },
        "Keychain": { basePrice: 8000, type: 'satuan', models: KEYCHAIN_MODELS },
        "Bundle of Blessings": {
            basePrice: 285000, type: 'bundle',
            items: [
                { name: "Kaos I", type: "Kaos", designs: KAOS_DESIGNS, sizes: KAOS_SIZES },
                { name: "Kaos II", type: "Kaos", designs: KAOS_DESIGNS, sizes: KAOS_SIZES },
                { name: "Kaos III", type: "Kaos", designs: KAOS_DESIGNS, sizes: KAOS_SIZES }
            ]
        },
        "Santa’s Safe Haven": {
            basePrice: 170000, type: 'bundle',
            items: [
                { name: "Kaos", type: "Kaos", designs: KAOS_DESIGNS, sizes: KAOS_SIZES },
                { name: "Dryfit", type: "Dryfit", designs: DRYFIT_DESIGNS, sizes: DRYFIT_SIZES }
            ]
        },
        "A December to Remember": {
            basePrice: 185000, type: 'bundle',
            items: [
                { name: "Kaos", type: "Kaos", designs: KAOS_DESIGNS, sizes: KAOS_SIZES },
                { name: "Dryfit", type: "Dryfit", designs: DRYFIT_DESIGNS, sizes: DRYFIT_SIZES },
                { name: "Stiker", type: "Stiker", models: STIKER_MODELS.map(m => m.name) }, 
                { name: "Keychain", type: "Keychain", models: KEYCHAIN_MODELS.map(m => m.name) } 
            ]
        },
        "Mistletoe Mavericks": {
            basePrice: 245000, type: 'bundle',
            items: [
                { name: "Dryfit I", type: "Dryfit", designs: DRYFIT_DESIGNS, sizes: DRYFIT_SIZES }, 
                { name: "Dryfit II", type: "Dryfit", designs: DRYFIT_DESIGNS, sizes: DRYFIT_SIZES }, 
                { name: "Dryfit III", type: "Dryfit", designs: DRYFIT_DESIGNS, sizes: DRYFIT_SIZES } 
            ]
        }
    };
    
    function createDropdown(id, label, options) {
        const isObjectArray = typeof options[0] === 'object';
        let optionsHtml = `<option value="" disabled selected>Pilih ${label}</option>`;
        options.forEach(opt => {
            const optionName = isObjectArray ? opt.name : opt;
            optionsHtml += `<option value="${optionName}">${optionName}</option>`;
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
                productData.designs.forEach(design => {
                    const item = document.createElement('div');
                    item.className = 'design-item';
                    item.dataset.design = design.name;
                    item.innerHTML = `
                        <img src="${design.image}" alt="${design.name}">
                        <p>${design.name}</p>
                    `;
                    item.addEventListener('click', () => selectDesign(item, design.name));
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
                    if (typeof model === 'object' && model.image) {
                        const item = document.createElement('div');
                        item.className = 'model-item'; 
                        item.dataset.model = model.name;
                        item.innerHTML = `
                            <img src="${model.image}" alt="${model.name}">
                            <p>${model.name}</p>
                        `;
                        item.addEventListener('click', () => selectModel(item, model.name));
                        modelSelector.appendChild(item);
                    } else {
                        const btn = document.createElement('button');
                        btn.className = 'model-btn';
                        btn.dataset.model = model;
                        btn.innerText = model;
                        btn.addEventListener('click', () => selectModel(btn, model));
                        modelSelector.appendChild(btn);
                    }
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
                
                let placeholderImg = "images/placeholder-design.png"; 
                if (item.type === 'Stiker') placeholderImg = "images/stiker-preview.png";
                if (item.type === 'Keychain') placeholderImg = "images/keychain-preview.png";
                if (item.type === 'Dryfit') placeholderImg = "images/dryfit-preview.png";
                if (item.type === 'Kaos') placeholderImg = "images/kaos-preview.png";
                
                itemHtml += `<img src="${placeholderImg}" class="bundle-item-preview" id="preview-${itemGroupId}">`;

                if (item.designs) {
                    itemHtml += createDropdown(`${itemGroupId}-design`, 'Desain', item.designs);
                }
                if (item.sizes) {
                    itemHtml += createDropdown(`${itemGroupId}-size`, 'Ukuran', item.sizes);
                }
                if (item.models) {
                    const modelNames = item.models.map(m => m.name || m);
                    itemHtml += createDropdown(`${itemGroupId}-model`, 'Model', modelNames);
                }
                itemHtml += '</div>';
                bundleOptionsContainer.innerHTML += itemHtml;
            });
            
            goToModalStep(2); 

            productData.items.forEach((item, index) => {
                const itemGroupId = `bundle-item-${index}`;
                const designDropdown = document.getElementById(`${itemGroupId}-design`);
                const modelDropdown = document.getElementById(`${itemGroupId}-model`);
                const previewImg = document.getElementById(`preview-${itemGroupId}`);
                
                let dbDesigns = [];
                if (item.type === 'Kaos') dbDesigns = KAOS_DESIGNS;
                if (item.type === 'Dryfit') dbDesigns = DRYFIT_DESIGNS;
                
                let dbModels = [];
                if (item.type === 'Stiker') dbModels = STIKER_MODELS;
                if (item.type === 'Keychain') dbModels = KEYCHAIN_MODELS;

                if (designDropdown && previewImg) { 
                    designDropdown.addEventListener('change', (e) => {
                        const selectedDesignName = e.target.value;
                        const designData = dbDesigns.find(d => d.name === selectedDesignName);
                        if (designData) {
                            previewImg.src = designData.image; 
                        }
                    });
                }
                
                if (modelDropdown && previewImg) { 
                    modelDropdown.addEventListener('change', (e) => {
                        const selectedModelName = e.target.value;
                        const modelData = dbModels.find(m => m.name === selectedModelName);
                        if (modelData && modelData.image) {
                            previewImg.src = modelData.image;
                        }
                    });
                }
            });
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
        document.querySelectorAll('#model-selector .selected').forEach(el => el.classList.remove('selected'));
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
        let finalPrice = currentSelection.basePrice;
        let optionsSummary = ""; 
        let validationError = false;
        if (currentSelection.type === 'satuan') {
            if ((productData.designs && !currentSelection.design) || !currentSelection.size) {
                validationError = true;
            }
            if (currentSelection.design) optionsSummary += `${currentSelection.design}, `;
            optionsSummary += currentSelection.size;
            
            if (currentSelection.size && currentSelection.size.includes("Lengan Panjang")) {
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
        let imgName = currentSelection.product.toLowerCase().split(' ')[0];
        if (currentSelection.type === 'bundle') {
            imgName = imgName.replace('’', ''); 
        }
        const imgPath = `images/${imgName}-preview.png`;

        cart.push({
            id: uniqueCartId,
            name: currentSelection.product,
            price: finalPrice,
            quantity: 1,
            options: {
                size: optionsSummary, 
                notes: " " 
            },
            image_url: imgPath
        });
        renderCart();
        showToast(`${currentSelection.product} ditambahkan!`); 
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
        
        // --- Reset Autocomplete saat keranjang dibuka ---
        customerReferralInput.value = '';
        referralSuggestions.innerHTML = '';
        referralSuggestions.style.display = 'none';
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
    
    // ==========================================================
    // === LOGIKA AUTOCOMPLETE REFERRAL ===
    // ==========================================================
    customerReferralInput.addEventListener('input', () => {
        const inputText = customerReferralInput.value.toLowerCase();
        referralSuggestions.innerHTML = '';
        
        if (inputText.length === 0) {
            referralSuggestions.style.display = 'none';
            return;
        }

        const filteredCodes = REFERRAL_CODES.filter(code => 
            code.toLowerCase().startsWith(inputText)
        );

        if (filteredCodes.length > 0) {
            filteredCodes.forEach(code => {
                const suggestionDiv = document.createElement('div');
                suggestionDiv.innerText = code;
                suggestionDiv.addEventListener('click', () => {
                    customerReferralInput.value = code;
                    referralSuggestions.innerHTML = '';
                    referralSuggestions.style.display = 'none';
                });
                referralSuggestions.appendChild(suggestionDiv);
            });
            referralSuggestions.style.display = 'block';
        } else {
            referralSuggestions.style.display = 'none';
        }
    });

    // Sembunyikan saran jika klik di luar
    document.addEventListener('click', (e) => {
        if (e.target !== customerReferralInput) {
            referralSuggestions.style.display = 'none';
        }
    });
    // ==========================================================


    checkoutButton.addEventListener('click', async () => { 
        try {
            const customerName = customerNameInput.value.trim();
            const customerPhone = customerPhoneInput.value.trim();
            const customerClass = customerClassInput.value;
            
            // === LOGIKA REFERRAL BARU ===
            const referralCodeRaw = customerReferralInput.value.trim();
            let validReferralCode = "TIDAK ADA"; // Default jika kosong

            // Cek apakah inputan ada di daftar, case-insensitive
            const foundCode = REFERRAL_CODES.find(code => code.toLowerCase() === referralCodeRaw.toLowerCase());

            if (referralCodeRaw.length > 0) {
                if (foundCode) {
                    validReferralCode = foundCode; 
                } else {
                    throw new Error("Kode Referral tidak valid. (Coba: Lion, Peacock, dll.)");
                }
            }
            // === AKHIR LOGIKA REFERRAL ===

            const phoneRegex = /^[0-9]{8,15}$/; 
            let errorMessage = "";

            if (cart.length === 0) { 
                errorMessage = 'Keranjang kamu masih kosong.'; 
            } else if (!customerName || customerName.length < 3) { 
                errorMessage = 'Nama Pemesan harus diisi (minimal 3 huruf).'; 
            } else if (!customerPhone || !phoneRegex.test(customerPhone.replace(/\D/g,''))) { 
                errorMessage = 'Mohon masukkan nomor telepon yang valid (hanya angka, 8-15 digit).'; 
            } else if (!customerClass) { 
                errorMessage = 'Tolong pilih Kelas Anda.'; 
            }
            
            if (errorMessage) { 
                showValidationError(errorMessage); 
                return; 
            }

            checkoutButton.disabled = true;
            checkoutButton.textContent = 'Memproses...';

            const itemsString = cart.map(item => { 
                let detail = `${item.name} (x${item.quantity}) - @${formatRupiah(item.price)}`; 
                if (item.options) { 
                    detail += ` [Opsi: ${item.options.size}]`; 
                } 
                return detail; 
            }).join('\n');
            const totalAsli = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            
            const orderData = {
                nama: customerName,
                telepon: customerPhone,
                kelas: customerClass,
                itemsString: itemsString,
                totalAsli: totalAsli,
                referralCode: validReferralCode 
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
            console.log("DATA DARI BACKEND:", data); 

            if (data.status !== "success") {
                throw new Error(data.message);
            }
            
            cartModal.style.display = 'none';
            cart = [];
            renderCart(); 
            customerNameInput.value = '';
            customerPhoneInput.value = '';
            customerClassInput.value = '';
            customerReferralInput.value = '';

            // ==========================================================
            // SIMPAN DATA QRIS, JANGAN RENDER DULU!
            // ==========================================================
            currentOrderData = { 
                orderId: data.orderId, 
                finalAmount: data.finalAmount,
                customerName: customerName,
                itemsString: itemsString,
                qrisString: data.qrisString 
            };
            
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

    // ==========================================================
    // === LISTENER TOMBOL OK PADA ALERT MODAL ===
    // ==========================================================
    alertOkButton.addEventListener('click', () => {
        alertModal.style.display = 'none';
        
         if (currentOrderData) {
            qrisAmountEl.textContent = formatRupiah(currentOrderData.finalAmount);
            qrisOrderIdEl.textContent = currentOrderData.orderId;
            
            // 1. TAMPILKAN MODAL DULU (AGAR TIDAK DISPLAY: NONE)
            qrisModal.style.display = 'flex';
            
            // 2. BARU GAMBAR QRIS-NYA
            renderQrCode(currentOrderData.qrisString); 
         }

        checkoutButton.disabled = false;
        checkoutButton.textContent = 'Proses Pesanan';
    });
    
    closeQrisModalButton.addEventListener('click', () => { qrisModal.style.display = 'none'; });
    qrisModal.addEventListener('click', (e) => { if (e.target === qrisModal) qrisModal.style.display = 'none'; });
    
    closeValidationModalButton.addEventListener('click', () => { validationModal.style.display = 'none'; });
    validationOkButton.addEventListener('click', () => { validationModal.style.display = 'none'; });
    validationModal.addEventListener('click', (e) => { if (e.target === validationModal) validationModal.style.display = 'none'; });
    
});