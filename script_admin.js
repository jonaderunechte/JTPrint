/* ===== script_admin.js — Admin Panel: Orders, Products, Gallery, Chat Mgmt ===== */

// ─── LOAD ORDERS ──────────────────────────────────────────────
function loadOrders() {
  // Try Firestore; fallback to SAMPLE_ORDERS from script.js
  if (window.fbDb) {
    window.fbFuncs.getCollectionDocs(window.fbDb, 'orders').then(docs => {
      if (docs.length > 0) orders = docs; else orders = [...SAMPLE_ORDERS];
      renderAdminTab('orders');
    }).catch(() => { orders = [...SAMPLE_ORDERS]; renderAdminTab('orders'); });
  } else {
    orders = [...SAMPLE_ORDERS];
    renderAdminTab('orders');
  }
}

// ─── ADMIN TAB SWITCHING ──────────────────────────────────────
function switchAdminTab(tab) {
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
  document.querySelector(`.admin-tab[data-tab="${tab}"]`).classList.add('active');
  document.getElementById('admin-' + tab).classList.add('active');
  renderAdminTab(tab);
}

function renderAdminTab(tab) {
  if (tab === 'orders')  renderOrders();
  if (tab === 'products') renderProductEditor();
  if (tab === 'gallery') renderGalleryEditor();
}

// ─── ORDER RENDERING ──────────────────────────────────────────
const STATUS_OPTIONS = [
  { val:'pending',     label:'Bestellung wurde aufgegeben' },
  { val:'processing',  label:'Wird bearbeitet' },
  { val:'designing',   label:'Wird designed' },
  { val:'printing',    label:'Wird gedruckt' },
  { val:'shipping',    label:'Wird versendet / Ist auf dem Weg' },
  { val:'questions',   label:'Fragen zu Maßen / Ungeklärte Fragen' },
  { val:'rejected',    label:'Bestellung abgelehnt' },
  { val:'completed',   label:'✓ Fertig' }
];

function renderOrders() {
  const el = document.getElementById('orders-list');
  if (!el) return;
  if (orders.length === 0) { el.innerHTML = '<div class="empty-state"><div class="icon">📭</div><p>Keine aktiven Bestellungen</p></div>'; return; }

  el.innerHTML = orders.map(o => {
    const statusCls = 'status-' + o.status;
    const statusLabel = (STATUS_OPTIONS.find(s => s.val === o.status) || {}).label || o.status;
    const itemsHtml = o.items.map(i => `
      <div class="order-item-thumb">
        <div class="thumb-img">${i.emoji||'📦'}</div>
        <div class="thumb-info">
          <strong>${i.productName || 'Upload'}</strong>
          <span>Menge: ${i.qty||1} | ${i.color ? '<span style="display:inline-block;width:12px;height:12px;background:'+i.color+';border-radius:50%;vertical-align:middle"></span>' : ''} ${i.price.toFixed(2)}€</span>
        </div>
      </div>`
    ).join('');

    const chatHtml = (o.chatHistory || []).map(m => `
      <div class="order-chat-m ${m.sender==='customer'?'c':'a'}">
        <span class="sender">${m.sender==='customer'?'Kunde':'Admin'} – ${formatTime(m.time)}</span><br>${m.text}
      </div>`
    ).join('');

    const selectOpts = STATUS_OPTIONS.map(s =>
      `<option value="${s.val}" ${o.status===s.val?'selected':''}>${s.label}</option>`
    ).join('');

    return `
    <div class="order-card" id="order-${o.id}">
      <div class="order-card-header">
        <div>
          <div class="order-id">${o.id}</div>
          <div class="order-meta">
            👤 ${o.userName || o.userEmail} &nbsp;|&nbsp; 📧 ${o.userEmail}<br>
            🕐 ${formatTime(o.createdAt)} &nbsp;|&nbsp; 💰 ${o.paymentMethod}
            ${o.notes ? '<br>📝 '+o.notes : ''}
          </div>
        </div>
        <div class="status-wrap">
          <span class="status-badge ${statusCls}">${statusLabel}</span>
        </div>
      </div>

      <!-- Items -->
      <div class="order-items">${itemsHtml}</div>

      <!-- Details grid -->
      <div class="order-details">
        <div class="order-detail-item"><div class="od-label">Summe</div><div class="od-val" style="color:var(--green)">${o.total.toFixed(2)}€</div></div>
        <div class="order-detail-item"><div class="od-label">Versand</div><div class="od-val">${o.shippingMethod} (${(o.shipping||0).toFixed(2)}€)</div></div>
        <div class="order-detail-item"><div class="od-label">Zahlung</div><div class="od-val">${o.paymentMethod}</div></div>
        <div class="order-detail-item"><div class="od-label">Status</div><div class="od-val"><span class="status-badge ${statusCls}">${statusLabel}</span></div></div>
      </div>

      <!-- Chat history -->
      ${(o.chatHistory||[]).length > 0 ? `
      <div class="order-chat">
        <div class="order-chat-title">💬 Chat-Verlauf</div>
        <div class="order-chat-msgs">${chatHtml}</div>
      </div>` : ''}

      <!-- Actions row -->
      <div class="order-actions">
        <select class="status-select" onchange="updateOrderStatus('${o.id}', this.value)">${selectOpts}</select>
        <button class="btn btn-sm btn-notify" onclick="openNotifyModal('${o.id}')">📨 Benachrichtigen</button>
        <button class="btn btn-sm btn-complete" onclick="completeOrder('${o.id}')">✓ Fertig & Entfernen</button>
      </div>

      <!-- Admin reply input -->
      <div style="margin-top:.7rem;display:flex;gap:.4rem;align-items:flex-end">
        <div class="fg" style="flex:1;margin-bottom:0"><label style="font-size:.77rem;color:var(--txt2)">Antwort an Kunde</label>
          <input type="text" id="reply-${o.id}" placeholder="Nachricht an Kunde…" style="padding:.5rem .7rem;font-size:.84rem" onkeydown="if(event.key==='Enter')adminReply('${o.id}')">
        </div>
        <button class="btn btn-pri btn-sm" onclick="adminReply('${o.id}')">Senden</button>
      </div>
    </div>`;
  }).join('');
}

