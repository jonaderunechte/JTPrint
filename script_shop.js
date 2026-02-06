/* ===== script_shop.js — Upload, PriceCalc, ProductDetail, Chat, Checkout ===== */

// ─── FILE UPLOAD HANDLING ────────────────────────────────────
let uploadedFile = null;

function switchUploadTab(tab) {
  document.querySelectorAll('.up-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.up-tab-content').forEach(c => c.classList.remove('active'));
  
  document.querySelector(`.up-tab[onclick*="${tab}"]`).classList.add('active');
  document.getElementById(`upload-${tab}-tab`).classList.add('active');
}

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  uploadedFile = file;
  const preview = document.getElementById('file-preview');
  const fileName = preview.querySelector('.file-name');
  
  fileName.textContent = file.name + ' (' + (file.size / 1024).toFixed(1) + ' KB)';
  preview.classList.remove('hidden');
}

function clearFile() {
  uploadedFile = null;
  document.getElementById('upload-file').value = '';
  document.getElementById('file-preview').classList.add('hidden');
}

// ─── UPLOAD MODAL ─────────────────────────────────────────────
function openUploadModal() {
  if (!window.currentUser) { openModal('loginModal'); return; }
  openModal('uploadModal');
}

// Material & Nozzle logic - FIXED: 0.05€/g statt 0.20€/g
function onMaterialChange() {
  const mat = document.getElementById('upload-material').value;
  const nozzleWrap = document.getElementById('nozzle-wrap');

  if (mat === 'PLA') {
    nozzleWrap.classList.remove('hidden');
  } else {
    nozzleWrap.classList.add('hidden');
    document.getElementById('nozzle-04').checked = true;
  }
  calculatePrice();
}

function calculatePrice() {
  const weightEl = document.getElementById('upload-weight');
  const weight   = parseFloat(weightEl ? weightEl.value : 0) || 0;
  const mat      = document.getElementById('upload-material') ? document.getElementById('upload-material').value : 'PLA';
  const express  = document.getElementById('upload-express')   ? document.getElementById('upload-express').value  : 'no';
  const nozzle02 = document.getElementById('nozzle-02')        ? document.getElementById('nozzle-02').checked     : false;

  const resEl    = document.getElementById('price-result');
  const amtEl    = document.getElementById('price-amount');
  const breakEl  = document.getElementById('price-breakdown');

  if (weight <= 0) { if(resEl) resEl.classList.add('hidden'); return 0; }

  const isPLA       = mat === 'PLA';
  const baseFull    = 8;
  const baseDisc    = isPLA ? 4 : baseFull;   // 50 % only for PLA
  const perGram     = 0.05;  // FIXED: 5ct statt 20ct!
  let   materialAdd = 0;
  if (!isPLA) materialAdd = 10;

  let subtotal = baseDisc + (weight * perGram) + materialAdd + (nozzle02 ? 4 : 0);

  if (express === 'yes') subtotal *= 1.30;

  // ── breakdown HTML ──
  let html = '';
  if (isPLA) {
    html += `Grundpreis: <strong>4€</strong> <span class="disc-badge">-50%</span> <span class="orig-price">8€</span><br>`;
  } else {
    html += `Grundpreis: <strong>${baseFull}€</strong> + Material-Aufpreis: <strong>10€</strong><br>`;
  }
  html += `Material (${weight}g × 0.05€): <strong>${(weight*perGram).toFixed(2)}€</strong><br>`;
  if (nozzle02) html += `Düse 0.2 Stainless Steel: <strong>+4€</strong><br>`;
  if (express === 'yes') html += `Express (+30%): angewendet<br>`;

  if (amtEl) amtEl.textContent = subtotal.toFixed(2) + '€';
  if (breakEl) breakEl.innerHTML = html;
  if (resEl) resEl.classList.remove('hidden');

  return subtotal;
}

