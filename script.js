/* ===== script.js — Core: Firebase, Auth, State, Products, Notifications ===== */

// ─── GLOBAL STATE ─────────────────────────────────────────────
const ADMIN_EMAIL = 'jona.thielgen@gmail.com';

let cart = [];
// In script.js ganz oben
window.currentUser = null;
window.isAdmin = false;
let allProducts = [];
let notifications = [];
let chatMessages = [];   // per-order chat map: { orderId: [...msgs] }
let orders = [];         // live orders (admin)

// ─── SAMPLE PRODUCTS ──────────────────────────────────────────
// Each product can have multiple images (URLs or emoji fallback).
// colors array: hex codes that tint the product images.
const SAMPLE_PRODUCTS = [
  {
    id:'sp1', name:'Smartphone Halterung',
    desc:'Verstellbare Smartphone-Halterung für den Schreibtisch. Kompatibel mit allen gängigen Smartphones. Stabiles Design.',
    price:12.99, category:'internet', weight:45, inStock:true,
    colors:['#000000','#FFFFFF','#0066cc','#ff4444','#00cc99'],
    images:['https://i.imgur.com/placeholder1.jpg'],
    emoji:'📱'
  },
  {
    id:'sp2', name:'Kabelhalter Set (5er)',
    desc:'Praktisches 5er-Set Kabelhalter für einen aufgeräumten Schreibtisch. Selbstklebend, sehr robust.',
    price:8.99, category:'internet', weight:20, inStock:true,
    colors:['#000000','#FFFFFF','#808080'],
    images:[],
    emoji:'🔌'
  },
  {
    id:'sp3', name:'Würfel Organizer',
    desc:'Modularer Würfel-Organizer für Stifte, Büroklammern und Kleinteile. Stapelbar und praktisch.',
    price:15.99, category:'custom', weight:80, inStock:true,
    colors:['#0066cc','#00cc99','#ff4444','#ffaa00','#9933cc'],
    images:[],
    emoji:'📦'
  },
  {
    id:'sp4', name:'Kopfhörer Ständer',
    desc:'Eleganter Kopfhörer-Ständer mit rutschfester Basis. Passend für alle Kopfhörer-Größen.',
    price:18.99, category:'custom', weight:120, inStock:true,
    colors:['#000000','#FFFFFF','#808080','#0066cc'],
    images:[],
    emoji:'🎧'
  },
  {
    id:'sp5', name:'Pflanztopf Mini',
    desc:'Dekorativer Mini-Pflanztopf mit geometrischem Design. Ideal für kleine Sukkulenten.',
    price:9.99, category:'internet', weight:35, inStock:true,
    colors:['#FFFFFF','#00cc99','#ffaa00','#ff69b4'],
    images:[],
    emoji:'🌱'
  },
  {
    id:'sp6', name:'Schlüsselanhänger',
    desc:'Personalisierter Schlüsselanhänger mit Ihrem Namen oder Logo. Robust und langlebig.',
    price:6.99, category:'custom', weight:15, inStock:true,
    colors:['#000000','#0066cc','#ff4444','#00cc99','#ffaa00'],
    images:[],
    emoji:'🔑'
  }
];