// ─── ORDER STATUS UPDATE ──────────────────────────────────────
async function updateOrderStatus(orderId, newStatus) {
  const order = orders.find(o => o.id === orderId);
  if (!order) return;
  
  order.status = newStatus;
  
  if (window.fbDb) {
    const orderRef = window.fbFuncs.doc(window.fbDb, 'orders', orderId);
    await window.fbFuncs.updateDoc(orderRef, { status: newStatus });
  }
  
  renderOrders();
  addNotification('Status geändert', `${orderId} ist jetzt: ${newStatus}`);
}

// In script_admin.js
async function completeOrder(orderId) {
  if (!confirm('Bestellung wirklich als erledigt markieren und löschen?')) return;

  // 1. Aus lokalem Array löschen
  orders = orders.filter(o => o.id !== orderId);
  renderOrders();

  // 2. In Firestore löschen (Das fehlt wahrscheinlich!)
  if (window.fbDb) {
    try {
      const { deleteDoc, doc } = window.fbFuncs;
      await deleteDoc(doc(window.fbDb, 'orders', orderId));
      addNotification('System', 'Bestellung wurde dauerhaft gelöscht.');
    } catch (e) {
      console.error("Löschen fehlgeschlagen:", e);
    }
  }
}

// ─── ADMIN REPLY IN CHAT ──────────────────────────────────────
async function adminReply(orderId) {
  const input = document.getElementById('reply-' + orderId);
  if (!input || !input.value.trim()) return;
  
  const order = orders.find(o => o.id === orderId);
  if (!order) return;
  
  const newMsg = { sender:'admin', text: input.value.trim(), time: new Date().toISOString() };
  if (!order.chatHistory) order.chatHistory = [];
  order.chatHistory.push(newMsg);

  if (window.fbDb) {
    const orderRef = window.fbFuncs.doc(window.fbDb, 'orders', orderId);
    await window.fbFuncs.updateDoc(orderRef, { chatHistory: order.chatHistory });
  }

  input.value = '';
  renderOrders();
  addNotification('Nachricht gesendet', 'An ' + order.userEmail);
}

// ─── NOTIFY MODAL (cost / time changes) ──────────────────────
let notifyOrderId = null;

