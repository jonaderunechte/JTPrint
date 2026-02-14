/* ===== script_admin.js — Admin Panel: Orders, Products, Gallery, Chat Mgmt ===== */

// ─── LOAD ORDERS ──────────────────────────────────────────────
async function loadOrders() {
  if (window.fbDb) {
    try {
      const docs = await window.fbFuncs.getCollectionDocs(window.fbDb, 'orders');
      if (docs.length > 0) { 
        orders = docs; 
      } else { 
        orders = [...SAMPLE_ORDERS];
        // Sample-Orders in Firebase speichern
        for (const o of SAMPLE_ORDERS) {
          await window.fbFuncs.setDoc(
            window.fbFuncs.docRef(window.fbDb, 'orders', o.id), 
            o
          );
        }
      }
      renderAdminTab('orders');
    } catch (err) {
      console.warn('Firestore error:', err);
      orders = [...SAMPLE_ORDERS]; 
      renderAdminTab('orders');
    }
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

// ─── OPEN ORDER DETAIL MODAL ──────────────────────────────────
function openOrderDetail(orderId) {
  const order = orders.find(o => o.id === orderId);
  if (!order) return;
  
  const statusCls = 'status-' + order.status;
  const statusLabel = (STATUS_OPTIONS.find(s => s.val === order.status) || {}).label || order.status;
  
  // Items HTML mit erweiterten Details
  const itemsHtml = order.items.map((item, idx) => {
    let itemDetails = '';
    
    if (item.type === 'upload') {
      itemDetails = `
        <div class="item-detail-card">
          <div class="item-detail-header">
            <div class="item-detail-emoji">${item.emoji || '📁'}</div>
            <div>
              <div class="item-detail-name">${item.productName || 'Custom Upload'}</div>
              <div style="color:var(--txt2);font-size:0.8rem">3D-Druck Upload</div>
            </div>
          </div>
          
          <div class="item-detail-specs">
            <div class="item-spec"><strong>Material:</strong> ${item.material || 'N/A'}</div>
            <div class="item-spec"><strong>Gewicht:</strong> ${item.weight || 'N/A'}g</div>
            <div class="item-spec"><strong>Düse:</strong> ${item.nozzle || 'N/A'}</div>
            <div class="item-spec"><strong>Express:</strong> ${item.express === 'yes' ? 'Ja (+30%)' : 'Nein'}</div>
            <div class="item-spec" style="grid-column: 1/-1"><strong>Preis:</strong> <span style="color:var(--green);font-size:1.1rem">${item.price.toFixed(2)}€</span></div>
          </div>
          
          ${item.desc ? `
            <div class="design-requirements">
              <div class="design-req-title">📝 Beschreibung / Besondere Wünsche:</div>
              <div class="design-req-text">${item.desc}</div>
            </div>
          ` : ''}
          
          ${item.notes ? `
            <div class="design-requirements">
              <div class="design-req-title">💬 Anmerkungen:</div>
              <div class="design-req-text">${item.notes}</div>
            </div>
          ` : ''}
          
          ${item.fileData || item.fileInfo ? `
            <div class="file-download-area">
              <div class="file-download-icon">📥</div>
              <div style="font-weight:600;color:var(--green);margin-bottom:0.5rem">Hochgeladene Datei</div>
              ${(() => {
                // Neue Struktur: fileData Objekt
                if (item.fileData && typeof item.fileData === 'object') {
                  if (item.fileData.type === 'file') {
                    return `
                      <div class="file-info-text">
                        <strong>${item.fileData.fileName}</strong><br>
                        <span style="font-size:0.85rem;opacity:0.8">
                          Größe: ${(item.fileData.fileSize / 1024).toFixed(1)} KB
                          ${item.fileData.fileType ? ' • ' + item.fileData.fileType : ''}
                        </span>
                      </div>
                      <button class="file-download-btn" onclick='downloadFile(${JSON.stringify(item.fileData).replace(/'/g, "\\'")}, "${order.id}")'>
                        ⬇️ Datei herunterladen
                      </button>
                    `;
                  } else if (item.fileData.type === 'link') {
                    return `
                      <div class="file-info-text">${item.fileData.url}</div>
                      <button class="file-download-btn" onclick='downloadFile(${JSON.stringify(item.fileData).replace(/'/g, "\\'")}, "${order.id}")'>
                        🔗 Link öffnen
                      </button>
                    `;
                  }
                }
                // Alte Struktur: fileInfo String (Abwärtskompatibilität)
                else if (item.fileInfo) {
                  return `
                    <div class="file-info-text">${item.fileInfo}</div>
                    <button class="file-download-btn" onclick='downloadFile("${item.fileInfo}", "${order.id}")'>
                      ⬇️ Datei herunterladen
                    </button>
                  `;
                }
                return '';
              })()}
            </div>
          ` : ''}
        </div>
      `;
    } else if (item.type === 'custom-design') {
      itemDetails = `
        <div class="item-detail-card">
          <div class="item-detail-header">
            <div class="item-detail-emoji">${item.emoji || '✏️'}</div>
            <div>
              <div class="item-detail-name">${item.name || 'Custom Design Service'}</div>
              <div style="color:var(--txt2);font-size:0.8rem">Design-Auftrag</div>
            </div>
          </div>
          
          <div class="item-detail-specs">
            <div class="item-spec"><strong>Stunden:</strong> ${item.hours || 'N/A'}h</div>
            <div class="item-spec"><strong>Stundensatz:</strong> ${item.rate || 'N/A'}€/h</div>
            <div class="item-spec"><strong>Fertigung:</strong> ${item.includePrint ? 'Ja (Design + Druck)' : 'Nein (nur Design)'}</div>
            <div class="item-spec" style="grid-column: 1/-1"><strong>Preis:</strong> <span style="color:var(--green);font-size:1.1rem">${item.price.toFixed(2)}€</span></div>
          </div>
          
          ${item.desc ? `
            <div class="design-requirements">
              <div class="design-req-title">✏️ Design-Anforderungen:</div>
              <div class="design-req-text">${item.desc}</div>
            </div>
          ` : ''}
        </div>
      `;
    } else if (item.type === 'product') {
      itemDetails = `
        <div class="item-detail-card">
          <div class="item-detail-header">
            <div class="item-detail-emoji">${item.emoji || '📦'}</div>
            <div>
              <div class="item-detail-name">${item.productName || 'Produkt'}</div>
              <div style="color:var(--txt2);font-size:0.8rem">Shop-Produkt</div>
            </div>
          </div>
          
          <div class="item-detail-specs">
            <div class="item-spec"><strong>Menge:</strong> ${item.qty || 1}</div>
            <div class="item-spec"><strong>Farbe:</strong> ${item.color ? `<span style="display:inline-block;width:16px;height:16px;background:${item.color};border-radius:3px;vertical-align:middle;border:1px solid var(--border)"></span>` : 'Standard'}</div>
            <div class="item-spec"><strong>Produkt-ID:</strong> ${item.productId || 'N/A'}</div>
            <div class="item-spec" style="grid-column: 1/-1"><strong>Preis:</strong> <span style="color:var(--green);font-size:1.1rem">${item.price.toFixed(2)}€</span></div>
          </div>
        </div>
      `;
    }
    
    return itemDetails;
  }).join('');
  
  // Chat HTML
  const chatHtml = (order.chatHistory && order.chatHistory.length > 0) ? 
    order.chatHistory.map(msg => `
      <div class="chat-detail-message ${msg.sender === 'customer' ? 'customer' : 'admin'}">
        <div class="chat-message-header">
          <span class="chat-message-sender">${msg.sender === 'customer' ? '👤 Kunde' : '🛡️ Admin'}</span>
          <span class="chat-message-time">${formatTime(msg.time)}</span>
        </div>
        <div class="chat-message-text">${msg.text}</div>
      </div>
    `).join('') : 
    '<div style="text-align:center;color:var(--txt2);padding:2rem">Kein Chat-Verlauf vorhanden</div>';
  
  // Status Select Options
  const selectOpts = STATUS_OPTIONS.map(s =>
    `<option value="${s.val}" ${order.status===s.val?'selected':''}>${s.label}</option>`
  ).join('');
  
  // Versandadresse
  const shippingAddress = order.shippingAddress ? `
    <div class="order-detail-row">
      <div class="order-detail-label">Straße</div>
      <div class="order-detail-value">${order.shippingAddress.street || 'N/A'}</div>
    </div>
    <div class="order-detail-row">
      <div class="order-detail-label">PLZ / Stadt</div>
      <div class="order-detail-value">${order.shippingAddress.zip || ''} ${order.shippingAddress.city || ''}</div>
    </div>
  ` : '<div style="text-align:center;color:var(--txt2);padding:1rem">Abholung - Keine Lieferadresse</div>';
  
  const content = `
    <h2 style="font-family:'Orbitron',sans-serif;color:var(--green);margin-bottom:1.5rem">
      📦 Bestellung ${order.id}
    </h2>
    
    <div class="order-detail-grid">
      <!-- Linke Spalte: Kundeninfo & Bestelldetails -->
      <div>
        <div class="order-detail-section">
          <h3>👤 Kundeninformationen</h3>
          <div class="order-detail-row">
            <div class="order-detail-label">Name</div>
            <div class="order-detail-value">${order.userName || 'Nicht angegeben'}</div>
          </div>
          <div class="order-detail-row">
            <div class="order-detail-label">E-Mail</div>
            <div class="order-detail-value">${order.userEmail}</div>
          </div>
          <div class="order-detail-row">
            <div class="order-detail-label">User ID</div>
            <div class="order-detail-value" style="font-size:0.75rem;opacity:0.7">${order.userId}</div>
          </div>
        </div>
        
        <div class="order-detail-section" style="margin-top:1rem">
          <h3>📋 Bestelldetails</h3>
          <div class="order-detail-row">
            <div class="order-detail-label">Bestelldatum</div>
            <div class="order-detail-value">${formatTime(order.createdAt)}</div>
          </div>
          <div class="order-detail-row">
            <div class="order-detail-label">Status</div>
            <div class="order-detail-value"><span class="status-badge ${statusCls}">${statusLabel}</span></div>
          </div>
          <div class="order-detail-row">
            <div class="order-detail-label">Zahlungsmethode</div>
            <div class="order-detail-value">${order.paymentMethod}</div>
          </div>
          <div class="order-detail-row">
            <div class="order-detail-label">Versandart</div>
            <div class="order-detail-value">${order.shippingMethod}</div>
          </div>
          <div class="order-detail-row">
            <div class="order-detail-label">Versandkosten</div>
            <div class="order-detail-value">${(order.shipping || 0).toFixed(2)}€</div>
          </div>
          <div class="order-detail-row" style="border-top:2px solid var(--border);margin-top:0.5rem;padding-top:0.8rem">
            <div class="order-detail-label" style="font-size:1.05rem;font-weight:700">Gesamtsumme</div>
            <div class="order-detail-value" style="font-size:1.3rem;color:var(--green)">${order.total.toFixed(2)}€</div>
          </div>
          ${order.notes ? `
          <div class="order-detail-row" style="border-top:1px dashed var(--border);margin-top:0.5rem;padding-top:0.8rem;flex-direction:column;align-items:flex-start">
            <div class="order-detail-label" style="margin-bottom:0.3rem">📝 Notizen:</div>
            <div style="color:var(--txt);font-size:0.85rem;font-weight:normal">${order.notes}</div>
          </div>
          ` : ''}
        </div>
        
        <div class="order-detail-section" style="margin-top:1rem">
          <h3>📍 Lieferadresse</h3>
          ${shippingAddress}
        </div>
      </div>
      
      <!-- Rechte Spalte: Items & Chat -->
      <div>
        <div class="order-detail-section">
          <h3>🛒 Bestellte Items (${order.items.length})</h3>
          ${itemsHtml}
        </div>
        
        <div class="order-detail-section" style="margin-top:1rem">
          <h3>💬 Chat-Verlauf</h3>
          <div class="chat-detail-area">
            ${chatHtml}
          </div>
        </div>
      </div>
    </div>
    
    <!-- Admin Actions -->
    <div class="order-detail-section" style="margin-top:1.5rem">
      <h3>⚙️ Admin-Aktionen</h3>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-top:1rem">
        <div class="fg" style="margin-bottom:0">
          <label>Status ändern</label>
          <select class="status-select" onchange="updateOrderStatus('${order.id}', this.value); updateOrderDetailView('${order.id}')" style="width:100%">
            ${selectOpts}
          </select>
        </div>
        <div style="display:flex;gap:0.5rem;align-items:flex-end">
          <button class="btn btn-sec" onclick="openNotifyModal('${order.id}')">📨 Kunde benachrichtigen</button>
          <button class="btn btn-pri" onclick="completeOrder('${order.id}'); closeModal('orderDetailModal')">✓ Fertig</button>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('order-detail-content').innerHTML = content;
  openModal('orderDetailModal');
}

// Funktion zum Aktualisieren der Detail-Ansicht nach Status-Änderung
function updateOrderDetailView(orderId) {
  const order = orders.find(o => o.id === orderId);
  if (!order) return;
  
  const statusCls = 'status-' + order.status;
  const statusLabel = (STATUS_OPTIONS.find(s => s.val === order.status) || {}).label || order.status;
  
  // Finde alle Status-Badges im Modal und aktualisiere sie
  const modal = document.getElementById('orderDetailModal');
  if (modal) {
    const badges = modal.querySelectorAll('.status-badge');
    badges.forEach(badge => {
      badge.className = 'status-badge ' + statusCls;
      badge.textContent = statusLabel;
    });
  }
}

function renderOrders() {
  const el = document.getElementById('orders-list');
  if (!el) return;
  if (orders.length === 0) { 
    el.innerHTML = '<div class="empty-state"><div class="icon">📭</div><p>Keine aktiven Bestellungen</p></div>'; 
    return; 
  }

  el.innerHTML = orders.map(o => {
    const statusCls = 'status-' + o.status;
    const statusLabel = (STATUS_OPTIONS.find(s => s.val === o.status) || {}).label || o.status;
    const itemsHtml = o.items.map(i => `
      <div class="order-item-thumb">
        <div class="thumb-img">${i.emoji||'📦'}</div>
        <div class="thumb-info">
          <strong>${i.productName || i.name || 'Upload'}</strong>
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
    <div class="order-card order-clickable" id="order-${o.id}" onclick="openOrderDetail('${o.id}')" style="cursor:pointer">
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
      <div class="order-actions" onclick="event.stopPropagation()">
        <select class="status-select" onchange="updateOrderStatus('${o.id}', this.value); event.stopPropagation()">${selectOpts}</select>
        <button class="btn btn-sm btn-notify" onclick="openNotifyModal('${o.id}'); event.stopPropagation()">📨 Benachrichtigen</button>
        <button class="btn btn-sm btn-complete" onclick="completeOrder('${o.id}'); event.stopPropagation()">✓ Fertig & Entfernen</button>
      </div>

      <!-- Admin reply input -->
      <div style="margin-top:.7rem;display:flex;gap:.4rem;align-items:flex-end" onclick="event.stopPropagation()">
        <div class="fg" style="flex:1;margin-bottom:0"><label style="font-size:.77rem;color:var(--txt2)">Antwort an Kunde</label>
          <input type="text" id="reply-${o.id}" placeholder="Nachricht an Kunde…" style="padding:.5rem .7rem;font-size:.84rem" onkeydown="if(event.key==='Enter')adminReply('${o.id}')" onclick="event.stopPropagation()">
        </div>
        <button class="btn btn-pri btn-sm" onclick="adminReply('${o.id}'); event.stopPropagation()">Senden</button>
      </div>
      
      <div class="detail-hint">💡 Klicke auf die Bestellung für erweiterte Details & Datei-Download</div>
    </div>`;
  }).join('');
}

// ─── ORDER STATUS UPDATE ──────────────────────────────────────
async function updateOrderStatus(orderId, newStatus) {
  const order = orders.find(o => o.id === orderId);
  if (!order) return;
  order.status = newStatus;
  
  // In Firebase aktualisieren
  if (window.fbDb) {
    try {
      await window.fbFuncs.updateDoc(
        window.fbFuncs.docRef(window.fbDb, 'orders', orderId),
        { status: newStatus }
      );
    } catch (err) {
      console.error('Status update failed:', err);
    }
  }
  
  renderOrders();
  addNotification('Status geändert', `${orderId} → ${(STATUS_OPTIONS.find(s=>s.val===newStatus)||{}).label}`);
}

// FIXED: deleteDoc war nicht in fbFuncs exportiert
async function completeOrder(orderId) {
  if (!confirm('Bestellung wirklich als erledigt markieren und löschen?')) return;

  // 1. Aus lokalem Array löschen
  orders = orders.filter(o => o.id !== orderId);
  renderOrders();

  // 2. In Firestore löschen
  if (window.fbDb && window.fbFuncs.deleteDoc) {
    try {
      await window.fbFuncs.deleteDoc(
        window.fbFuncs.docRef(window.fbDb, 'orders', orderId)
      );
      addNotification('System', 'Bestellung wurde dauerhaft gelöscht.');
    } catch (e) {
      console.error("Löschen fehlgeschlagen:", e);
    }
  }
}

// ─── FILE DOWNLOAD HELPER ─────────────────────────────────────
function downloadFile(fileData, orderId) {
  // Wenn fileData ein String ist (alte Struktur - Abwärtskompatibilität)
  if (typeof fileData === 'string') {
    if (fileData.startsWith('http://') || fileData.startsWith('https://')) {
      window.open(fileData, '_blank');
      addNotification('Download', 'Datei-Link in neuem Tab geöffnet');
    } else {
      alert(`📁 Datei: ${fileData}\n\nHinweis: Alte Dateistruktur - Datei wurde nicht als Base64 gespeichert.\nBestellung: ${orderId}`);
    }
    return;
  }
  
  // Neue Struktur mit fileData Objekt
  if (!fileData || typeof fileData !== 'object') {
    alert('Keine Datei-Daten vorhanden');
    return;
  }
  
  // Link-Upload
  if (fileData.type === 'link') {
    window.open(fileData.url, '_blank');
    addNotification('Download', 'Datei-Link in neuem Tab geöffnet');
    return;
  }
  
  // File-Upload (Base64 aus Firestore)
  if (fileData.type === 'file' && fileData.base64Data) {
    try {
      // Konvertiere Base64 zurück zu Blob
      const byteCharacters = atob(fileData.base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      
      // Bestimme MIME-Type
      let mimeType = fileData.fileType || 'application/octet-stream';
      if (fileData.fileName.endsWith('.stl')) {
        mimeType = 'model/stl';
      } else if (fileData.fileName.endsWith('.3mf')) {
        mimeType = 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml';
      }
      
      const blob = new Blob([byteArray], { type: mimeType });
      
      // Erstelle Download-Link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileData.fileName || 'download.stl';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      addNotification('Download', `Datei "${fileData.fileName}" wird heruntergeladen (${(fileData.fileSize / 1024).toFixed(1)} KB)`);
    } catch (error) {
      console.error('Download-Fehler:', error);
      alert('Fehler beim Herunterladen der Datei. Bitte kontaktieren Sie den Support.\n\nFehler: ' + error.message);
    }
    return;
  }
  
  // Fallback
  alert('Unbekanntes Datei-Format');
}

// ─── ADMIN REPLY IN CHAT ──────────────────────────────────────
async function adminReply(orderId) {
  const input = document.getElementById('reply-' + orderId);
  if (!input || !input.value.trim()) return;
  
  const order = orders.find(o => o.id === orderId);
  if (!order) return;
  
  if (!order.chatHistory) order.chatHistory = [];
  
  const newMsg = { 
    sender: 'admin', 
    text: input.value.trim(), 
    time: new Date().toISOString() 
  };
  
  order.chatHistory.push(newMsg);
  input.value = '';
  
  // In Firebase speichern
  if (window.fbDb) {
    try {
      await window.fbFuncs.updateDoc(
        window.fbFuncs.docRef(window.fbDb, 'orders', orderId),
        { chatHistory: order.chatHistory }
      );
    } catch (err) {
      console.error('Chat save failed:', err);
    }
  }
  
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

  if (!msg && !costChg && !timeChg) { alert('Bitte Nachricht oder Änderungen eingeben!'); return; }

  const order = orders.find(o => o.id === notifyOrderId);
  if (!order) return;

  let fullMsg = msg;
  if (costChg) fullMsg += `\n💰 Kostenänderung: ${costChg}`;
  if (timeChg) fullMsg += `\n⏱️ Zeitänderung: ${timeChg}`;

  // Add to chat
  if (!order.chatHistory) order.chatHistory = [];
  order.chatHistory.push({ sender:'admin', text: fullMsg, time: new Date().toISOString() });

  // Send notification to customer
  addNotification('Neue Nachricht von Admin', fullMsg, order.userId);

  closeModal('notifyModal');
  renderOrders();
  alert('✅ Kunde wurde benachrichtigt!');
}

// ─── PRODUCT EDITOR ───────────────────────────────────────────
let editingProduct = null;

function renderProductEditor() {
  const el = document.getElementById('prod-editor-list');
  if (!el) return;
  if (allProducts.length === 0) { el.innerHTML = '<p style="color:var(--txt2);text-align:center;padding:1rem">Noch keine Produkte</p>'; return; }

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
  colEl.innerHTML = (p.colors||[]).map(c => {
    const imageUrl = p.colorImages && p.colorImages[c] ? p.colorImages[c] : '';
    return `
      <div class="color-chip-container">
        <div class="color-chip" style="background:${c}" title="${c}">
          <span class="remove-chip" onclick="removeColor(this.parentElement.parentElement)">✕</span>
        </div>
        <input type="text" class="color-image-url" placeholder="Bild-URL für diese Farbe (optional)" data-color="${c}" value="${imageUrl}">
      </div>
    `;
  }).join('');

  // images
  const imgEl = document.getElementById('pe-images');
  imgEl.innerHTML = (p.images||[]).map(url =>
    `<div class="img-url-item"><input type="text" value="${url}" placeholder="Bild-URL"><button onclick="removeImgUrl(this)">✕</button></div>`
  ).join('') || '<div class="img-url-item"><input type="text" placeholder="Bild-URL (optional)"><button onclick="removeImgUrl(this)">✕</button></div>';

  document.getElementById('pe-form-title').textContent = 'Produkt bearbeiten';
  document.getElementById('pe-submit-btn').textContent = '💾 Speichern';
}

async function deleteProduct(idx) {
  if (!confirm('Produkt „' + allProducts[idx].name + '" löschen?')) return;
  
  const product = allProducts[idx];
  
  // Aus lokalem Array löschen
  allProducts.splice(idx, 1);
  
  // Aus Firebase löschen
  if (window.fbDb && product.id && window.fbFuncs.deleteDoc) {
    try {
      await window.fbFuncs.deleteDoc(
        window.fbFuncs.docRef(window.fbDb, 'products', product.id)
      );
    } catch (err) {
      console.error('Delete failed:', err);
    }
  }
  
  renderProductEditor();
  renderShop();
  renderGallery();
}

function addColorChip() {
  const input = document.getElementById('pe-new-color');
  if (!input || !input.value) return;
  const el = document.getElementById('pe-colors');
  
  const chip = document.createElement('div');
  chip.className = 'color-chip-container';
  chip.innerHTML = `
    <div class="color-chip" style="background:${input.value}" title="${input.value}">
      <span class="remove-chip" onclick="removeColor(this.parentElement.parentElement)">✕</span>
    </div>
    <input type="text" class="color-image-url" placeholder="Bild-URL für diese Farbe (optional)" data-color="${input.value}">
  `;
  el.appendChild(chip);
  input.value = '';
}

function removeColor(container) {
  container.remove();
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

async function saveProduct() {
  const name     = document.getElementById('pe-name').value.trim();
  const desc     = document.getElementById('pe-desc').value.trim();
  const price    = parseFloat(document.getElementById('pe-price').value) || 0;
  const weight   = parseFloat(document.getElementById('pe-weight').value) || 0;
  const emoji    = document.getElementById('pe-emoji').value.trim() || '📦';
  const category = document.getElementById('pe-category').value;
  const inStock  = document.getElementById('pe-instock').checked;

  if (!name || price <= 0) { alert('Bitte Name und Preis ausfüllen!'); return; }

  // collect colors and their images
  const colorContainers = [...document.querySelectorAll('#pe-colors .color-chip-container')];
  const colors = colorContainers.map(container => {
    const chip = container.querySelector('.color-chip');
    return chip.title || chip.style.background;
  });
  
  const colorImages = {};
  colorContainers.forEach(container => {
    const chip = container.querySelector('.color-chip');
    const imageInput = container.querySelector('.color-image-url');
    const color = chip.title || chip.style.background;
    colorImages[color] = imageInput ? imageInput.value.trim() : '';
  });
  
  // collect images
  const images = [...document.querySelectorAll('#pe-images input')].map(i => i.value.trim()).filter(Boolean);

  const product = { 
    name, desc, price, weight, emoji, category, inStock, colors, colorImages, images, 
    id: editingProduct !== null ? allProducts[editingProduct].id : 'p_'+Date.now() 
  };

  if (editingProduct !== null) {
    allProducts[editingProduct] = product;
  } else {
    allProducts.push(product);
  }

  // In Firebase speichern
  if (window.fbDb) {
    try {
      await window.fbFuncs.setDoc(
        window.fbFuncs.docRef(window.fbDb, 'products', product.id), 
        product
      );
    } catch (e) {
      console.warn('Product save failed:', e);
    }
  }

  renderProductEditor();
  renderShop();
  renderGallery();
  addNotification('Produkt gespeichert', product.name);
}

// ─── GALLERY EDITOR ───────────────────────────────────────────
let galleryItems = [];

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
}

// ─── EXTENDED ORDER DETAIL MODAL ──────────────────────────────────
function openOrderDetail(orderId) {
  const order = orders.find(o => o.id === orderId);
  if (!order) return;
  
  const statusCls = 'status-' + order.status;
  const statusLabel = (STATUS_OPTIONS.find(s => s.val === order.status) || {}).label || order.status;
  
  // Bestellinformationen
  const orderInfoHtml = `
    <div class="order-info-grid">
      <div class="order-info-item">
        <div class="order-info-label">Bestell-ID</div>
        <div class="order-info-value">${order.id}</div>
      </div>
      <div class="order-info-item">
        <div class="order-info-label">Status</div>
        <div class="order-info-value"><span class="status-badge ${statusCls}">${statusLabel}</span></div>
      </div>
      <div class="order-info-item">
        <div class="order-info-label">Bestelldatum</div>
        <div class="order-info-value">${formatTime(order.createdAt)}</div>
      </div>
      <div class="order-info-item">
        <div class="order-info-label">Kunde</div>
        <div class="order-info-value">${order.userName || order.userEmail}</div>
      </div>
      <div class="order-info-item">
        <div class="order-info-label">E-Mail</div>
        <div class="order-info-value">${order.userEmail}</div>
      </div>
      <div class="order-info-item">
        <div class="order-info-label">Zahlung</div>
        <div class="order-info-value">${order.paymentMethod}</div>
      </div>
      <div class="order-info-item">
        <div class="order-info-label">Versandart</div>
        <div class="order-info-value">${order.shippingMethod} (${(order.shipping||0).toFixed(2)}€)</div>
      </div>
      <div class="order-info-item">
        <div class="order-info-label">Gesamtbetrag</div>
        <div class="order-info-value" style="color:var(--green);font-size:1.2rem;font-weight:700">${order.total.toFixed(2)}€</div>
      </div>
    </div>
  `;
  
  // Items mit Details
  const itemsDetailHtml = order.items.map(item => {
    let specsHtml = '';
    let fileHtml = '';
    let designReqHtml = '';
    
    // Spezifikationen basierend auf Item-Typ
    if (item.type === 'product') {
      specsHtml = `
        <div class="order-item-specs">
          <span class="spec-badge">📦 Produkt</span>
          <span class="spec-badge">Menge: ${item.qty}</span>
          ${item.color ? `<span class="spec-badge">Farbe: <span style="display:inline-block;width:12px;height:12px;background:${item.color};border-radius:50%;vertical-align:middle;margin-left:4px"></span></span>` : ''}
          <span class="spec-badge">Preis: ${item.price.toFixed(2)}€</span>
        </div>
      `;
    } else if (item.type === 'upload') {
      specsHtml = `
        <div class="order-item-specs">
          <span class="spec-badge">📁 Upload</span>
          <span class="spec-badge">${item.material || 'PLA'}</span>
          <span class="spec-badge">${item.weight || 0}g</span>
          ${item.nozzle ? `<span class="spec-badge">Düse: ${item.nozzle}</span>` : ''}
          ${item.express === 'yes' ? `<span class="spec-badge" style="background:rgba(255,170,0,.15);color:#fa0;border-color:rgba(255,170,0,.3)">⚡ Express</span>` : ''}
          <span class="spec-badge">Preis: ${item.price.toFixed(2)}€</span>
        </div>
      `;
      
      // Datei-Download Box
      if (item.fileInfo) {
        const isLink = item.fileInfo.startsWith('http');
        const fileName = isLink ? item.fileInfo.split('/').pop() : item.fileInfo;
        fileHtml = `
          <div class="file-download-box">
            <div class="file-info">
              <div class="file-icon">📄</div>
              <div class="file-details">
                <div class="file-name">${fileName}</div>
                <div class="file-meta">${isLink ? 'Link' : 'Hochgeladene Datei'} • STL/3MF</div>
              </div>
            </div>
            ${isLink ? 
              `<a href="${item.fileInfo}" target="_blank" class="download-btn">🔗 Link öffnen</a>` :
              `<button class="download-btn" onclick="alert('Download-Funktion würde hier die Datei von Firebase Storage herunterladen')">⬇️ Herunterladen</button>`
            }
          </div>
        `;
      }
      
      // Beschreibung & Notizen
      if (item.desc || item.notes) {
        designReqHtml = `
          <div class="design-requirements">
            ${item.desc ? `<div class="requirement-item"><div class="requirement-label">Beschreibung</div><div class="requirement-value">${item.desc}</div></div>` : ''}
            ${item.notes ? `<div class="requirement-item"><div class="requirement-label">Anmerkungen</div><div class="requirement-value">${item.notes}</div></div>` : ''}
          </div>
        `;
      }
    } else if (item.type === 'custom-design') {
      specsHtml = `
        <div class="order-item-specs">
          <span class="spec-badge">✏️ Custom Design</span>
          <span class="spec-badge">${item.hours || 2}h × ${item.rate || 20}€/h</span>
          ${item.includePrint ? `<span class="spec-badge" style="background:rgba(0,204,153,.15);color:var(--green);border-color:rgba(0,204,153,.3)">+ Druck</span>` : ''}
          <span class="spec-badge">Preis: ${item.price.toFixed(2)}€</span>
        </div>
      `;
      
      if (item.desc) {
        designReqHtml = `
          <div class="design-requirements">
            <div class="requirement-item">
              <div class="requirement-label">Projektbeschreibung</div>
              <div class="requirement-value">${item.desc}</div>
            </div>
            <div class="requirement-item">
              <div class="requirement-label">Geschätzter Zeitaufwand</div>
              <div class="requirement-value">${item.hours || 2} Stunden</div>
            </div>
            <div class="requirement-item">
              <div class="requirement-label">Stundensatz</div>
              <div class="requirement-value">${item.rate || 20}€/h</div>
            </div>
            <div class="requirement-item">
              <div class="requirement-label">Druck gewünscht?</div>
              <div class="requirement-value">${item.includePrint ? '✅ Ja, Design + Druck' : '❌ Nein, nur Design'}</div>
            </div>
          </div>
        `;
      }
    }
    
    return `
      <div class="order-item-detail">
        <div class="order-item-icon">${item.emoji || '📦'}</div>
        <div class="order-item-details">
          <div class="order-item-name">${item.productName || item.name || 'Custom Upload'}</div>
          ${specsHtml}
          ${fileHtml}
          ${designReqHtml}
        </div>
      </div>
    `;
  }).join('');
  
  // Chat-Verlauf
  let chatHtml = '';
  if (order.chatHistory && order.chatHistory.length > 0) {
    const chatMsgs = order.chatHistory.map(m => `
      <div class="chat-message-detail ${m.sender === 'customer' ? 'customer' : 'admin'}">
        <div class="chat-sender">${m.sender === 'customer' ? '👤 Kunde' : '🛡️ Admin'}</div>
        <div class="chat-text">${m.text}</div>
        <div class="chat-time">${formatTime(m.time)}</div>
      </div>
    `).join('');
    
    chatHtml = `
      <div class="order-detail-section">
        <h3>💬 Chat-Verlauf</h3>
        <div class="chat-detail-box">
          ${chatMsgs}
        </div>
      </div>
    `;
  }
  
  // Versandadresse
  let addressHtml = '';
  if (order.shippingMethod !== 'pickup' && order.address) {
    addressHtml = `
      <div class="order-detail-section">
        <h3>📍 Versandadresse</h3>
        <div class="order-info-grid">
          <div class="order-info-item">
            <div class="order-info-label">Straße & Hausnummer</div>
            <div class="order-info-value">${order.address.street || 'Nicht angegeben'}</div>
          </div>
          <div class="order-info-item">
            <div class="order-info-label">PLZ</div>
            <div class="order-info-value">${order.address.zip || 'Nicht angegeben'}</div>
          </div>
          <div class="order-info-item">
            <div class="order-info-label">Stadt</div>
            <div class="order-info-value">${order.address.city || 'Nicht angegeben'}</div>
          </div>
        </div>
      </div>
    `;
  } else if (order.shippingMethod === 'pickup') {
    addressHtml = `
      <div class="order-detail-section">
        <h3>🏪 Abholung</h3>
        <div class="order-info-item">
          <div class="order-info-label">Hinweis</div>
          <div class="order-info-value">Der Kunde möchte die Bestellung persönlich abholen.</div>
        </div>
      </div>
    `;
  }
  
  // Notizen
  let notesHtml = '';
  if (order.notes) {
    notesHtml = `
      <div class="order-detail-section">
        <h3>📝 Notizen</h3>
        <div class="order-info-item">
          <div class="order-info-value">${order.notes}</div>
        </div>
      </div>
    `;
  }
  
  // Komplettes Detail-Modal
  const detailContent = `
    <div class="order-detail-section">
      <h3>📋 Bestellinformationen</h3>
      ${orderInfoHtml}
    </div>
    
    <div class="order-detail-section">
      <h3>🛒 Bestellte Artikel (${order.items.length})</h3>
      <div class="order-items-detail">
        ${itemsDetailHtml}
      </div>
    </div>
    
    ${chatHtml}
    ${addressHtml}
    ${notesHtml}
  `;
  
  document.getElementById('order-detail-title').textContent = `📦 Bestellung ${order.id}`;
  document.getElementById('order-detail-content').innerHTML = detailContent;
  openModal('orderDetailModal');
}