// Sample orders for demo (admin view)
const SAMPLE_ORDERS = [
  {
    id:'ORD-2026-001', userId:'user1', userEmail:'max.mustermann@email.de', userName:'Max Mustermann',
    items:[{ type:'product', productId:'sp1', productName:'Smartphone Halterung', emoji:'📱', qty:2, color:'#0066cc', price:25.98 }],
    total:31.97, shipping:5.99, shippingMethod:'standard',
    paymentMethod:'paypal', status:'pending',
    createdAt:'2026-02-02T10:30:00', notes:'Bitte in Blau drucken',
    chatHistory:[
      { sender:'customer', text:'Kann ich auch eine Aufschrift drauf haben?', time:'2026-02-02T10:35:00' },
      { sender:'admin', text:'Klar, was soll darauf stehen?', time:'2026-02-02T10:40:00' },
      { sender:'customer', text:'„Max" bitte', time:'2026-02-02T10:42:00' }
    ]
  },
  {
    id:'ORD-2026-002', userId:'user2', userEmail:'anna.schmidt@email.de', userName:'Anna Schmidt',
    items:[
      { type:'upload', productName:'Custom Upload', emoji:'📁', qty:1, color:null, price:18.40 },
      { type:'product', productId:'sp3', productName:'Würfel Organizer', emoji:'📦', qty:1, color:'#ffaa00', price:15.99 }
    ],
    total:30.38, shipping:5.99, shippingMethod:'standard',
    paymentMethod:'stripe', status:'processing',
    createdAt:'2026-02-01T14:15:00', notes:'STL-Datei separat per E-Mail gesendet',
    chatHistory:[
      { sender:'customer', text:'Hier noch die Maße: 8cm x 5cm x 3cm', time:'2026-02-01T14:20:00' }
    ]
  },
  {
    id:'ORD-2026-003', userId:'user3', userEmail:'thomas.fischer@email.de', userName:'Thomas Fischer',
    items:[{ type:'product', productId:'sp4', productName:'Kopfhörer Ständer', emoji:'🎧', qty:1, color:'#000000', price:18.99 }],
    total:18.99, shipping:0, shippingMethod:'pickup',
    paymentMethod:'privat', status:'printing',
    createdAt:'2026-01-31T09:00:00', notes:'',
    chatHistory:[]
  }
];

// Hilfsfunktion für den roten Punkt am Icon
function updateNotificationBadge() {
  const badge = document.getElementById('notif-badge'); // Sicherstellen, dass die ID im HTML existiert
  const unreadCount = notifications.filter(n => !n.read).length;
  if (badge) {
    badge.textContent = unreadCount;
    badge.classList.toggle('hidden', unreadCount === 0);
  }
}

async function addNotification(title, text, targetUserId = null) {
  const notification = {
    title,
    text,
    time: new Date().toISOString(),
    read: false,
    userId: targetUserId || (window.currentUser ? window.currentUser.uid : 'system')
  };

  notifications.unshift(notification);
  updateNotificationBadge();

  // Firebase Speicherung
  if (window.fbDb && window.fbFuncs && window.currentUser) {
    try {
      await window.fbFuncs.addDoc(window.fbFuncs.collection(window.fbDb, 'notifications'), notification);
    } catch (err) { console.error("Firebase Notif Error:", err); }
  }
}

// Neue Funktion zum Laden beim Start
async function loadProducts() {
  if (window.fbDb) {
    try {
      const docs = await window.fbFuncs.getCollectionDocs(window.fbDb, 'products');
      allProducts = docs.length > 0 ? docs : [...SAMPLE_PRODUCTS];
      renderShop(); // Shop aktualisieren
    } catch (e) { allProducts = [...SAMPLE_PRODUCTS]; }
  } else {
    allProducts = [...SAMPLE_PRODUCTS];
  }
}

  // 1. Lokal hinzufügen (für sofortige Anzeige)
  notifications.unshift(notification);
  updateNotificationBadge();

  // 2. In Firebase speichern, wenn verbunden
  if (window.fbDb && window.fbFuncs && window.currentUser) {
    try {
      await window.fbFuncs.addDoc(window.fbFuncs.collection(window.fbDb, 'notifications'), notification);
    } catch (err) {
      console.error("Fehler beim Speichern der Benachrichtigung:", err);
    }
  }
}

