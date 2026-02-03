/* ============================================================
   JT PRINT – script.js
   ============================================================ */

// ============================================================
// CONFIG
// ============================================================
const ADMIN_EMAIL = "jona.thielgen@gmail.com";

// ============================================================
// STATE
// ============================================================
let cart = [];
let products = [];
let galleryItems = [];
let orders = [];       // live from Firestore (or sample)
let chatSessions = {}; // { sessionId: [msgs…] }
let currentUser = null;
let isAdmin = false;

// product-detail state
let currentProduct = null;
let selectedColorIndex = 0;
let selectedQty = 1;

// admin order-detail state
let currentOrderId = null;

// admin chat state
let activeChatSession = null;

// checkout discount
let appliedDiscount = 0;

// ============================================================
// SAMPLE DATA (fallback when Firestore is empty / offline)
// ============================================================
const SAMPLE_PRODUCTS = [
    {
        id:'sp1', name:'Smartphone Halterung',
        description:'Verstellbare Smartphone-Halterung für Schreibtisch. Kompatibel mit allen Smartphones.',
        price:12.99, category:'internet', weight:45,
        colors:['#000000','#FFFFFF','#0066cc','#ff4444','#00cc99'],
        images:[], emoji:'📱', inStock:true
    },
    {
        id:'sp2', name:'Kabelhalter Set',
        description:'Praktisches 5er-Set Kabelhalter. Selbstklebend, ordentlich.',
        price:8.99, category:'internet', weight:20,
        colors:['#000000','#FFFFFF','#808080'],
        images:[], emoji:'🔌', inStock:true
    },
    {
        id:'sp3', name:'Würfel Organizer',
        description:'Modularer Würfel-Organizer für Stifte & Kleinteile. Stapelbar.',
        price:15.99, category:'custom', weight:80,
        colors:['#0066cc','#00cc99','#ff4444','#ffaa00','#9933cc'],
        images:[], emoji:'📦', inStock:true
    },
    {
        id:'sp4', name:'Kopfhörer Ständer',
        description:'Eleganter Kopfhörer-Ständer mit rutschfester Basis.',
        price:18.99, category:'custom', weight:120,
        colors:['#000000','#FFFFFF','#808080','#0066cc'],
        images:[], emoji:'🎧', inStock:true
    },
    {
        id:'sp5', name:'Pflanztopf Mini',
        description:'Dekorativer Mini-Pflanztopf mit geometrischem Design. Für Sukkulenten.',
        price:9.99, category:'internet', weight:35,
        colors:['#FFFFFF','#00cc99','#ffaa00','#ff69b4'],
        images:[], emoji:'🌱', inStock:true
    },
    {
        id:'sp6', name:'Schlüsselanhänger',
        description:'Personalisierter Schlüsselanhänger mit Ihrem Namen oder Logo.',
        price:6.99, category:'custom', weight:15,
        colors:['#000000','#0066cc','#ff4444','#00cc99','#ffaa00'],
        images:[], emoji:'🔑', inStock:true
    }
];

const SAMPLE_GALLERY = [
    { id:'sg1', name:'Schachfigur', description:'Detaillierte Schachfigur – hohe Präzision.', image:'', emoji:'♟️' },
    { id:'sg2', name:'Mechanismus', description:'Funktionales Getriebe aus 5 Teilen.', image:'', emoji:'⚙️' },
    { id:'sg3', name:'Vase', description:'Organische Vase für kleine Blumen.', image:'', emoji:'🏺' }
];

const SAMPLE_ORDERS = [
    {
        id:'order-001', userId:'demo-user-1', userEmail:'kunde1@example.com', userName:'Max Mustermann',
        items:[{ type:'product', productId:'sp1', productName:'Smartphone Halterung', emoji:'📱', qty:2, color:'#0066cc', price:25.98 }],
        shippingMethod:'standard', address:{ street:'Musterstr. 1', zip:'12345', city:'Berlin', country:'Deutschland' },
        paymentMethod:'paypal', total:30.97, status:'aufgegeben',
        chatLog:[{ sender:'user', text:'Kann die Halterung höher gemacht werden?', time:'2025-01-15T10:00:00' }],
        createdAt:'2025-01-15T09:30:00', notes:''
    },
    {
        id:'order-002', userId:'demo-user-2', userEmail:'kunde2@example.com', userName:'Erika Mustermann',
        items:[{ type:'upload', description:'Ersatzteil für Drohne', emoji:'✈️', weight:60, material:'petg', nozzle:'hardened_04', express:'yes', price:24.18 }],
        shippingMethod:'pickup', address:null,
        paymentMethod:'transfer', total:24.18, status:'bearbeitet',
        chatLog:[
            { sender:'user', text:'Maße: 8cm x 4cm x 2cm, bitte genau wie Original.', time:'2025-01-14T14:00:00' },
            { sender:'admin', text:'Understood – wir drucken es genau nach den Specs!', time:'2025-01-14T14:30:00' }
        ],
        createdAt:'2025-01-14T13:00:00', notes:'Ersatzteil'
    },
    {
        id:'order-003', userId:'demo-user-3', userEmail:'kunde3@example.com', userName:'Hans Schmidt',
        items:[{ type:'product', productId:'sp3', productName:'Würfel Organizer', emoji:'📦', qty:1, color:'#ff4444', price:15.99 }],
        shippingMethod:'express_ship', address:{ street:'Hauptstr. 22', zip:'54321', city:'München', country:'Deutschland' },
        paymentMethod:'private', total:25.98, status:'fragen',
        chatLog:[],
        createdAt:'2025-01-13T11:00:00', notes:'Bitte schnell'
    }
];