function openNotifyModal(orderId) {
  notifyOrderId = orderId;
  // reset fields
  document.getElementById('notify-msg').value = '';
  document.querySelectorAll('.notify-type-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('notify-cost-change').classList.add('hidden');
  document.getElementById('notify-time-change').classList.add('hidden');
  openModal('notifyModal');
}

function toggleNotifyType(type) {
  const btn = document.querySelector(`.notify-type-btn[data-type="${type}"]`);
  if (!btn) return;
  btn.classList.toggle('active');

  if (type === 'cost') document.getElementById('notify-cost-change').classList.toggle('hidden', !btn.classList.contains('active'));
  if (type === 'time') document.getElementById('notify-time-change').classList.toggle('hidden', !btn.classList.contains('active'));
}

function sendNotification() {
  const msg       = document.getElementById('notify-msg').value.trim();
  const costChg   = document.getElementById('notify-cost-val')  ? document.getElementById('notify-cost-val').value  : '';
  const timeChg   = document.getElementById('notify-time-val')  ? document.getElementById('notify-time-val').value  : '';
  const order     = orders.find(o => o.id === notifyOrderId);

  let fullMsg = msg;
  if (costChg) fullMsg += '\n💰 Kostenänderung: ' + costChg;
  if (timeChg) fullMsg += '\n⏱️ Zeitänderung: '   + timeChg;

  if (!fullMsg.trim()) { alert('Bitte geben Sie eine Nachricht ein.'); return; }

  // Add to order chat
  if (order) {
    if (!order.chatHistory) order.chatHistory = [];
    order.chatHistory.push({ sender:'admin', text: fullMsg.replace(/\n/g,'<br>'), time: new Date().toISOString() });
  }

  addNotification('Benachrichtigung gesendet', notifyOrderId + ' – ' + (order?order.userEmail:''));
  closeModal('notifyModal');
  renderOrders();
}

// ─── PRODUCT EDITOR ───────────────────────────────────────────
let editingProduct = null;  // null = new, else product object

function renderProductEditor() {
  renderProductList();
  resetProductForm();
}

function renderProductList() {
  const el = document.getElementById('prod-editor-list');
  if (!el) return;
  el.innerHTML = allProducts.map((p,i) => `
    <div class="prod-list-item">
      <div><div class="pli-name">${p.emoji||'📦'} ${p.name}</div><div class="pli-info">${p.price.toFixed(2)}€ | ${p.category}</div></div>
      <div class="pli-actions">
        <button class="pli-edit" onclick="editProduct(${i})">✏️</button>
        <button class="pli-del"  onclick="deleteProduct(${i})">🗑️</button>
      </div>
    </div>`
  ).join('');
}

function resetProductForm() {
  editingProduct = null;
  document.getElementById('pe-name').value        = '';
  document.getElementById('pe-desc').value        = '';
  document.getElementById('pe-price').value       = '';
  document.getElementById('pe-weight').value      = '';
  document.getElementById('pe-emoji').value       = '📦';
  document.getElementById('pe-category').value    = 'internet';
  document.getElementById('pe-instock').checked   = true;
  document.getElementById('pe-colors').innerHTML  = '';
  document.getElementById('pe-images').innerHTML  = '<div class="img-url-item"><input type="text" placeholder="Bild-URL (optional)"><button onclick="removeImgUrl(this)">✕</button></div>';
  document.getElementById('pe-form-title').textContent = 'Neues Produkt hinzufügen';
  document.getElementById('pe-submit-btn').textContent = '+ Produkt hinzufügen';
}

function editProduct(idx) {
  const p = allProducts[idx];
  if (!p) return;
  editingProduct = idx;
  document.getElementById('pe-name').value     = p.name;
  document.getElementById('pe-desc').value     = p.desc || '';
  document.getElementById('pe-price').value    = p.price;
  document.getElementById('pe-weight').value   = p.weight || 0;
  document.getElementById('pe-emoji').value    = p.emoji || '📦';
  document.getElementById('pe-category').value = p.category;
  document.getElementById('pe-instock').checked= p.inStock !== false;

  // colors
  const colEl = document.getElementById('pe-colors');
  colEl.innerHTML = (p.colors||[]).map(c =>
    `<div class="color-chip" style="background:${c}" title="${c}"><span class="remove-chip" onclick="removeColor(this)">✕</span></div>`
  ).join('');

  // images
  const imgEl = document.getElementById('pe-images');
  imgEl.innerHTML = (p.images||[]).map(url =>
    `<div class="img-url-item"><input type="text" value="${url}" placeholder="Bild-URL"><button onclick="removeImgUrl(this)">✕</button></div>`
  ).join('') || '<div class="img-url-item"><input type="text" placeholder="Bild-URL (optional)"><button onclick="removeImgUrl(this)">✕</button></div>';

  document.getElementById('pe-form-title').textContent = 'Produkt bearbeiten';
  document.getElementById('pe-submit-btn').textContent = '💾 Speichern';
}

async function deleteProduct(idx) {
  const product = allProducts[idx];
  if (!confirm(`Produkt "${product.name}" wirklich löschen?`)) return;

  if (window.fbDb && product.id) {
    const prodRef = window.fbFuncs.doc(window.fbDb, 'products', product.id);
    await window.fbFuncs.deleteDoc(prodRef);
  }

  allProducts.splice(idx, 1);
  renderProductEditor();
  renderShop();
}

function addColorChip() {
  const input = document.getElementById('pe-new-color');
  if (!input || !input.value) return;
  const el = document.getElementById('pe-colors');
  const chip = document.createElement('div');
  chip.className = 'color-chip';
  chip.style.background = input.value;
  chip.title = input.value;
  chip.innerHTML = '<span class="remove-chip" onclick="removeColor(this)">✕</span>';
  el.appendChild(chip);
  input.value = '';
}

function removeColor(chipX) {
  chipX.parentElement.remove();
}

function addImgUrl() {
  const el = document.getElementById('pe-images');
  const row = document.createElement('div');
  row.className = 'img-url-item';
  row.innerHTML = '<input type="text" placeholder="Bild-URL"><button onclick="removeImgUrl(this)">✕</button>';
  el.appendChild(row);
}

function removeImgUrl(btn) {
  const parent = btn.parentElement;
  if (document.querySelectorAll('.img-url-item').length > 1) parent.remove();
  else { const inp = parent.querySelector('input'); if (inp) inp.value = ''; }
}

function saveProduct() {
  const name     = document.getElementById('pe-name').value.trim();
  const desc     = document.getElementById('pe-desc').value.trim();
  const price    = parseFloat(document.getElementById('pe-price').value) || 0;
  const weight   = parseFloat(document.getElementById('pe-weight').value) || 0;
  const emoji    = document.getElementById('pe-emoji').value.trim() || '📦';
  const category = document.getElementById('pe-category').value;
  const inStock  = document.getElementById('pe-instock').checked;

  if (!name || price <= 0) { alert('Bitte Name und Preis ausfüllen!'); return; }

  // collect colors
  const colors = [...document.querySelectorAll('#pe-colors .color-chip')].map(c => c.title || c.style.background);
  // collect images
  const images = [...document.querySelectorAll('#pe-images input')].map(i => i.value.trim()).filter(Boolean);

  const product = { name, desc, price, weight, emoji, category, inStock, colors, images, id: editingProduct !== null ? allProducts[editingProduct].id : 'p_'+Date.now() };

  if (editingProduct !== null) {
    allProducts[editingProduct] = product;
  } else {
    allProducts.push(product);
  }

  // Try persist to Firestore
  if (window.fbDb) {
    window.fbFuncs.setDoc(window.fbFuncs.docRef(window.fbDb, 'products', product.id), product).catch(e => console.warn(e));
  }

  renderProductEditor();
  renderShop();
  renderGallery();
  addNotification('Produkt gespeichert', product.name);
}

// ─── GALLERY EDITOR ───────────────────────────────────────────
// Gallery = first N products shown in gallery section.
// Admin can reorder / remove items from gallery or add new ones.

let galleryItems = [];   // indices into allProducts

function renderGalleryEditor() {
  // default: first 6
  if (galleryItems.length === 0) galleryItems = allProducts.map((_,i) => i).slice(0,6);
  const el = document.getElementById('gallery-editor-grid');
  if (!el) return;

  el.innerHTML = galleryItems.map(idx => {
    const p = allProducts[idx];
    if (!p) return '';
    return `<div class="gallery-item">
      <span class="emoji">${p.emoji||'📦'}</span>
      <button class="gallery-del" onclick="removeGalleryItem(${idx})">✕</button>
    </div>`;
  }).join('') + `
    <div class="gallery-add" onclick="openAddGalleryModal()">
      <span style="font-size:1.6rem">+</span>
      <span>Hinzufügen</span>
    </div>`;
}

function removeGalleryItem(prodIdx) {
  galleryItems = galleryItems.filter(i => i !== prodIdx);
  renderGalleryEditor();
  updateGallerySection();
}

function openAddGalleryModal() {
  // show products not yet in gallery
  const available = allProducts.filter((_,i) => !galleryItems.includes(i));
  if (available.length === 0) { alert('Alle Produkte sind bereits in der Galerie!'); return; }
  const el = document.getElementById('gallery-add-list');
  el.innerHTML = available.map((p,i) => {
    const realIdx = allProducts.indexOf(p);
    return `<div class="prod-list-item" onclick="addGalleryItem(${realIdx})">
      <div><div class="pli-name">${p.emoji||'📦'} ${p.name}</div><div class="pli-info">${p.price.toFixed(2)}€</div></div>
      <span class="btn btn-pri btn-sm">+ Hinzu</span>
    </div>`;
  }).join('');
  openModal('addGalleryModal');
}

function addGalleryItem(idx) {
  if (!galleryItems.includes(idx)) galleryItems.push(idx);
  closeModal('addGalleryModal');
  renderGalleryEditor();
  updateGallerySection();
}

function updateGallerySection() {
  // update the live gallery on the shop page
  const grid = document.getElementById('gallery-grid');
  if (!grid) return;
  grid.innerHTML = '';
  galleryItems.forEach(idx => {
    const p = allProducts[idx];
    if (p) grid.appendChild(createProductCard(p));
  });