// Funktion zum Laden der Benachrichtigungen (NEU)
async function loadUserNotifications() {
  if (!window.fbDb || !window.currentUser) return;
  
  try {
    // Hier müssten eigentlich Queries genutzt werden, aber für den Anfang laden wir alle 
    // und filtern lokal, falls keine komplexen Firebase-Indexe erstellt sind:
    const allNotifs = await window.fbFuncs.getCollectionDocs(window.fbDb, 'notifications');
    notifications = allNotifs
      .filter(n => n.userId === window.currentUser.uid || n.userId === 'system')
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    updateNotificationBadge();
  } catch (err) {
    console.warn("Benachrichtigungen konnten nicht geladen werden", err);
  }
}
function renderNotifBadge() {
  const unread = notifications.filter(n => !n.read).length;
  const badge = document.getElementById('notif-badge');
  if (badge) { badge.className = 'notif-badge' + (unread > 0 ? ' show' : ''); badge.textContent = unread; }
}
function toggleNotifPanel() {
  const panel = document.getElementById('notif-panel');
  if (!panel) return;
  panel.classList.toggle('open');
  // close user-drop if open
  const ud = document.querySelector('.user-drop');
  if (ud) ud.classList.remove('open');
}
function renderNotifPanel() {
  const list = document.getElementById('notif-list');
  if (!list) return;
  if (notifications.length === 0) { list.innerHTML = '<div class="notif-empty">Keine Benachrichtigungen</div>'; return; }
  list.innerHTML = notifications.map(n => `
    <div class="notif-item ${n.read ? '' : 'unread'}" onclick="markRead(${n.id})">
      <div class="n-title">${n.title}</div>
      <div class="n-body">${n.body}</div>
      <div class="n-time">${formatTime(n.time)}</div>
    </div>
  `).join('');
}
function markRead(id) { const n = notifications.find(x => x.id === id); if (n) n.read = true; renderNotifBadge(); renderNotifPanel(); }
function markAllRead() { notifications.forEach(n => n.read = true); renderNotifBadge(); renderNotifPanel(); }

// ─── UTILITY ──────────────────────────────────────────────────
function formatTime(d) {
  const date = new Date(d);
  return date.toLocaleDateString('de-DE', { day:'2-digit', month:'2-digit' }) + ' ' +
         date.toLocaleTimeString('de-DE', { hour:'2-digit', minute:'2-digit' });
}
function closeAllDropdowns(e) {
  if (!e.target.closest('.user-menu')) { const ud = document.querySelector('.user-drop'); if (ud) ud.classList.remove('open'); }
  if (!e.target.closest('.notif-wrap')) { const np = document.getElementById('notif-panel'); if (np) np.classList.remove('open'); }
}

// ─── FIREBASE INIT ───────────────────────────────────────────
// Loaded via <script type="module"> in index.html.
// window.fbAuth, window.fbDb, window.fbFuncs set there.

// ─── AUTH HANDLERS ────────────────────────────────────────────
async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const bd   = document.getElementById('reg-bd').value;
  const email = document.getElementById('reg-email').value.trim();
  const pw   = document.getElementById('reg-pw').value;
  const pw2  = document.getElementById('reg-pw2').value;
  const errEl = document.getElementById('reg-err');
  const okEl  = document.getElementById('reg-ok');
  errEl.classList.add('hidden'); okEl.classList.add('hidden');

  if (pw !== pw2) { errEl.textContent = 'Passwörter stimmen nicht überein!'; errEl.classList.remove('hidden'); return; }

  try {
    const cred = await window.fbFuncs.createUser(window.fbAuth, email, pw);
    await window.fbFuncs.sendVerifyEmail(cred.user);
    // save profile
    if (window.fbDb) {
      await window.fbFuncs.setDoc(window.fbFuncs.docRef(window.fbDb, 'users', cred.user.uid), { name, birthdate: bd, email, createdAt: new Date().toISOString() });
    }
    okEl.textContent = '✅ Registrierung erfolgreich! Bitte prüfen Sie Ihre E-Mail (auch den Spam-Ordner!) und bestätigen Sie Ihre Adresse.';
    okEl.classList.remove('hidden');
    setTimeout(() => closeModal('registerModal'), 3000);
  } catch (err) {
    errEl.textContent = 'Fehler: ' + (err.message || err);
    errEl.classList.remove('hidden');
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const pw    = document.getElementById('login-pw').value;
  const errEl = document.getElementById('login-err');
  errEl.classList.add('hidden');
  try {
    await window.fbFuncs.signIn(window.fbAuth, email, pw);
    closeModal('loginModal');
  } catch (err) {
    errEl.textContent = 'Fehler: ' + (err.message || err);
    errEl.classList.remove('hidden');
  }
}

async function handleLogout() {
  try {
    await window.fbFuncs.signOutFn(window.fbAuth);
    cart = []; currentUser = null; isAdmin = false;
    updateCartBadge();
    renderNav();
    closeAllPanels();
    showShop();
  } catch (err) { console.error(err); }
}