function handleUpload(e) {
  e.preventDefault();
  if (!window.currentUser) { openModal('loginModal'); return; }

  const fileTab = document.getElementById('upload-file-tab').classList.contains('active');
  let fileInfo = '';
  
  if (fileTab && uploadedFile) {
    fileInfo = uploadedFile.name;
  } else if (!fileTab) {
    const link = document.getElementById('upload-link').value.trim();
    if (link) fileInfo = link;
  }
  
  if (!fileInfo) {
    alert('Bitte Datei hochladen oder Link angeben!');
    return;
  }

  const desc    = document.getElementById('upload-desc').value;
  const weight  = document.getElementById('upload-weight').value;
  const mat     = document.getElementById('upload-material').value;
  const express = document.getElementById('upload-express').value;
  const nozzle  = document.getElementById('nozzle-02').checked ? '0.2 SS' : '0.4 HS';
  const notes   = document.getElementById('upload-notes').value;
  const price   = calculatePrice();

  cart.push({
    type:'upload', 
    name:'Custom Upload (' + mat + ')',
    fileInfo: fileInfo,
    desc, weight, material:mat, nozzle, express, notes, price
  });
  
  updateCartBadge();
  closeModal('uploadModal');
  document.getElementById('uploadForm').reset();
  document.getElementById('price-result').classList.add('hidden');
  document.getElementById('nozzle-wrap').classList.add('hidden');
  document.getElementById('nozzle-04').checked = true;
  clearFile();
}

// ─── PRODUCT DETAIL MODAL ─────────────────────────────────────
let detProduct   = null;
let detQty       = 1;
let detColor     = '';
let detThumbIdx  = 0;

function openProductDetail(p) {
  detProduct  = p;
  detQty      = 1;
  detColor    = p.colors && p.colors[0] ? p.colors[0] : '#000000';
  detThumbIdx = 0;

  document.getElementById('det-name').textContent        = p.name;
  document.getElementById('det-desc').textContent        = p.desc || '';
  document.getElementById('det-price').textContent       = p.price.toFixed(2) + '€';
  document.getElementById('det-qty').textContent         = '1';

  renderDetImage(p, 0);
  renderDetThumbnails(p);
  renderDetColors(p);

  openModal('productDetailModal');
}

function renderDetImage(p, idx) {
  const wrap = document.getElementById('det-img-wrap');
  if (!wrap) return;
  wrap.innerHTML = `<span class="emoji">${p.emoji || '📦'}</span>`;
  wrap.style.background = `linear-gradient(135deg, ${detColor}22, ${detColor}44)`;
}

function renderDetThumbnails(p) {
  const el = document.getElementById('det-thumbs');
  if (!el) return;
  el.innerHTML = (p.colors || []).slice(0,5).map((c,i) =>
    `<div class="det-thumb ${i===0?'active':''}" style="background:${c}33" onclick="switchDetThumb(${i},'${c}')">
      <span class="emoji" style="font-size:1.1rem">${p.emoji||'📦'}</span></div>`
  ).join('');
}

function switchDetThumb(i, color) {
  detThumbIdx = i;
  detColor    = color;
  document.querySelectorAll('.det-thumb').forEach((t,idx) => t.classList.toggle('active', idx===i));
  const wrap = document.getElementById('det-img-wrap');
  if (wrap) wrap.style.background = `linear-gradient(135deg, ${color}22, ${color}44)`;
  document.querySelectorAll('.col-opt').forEach((c,idx) => c.classList.toggle('active', idx===i));
}

function renderDetColors(p) {
  const el = document.getElementById('det-colors');
  if (!el) return;
  el.innerHTML = (p.colors || []).map((c,i) =>
    `<div class="col-opt ${i===0?'active':''}" style="background:${c}" onclick="pickColor(${i},'${c}')"></div>`
  ).join('');
}

function pickColor(i, color) {
  detColor = color;
  document.querySelectorAll('.col-opt').forEach((c,idx) => c.classList.toggle('active', idx===i));
  document.querySelectorAll('.det-thumb').forEach((t,idx) => t.classList.toggle('active', idx===i));
  detThumbIdx = i;
  const wrap = document.getElementById('det-img-wrap');
  if (wrap) wrap.style.background = `linear-gradient(135deg, ${color}22, ${color}44)`;
}

function changeQty(delta) {
  detQty = Math.max(1, detQty + delta);
  document.getElementById('det-qty').textContent = detQty;
}

function addToCartFromDetail() {
  if (!detProduct) return;
  cart.push({
    type:'product', name:detProduct.name, emoji:detProduct.emoji,
    productId:detProduct.id, qty:detQty, color:detColor,
    price:detProduct.price * detQty
  });
  updateCartBadge();
  closeModal('productDetailModal');
}