// ============================================================
// AUTH
// ============================================================
window.onAuthChange = function(user) {
    currentUser = user;
    isAdmin = user && user.email === ADMIN_EMAIL;

    const navAuth   = document.getElementById('navAuth');
    const navCart   = document.getElementById('navCart');
    const navSett   = document.getElementById('navSettings');
    const adminTabs = document.getElementById('adminTabs');
    const adminPanel= document.getElementById('adminPanel');
    const custFront = document.getElementById('customerFrontend');
    const navLinks  = document.getElementById('navLinks');

    if (user) {
        navAuth.innerHTML = `<span style="color:var(--txt2);font-size:.82rem;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${user.email}</span><button class="btn-secondary small" onclick="handleLogout()">Abmelden</button>`;
        navCart.classList.remove('hidden');
        navSett.classList.remove('hidden');

        if (isAdmin) {
            adminTabs.classList.remove('hidden');
            navLinks.classList.add('hidden');
            adminPanel.classList.remove('hidden');
            custFront.classList.add('hidden');
            loadAdminOrders();
            loadAdminProducts();
            loadAdminGallery();
            loadAdminChats();
        } else {
            adminTabs.classList.add('hidden');
            navLinks.classList.remove('hidden');
            adminPanel.classList.add('hidden');
            custFront.classList.remove('hidden');
        }
        loadUserSettings();
    } else {
        navAuth.innerHTML = `<button class="btn-secondary" onclick="showModal('loginModal')">Anmelden</button>`;
        navCart.classList.add('hidden');
        navSett.classList.add('hidden');
        adminTabs.classList.add('hidden');
        adminPanel.classList.add('hidden');
        custFront.classList.remove('hidden');
        navLinks.classList.remove('hidden');
    }
};

async function handleLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const pass  = document.getElementById('loginPassword').value;
    const errEl = document.getElementById('loginError');
    errEl.classList.add('hidden');
    try {
        await window.FB.signIn(window.FB.auth, email, pass);
        closeModal('loginModal');
    } catch(e) {
        errEl.textContent = 'Fehler: ' + (e.message || e);
        errEl.classList.remove('hidden');
    }
}

async function handleRegister() {
    const name  = document.getElementById('regName').value.trim();
    const bd    = document.getElementById('regBirthdate').value;
    const email = document.getElementById('regEmail').value.trim();
    const pass  = document.getElementById('regPassword').value;
    const conf  = document.getElementById('regPassConf').value;
    const errEl = document.getElementById('regError');
    const sucEl = document.getElementById('regSuccess');
    errEl.classList.add('hidden');
    sucEl.classList.add('hidden');

    if (pass !== conf) { errEl.textContent = 'Passwörter stimmen nicht überein!'; errEl.classList.remove('hidden'); return; }
    try {
        const cred = await window.FB.createUser(window.FB.auth, email, pass);
        await window.FB.sendVerification(cred.user);
        await window.FB.setDoc(window.FB.doc('users', cred.user.uid), { name, birthdate:bd, email, createdAt:new Date().toISOString() });
        sucEl.classList.remove('hidden');
        setTimeout(() => closeModal('registerModal'), 3000);
    } catch(e) {
        errEl.textContent = 'Fehler: ' + (e.message || e);
        errEl.classList.remove('hidden');
    }
}

async function handleLogout() {
    await window.FB.signOut();
    cart = []; updateCartCount();
}

// ============================================================
// SETTINGS
// ============================================================
async function loadUserSettings() {
    if (!currentUser) return;
    document.getElementById('settingsEmail').value = currentUser.email;
    try {
        const snap = await window.FB.getDocs(window.FB.col('users'));
        snap.forEach(d => {
            if (d.id === currentUser.uid) {
                const data = d.data();
                document.getElementById('settingsName').value = data.name || '';
                document.getElementById('settingsBirthdate').value = data.birthdate || '';
            }
        });
    } catch(e) { /* offline */ }
    loadNotifications();
}

async function saveSettings() {
    const errEl = document.getElementById('settError');
    const sucEl = document.getElementById('settSuccess');
    errEl.classList.add('hidden'); sucEl.classList.add('hidden');
    try {
        await window.FB.setDoc(window.FB.doc('users', currentUser.uid), {
            name: document.getElementById('settingsName').value,
            birthdate: document.getElementById('settingsBirthdate').value,
            email: currentUser.email,
            createdAt: new Date().toISOString()
        });
        sucEl.textContent = 'Gespeichert!'; sucEl.classList.remove('hidden');
    } catch(e) {
        errEl.textContent = 'Fehler: ' + (e.message||e); errEl.classList.remove('hidden');
    }
}

async function changePassword() {
    const p1 = document.getElementById('settNewPass').value;
    const p2 = document.getElementById('settNewPassConf').value;
    const errEl = document.getElementById('settError');
    const sucEl = document.getElementById('settSuccess');
    errEl.classList.add('hidden'); sucEl.classList.add('hidden');
    if (!p1) return;
    if (p1 !== p2) { errEl.textContent = 'Passwörter stimmen nicht überein!'; errEl.classList.remove('hidden'); return; }
    try {
        await window.FB.updatePassword(currentUser, p1);
        sucEl.textContent = 'Passwort geändert!'; sucEl.classList.remove('hidden');
        document.getElementById('settNewPass').value = '';
        document.getElementById('settNewPassConf').value = '';
    } catch(e) {
        errEl.textContent = 'Fehler: ' + (e.message||e); errEl.classList.remove('hidden');
    }
}

function loadNotifications() {
    // Show notifications stored in Firestore for this user
    const container = document.getElementById('notificationsList');
    const userNotifs = [];
    // pull from orders chatLog where sender==='admin' tagged as notification
    // For now show sample:
    container.innerHTML = `<div style="background:var(--card);border:1px solid var(--border);border-radius:8px;padding:.75rem;margin-bottom:.5rem;font-size:.83rem;">
        <strong style="color:var(--green);">ℹ️ System</strong><br><span style="color:var(--txt2);">Willkommen bei JT Print! Ihre Bestellungen & Nachrichten werden hier angezeigt.</span>
    </div>`;
}