// ─── NAV RENDERING ────────────────────────────────────────────
function renderNav() {
  const authArea = document.getElementById('nav-auth');
  if (!authArea) return;
  if (currentUser) {
    authArea.innerHTML = `
      <div class="notif-wrap" onclick="toggleNotifPanel()">🔔<span class="notif-badge" id="notif-badge"></span>
        <div class="notif-panel" id="notif-panel"><div class="notif-head">Benachrichtigungen <button onclick="markAllRead()">Alle gelesen</button></div><div id="notif-list"></div></div>
      </div>
      <div class="cart-wrap" onclick="openCart()">🛒<span class="cart-badge">0</span></div>
      <div class="user-menu">
        <button class="user-btn" onclick="document.querySelector('.user-drop').classList.toggle('open')">👤 ${currentUser.email.split('@')[0]} ▾</button>
        <div class="user-drop">
          <button onclick="openSettings()">⚙️ Einstellungen</button>
          ${isAdmin ? '<div class="sep"></div><button onclick="showAdminPanel()" style="color:var(--green);font-weight:600">🛡️ Admin Panel</button>' : ''}
          <div class="sep"></div>
          <button onclick="handleLogout()">🚪 Abmelden</button>
        </div>
      </div>`;
    renderNotifBadge(); renderNotifPanel();
  } else {
    authArea.innerHTML = `<button class="btn btn-sec" onclick="openModal('loginModal')">Anmelden</button>`;
  }
}

// ─── PRODUCT LOADING ──────────────────────────────────────────
function loadProducts() {
  // Try Firestore first; fallback to samples
  if (window.fbDb) {
    window.fbFuncs.getCollectionDocs(window.fbDb, 'products').then(docs => {
      if (docs.length > 0) { allProducts = docs; } else { allProducts = [...SAMPLE_PRODUCTS]; }
      renderShop(); renderGallery();
    }).catch(() => { allProducts = [...SAMPLE_PRODUCTS]; renderShop(); renderGallery(); });
  } else { allProducts = [...SAMPLE_PRODUCTS]; renderShop(); renderGallery(); }
}

function renderShop() {
  const internet = document.getElementById('internet-products');
  const custom   = document.getElementById('custom-products');
  if (!internet || !custom) return;
  internet.innerHTML = ''; custom.innerHTML = '';
  allProducts.forEach(p => {
    const card = createProductCard(p);
    (p.category === 'internet' ? internet : custom).appendChild(card);
  });
}

function createProductCard(p) {
  const div = document.createElement('div');
  div.className = 'prod-card';
  div.onclick = () => openProductDetail(p);
  const imgHtml = (p.images && p.images.length && p.images[0]) ?
    `<img src="${p.images[0]}" alt="${p.name}" onerror="this.style.display='none';this.parentElement.querySelector('.emoji').style.display='flex'">
     <span class="emoji" style="display:none">${p.emoji||'📦'}</span>` :
    `<span class="emoji">${p.emoji||'📦'}</span>`;
  div.innerHTML = `
    <div class="prod-img">${imgHtml}</div>
    <div class="prod-info">
      <h4>${p.name}</h4>
      <p>${(p.desc||'').substring(0,60)}...</p>
      <span class="prod-price">${p.price.toFixed(2)}€</span> &nbsp;
      <span class="${p.inStock?'stock-ok':'stock-no'}">${p.inStock?'✓ Auf Lager':'Nicht verfügbar'}</span>
    </div>`;
  return div;
}

function renderGallery() {
  const grid = document.getElementById('gallery-grid');
  if (!grid) return;
  grid.innerHTML = '';
  allProducts.slice(0, 6).forEach(p => grid.appendChild(createProductCard(p)));
}