// ─── CHAT WIDGET ──────────────────────────────────────────────
let chatOpen = false;

function toggleChat() {
  chatOpen = !chatOpen;
  document.getElementById('chatWin').classList.toggle('open', chatOpen);
}

function sendChat() {
  const input = document.getElementById('chat-input');
  const msg   = input.value.trim();
  if (!msg) return;
  input.value = '';

  appendChatMsg('u', msg);

  setTimeout(() => {
    appendChatMsg('b',
      `Danke für Ihre Nachricht! Ich werde Ihre Anfrage bearbeiten und ggf. nach weiteren Informationen zum Design nachfragen.<br><br>
       <strong>Stundensatz:</strong> 20€/h oder Preisvorschlag – wir können über den Preis verhandeln! 😊<br><br>
       <button class="btn btn-pri btn-sm" onclick="openCustomDesignModal()">Custom Design bestellen</button>`
    );
  }, 1200);
}

function appendChatMsg(type, html) {
  const el = document.getElementById('chat-msgs');
  if (!el) return;
  const div = document.createElement('div');
  div.className = 'chat-m ' + type;
  div.innerHTML = html + `<div class="t">${new Date().toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})}</div>`;
  el.appendChild(div);
  el.scrollTop = el.scrollHeight;
}

function chatKeydown(e) { if (e.key === 'Enter') sendChat(); }

// ─── CUSTOM DESIGN ORDER ──────────────────────────────────────
function openCustomDesign() {
  if (!window.currentUser) { openModal('loginModal'); return; }
  toggleChat();
}

function openCustomDesignModal() {
  closeAllPanels();
  calculateCustomPrice();
  openModal('customDesignModal');
}

function calculateCustomPrice() {
  const hours = parseFloat(document.getElementById('custom-hours').value) || 2;
  const rate = parseFloat(document.getElementById('custom-rate').value) || 20;
  const price = hours * rate;
  document.getElementById('custom-price-amount').textContent = price.toFixed(2) + '€';
}

function handleCustomDesignOrder(e) {
  e.preventDefault();
  if (!window.currentUser) { openModal('loginModal'); return; }

  const desc = document.getElementById('custom-desc').value;
  const hours = parseFloat(document.getElementById('custom-hours').value) || 2;
  const rate = parseFloat(document.getElementById('custom-rate').value) || 20;
  const printToo = document.getElementById('custom-print').value;
  const price = hours * rate;

  cart.push({
    type: 'custom-design',
    name: 'Custom Design Service',
    desc: desc,
    hours: hours,
    rate: rate,
    includePrint: printToo === 'yes',
    price: price,
    emoji: '✏️'
  });

  updateCartBadge();
  closeModal('customDesignModal');
  document.getElementById('customDesignForm').reset();
  calculateCustomPrice();
  
  alert('✅ Custom Design wurde zum Warenkorb hinzugefügt!\n\nNach der Bestellung werden wir uns mit Ihnen in Verbindung setzen, um die Details zu besprechen.');
}

// ─── CHECKOUT ─────────────────────────────────────────────────
let shippingCost = 0;
let discountAmount = 0;

function proceedToCheckout() {
  if (cart.length === 0) return;
  const sub = cart.reduce((s,i) => s + i.price, 0);
  document.getElementById('co-subtotal').textContent = sub.toFixed(2) + '€';
  document.getElementById('co-shipping').textContent = '0.00€';
  document.getElementById('co-discount').textContent = '0.00€';
  document.getElementById('co-total').textContent    = sub.toFixed(2) + '€';
  shippingCost = 0; discountAmount = 0;
  closeModal('cartModal');
  openModal('checkoutModal');
}