// ============================================================
// PRODUCTS – load & render
// ============================================================
async function loadProducts() {
    try {
        const snap = await window.FB.getDocs(window.FB.col('products'));
        products = [];
        snap.forEach(d => products.push({ id:d.id, ...d.data() }));
        if (products.length === 0) products = SAMPLE_PRODUCTS;
    } catch(e) { products = SAMPLE_PRODUCTS; }
    renderProducts();
}

function renderProducts() {
    const internetEl = document.getElementById('internetProducts');
    const customEl   = document.getElementById('customProducts');
    internetEl.innerHTML = ''; customEl.innerHTML = '';
    products.forEach(p => {
        const card = buildProductCard(p);
        (p.category === 'internet' ? internetEl : customEl).appendChild(card);
    });
}

function buildProductCard(p) {
    const div = document.createElement('div');
    div.className = 'product-card';
    div.onclick = () => openProductDetail(p);
    const hasImg = p.images && p.images.length > 0 && p.images[0];
    div.innerHTML = `
        <div class="product-card-img">
            ${hasImg ? `<img src="${p.images[0]}" alt="${p.name}">` : ''}
            <span class="card-emoji" ${hasImg?'style="display:none"':''}>${p.emoji||'📦'}</span>
        </div>
        <div class="product-card-body">
            <h4>${p.name}</h4>
            <p>${(p.description||'').substring(0,55)}…</p>
            <div class="product-card-price">${Number(p.price).toFixed(2)}€</div>
            <span class="${p.inStock?'in-stock':'out-stock'}">${p.inStock?'✓ Auf Lager':'Nicht verfügbar'}</span>
        </div>`;
    return div;
}

// ============================================================
// GALLERY
// ============================================================
async function loadGallery() {
    try {
        const snap = await window.FB.getDocs(window.FB.col('gallery'));
        galleryItems = [];
        snap.forEach(d => galleryItems.push({ id:d.id, ...d.data() }));
        if (galleryItems.length === 0) galleryItems = SAMPLE_GALLERY;
    } catch(e) { galleryItems = SAMPLE_GALLERY; }
    renderGallery();
}

function renderGallery() {
    const el = document.getElementById('galleryGrid');
    el.innerHTML = '';
    galleryItems.forEach(g => {
        const div = document.createElement('div');
        div.className = 'product-card';
        div.style.cursor = 'default';
        const hasImg = g.image && g.image.length > 0;
        div.innerHTML = `
            <div class="product-card-img">
                ${hasImg ? `<img src="${g.image}" alt="${g.name}">` : ''}
                <span class="card-emoji" ${hasImg?'style="display:none"':''}>${g.emoji||'🎨'}</span>
            </div>
            <div class="product-card-body">
                <h4>${g.name}</h4>
                <p>${g.description||''}</p>
            </div>`;
        el.appendChild(div);
    });
}

// ============================================================
// PRODUCT DETAIL MODAL
// ============================================================
function openProductDetail(p) {
    currentProduct = p;
    selectedColorIndex = 0;
    selectedQty = 1;

    document.getElementById('detailName').textContent = p.name;
    document.getElementById('detailDesc').textContent  = p.description || '';
    document.getElementById('detailPrice').textContent = Number(p.price).toFixed(2) + '€';
    document.getElementById('detailQty').textContent   = '1';

    // main image / emoji
    const mainImg   = document.getElementById('detailMainImg');
    const mainEmoji = document.getElementById('detailMainEmoji');
    const hasImg = p.images && p.images.length > 0 && p.images[0];
    if (hasImg) { mainImg.src = p.images[0]; mainImg.classList.remove('hidden'); mainEmoji.classList.add('hidden'); }
    else        { mainImg.classList.add('hidden'); mainEmoji.classList.remove('hidden'); mainEmoji.textContent = p.emoji||'📦'; }

    // thumbs (one per color)
    const thumbsEl = document.getElementById('detailThumbs');
    thumbsEl.innerHTML = '';
    const colors = p.colors || ['#000000'];
    colors.forEach((c, i) => {
        const t = document.createElement('div');
        t.className = 'detail-thumb' + (i===0?' active':'');
        const imgUrl = (p.images && p.images[i]) ? p.images[i] : null;
        if (imgUrl) { t.innerHTML = `<img src="${imgUrl}" alt="">`; }
        else        { t.style.background = c; }
        t.onclick = () => selectColorVariant(i);
        thumbsEl.appendChild(t);
    });

    // color dots
    const colorsEl = document.getElementById('detailColors');
    colorsEl.innerHTML = '';
    colors.forEach((c, i) => {
        const dot = document.createElement('div');
        dot.className = 'color-dot' + (i===0?' active':'');
        dot.style.background = c;
        dot.onclick = () => selectColorVariant(i);
        colorsEl.appendChild(dot);
    });

    showModal('productDetailModal');
}

function selectColorVariant(idx) {
    selectedColorIndex = idx;
    const p = currentProduct;
    const colors = p.colors || ['#000000'];

    // update dots
    document.querySelectorAll('#detailColors .color-dot').forEach((d,i) => d.classList.toggle('active', i===idx));
    // update thumbs
    document.querySelectorAll('#detailThumbs .detail-thumb').forEach((t,i) => t.classList.toggle('active', i===idx));

    // update main image
    const mainImg   = document.getElementById('detailMainImg');
    const mainEmoji = document.getElementById('detailMainEmoji');
    const imgUrl = (p.images && p.images[idx]) ? p.images[idx] : null;
    if (imgUrl) { mainImg.src = imgUrl; mainImg.classList.remove('hidden'); mainEmoji.classList.add('hidden'); }
    else        { mainImg.classList.add('hidden'); mainEmoji.classList.remove('hidden'); mainEmoji.textContent = p.emoji||'📦'; }
}

function changeQty(delta) {
    selectedQty = Math.max(1, selectedQty + delta);
    document.getElementById('detailQty').textContent = selectedQty;
}