// ─── CART ─────────────────────────────────────────────────────
function updateCartBadge() {
  const badge = document.querySelector('.cart-badge');
  if (badge) badge.textContent = cart.length;
}
function openCart() {
  renderCartModal();
  openModal('cartModal');
}
function renderCartModal() {
  const el = document.getElementById('cart-items');
  if (!el) return;
  if (cart.length === 0) { el.innerHTML = '<p style="color:var(--txt2);text-align:center;padding:1rem">Warenkorb ist leer</p>'; document.getElementById('cart-total-val').textContent = '0.00€'; return; }
  let total = 0;
  el.innerHTML = cart.map((item, i) => {
    total += item.price;
    const colorDot = item.color ? `<span style="display:inline-block;width:13px;height:13px;background:${item.color};border-radius:50%;vertical-align:middle;"></span>` : '';
    return `<div style="background:var(--card);padding:.8rem;border-radius:8px;margin-bottom:.5rem;display:flex;justify-content:space-between;align-items:center;">
      <div><strong style="color:var(--green);font-size:.88rem">${item.name||'Custom Upload'}</strong><br>
        <span style="color:var(--txt2);font-size:.8rem">${item.type==='product'?'Menge: '+item.qty+' | ':''} ${colorDot} ${item.material||''} ${item.express==='yes'?'| Express':''}</span></div>
      <div style="text-align:right"><strong style="color:var(--blue)">${item.price.toFixed(2)}€</strong><br>
        <button class="btn btn-danger btn-sm" onclick="removeCartItem(${i})">✕</button></div>
    </div>`;
  }).join('');
  document.getElementById('cart-total-val').textContent = total.toFixed(2) + '€';
}
function removeCartItem(i) { cart.splice(i,1); updateCartBadge(); renderCartModal(); }

// ─── MODAL HELPERS ────────────────────────────────────────────
function openModal(id)  { const m = document.getElementById(id); if(m) m.classList.add('active'); }
function closeModal(id) { const m = document.getElementById(id); if(m) m.classList.remove('active'); }
function closeAllPanels() { document.querySelectorAll('.modal').forEach(m => m.classList.remove('active')); }

// ─── ACCOUNT SETTINGS ─────────────────────────────────────────
function openSettings() {
  document.querySelector('.user-drop').classList.remove('open');
  // populate
  if (currentUser) {
    document.getElementById('set-email').value = currentUser.email || '';
    document.getElementById('set-name').value  = currentUser.displayName || '';
  }
  openModal('settingsModal');
}
async function saveSettings(e) {
  e.preventDefault();
  // In a real app, update Firestore user doc here
  addNotification('Einstellungen gespeichert', 'Ihre Änderungen wurden erfolgreich gespeichert.');
  closeModal('settingsModal');
}
async function changePassword(e) {
  e.preventDefault();
  const oldPw = document.getElementById('set-old-pw').value;
  const newPw = document.getElementById('set-new-pw').value;
  const newPw2 = document.getElementById('set-new-pw2').value;
  const errEl = document.getElementById('set-pw-err');
  errEl.classList.add('hidden');
  if (newPw !== newPw2) { errEl.textContent = 'Neue Passwörter stimmen nicht überein!'; errEl.classList.remove('hidden'); return; }
  try {
    // Firebase reauthenticate + updatePassword would go here
    addNotification('Passwort geändert', 'Ihr Passwort wurde erfolgreich aktualisiert.');
    document.getElementById('changePwForm').reset();
    closeModal('changePwModal');
  } catch (err) { errEl.textContent = 'Fehler: ' + err.message; errEl.classList.remove('hidden'); }
}

// ─── SHOW/HIDE SECTIONS ──────────────────────────────────────
function showShop() {
  document.getElementById('shop-section').classList.remove('hidden');
  document.getElementById('admin-panel').classList.add('hidden');
}
function showAdminPanel() {
  document.querySelector('.user-drop').classList.remove('open');
  document.getElementById('shop-section').classList.add('hidden');
  document.getElementById('admin-panel').classList.remove('hidden');
  // load orders
  if (typeof loadOrders === 'function') loadOrders();
}

// ─── CHECKOUT (continued in script_shop.js, called from there) ─
// proceedToCheckout, applyCoupon, handleCheckout  → script_shop.js

// ─── INIT ON DOM READY ────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('click', closeAllDropdowns);
  loadProducts();
  renderNav();
  // seed sample notifications
  addNotification('Willkommen bei JT Print!', 'Erstellen Sie ein Konto oder melden Sie sich an.');
});