function onShippingChange() {
  const method  = document.getElementById('co-shipping-method').value;
  const addrEl  = document.getElementById('co-address-fields');

  if (method === 'pickup') {
    addrEl.classList.add('hidden');
    shippingCost = 0;
  } else if (method === 'standard') {
    addrEl.classList.remove('hidden');
    const totalW = cart.reduce((s,i) => s + ((i.weight||0) * (i.qty||1)), 0);
    if      (totalW < 100) shippingCost = 4.99;
    else if (totalW < 500) shippingCost = 5.99;
    else if (totalW < 1000) shippingCost = 6.99;
    else                   shippingCost = 8.99;
  } else if (method === 'express') {
    addrEl.classList.remove('hidden');
    shippingCost = 9.99;
  }
  document.getElementById('co-shipping').textContent = shippingCost.toFixed(2) + '€';
  recalcTotal();
}

function applyCoupon() {
  const code = document.getElementById('co-coupon').value.toUpperCase().trim();
  const coupons = { 'WELCOME10':0.10, 'SAVE20':0.20, 'FIRST50':0.50 };
  if (coupons[code]) {
    const sub = cart.reduce((s,i) => s + i.price, 0);
    discountAmount = sub * coupons[code];
    document.getElementById('co-discount').textContent = '-' + discountAmount.toFixed(2) + '€';
    recalcTotal();
    alert('✅ Gutschein erfolgreich eingelöst!');
  } else { alert('❌ Ungültiger Gutscheincode'); }
}

function recalcTotal() {
  const sub = cart.reduce((s,i) => s + i.price, 0);
  const total = sub + shippingCost - discountAmount;
  document.getElementById('co-total').textContent = total.toFixed(2) + '€';
}

function onPaymentChange() {
  const pay = document.getElementById('co-payment').value;
  const privWarn = document.getElementById('co-priv-warn');
  if (pay === 'privat') {
    privWarn.classList.remove('hidden');
  } else {
    privWarn.classList.add('hidden');
  }
}

async function handleCheckout(e) {
  e.preventDefault();
  const method  = document.getElementById('co-shipping-method').value;
  const payment = document.getElementById('co-payment').value;

  if (method !== 'pickup') {
    const street = document.getElementById('co-street').value.trim();
    const zip    = document.getElementById('co-zip').value.trim();
    const city   = document.getElementById('co-city').value.trim();
    if (!street || !zip || !city) { alert('Bitte füllen Sie die Lieferadresse aus!'); return; }
  }

  const total = parseFloat(document.getElementById('co-total').textContent.replace('€',''));
  const orderId = 'ORD-' + Date.now();

  // Save to Firestore
  if (window.fbDb && window.currentUser) {
    try {
      const orderData = {
        userId: window.currentUser.uid, 
        userEmail: window.currentUser.email,
        userName: window.currentUser.displayName || window.currentUser.email.split('@')[0],
        items: cart, 
        total, 
        shipping: shippingCost,
        shippingMethod: method, 
        paymentMethod: payment,
        status:'pending', 
        createdAt: new Date().toISOString(),
        chatHistory: []
      };
      await window.fbFuncs.setDoc(
        window.fbFuncs.docRef(window.fbDb, 'orders', orderId),
        orderData
      );
    } catch(err) { 
      console.warn('Firestore save failed', err); 
    }
  }

  // Payment flow
  if (payment === 'paypal') {
    alert('🏦 PayPal-Zahlung wird geöffnet…\n(Demo-Modus – Zahlung wird nicht wirklich verarbeitet)\n\nBestellnummer: ' + orderId);
  } else if (payment === 'stripe') {
    alert('💳 Stripe-Zahlung wird geöffnet…\n(Demo-Modus)\n\nBestellnummer: ' + orderId);
  } else if (payment === 'transfer') {
    alert('🏦 Bitte überweisen Sie ' + total.toFixed(2) + '€ an:\n\nIBAN: DE89 3704 0044 0532 0130 00\nBetreff: ' + orderId);
  } else if (payment === 'privat') {
    alert('✅ Bestellung aufgegeben!\n\nBei der Zahlungsart „Privat" wird die Zahlung persönlich vereinbart.\n\nBestellnummer: ' + orderId);
  }

  // Notify admin
  if (window.isAdmin) addNotification('Neue Bestellung', orderId + ' – ' + total.toFixed(2) + '€');

  cart = [];
  updateCartBadge();
  closeModal('checkoutModal');
  document.getElementById('checkoutForm').reset();
  document.getElementById('co-address-fields').classList.add('hidden');
  document.getElementById('co-priv-warn').classList.add('hidden');
}