function addToCartFromDetail() {
    if (!currentProduct) return;
    const colors = currentProduct.colors || ['#000000'];
    cart.push({
        type:'product',
        productId: currentProduct.id,
        productName: currentProduct.name,
        emoji: currentProduct.emoji || '📦',
        image: (currentProduct.images && currentProduct.images[selectedColorIndex]) || null,
        qty: selectedQty,
        color: colors[selectedColorIndex],
        price: Number(currentProduct.price) * selectedQty
    });
    updateCartCount();
    closeModal('productDetailModal');
    showToast('Produkt zum Warenkorb hinzugefügt!');
}

// ============================================================
// UPLOAD (custom print order)
// ============================================================
function showUploadModal() {
    if (!currentUser) { showModal('loginModal'); return; }
    showModal('uploadModal');
}

function checkNozzleCompat() {
    const mat   = document.getElementById('uploadMaterial').value;
    const nozzle= document.getElementById('uploadNozzle').value;
    const warn  = document.getElementById('nozzleWarning');
    if (nozzle === 'stainless_02' && mat !== 'pla') {
        warn.classList.remove('hidden');
        document.getElementById('uploadNozzle').value = 'hardened_04';
        calcUploadPrice();
    } else { warn.classList.add('hidden'); }
}

function calcUploadPrice() {
    const w       = parseFloat(document.getElementById('uploadWeight').value) || 0;
    const mat     = document.getElementById('uploadMaterial').value;
    const nozzle  = document.getElementById('uploadNozzle').value;
    const express = document.getElementById('uploadExpress').value;

    if (w === 0) { document.getElementById('uploadPriceBox').classList.add('hidden'); return 0; }

    const isPLA     = mat === 'pla';
    const baseOrig  = 8;
    const base      = isPLA ? 4 : 8;
    const perGram   = 0.20;
    let extras      = 0;

    if (!isPLA)                      extras += 10;
    if (nozzle === 'stainless_02')   extras += 4;

    let subtotal = base + (w * perGram) + extras;
    if (express === 'yes') subtotal *= 1.30;

    // render
    document.getElementById('uploadPriceBox').classList.remove('hidden');
    document.getElementById('upBase').textContent = base.toFixed(2) + '€';
    const discRow = document.getElementById('upDiscRow');
    if (isPLA) { discRow.classList.remove('hidden'); } else { discRow.classList.add('hidden'); }
    document.getElementById('upMat').textContent = (w * perGram).toFixed(2) + '€';

    let extrasLabel = [];
    if (!isPLA)                      extrasLabel.push('Spezialmaterial +10€');
    if (nozzle === 'stainless_02')   extrasLabel.push('Stainless Steel Nozzle +4€');
    if (express === 'yes')           extrasLabel.push('Express +30%');
    const extraRow = document.getElementById('upExtraRow');
    if (extrasLabel.length > 0) { extraRow.classList.remove('hidden'); document.getElementById('upExtras').textContent = extrasLabel.join(' | '); }
    else { extraRow.classList.add('hidden'); }

    document.getElementById('upTotal').textContent = subtotal.toFixed(2) + '€';
    return subtotal;
}

function addUploadToCart() {
    if (!currentUser) { showModal('loginModal'); closeModal('uploadModal'); return; }
    const price = calcUploadPrice();
    if (!price) { showToast('Bitte geben Sie das Gewicht ein!'); return; }
    cart.push({
        type:'upload',
        description: document.getElementById('uploadDesc').value,
        weight: document.getElementById('uploadWeight').value,
        material: document.getElementById('uploadMaterial').value,
        nozzle: document.getElementById('uploadNozzle').value,
        express: document.getElementById('uploadExpress').value,
        notes: document.getElementById('uploadNotes').value,
        emoji:'🖨️',
        price: price
    });
    updateCartCount();
    closeModal('uploadModal');
    showToast('Auftrag zum Warenkorb hinzugefügt!');
}

// ============================================================
// CART
// ============================================================
function updateCartCount() {
    document.getElementById('cartCount').textContent = cart.length;
}

function showCart() {
    renderCart();
    showModal('cartModal');
}

function renderCart() {
    const el = document.getElementById('cartItemsList');
    if (cart.length === 0) { el.innerHTML = '<p class="empty-state">Warenkorb ist leer.</p>'; document.getElementById('cartTotalDisplay').textContent='0.00€'; return; }
    let total = 0;
    el.innerHTML = cart.map((item,i) => {
        total += item.price;
        const imgHtml = item.image ? `<img src="${item.image}" style="width:100%;height:100%;object-fit:cover;" alt="">` : '';
        return `<div style="display:flex;align-items:center;gap:.75rem;background:var(--card);border:1px solid var(--border);border-radius:10px;padding:.7rem;margin-bottom:.5rem;">
            <div style="width:48px;height:48px;border-radius:8px;background:linear-gradient(135deg,rgba(0,102,204,.2),rgba(0,204,153,.2));display:flex;align-items:center;justify-content:center;font-size:1.3rem;flex-shrink:0;overflow:hidden;">${imgHtml || item.emoji||'📦'}</div>
            <div style="flex:1;min-width:0;">
                <div style="font-size:.82rem;color:var(--green);font-weight:600;">${item.type==='product'?item.productName:'Upload: '+((item.description||'').substring(0,30)+'…')}</div>
                <div style="font-size:.74rem;color:var(--txt2);">${item.type==='product'?`Menge: ${item.qty}`:`${item.weight}g | ${item.material} | ${item.nozzle==='stainless_02'?'0.2mm SS':'0.4mm HS'}`} ${item.type==='upload'&&item.express==='yes'?'| Express':''}</div>
            </div>
            <div style="text-align:right;">
                <div style="font-weight:700;color:var(--blue);">${item.price.toFixed(2)}€</div>
                <button onclick="removeCartItem(${i})" style="background:none;border:none;color:var(--red);cursor:pointer;font-size:.75rem;">✕</button>
            </div>
        </div>`;
    }).join('');
    document.getElementById('cartTotalDisplay').textContent = total.toFixed(2)+'€';
}

function removeCartItem(i) { cart.splice(i,1); updateCartCount(); renderCart(); }

// ============================================================
// CHECKOUT
// ============================================================
function openCheckout() {
    if (cart.length === 0) return;
    if (!currentUser) { closeModal('cartModal'); showModal('loginModal'); return; }
    closeModal('cartModal');
    appliedDiscount = 0;
    document.getElementById('chDiscRow').classList.add('hidden');
    document.getElementById('couponMsg').classList.add('hidden');
    document.getElementById('privateWarning').classList.add('hidden');
    updateCheckoutSummary();
    showModal('checkoutModal');
}

function onShippingChange() {
    const m = document.getElementById('shippingMethod').value;
    document.getElementById('addressBlock').classList.toggle('hidden', m==='pickup'||m==='');
    updateCheckoutSummary();
}

function onPaymentChange() {
    const m = document.getElementById('paymentMethod').value;
    document.getElementById('privateWarning').classList.toggle('hidden', m!=='private');
}

function applyCoupon() {
    const code = document.getElementById('couponInput').value.trim().toUpperCase();
    const coupons = { 'WELCOME10':0.10, 'SAVE20':0.20, 'FIRST50':0.50 };
    const msgEl = document.getElementById('couponMsg');
    if (coupons[code]) {
        const sub = cart.reduce((s,i)=>s+i.price,0);
        appliedDiscount = sub * coupons[code];
        document.getElementById('chDiscount').textContent = '-'+appliedDiscount.toFixed(2)+'€';
        document.getElementById('chDiscRow').classList.remove('hidden');
        msgEl.textContent = 'Gutschein eingelöst!'; msgEl.classList.remove('hidden');
        updateCheckoutSummary();
    } else {
        msgEl.textContent = 'Ungültiger Code.'; msgEl.classList.remove('hidden'); msgEl.className='msg error';
        setTimeout(()=>{ msgEl.className='msg success hidden'; },2000);
    }
}

function updateCheckoutSummary() {
    const sub = cart.reduce((s,i)=>s+i.price,0);
    const method = document.getElementById('shippingMethod').value;
    let ship = 0;
    if (method==='standard') ship=4.99;
    if (method==='express_ship') ship=9.99;
    document.getElementById('chSubtotal').textContent  = sub.toFixed(2)+'€';
    document.getElementById('chShipping').textContent  = ship.toFixed(2)+'€';
    document.getElementById('chTotal').textContent     = (sub+ship-appliedDiscount).toFixed(2)+'€';
}

async function placeOrder() {
    const ship = document.getElementById('shippingMethod').value;
    const pay  = document.getElementById('paymentMethod').value;
    if (!ship) { showToast('Bitte wählen Sie eine Versandart!'); return; }
    if (!pay)  { showToast('Bitte wählen Sie eine Zahlungsmethode!'); return; }
    if (ship!=='pickup') {
        if (!document.getElementById('chStreet').value.trim()) { showToast('Bitte geben Sie die Straße ein!'); return; }
    }

    const total = parseFloat(document.getElementById('chTotal').textContent);
    const orderData = {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        items: cart,
        shippingMethod: ship,
        address: ship!=='pickup' ? {
            street: document.getElementById('chStreet').value,
            zip:    document.getElementById('chZip').value,
            city:   document.getElementById('chCity').value,
            country:document.getElementById('chCountry').value
        } : null,
        paymentMethod: pay,
        total: total,
        status:'aufgegeben',
        chatLog: chatSessions[currentUser.uid] || [],
        createdAt: new Date().toISOString(),
        notes:''
    };

    try {
        const ref = await window.FB.addDoc(window.FB.col('orders'), orderData);
        orderData.id = ref.id;
        orders.push(orderData);                          // local cache
        if (isAdmin) loadAdminOrders();                  // refresh admin view

        if (pay==='transfer') {
            showToast(`Bestellung aufgegeben! Bitte überweisen Sie ${total.toFixed(2)}€ – Betreff: ${ref.id}`);
        } else {
            showToast(`Bestellung ${ref.id} erfolgreich aufgegeben!`);
        }
    } catch(e) {
        // fallback: push to local sample
        orderData.id = 'local-'+ Date.now();
        orders.push(orderData);
        showToast('Bestellung aufgegeben (offline-Modus)!');
    }

    cart = []; updateCartCount();
    closeModal('checkoutModal');
    // clear chat session after order
    if (currentUser) chatSessions[currentUser.uid] = [];
}

// ============================================================
// CHAT (customer widget)
// ============================================================
function toggleChatWindow() {
    document.getElementById('chatWindow').classList.toggle('active');
}

function sendChat(e) {
    if (e && e.key && e.key !== 'Enter') return;
    const input = document.getElementById('chatInput');
    const text  = input.value.trim();
    if (!text) return;

    // render user message
    appendChatMsg('chatMessages', 'user', text);
    input.value = '';

    // store in session
    if (!currentUser) return;
    if (!chatSessions[currentUser.uid]) chatSessions[currentUser.uid] = [];
    chatSessions[currentUser.uid].push({ sender:'user', text, time:new Date().toISOString() });

    // also persist to Firestore
    try {
        window.FB.setDoc(window.FB.doc('chatSessions', currentUser.uid), { messages: chatSessions[currentUser.uid], email: currentUser.email });
    } catch(e){}

    // auto reply
    setTimeout(() => {
        const reply = 'Vielen Dank! Ihre Nachricht wurde empfangen. Sie werden in Kürze eine Antwort erhalten – bitte prüfen Sie auch Ihren Spam-Ordner! 📧';
        appendChatMsg('chatMessages', 'admin', reply);
        chatSessions[currentUser.uid].push({ sender:'admin', text:reply, time:new Date().toISOString() });
    }, 900);
}

function appendChatMsg(containerId, sender, text) {
    const el  = document.getElementById(containerId);
    const div = document.createElement('div');
    div.className = 'chat-msg ' + sender;
    div.innerHTML = text;
    el.appendChild(div);
    el.scrollTop = el.scrollHeight;
}

// ============================================================
// ADMIN – Orders
// ============================================================
async function loadAdminOrders() {
    try {
        const snap = await window.FB.getDocs(window.FB.col('orders'));
        orders = [];
        snap.forEach(d => orders.push({ id:d.id, ...d.data() }));
        if (orders.length===0) orders = [...SAMPLE_ORDERS];
    } catch(e) { orders = [...SAMPLE_ORDERS]; }
    renderAdminOrders();
}

function renderAdminOrders() {
    const el = document.getElementById('adminOrdersList');
    if (orders.length===0) { el.innerHTML='<p class="empty-state">Keine Bestellungen.</p>'; return; }
    el.innerHTML = orders.map(o => `
        <div class="admin-order-card" onclick="openOrderDetail('${o.id}')">
            <h4>Bestellung #${o.id}</h4>
            <p>👤 ${o.userName||o.userEmail||'Unbekannt'}</p>
            <p>💰 ${Number(o.total).toFixed(2)}€ – ${o.paymentMethod}</p>
            <p>📦 ${(o.items||[]).length} Artikel</p>
            <p>📅 ${new Date(o.createdAt).toLocaleDateString('de-DE')}</p>
            <span class="status-pill ${o.status}">${statusLabel(o.status)}</span>
        </div>`
    ).join('');
}

function openOrderDetail(orderId) {
    const o = orders.find(x=>x.id===orderId);
    if (!o) return;
    currentOrderId = orderId;

    document.getElementById('odId').textContent       = o.id;
    document.getElementById('odCustomer').textContent = (o.userName||'')+' – '+(o.userEmail||'');
    document.getElementById('odPayment').textContent  = o.paymentMethod;
    document.getElementById('odShipping').textContent = o.shippingMethod + (o.address ? ` – ${o.address.street}, ${o.address.zip} ${o.address.city}` : ' (Selbstabholung)');
    document.getElementById('odStatus').value         = o.status;

    // items
    document.getElementById('odItems').innerHTML = (o.items||[]).map(it => {
        const imgHtml = it.image ? `<img src="${it.image}" alt="">` : '';
        return `<div class="order-item-row">
            <div class="oi-img">${imgHtml || (it.emoji||'📦')}</div>
            <div class="oi-info">
                <h5>${it.productName||it.description||'Upload'}</h5>
                <p>${it.type==='product'?`Menge: ${it.qty} | Farbe: ${it.color||'–'}`:`${it.weight}g | ${it.material} | ${it.nozzle==='stainless_02'?'0.2mm SS':'0.4mm HS'}`} – ${Number(it.price).toFixed(2)}€</p>
            </div>
        </div>`
    }).join('');

    // chat log
    const chatLog = o.chatLog || [];
    document.getElementById('odChatLog').innerHTML = chatLog.length===0 ? '<p class="empty-state">Kein Chat.</p>' :
        chatLog.map(m => `<div class="chat-msg ${m.sender}">${m.text}</div>`).join('');

    showModal('orderDetailModal');
}

async function updateOrderStatus() {
    const newStatus = document.getElementById('odStatus').value;
    const o = orders.find(x=>x.id===currentOrderId);
    if (o) o.status = newStatus;
    try { await window.FB.updateDoc(window.FB.doc('orders', currentOrderId), { status:newStatus }); } catch(e){}
    renderAdminOrders();
}

async function sendAdminNotify() {
    const type = document.getElementById('odNotifyType').value;
    const msg  = document.getElementById('odNotifyMsg').value.trim();
    if (!msg) { showToast('Bitte geben Sie eine Nachricht ein!'); return; }

    const o = orders.find(x=>x.id===currentOrderId);
    if (!o) return;

    const prefix = { info:'ℹ️ Info', cost_more:'⬆️ Kostensteigerung', cost_less:'⬇️ Kostensenkung', takes_longer:'🕐 Verzögerung', takes_shorter:'⚡ Früher fertig' };
    const fullMsg = `<strong>${prefix[type]||'Info'}:</strong> ${msg}`;

    // push to order chatLog
    if (!o.chatLog) o.chatLog = [];
    o.chatLog.push({ sender:'admin', text:fullMsg, time:new Date().toISOString() });

    // persist
    try { await window.FB.updateDoc(window.FB.doc('orders', currentOrderId), { chatLog:o.chatLog }); } catch(e){}

    // push to user notifications (via chatSessions)
    if (o.userId) {
        if (!chatSessions[o.userId]) chatSessions[o.userId] = [];
        chatSessions[o.userId].push({ sender:'admin', text:fullMsg, time:new Date().toISOString() });
        try { await window.FB.setDoc(window.FB.doc('chatSessions', o.userId), { messages:chatSessions[o.userId], email:o.userEmail }); } catch(e){}
    }

    document.getElementById('odNotifyMsg').value = '';
    // refresh chat log display
    document.getElementById('odChatLog').innerHTML = o.chatLog.map(m => `<div class="chat-msg ${m.sender}">${m.text}</div>`).join('');
    showToast('Benachrichtigung gesendet!');
}

async function completeOrder() {
    if (!currentOrderId) return;
    // mark completed
    try { await window.FB.updateDoc(window.FB.doc('orders', currentOrderId), { status:'completed' }); } catch(e){}
    // remove from local list
    orders = orders.filter(o=>o.id!==currentOrderId);
    closeModal('orderDetailModal');
    renderAdminOrders();
    showToast('Bestellung als erledigt markiert & entfernt!');
}

// ============================================================
// ADMIN – Products
// ============================================================
async function loadAdminProducts() {
    // re-use products array
    if (products.length===0) { products = SAMPLE_PRODUCTS; }
    renderAdminProducts();
}

function renderAdminProducts() {
    const el = document.getElementById('adminProductList');
    el.innerHTML = products.map(p => {
        const hasImg = p.images && p.images.length>0 && p.images[0];
        return `<div class="admin-product-card">
            <div class="apc-img">${hasImg?`<img src="${p.images[0]}" alt="">`:(p.emoji||'📦')}</div>
            <div class="apc-body">
                <h4>${p.name}</h4>
                <p>${Number(p.price).toFixed(2)}€ – ${p.category}</p>
                <div class="apc-actions">
                    <button class="btn-secondary small" onclick="editProduct('${p.id}')">✎ Edit</button>
                    <button class="btn-danger small" onclick="deleteProduct('${p.id}')">✕</button>
                </div>
            </div>
        </div>`;
    }).join('');
}

function editProduct(id) {
    const p = products.find(x=>x.id===id);
    if (!p) return;
    document.getElementById('apTitle').textContent = '✎ Produkt bearbeiten';
    document.getElementById('apId').value    = p.id;
    document.getElementById('apName').value  = p.name;
    document.getElementById('apDesc').value  = p.description||'';
    document.getElementById('apPrice').value = p.price;
    document.getElementById('apCat').value   = p.category;
    document.getElementById('apWeight').value= p.weight||0;
    document.getElementById('apColors').value= (p.colors||[]).join(', ');
    document.getElementById('apImages').value= (p.images||[]).join(', ');
    document.getElementById('apEmoji').value = p.emoji||'📦';
    showModal('addProductModal');
}

async function saveProduct() {
    const id     = document.getElementById('apId').value;
    const name   = document.getElementById('apName').value.trim();
    const desc   = document.getElementById('apDesc').value.trim();
    const price  = parseFloat(document.getElementById('apPrice').value);
    const cat    = document.getElementById('apCat').value;
    const weight = parseFloat(document.getElementById('apWeight').value)||0;
    const colors = document.getElementById('apColors').value.split(',').map(s=>s.trim()).filter(Boolean);
    const images = document.getElementById('apImages').value.split(',').map(s=>s.trim()).filter(Boolean);
    const emoji  = document.getElementById('apEmoji').value.trim()||'📦';

    if (!name) { showToast('Bitte geben Sie einen Namen ein!'); return; }

    const data = { name, description:desc, price, category:cat, weight, colors, images, emoji, inStock:true };

    if (id) {
        // update
        try { await window.FB.updateDoc(window.FB.doc('products',id), data); } catch(e){}
        const idx = products.findIndex(p=>p.id===id);
        if (idx>-1) products[idx] = { id, ...data };
    } else {
        // create
        let newId = 'local-prod-'+Date.now();
        try { const ref = await window.FB.addDoc(window.FB.col('products'), data); newId=ref.id; } catch(e){}
        products.push({ id:newId, ...data });
    }

    closeModal('addProductModal');
    document.getElementById('apId').value = '';
    document.getElementById('apTitle').textContent = '+ Neues Produkt';
    renderAdminProducts();
    renderProducts();
    showToast('Produkt gespeichert!');
}

async function deleteProduct(id) {
    if (!confirm('Produkt löschen?')) return;
    try { await window.FB.deleteDoc(window.FB.doc('products',id)); } catch(e){}
    products = products.filter(p=>p.id!==id);
    renderAdminProducts();
    renderProducts();
    showToast('Produkt gelöscht!');
}

// ============================================================
// ADMIN – Gallery
// ============================================================
async function loadAdminGallery() {
    if (galleryItems.length===0) galleryItems = SAMPLE_GALLERY;
    renderAdminGallery();
}

function renderAdminGallery() {
    const el = document.getElementById('adminGalleryList');
    el.innerHTML = galleryItems.map(g => {
        const hasImg = g.image && g.image.length>0;
        return `<div class="admin-product-card">
            <div class="apc-img">${hasImg?`<img src="${g.image}" alt="">`:(g.emoji||'🎨')}</div>
            <div class="apc-body">
                <h4>${g.name}</h4>
                <p>${g.description||''}</p>
                <div class="apc-actions">
                    <button class="btn-secondary small" onclick="editGalleryItem('${g.id}')">✎ Edit</button>
                    <button class="btn-danger small" onclick="deleteGalleryItem('${g.id}')">✕</button>
                </div>
            </div>
        </div>`;
    }).join('');
}

function editGalleryItem(id) {
    const g = galleryItems.find(x=>x.id===id);
    if (!g) return;
    document.getElementById('agTitle').textContent = '✎ Galerie bearbeiten';
    document.getElementById('agId').value    = g.id;
    document.getElementById('agName').value  = g.name;
    document.getElementById('agDesc').value  = g.description||'';
    document.getElementById('agImage').value = g.image||'';
    document.getElementById('agEmoji').value = g.emoji||'🎨';
    showModal('addGalleryModal');
}

async function saveGalleryItem() {
    const id    = document.getElementById('agId').value;
    const name  = document.getElementById('agName').value.trim();
    const desc  = document.getElementById('agDesc').value.trim();
    const image = document.getElementById('agImage').value.trim();
    const emoji = document.getElementById('agEmoji').value.trim()||'🎨';
    if (!name) { showToast('Name erforderlich!'); return; }

    const data = { name, description:desc, image, emoji };
    if (id) {
        try { await window.FB.updateDoc(window.FB.doc('gallery',id), data); } catch(e){}
        const idx = galleryItems.findIndex(g=>g.id===id);
        if (idx>-1) galleryItems[idx] = { id, ...data };
    } else {
        let newId = 'local-gal-'+Date.now();
        try { const ref = await window.FB.addDoc(window.FB.col('gallery'), data); newId=ref.id; } catch(e){}
        galleryItems.push({ id:newId, ...data });
    }

    closeModal('addGalleryModal');
    document.getElementById('agId').value='';
    document.getElementById('agTitle').textContent='+ Galerie-Bild';
    renderAdminGallery();
    renderGallery();
    showToast('Galerie-Bild gespeichert!');
}

async function deleteGalleryItem(id) {
    if (!confirm('Galerie-Bild löschen?')) return;
    try { await window.FB.deleteDoc(window.FB.doc('gallery',id)); } catch(e){}
    galleryItems = galleryItems.filter(g=>g.id!==id);
    renderAdminGallery();
    renderGallery();
    showToast('Gelöscht!');
}

// ============================================================
// ADMIN – Chat management
// ============================================================
function loadAdminChats() {
    // Merge chatSessions into a list
    renderAdminChatList();
}

function renderAdminChatList() {
    const el = document.getElementById('adminChatList');
    const sessions = Object.keys(chatSessions);
    if (sessions.length===0) {
        // show sessions from orders chatLog
        const fromOrders = orders.filter(o=>o.chatLog&&o.chatLog.length>0);
        if (fromOrders.length===0) { el.innerHTML='<p class="empty-state">Keine Chats.</p>'; return; }
        el.innerHTML = fromOrders.map(o => {
            const last = o.chatLog[o.chatLog.length-1];
            return `<div class="admin-chat-item" onclick="openAdminChat('order-${o.id}','${o.userEmail||''}','${o.id}')">
                <h5>${o.userEmail||'Unbekannt'}</h5>
                <p>${last.text.substring(0,50)}</p>
            </div>`;
        }).join('');
        return;
    }
    el.innerHTML = sessions.map(uid => {
        const msgs = chatSessions[uid]||[];
        const last = msgs[msgs.length-1]||{};
        return `<div class="admin-chat-item" onclick="openAdminChat('${uid}','','')">
            <h5>${uid.substring(0,30)}</h5>
            <p>${(last.text||'').substring(0,50)}</p>
        </div>`;
    }).join('');
}

function openAdminChat(sessionId, email, orderId) {
    activeChatSession = sessionId;
    let msgs = [];
    if (sessionId.startsWith('order-')) {
        const oid = sessionId.replace('order-','');
        const o = orders.find(x=>x.id===oid);
        msgs = o ? (o.chatLog||[]) : [];
    } else {
        msgs = chatSessions[sessionId]||[];
    }

    // render
    const msgsEl = document.getElementById('adminChatMessages');
    msgsEl.innerHTML = msgs.length===0 ? '<p class="empty-state">Keine Nachrichten.</p>' :
        msgs.map(m => `<div class="chat-msg ${m.sender}">${m.text}</div>`).join('');
    msgsEl.scrollTop = msgsEl.scrollHeight;

    document.getElementById('adminChatInputArea').classList.remove('hidden');
    document.querySelectorAll('.admin-chat-item').forEach(el=>el.classList.remove('active'));
    event && event.target && event.target.closest('.admin-chat-item') && event.target.closest('.admin-chat-item').classList.add('active');
}

function adminSendMsg(e) {
    if (e && e.key && e.key !== 'Enter') return;
    const input = document.getElementById('adminChatInput');
    const text = input.value.trim();
    if (!text || !activeChatSession) return;

    const msg = { sender:'admin', text, time:new Date().toISOString() };

    if (activeChatSession.startsWith('order-')) {
        const oid = activeChatSession.replace('order-','');
        const o = orders.find(x=>x.id===oid);
        if (o) { if(!o.chatLog) o.chatLog=[]; o.chatLog.push(msg); }
        try { window.FB.updateDoc(window.FB.doc('orders',oid), { chatLog:o.chatLog }); } catch(e2){}
    } else {
        if (!chatSessions[activeChatSession]) chatSessions[activeChatSession]=[];
        chatSessions[activeChatSession].push(msg);
        try { window.FB.setDoc(window.FB.doc('chatSessions',activeChatSession), { messages:chatSessions[activeChatSession] }); } catch(e2){}
    }

    appendChatMsg('adminChatMessages', 'admin', text);
    input.value = '';
}

// ============================================================
// ADMIN TAB SWITCHING
// ============================================================
function switchAdminTab(tab) {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.toggle('active', t.dataset.tab===tab));
    ['adminOrders','adminProducts','adminGallery','adminChat'].forEach(id => {
        document.getElementById(id).classList.toggle('active', id==='admin'+tab.charAt(0).toUpperCase()+tab.slice(1));
    });
}

// ============================================================
// PRODUCT TAB SWITCHING (customer)
// ============================================================
function switchProductTab(name, btn) {
    document.querySelectorAll('.tabs .tab').forEach(t=>t.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('internetTab').classList.toggle('active', name==='internet');
    document.getElementById('customTab').classList.toggle('active', name==='custom');
}

// ============================================================
// MODAL HELPERS
// ============================================================
function showModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
// close on backdrop click
document.addEventListener('click', e => {
    if (e.target.classList.contains('modal')) e.target.classList.remove('active');
});

// ============================================================
// TOAST
// ============================================================
function showToast(msg) {
    let t = document.getElementById('__toast');
    if (!t) {
        t = document.createElement('div');
        t.id = '__toast';
        t.style.cssText = 'position:fixed;bottom:5rem;left:50%;transform:translateX(-50%);background:var(--darker);border:1px solid var(--green);color:var(--txt);padding:.7rem 1.4rem;border-radius:10px;z-index:3000;font-size:.88rem;box-shadow:0 4px 18px rgba(0,0,0,.5);transition:.3s;opacity:0;pointer-events:none;';
        document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = '1';
    setTimeout(() => { t.style.opacity='0'; }, 2800);
}

// ============================================================
// HELPERS
// ============================================================
function statusLabel(s) {
    const map = { aufgegeben:'Aufgegeben', bearbeitet:'In Bearbeitung', designed:'Wird designed', gedruckt:'Wird gedruckt', versendet:'Auf dem Weg', fragen:'Fragen offen', abgelehnt:'Abgelehnt', completed:'Erledigt' };
    return map[s]||s;
}

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    loadGallery();
});
