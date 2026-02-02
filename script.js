// Global State
let cart = [];
let currentProduct = null;
let selectedQuantity = 1;
let selectedColor = '';
let allProducts = [];
let chatMessages = [];
let isAdmin = false;
let currentUserData = null;
let currentEditProductId = null;

// Navigate to home
function goToHome() {
    showPublicSite();
    window.location.hash = 'home';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Sample Products
const sampleProducts = [
    {
        id: '1',
        name: 'Smartphone Halterung',
        description: 'Verstellbare Smartphone-Halterung für den Schreibtisch. Kompatibel mit allen gängigen Smartphones.',
        price: 12.99,
        category: 'internet',
        weight: 45,
        colors: ['#000000', '#FFFFFF', '#0066cc', '#ff4444', '#00cc99'],
        image: '📱',
        inStock: true
    },
    {
        id: '2',
        name: 'Kabelhalter Set',
        description: 'Praktisches 5er-Set Kabelhalter für einen aufgeräumten Schreibtisch. Selbstklebend.',
        price: 8.99,
        category: 'internet',
        weight: 20,
        colors: ['#000000', '#FFFFFF', '#808080'],
        image: '🔌',
        inStock: true
    },
    {
        id: '3',
        name: 'Würfel Organizer',
        description: 'Modularer Würfel-Organizer für Stifte, Büroklammern und Kleinteile. Stapelbar.',
        price: 15.99,
        category: 'custom',
        weight: 80,
        colors: ['#0066cc', '#00cc99', '#ff4444', '#ffaa00', '#9933cc'],
        image: '📦',
        inStock: true
    },
    {
        id: '4',
        name: 'Kopfhörer Ständer',
        description: 'Eleganter Kopfhörer-Ständer mit rutschfester Basis. Für alle Kopfhörer-Größen geeignet.',
        price: 18.99,
        category: 'custom',
        weight: 120,
        colors: ['#000000', '#FFFFFF', '#808080', '#0066cc'],
        image: '🎧',
        inStock: true
    },
    {
        id: '5',
        name: 'Pflanztopf Mini',
        description: 'Dekorativer Mini-Pflanztopf mit geometrischem Design. Perfekt für Sukkulenten.',
        price: 9.99,
        category: 'internet',
        weight: 35,
        colors: ['#FFFFFF', '#00cc99', '#ffaa00', '#ff69b4'],
        image: '🌱',
        inStock: true
    },
    {
        id: '6',
        name: 'Schlüsselanhänger Custom',
        description: 'Personalisierter Schlüsselanhänger mit Ihrem Namen oder Logo. Robust und langlebig.',
        price: 6.99,
        category: 'custom',
        weight: 15,
        colors: ['#000000', '#0066cc', '#ff4444', '#00cc99', '#ffaa00'],
        image: '🔑',
        inStock: true
    }
];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadSampleProducts();
});

// Modal Functions
function showLoginModal() {
    document.getElementById('loginModal').classList.add('active');
}

function showRegisterModal() {
    closeModal('loginModal');
    document.getElementById('registerModal').classList.add('active');
}

function showUploadModal() {
    if (!window.firebaseAuth.currentUser) {
        alert('Bitte melden Sie sich zuerst an!');
        showLoginModal();
        return;
    }
    document.getElementById('uploadModal').classList.add('active');
}

function showCustomDesignModal() {
    if (!window.firebaseAuth.currentUser) {
        alert('Bitte melden Sie sich zuerst an!');
        showLoginModal();
        return;
    }
    toggleChat();
}

function showCart() {
    updateCartDisplay();
    document.getElementById('cartModal').classList.add('active');
}

function showSettingsModal() {
    if (!window.firebaseAuth.currentUser || !currentUserData) return;
    
    document.getElementById('settingsName').value = currentUserData.name || '';
    document.getElementById('settingsEmail').value = currentUserData.email || '';
    document.getElementById('settingsMemberSince').value = currentUserData.createdAt ? new Date(currentUserData.createdAt).toLocaleDateString('de-DE') : '';
    
    loadNotifications();
    document.getElementById('settingsModal').classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Tab Switching
function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(tabName + '-tab').classList.add('active');
}

// Admin Panel Functions
function showPublicSite() {
    document.getElementById('publicSite').classList.remove('hidden');
    document.getElementById('adminPanel').classList.add('hidden');
}

function showAdminPanel(section) {
    if (!isAdmin) return;
    
    document.getElementById('publicSite').classList.add('hidden');
    document.getElementById('adminPanel').classList.remove('hidden');
    
    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(s => s.classList.add('hidden'));
    
    // Show selected section
    if (section === 'orders') {
        document.getElementById('adminOrders').classList.remove('hidden');
        loadOrders();
    } else if (section === 'products') {
        document.getElementById('adminProducts').classList.remove('hidden');
        loadAdminProducts();
    } else if (section === 'chat') {
        document.getElementById('adminChat').classList.remove('hidden');
        loadChats();
    }
}

// Load Orders (Admin)
async function loadOrders() {
    if (!isAdmin) return;
    
    try {
        const ordersQuery = await window.firebaseDbFunctions.getDocs(
            window.firebaseDbFunctions.query(
                window.firebaseDbFunctions.collection(window.firebaseDb, 'orders'),
                window.firebaseDbFunctions.orderBy('createdAt', 'desc')
            )
        );
        
        const ordersList = document.getElementById('ordersList');
        ordersList.innerHTML = '';
        
        if (ordersQuery.empty) {
            ordersList.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Keine Bestellungen vorhanden</p>';
            return;
        }
        
        ordersQuery.forEach((doc) => {
            const order = doc.data();
            order.id = doc.id;
            ordersList.appendChild(createOrderCard(order));
        });
    } catch (error) {
        console.error('Error loading orders:', error);
        document.getElementById('ordersList').innerHTML = '<p style="text-align: center; color: var(--red-accent);">Fehler beim Laden der Bestellungen</p>';
    }
}

function createOrderCard(order) {
    const card = document.createElement('div');
    card.className = 'order-card';
    
    const statusClass = `status-${order.status}`;
    const statusText = getStatusText(order.status);
    
    const itemsHtml = order.items.map(item => {
        if (item.type === 'product') {
            return `
                <div class="order-item">
                    <div class="order-item-image">${item.product.image || '📦'}</div>
                    <div style="flex: 1;">
                        <h4 style="color: var(--primary-green);">${item.product.name}</h4>
                        <p style="color: var(--text-secondary); font-size: 0.9rem;">
                            Menge: ${item.quantity} | Farbe: <span style="display: inline-block; width: 15px; height: 15px; background: ${item.color}; border-radius: 50%; vertical-align: middle;"></span>
                        </p>
                        <p style="color: var(--primary-blue); font-weight: 700;">${item.price.toFixed(2)}€</p>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="order-item">
                    <div class="order-item-image">📄</div>
                    <div style="flex: 1;">
                        <h4 style="color: var(--primary-green);">Custom Upload</h4>
                        <p style="color: var(--text-secondary); font-size: 0.9rem;">
                            ${item.weight}g | ${item.material === 'pla' ? 'PLA' : 'Spezialmaterial'} | 
                            ${item.nozzle || '0.4'}mm | ${item.express === 'yes' ? 'Express' : 'Normal'}
                        </p>
                        <p style="color: var(--text-secondary); font-size: 0.85rem; font-style: italic;">${item.description.substring(0, 100)}...</p>
                        <p style="color: var(--primary-blue); font-weight: 700;">${item.price.toFixed(2)}€</p>
                    </div>
                </div>
            `;
        }
    }).join('');
    
    card.innerHTML = `
        <div class="order-header">
            <div>
                <h3 style="color: var(--primary-green); font-family: 'Orbitron', sans-serif;">Bestellung #${order.id.substring(0, 8)}</h3>
                <p style="color: var(--text-secondary); font-size: 0.9rem;">
                    ${new Date(order.createdAt).toLocaleString('de-DE')} | ${order.userEmail}
                </p>
            </div>
            <span class="order-status ${statusClass}">${statusText}</span>
        </div>
        
        <div class="order-items">
            ${itemsHtml}
        </div>
        
        <div style="margin: 1rem 0; padding: 1rem; background: rgba(0, 0, 0, 0.3); border-radius: 8px;">
            <p><strong>Versand:</strong> ${order.shippingMethod === 'pickup' ? 'Selbstabholung' : order.shippingMethod === 'standard' ? 'Standard-Versand' : 'Express-Versand'}</p>
            ${order.address ? `<p><strong>Adresse:</strong> ${order.address.street}, ${order.address.zipCode} ${order.address.city}</p>` : ''}
            <p><strong>Zahlung:</strong> ${getPaymentMethodText(order.paymentMethod)}</p>
            <p style="color: var(--primary-green); font-size: 1.25rem; font-weight: 700; margin-top: 0.5rem;">
                <strong>Gesamt:</strong> ${order.total.toFixed(2)}€
            </p>
        </div>
        
        ${order.chatMessages && order.chatMessages.length > 0 ? `
        <div style="margin: 1rem 0; padding: 1rem; background: rgba(0, 0, 0, 0.3); border-radius: 8px;">
            <h4 style="color: var(--primary-green); margin-bottom: 0.5rem;">📩 Chat-Nachrichten:</h4>
            ${order.chatMessages.map(msg => `
                <div style="margin: 0.5rem 0; padding: 0.5rem; background: rgba(0, 102, 204, 0.1); border-radius: 4px;">
                    <small style="color: var(--text-secondary);">${new Date(msg.timestamp).toLocaleString('de-DE')}</small>
                    <p style="margin: 0.25rem 0;">${msg.text}</p>
                </div>
            `).join('')}
        </div>
        ` : ''}
        
        <div class="order-actions">
            <select onchange="updateOrderStatus('${order.id}', this.value)" style="padding: 0.5rem; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary);">
                <option value="">Status ändern...</option>
                <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Bestellung aufgegeben</option>
                <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Wird bearbeitet</option>
                <option value="designing" ${order.status === 'designing' ? 'selected' : ''}>Wird designed</option>
                <option value="printing" ${order.status === 'printing' ? 'selected' : ''}>Wird gedruckt</option>
                <option value="shipping" ${order.status === 'shipping' ? 'selected' : ''}>Wird versendet / Auf dem Weg</option>
                <option value="questions" ${order.status === 'questions' ? 'selected' : ''}>Ungeklärte Fragen</option>
                <option value="rejected" ${order.status === 'rejected' ? 'selected' : ''}>Bestellung abgelehnt</option>
                <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Abgeschlossen</option>
            </select>
            
            <button class="btn-primary" onclick="messageCustomer('${order.userId}', '${order.userEmail}')">
                💬 Kunde benachrichtigen
            </button>
            
            <button class="btn-secondary" onclick="notifyPriceChange('${order.userId}', '${order.userEmail}', '${order.id}', 'higher')">
                💰 Preis höher
            </button>
            
            <button class="btn-secondary" onclick="notifyPriceChange('${order.userId}', '${order.userEmail}', '${order.id}', 'lower')">
                💰 Preis niedriger
            </button>
            
            <button class="btn-secondary" onclick="notifyTimeChange('${order.userId}', '${order.userEmail}', '${order.id}', 'longer')">
                ⏰ Dauert länger
            </button>
            
            <button class="btn-secondary" onclick="notifyTimeChange('${order.userId}', '${order.userEmail}', '${order.id}', 'shorter')">
                ⏰ Dauert kürzer
            </button>
            
            ${order.status === 'completed' || order.status === 'rejected' ? `
                <button class="btn-danger" onclick="deleteOrder('${order.id}')">
                    🗑️ Bestellung entfernen
                </button>
            ` : ''}
        </div>
    `;
    
    return card;
}

function getStatusText(status) {
    const statusMap = {
        'pending': 'Bestellung aufgegeben',
        'processing': 'Wird bearbeitet',
        'designing': 'Wird designed',
        'printing': 'Wird gedruckt',
        'shipping': 'Auf dem Weg',
        'questions': 'Ungeklärte Fragen',
        'rejected': 'Abgelehnt',
        'completed': 'Abgeschlossen'
    };
    return statusMap[status] || status;
}

function getPaymentMethodText(method) {
    const methodMap = {
        'paypal': 'PayPal',
        'stripe': 'Kreditkarte',
        'transfer': 'Überweisung',
        'private': 'Privat'
    };
    return methodMap[method] || method;
}

async function updateOrderStatus(orderId, newStatus) {
    if (!newStatus) return;
    
    try {
        await window.firebaseDbFunctions.updateDoc(
            window.firebaseDbFunctions.doc(window.firebaseDb, 'orders', orderId),
            { status: newStatus }
        );
        
        // Notify customer
        const orderDoc = await window.firebaseDbFunctions.getDocs(
            window.firebaseDbFunctions.query(
                window.firebaseDbFunctions.collection(window.firebaseDb, 'orders'),
                window.firebaseDbFunctions.where('__name__', '==', orderId)
            )
        );
        
        if (!orderDoc.empty) {
            const order = orderDoc.docs[0].data();
            await sendNotification(order.userId, `Ihre Bestellung #${orderId.substring(0, 8)} wurde aktualisiert: ${getStatusText(newStatus)}`);
        }
        
        loadOrders();
        alert('Status erfolgreich aktualisiert!');
    } catch (error) {
        console.error('Error updating order:', error);
        alert('Fehler beim Aktualisieren des Status');
    }
}

async function deleteOrder(orderId) {
    if (!confirm('Möchten Sie diese Bestellung wirklich löschen?')) return;
    
    try {
        await window.firebaseDbFunctions.deleteDoc(
            window.firebaseDbFunctions.doc(window.firebaseDb, 'orders', orderId)
        );
        loadOrders();
        alert('Bestellung erfolgreich gelöscht!');
    } catch (error) {
        console.error('Error deleting order:', error);
        alert('Fehler beim Löschen der Bestellung');
    }
}

function messageCustomer(userId, userEmail) {
    document.getElementById('messageUserId').value = userId;
    document.getElementById('messageRecipient').value = userEmail;
    document.getElementById('messageCustomerModal').classList.add('active');
}

async function handleSendMessage(event) {
    event.preventDefault();
    
    const userId = document.getElementById('messageUserId').value;
    const message = document.getElementById('messageText').value;
    
    try {
        await sendNotification(userId, message);
        closeModal('messageCustomerModal');
        document.getElementById('messageForm').reset();
        alert('Nachricht erfolgreich gesendet!');
    } catch (error) {
        console.error('Error sending message:', error);
        alert('Fehler beim Senden der Nachricht');
    }
}

async function notifyPriceChange(userId, userEmail, orderId, direction) {
    const priceText = direction === 'higher' ? 'höher ausfallen' : 'niedriger ausfallen';
    const reason = prompt(`Warum wird der Preis ${priceText}?\n\nz.B. "Falsches Gewicht angegeben", "Material aktuell nicht verfügbar", etc.`);
    
    if (!reason) return;
    
    const message = `⚠️ Preisänderung für Bestellung #${orderId.substring(0, 8)}\n\nIhr Auftrag wird voraussichtlich ${priceText} als ursprünglich kalkuliert.\n\nGrund: ${reason}\n\nWir werden Sie mit dem genauen Preis kontaktieren, bevor wir fortfahren.`;
    
    try {
        await sendNotification(userId, message);
        alert('Kunde wurde über die Preisänderung informiert!');
    } catch (error) {
        console.error('Error sending notification:', error);
        alert('Fehler beim Senden der Benachrichtigung');
    }
}

async function notifyTimeChange(userId, userEmail, orderId, direction) {
    const timeText = direction === 'longer' ? 'länger dauern' : 'schneller fertig sein';
    const reason = prompt(`Warum wird es ${timeText}?\n\nz.B. "Komplexeres Design als erwartet", "Drucker schneller verfügbar", etc.`);
    
    if (!reason) return;
    
    const message = `⏰ Zeitänderung für Bestellung #${orderId.substring(0, 8)}\n\nIhr Auftrag wird voraussichtlich ${timeText} als ursprünglich geschätzt.\n\nGrund: ${reason}\n\nWir halten Sie auf dem Laufenden!`;
    
    try {
        await sendNotification(userId, message);
        alert('Kunde wurde über die Zeitänderung informiert!');
    } catch (error) {
        console.error('Error sending notification:', error);
        alert('Fehler beim Senden der Benachrichtigung');
    }
}

async function sendNotification(userId, message) {
    try {
        await window.firebaseDbFunctions.addDoc(
            window.firebaseDbFunctions.collection(window.firebaseDb, 'notifications'),
            {
                userId: userId,
                message: message,
                read: false,
                createdAt: new Date().toISOString()
            }
        );
    } catch (error) {
        console.error('Error sending notification:', error);
    }
}

async function loadNotifications() {
    if (!window.firebaseAuth.currentUser) return;
    
    try {
        const notificationsQuery = await window.firebaseDbFunctions.getDocs(
            window.firebaseDbFunctions.query(
                window.firebaseDbFunctions.collection(window.firebaseDb, 'notifications'),
                window.firebaseDbFunctions.where('userId', '==', window.firebaseAuth.currentUser.uid),
                window.firebaseDbFunctions.orderBy('createdAt', 'desc')
            )
        );
        
        const notificationsList = document.getElementById('notificationsList');
        notificationsList.innerHTML = '';
        
        if (notificationsQuery.empty) {
            notificationsList.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">Keine Benachrichtigungen</p>';
            return;
        }
        
        notificationsQuery.forEach((doc) => {
            const notification = doc.data();
            const div = document.createElement('div');
            div.className = 'notification-item' + (!notification.read ? ' notification-unread' : '');
            div.innerHTML = `
                <p style="color: var(--text-secondary); font-size: 0.875rem;">${new Date(notification.createdAt).toLocaleString('de-DE')}</p>
                <p style="margin: 0.5rem 0;">${notification.message}</p>
                ${!notification.read ? `<button class="btn-secondary" onclick="markNotificationRead('${doc.id}')" style="padding: 0.25rem 0.75rem; font-size: 0.875rem;">Als gelesen markieren</button>` : ''}
            `;
            notificationsList.appendChild(div);
        });
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

async function markNotificationRead(notificationId) {
    try {
        await window.firebaseDbFunctions.updateDoc(
            window.firebaseDbFunctions.doc(window.firebaseDb, 'notifications', notificationId),
            { read: true }
        );
        loadNotifications();
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}

// Product Management (Admin)
async function loadAdminProducts() {
    if (!isAdmin) return;
    
    const adminProductsList = document.getElementById('adminProductsList');
    adminProductsList.innerHTML = '';
    
    allProducts.forEach(product => {
        const card = document.createElement('div');
        card.className = 'admin-product-card';
        
        card.innerHTML = `
            <div class="admin-product-info">
                <h4 style="color: var(--primary-green); font-family: 'Orbitron', sans-serif;">${product.name}</h4>
                <p style="color: var(--text-secondary); font-size: 0.9rem;">${product.description}</p>
                <p style="color: var(--primary-blue); font-weight: 700; margin-top: 0.5rem;">${product.price.toFixed(2)}€ | ${product.weight}g | ${product.category}</p>
            </div>
            <div class="admin-product-actions">
                <button class="btn-primary" onclick="editProduct('${product.id}')" style="padding: 0.5rem 1rem;">✏️ Bearbeiten</button>
                <button class="btn-danger" onclick="deleteProduct('${product.id}')" style="padding: 0.5rem 1rem;">🗑️ Löschen</button>
            </div>
        `;
        
        adminProductsList.appendChild(card);
    });
}

function showAddProductModal() {
    document.getElementById('productModalTitle').textContent = 'Neues Produkt hinzufügen';
    document.getElementById('productForm').reset();
    document.getElementById('editProductId').value = '';
    currentEditProductId = null;
    document.getElementById('addProductModal').classList.add('active');
}

function editProduct(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    document.getElementById('productModalTitle').textContent = 'Produkt bearbeiten';
    document.getElementById('productName').value = product.name;
    document.getElementById('productDescription').value = product.description;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productCategory').value = product.category;
    document.getElementById('productWeight').value = product.weight;
    document.getElementById('productImage').value = product.image;
    document.getElementById('productImages').value = product.images && Array.isArray(product.images) ? product.images.join('\n') : '';
    document.getElementById('productColors').value = product.colors.join(',');
    document.getElementById('productInStock').value = product.inStock.toString();
    document.getElementById('editProductId').value = productId;
    currentEditProductId = productId;
    
    document.getElementById('addProductModal').classList.add('active');
}

async function handleAddProduct(event) {
    event.preventDefault();
    
    const imagesText = document.getElementById('productImages').value.trim();
    const imagesArray = imagesText ? imagesText.split('\n').map(img => img.trim()).filter(img => img) : null;
    
    const productData = {
        name: document.getElementById('productName').value,
        description: document.getElementById('productDescription').value,
        price: parseFloat(document.getElementById('productPrice').value),
        category: document.getElementById('productCategory').value,
        weight: parseInt(document.getElementById('productWeight').value),
        image: document.getElementById('productImage').value,
        images: imagesArray, // Multiple images for color variations
        colors: document.getElementById('productColors').value.split(',').map(c => c.trim()),
        inStock: document.getElementById('productInStock').value === 'true'
    };
    
    try {
        if (currentEditProductId) {
            // Update existing product
            await window.firebaseDbFunctions.updateDoc(
                window.firebaseDbFunctions.doc(window.firebaseDb, 'products', currentEditProductId),
                productData
            );
            
            // Update local array
            const index = allProducts.findIndex(p => p.id === currentEditProductId);
            if (index !== -1) {
                allProducts[index] = { ...allProducts[index], ...productData };
            }
            
            alert('Produkt erfolgreich aktualisiert!');
        } else {
            // Add new product
            const docRef = await window.firebaseDbFunctions.addDoc(
                window.firebaseDbFunctions.collection(window.firebaseDb, 'products'),
                productData
            );
            
            allProducts.push({ id: docRef.id, ...productData });
            alert('Produkt erfolgreich hinzugefügt!');
        }
        
        closeModal('addProductModal');
        loadAdminProducts();
        displayProducts();
        displayGallery();
    } catch (error) {
        console.error('Error saving product:', error);
        alert('Fehler beim Speichern des Produkts');
    }
}

async function deleteProduct(productId) {
    if (!confirm('Möchten Sie dieses Produkt wirklich löschen?')) return;
    
    try {
        await window.firebaseDbFunctions.deleteDoc(
            window.firebaseDbFunctions.doc(window.firebaseDb, 'products', productId)
        );
        
        allProducts = allProducts.filter(p => p.id !== productId);
        loadAdminProducts();
        displayProducts();
        displayGallery();
        alert('Produkt erfolgreich gelöscht!');
    } catch (error) {
        console.error('Error deleting product:', error);
        alert('Fehler beim Löschen des Produkts');
    }
}

// Chat Management (Admin)
async function loadChats() {
    if (!isAdmin) return;
    
    try {
        const chatsQuery = await window.firebaseDbFunctions.getDocs(
            window.firebaseDbFunctions.collection(window.firebaseDb, 'chats')
        );
        
        const chatsList = document.getElementById('chatsList');
        chatsList.innerHTML = '';
        
        if (chatsQuery.empty) {
            chatsList.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Keine Chat-Anfragen vorhanden</p>';
            return;
        }
        
        chatsQuery.forEach((doc) => {
            const chat = doc.data();
            const card = document.createElement('div');
            card.className = 'chat-card';
            
            card.innerHTML = `
                <h4 style="color: var(--primary-green); font-family: 'Orbitron', sans-serif;">Chat mit ${chat.userEmail}</h4>
                <p style="color: var(--text-secondary); font-size: 0.9rem;">${new Date(chat.createdAt).toLocaleString('de-DE')}</p>
                
                <div class="chat-preview">
                    ${chat.messages.map(msg => `
                        <div style="margin-bottom: 0.5rem;">
                            <strong style="color: ${msg.sender === 'user' ? 'var(--primary-blue)' : 'var(--primary-green)'};">${msg.sender === 'user' ? 'Kunde' : 'Admin'}:</strong>
                            <p style="margin: 0.25rem 0 0 1rem; color: var(--text-secondary);">${msg.text}</p>
                        </div>
                    `).join('')}
                </div>
                
                <button class="btn-primary" onclick="messageCustomer('${chat.userId}', '${chat.userEmail}')" style="margin-top: 1rem;">
                    💬 Antworten
                </button>
            `;
            
            chatsList.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading chats:', error);
    }
}

// Product Functions
function loadSampleProducts() {
    allProducts = sampleProducts;
    displayProducts();
    displayGallery();
}

async function loadProducts() {
    try {
        const productsQuery = await window.firebaseDbFunctions.getDocs(
            window.firebaseDbFunctions.collection(window.firebaseDb, 'products')
        );
        
        allProducts = [];
        productsQuery.forEach((doc) => {
            allProducts.push({ id: doc.id, ...doc.data() });
        });
        
        if (allProducts.length === 0) {
            loadSampleProducts();
        } else {
            displayProducts();
            displayGallery();
        }
    } catch (error) {
        console.log('Loading sample products');
        loadSampleProducts();
    }
}

function displayProducts() {
    const internetGrid = document.getElementById('internet-products');
    const customGrid = document.getElementById('custom-products');
    
    internetGrid.innerHTML = '';
    customGrid.innerHTML = '';

    allProducts.forEach(product => {
        const card = createProductCard(product);
        if (product.category === 'internet') {
            internetGrid.appendChild(card);
        } else {
            customGrid.appendChild(card);
        }
    });
}

function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.onclick = () => showProductDetail(product);
    
    const imageContent = product.image.startsWith('http') 
        ? `<img src="${product.image}" alt="${product.name}">` 
        : product.image;
    
    card.innerHTML = `
        <div class="product-image">${imageContent}</div>
        <div class="product-info">
            <h4>${product.name}</h4>
            <p style="color: var(--text-secondary); font-size: 0.9rem;">${product.description.substring(0, 60)}...</p>
            <p class="product-price">${product.price.toFixed(2)}€</p>
            ${product.inStock ? '<span style="color: var(--primary-green); font-size: 0.875rem;">✓ Auf Lager</span>' : '<span style="color: var(--red-accent); font-size: 0.875rem;">Nicht verfügbar</span>'}
        </div>
    `;
    
    return card;
}

function displayGallery() {
    const galleryGrid = document.getElementById('gallery-grid');
    galleryGrid.innerHTML = '';
    
    const galleryItems = allProducts.slice(0, 6);
    
    galleryItems.forEach(product => {
        const card = createProductCard(product);
        galleryGrid.appendChild(card);
    });
}

function showProductDetail(product) {
    currentProduct = product;
    selectedQuantity = 1;
    
    // Handle multiple images or single image
    let imageContent;
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        // Multiple images for different colors
        imageContent = product.images[0].startsWith('http') 
            ? `<img src="${product.images[0]}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: cover;" id="productDetailImageElement">` 
            : `<span id="productDetailImageElement" style="font-size: 4rem;">${product.images[0]}</span>`;
    } else {
        // Single image fallback
        imageContent = product.image.startsWith('http') 
            ? `<img src="${product.image}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: cover;" id="productDetailImageElement">` 
            : `<span id="productDetailImageElement" style="font-size: 4rem;">${product.image}</span>`;
    }
    
    document.getElementById('detailImage').innerHTML = imageContent;
    document.getElementById('detailName').textContent = product.name;
    document.getElementById('detailDescription').textContent = product.description;
    document.getElementById('detailPrice').textContent = product.price.toFixed(2) + '€';
    document.getElementById('quantityDisplay').textContent = '1';
    
    const colorSelector = document.getElementById('colorSelector');
    colorSelector.innerHTML = '';
    
    product.colors.forEach((color, index) => {
        const colorDiv = document.createElement('div');
        colorDiv.className = 'color-option' + (index === 0 ? ' selected' : '');
        colorDiv.style.background = color;
        colorDiv.onclick = () => selectColor(colorDiv, color, index);
        colorSelector.appendChild(colorDiv);
    });
    
    selectedColor = product.colors[0];
    
    document.getElementById('productDetailModal').classList.add('active');
}

function selectColor(element, color, colorIndex) {
    document.querySelectorAll('.color-option').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    selectedColor = color;
    
    // Change product image if multiple images available
    if (currentProduct.images && Array.isArray(currentProduct.images) && currentProduct.images[colorIndex]) {
        const imageElement = document.getElementById('productDetailImageElement');
        if (imageElement) {
            if (currentProduct.images[colorIndex].startsWith('http')) {
                // Update img src
                if (imageElement.tagName === 'IMG') {
                    imageElement.src = currentProduct.images[colorIndex];
                } else {
                    // Replace span with img
                    document.getElementById('detailImage').innerHTML = 
                        `<img src="${currentProduct.images[colorIndex]}" alt="${currentProduct.name}" style="width: 100%; height: 100%; object-fit: cover;" id="productDetailImageElement">`;
                }
            } else {
                // Update emoji/text
                if (imageElement.tagName === 'SPAN') {
                    imageElement.textContent = currentProduct.images[colorIndex];
                } else {
                    // Replace img with span
                    document.getElementById('detailImage').innerHTML = 
                        `<span id="productDetailImageElement" style="font-size: 4rem;">${currentProduct.images[colorIndex]}</span>`;
                }
            }
        }
    }
}

function changeQuantity(delta) {
    selectedQuantity = Math.max(1, selectedQuantity + delta);
    document.getElementById('quantityDisplay').textContent = selectedQuantity;
}

function addDetailProductToCart() {
    if (!currentProduct) return;
    
    cart.push({
        type: 'product',
        product: currentProduct,
        quantity: selectedQuantity,
        color: selectedColor,
        price: currentProduct.price * selectedQuantity
    });
    
    updateCartCount();
    closeModal('productDetailModal');
    alert('Produkt wurde zum Warenkorb hinzugefügt!');
}

// Price Calculator
function calculatePrice() {
    const weight = parseFloat(document.getElementById('weight').value) || 0;
    const material = document.getElementById('material').value;
    const nozzle = document.getElementById('nozzle').value;
    const express = document.getElementById('express').value;

    if (weight === 0) {
        document.getElementById('priceResult').classList.add('hidden');
        return;
    }

    // Check nozzle compatibility
    if (nozzle === '0.2' && material !== 'pla') {
        alert('0.2mm Stainless Steel Nozzle ist nur mit PLA kompatibel!');
        document.getElementById('nozzle').value = '0.4';
        return;
    }

    const isPLA = material === 'pla';
    const basePrice = isPLA ? 4 : 8;
    const pricePerGram = 0.20;
    let total = basePrice + (weight * pricePerGram);

    // Add special material cost (all except standard PLA)
    if (material !== 'pla') {
        total += 10;
    }

    if (nozzle === '0.2') {
        total += 4;
    }

    if (express === 'yes') {
        total *= 1.30;
    }

    // Get material display name
    const materialNames = {
        'pla': 'PLA',
        'tpu': 'TPU',
        'asa': 'ASA',
        'abs': 'ABS',
        'petg': 'PETG',
        'pla-cf': 'PLA Carbon Fiber',
        'petg-cf': 'PETG Carbon Fiber',
        'pla-wood': 'PLA Wood',
        'pla-glow': 'PLA Glow in the Dark',
        'pla-marble': 'PLA Marble',
        'pla-silk': 'PLA Silk'
    };

    let breakdown = `Grundpreis: ${basePrice}€`;
    if (isPLA) {
        breakdown += ' <span class="discount-badge">-50%</span> <span class="original-price">8€</span>';
    }
    breakdown += `<br>Material (${materialNames[material]}): ${(weight * pricePerGram).toFixed(2)}€`;
    if (material !== 'pla') breakdown += `<br>Spezialmaterial: +10€`;
    if (nozzle === '0.2') breakdown += `<br>0.2mm Nozzle: +4€`;
    if (express === 'yes') breakdown += `<br>Express: +30%`;

    document.getElementById('priceAmount').textContent = total.toFixed(2) + '€';
    document.getElementById('priceBreakdown').innerHTML = breakdown;
    document.getElementById('priceResult').classList.remove('hidden');

    return total;
}

// Chat Functions
function toggleChat() {
    const chatWindow = document.getElementById('chatWindow');
    chatWindow.classList.toggle('active');
}

function handleChatKeyPress(event) {
    if (event.key === 'Enter') {
        sendChatMessage();
    }
}

async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    const messagesDiv = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message user';
    messageDiv.textContent = message;
    messagesDiv.appendChild(messageDiv);
    
    input.value = '';
    
    const chatMessage = {
        sender: 'user',
        text: message,
        timestamp: new Date().toISOString()
    };
    
    chatMessages.push(chatMessage);
    
    // Save to Firestore
    try {
        const userId = window.firebaseAuth.currentUser.uid;
        const userEmail = window.firebaseAuth.currentUser.email;
        
        const chatQuery = await window.firebaseDbFunctions.getDocs(
            window.firebaseDbFunctions.query(
                window.firebaseDbFunctions.collection(window.firebaseDb, 'chats'),
                window.firebaseDbFunctions.where('userId', '==', userId)
            )
        );
        
        if (chatQuery.empty) {
            await window.firebaseDbFunctions.addDoc(
                window.firebaseDbFunctions.collection(window.firebaseDb, 'chats'),
                {
                    userId: userId,
                    userEmail: userEmail,
                    messages: [chatMessage],
                    createdAt: new Date().toISOString()
                }
            );
        } else {
            const chatDoc = chatQuery.docs[0];
            const existingMessages = chatDoc.data().messages || [];
            await window.firebaseDbFunctions.updateDoc(
                window.firebaseDbFunctions.doc(window.firebaseDb, 'chats', chatDoc.id),
                {
                    messages: [...existingMessages, chatMessage]
                }
            );
        }
    } catch (error) {
        console.error('Error saving chat message:', error);
    }
    
    setTimeout(() => {
        const responseDiv = document.createElement('div');
        responseDiv.className = 'chat-message admin';
        responseDiv.innerHTML = `Vielen Dank für Ihre Anfrage! Ich werde Ihr Projekt analysieren und Ihnen innerhalb von 24 Stunden ein detailliertes Angebot unterbreiten.<br><br>Basis-Stundensatz: <strong>20€/h</strong><br>Gerne können wir auch über den Preis verhandeln!`;
        messagesDiv.appendChild(responseDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }, 1000);
    
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Authentication
async function handleRegister(event) {
    event.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const birthdate = document.getElementById('registerBirthdate').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const passwordConfirm = document.getElementById('registerPasswordConfirm').value;

    const errorDiv = document.getElementById('registerError');
    const successDiv = document.getElementById('registerSuccess');
    errorDiv.classList.add('hidden');
    successDiv.classList.add('hidden');

    if (password !== passwordConfirm) {
        errorDiv.textContent = 'Passwörter stimmen nicht überein!';
        errorDiv.classList.remove('hidden');
        return;
    }

    try {
        const userCredential = await window.firebaseAuthFunctions.createUserWithEmailAndPassword(
            window.firebaseAuth, email, password
        );

        await window.firebaseAuthFunctions.sendEmailVerification(userCredential.user);

        await window.firebaseDbFunctions.setDoc(
            window.firebaseDbFunctions.doc(window.firebaseDb, 'users', userCredential.user.uid),
            {
                name: name,
                birthdate: birthdate,
                email: email,
                createdAt: new Date().toISOString()
            }
        );

        successDiv.textContent = 'Registrierung erfolgreich!';
        successDiv.classList.remove('hidden');
        document.getElementById('registerEmailInfo').classList.remove('hidden');

        setTimeout(() => {
            closeModal('registerModal');
        }, 5000);
    } catch (error) {
        errorDiv.textContent = 'Fehler: ' + error.message;
        errorDiv.classList.remove('hidden');
    }
}

async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');
    errorDiv.classList.add('hidden');

    try {
        await window.firebaseAuthFunctions.signInWithEmailAndPassword(
            window.firebaseAuth, email, password
        );
        closeModal('loginModal');
    } catch (error) {
        let errorMessage = 'Fehler beim Anmelden';
        
        // User-friendly error messages
        if (error.code === 'auth/invalid-credential' || 
            error.code === 'auth/wrong-password' || 
            error.code === 'auth/user-not-found') {
            errorMessage = 'Falsches Passwort oder E-Mail-Adresse';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Ungültige E-Mail-Adresse';
        } else if (error.code === 'auth/user-disabled') {
            errorMessage = 'Dieser Account wurde deaktiviert';
        } else if (error.code === 'auth/too-many-requests') {
            errorMessage = 'Zu viele fehlgeschlagene Versuche. Bitte versuchen Sie es später erneut';
        }
        
        errorDiv.textContent = errorMessage;
        errorDiv.classList.remove('hidden');
    }
}

async function handleLogout() {
    try {
        await window.firebaseAuthFunctions.signOut(window.firebaseAuth);
        cart = [];
        updateCartCount();
        showPublicSite();
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// Upload Handler
async function handleUpload(event) {
    event.preventDefault();

    const description = document.getElementById('uploadDescription').value;
    const weight = document.getElementById('weight').value;
    const material = document.getElementById('material').value;
    const nozzle = document.getElementById('nozzle').value;
    const express = document.getElementById('express').value;
    const notes = document.getElementById('uploadNotes').value;
    const price = calculatePrice();

    cart.push({
        type: 'upload',
        description: description,
        weight: weight,
        material: material,
        nozzle: nozzle,
        express: express,
        notes: notes,
        price: price
    });

    updateCartCount();
    closeModal('uploadModal');
    alert('Auftrag wurde zum Warenkorb hinzugefügt!');
    
    document.getElementById('uploadForm').reset();
    document.getElementById('priceResult').classList.add('hidden');
}

// Cart Functions
function updateCartCount() {
    const count = cart.length;
    document.querySelector('.cart-count').textContent = count;
}

function updateCartDisplay() {
    const cartItemsDiv = document.getElementById('cartItems');
    let total = 0;

    if (cart.length === 0) {
        cartItemsDiv.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Ihr Warenkorb ist leer</p>';
        document.getElementById('totalAmount').textContent = '0.00€';
        return;
    }

    cartItemsDiv.innerHTML = cart.map((item, index) => {
        total += item.price;
        
        if (item.type === 'product') {
            return `
                <div style="background: var(--card-bg); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <h4 style="color: var(--primary-green);">${item.product.name}</h4>
                            <p style="color: var(--text-secondary); font-size: 0.9rem;">
                                Menge: ${item.quantity} | Farbe: <span style="display: inline-block; width: 15px; height: 15px; background: ${item.color}; border-radius: 50%; vertical-align: middle;"></span>
                            </p>
                        </div>
                        <div style="text-align: right;">
                            <p style="font-size: 1.25rem; font-weight: 700; color: var(--primary-blue);">${item.price.toFixed(2)}€</p>
                            <button onclick="removeFromCart(${index})" style="background: none; border: none; color: #ff4444; cursor: pointer;">Entfernen</button>
                        </div>
                    </div>
                </div>
            `;
        } else {
            return `
                <div style="background: var(--card-bg); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <h4 style="color: var(--primary-green);">Custom Upload</h4>
                            <p style="color: var(--text-secondary); font-size: 0.9rem;">
                                ${item.weight}g | ${item.material === 'pla' ? 'PLA' : 'Spezialmaterial'} | ${item.nozzle}mm | ${item.express === 'yes' ? 'Express' : 'Normal'}
                            </p>
                        </div>
                        <div style="text-align: right;">
                            <p style="font-size: 1.25rem; font-weight: 700; color: var(--primary-blue);">${item.price.toFixed(2)}€</p>
                            <button onclick="removeFromCart(${index})" style="background: none; border: none; color: #ff4444; cursor: pointer;">Entfernen</button>
                        </div>
                    </div>
                </div>
            `;
        }
    }).join('');

    document.getElementById('totalAmount').textContent = total.toFixed(2) + '€';
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartCount();
    updateCartDisplay();
}

function updateShipping() {
    const method = document.getElementById('shippingMethod').value;
    const addressFields = document.getElementById('addressFields');
    const shippingCostEl = document.getElementById('shippingCost');
    
    let shipping = 0;
    
    if (method === 'pickup') {
        addressFields.classList.add('hidden');
        shipping = 0;
    } else if (method === 'standard') {
        addressFields.classList.remove('hidden');
        shipping = 4.99;
    } else if (method === 'express') {
        addressFields.classList.remove('hidden');
        shipping = 9.99;
    }
    
    shippingCostEl.textContent = shipping.toFixed(2) + '€';
    updateCheckoutTotal();
}

function checkPrivatePayment() {
    const method = document.getElementById('paymentMethod').value;
    const warning = document.getElementById('privatePaymentWarning');
    
    if (method === 'private') {
        warning.classList.remove('hidden');
    } else {
        warning.classList.add('hidden');
    }
}

function updateCheckoutTotal() {
    const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
    const shippingText = document.getElementById('shippingCost').textContent;
    const shipping = parseFloat(shippingText.replace('€', '')) || 0;
    const discountText = document.getElementById('discount').textContent;
    const discount = parseFloat(discountText.replace('€', '').replace('-', '')) || 0;
    
    const total = subtotal + shipping - discount;
    
    document.getElementById('checkoutSubtotal').textContent = subtotal.toFixed(2) + '€';
    document.getElementById('checkoutTotal').textContent = total.toFixed(2) + '€';
}

function proceedToCheckout() {
    if (cart.length === 0) {
        alert('Ihr Warenkorb ist leer!');
        return;
    }

    const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
    document.getElementById('checkoutSubtotal').textContent = subtotal.toFixed(2) + '€';
    document.getElementById('shippingCost').textContent = '0.00€';
    document.getElementById('discount').textContent = '0.00€';
    document.getElementById('checkoutTotal').textContent = subtotal.toFixed(2) + '€';

    closeModal('cartModal');
    document.getElementById('checkoutModal').classList.add('active');
}

function applyCoupon() {
    const code = document.getElementById('couponCode').value.toUpperCase();
    const discountEl = document.getElementById('discount');
    
    const coupons = {
        'WELCOME10': 0.10,
        'SAVE20': 0.20,
        'FIRST50': 0.50
    };
    
    if (coupons[code]) {
        const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
        const discount = subtotal * coupons[code];
        discountEl.textContent = '-' + discount.toFixed(2) + '€';
        updateCheckoutTotal();
        alert('Gutschein erfolgreich eingelöst!');
    } else {
        alert('Ungültiger Gutscheincode');
    }
}

async function handleCheckout(event) {
    event.preventDefault();

    const shippingMethod = document.getElementById('shippingMethod').value;
    const paymentMethod = document.getElementById('paymentMethod').value;
    
    let address = null;
    if (shippingMethod !== 'pickup') {
        address = {
            street: document.getElementById('street').value,
            zipCode: document.getElementById('zipCode').value,
            city: document.getElementById('city').value,
            country: document.getElementById('country').value
        };
    }

    const orderData = {
        userId: window.firebaseAuth.currentUser.uid,
        userEmail: window.firebaseAuth.currentUser.email,
        items: cart,
        shippingMethod: shippingMethod,
        address: address,
        paymentMethod: paymentMethod,
        total: parseFloat(document.getElementById('checkoutTotal').textContent),
        status: 'pending',
        chatMessages: chatMessages,
        createdAt: new Date().toISOString()
    };

    try {
        const orderRef = await window.firebaseDbFunctions.addDoc(
            window.firebaseDbFunctions.collection(window.firebaseDb, 'orders'),
            orderData
        );

        if (paymentMethod === 'paypal') {
            alert('PayPal-Zahlung wird geöffnet... (Demo-Modus)');
            completeOrder(orderRef.id);
        } else if (paymentMethod === 'stripe') {
            alert('Stripe-Zahlung wird geöffnet... (Demo-Modus)');
            completeOrder(orderRef.id);
        } else if (paymentMethod === 'transfer') {
            alert(`Bestellung erfolgreich!\n\nBitte überweisen Sie ${orderData.total.toFixed(2)}€ an:\n\nIBAN: DE89 3704 0044 0532 0130 00\nBetreff: Bestellung ${orderRef.id}\n\nSie erhalten eine Bestätigung per E-Mail.`);
            completeOrder(orderRef.id);
        } else if (paymentMethod === 'private') {
            alert(`Bestellung aufgegeben!\n\nDa Sie "Privat" als Zahlungsmethode gewählt haben, wird die Zahlung persönlich abgewickelt.\n\nBestellnummer: ${orderRef.id}`);
            completeOrder(orderRef.id);
        }
    } catch (error) {
        alert('Fehler beim Aufgeben der Bestellung: ' + error.message);
    }
}

function completeOrder(orderId) {
    cart = [];
    chatMessages = [];
    updateCartCount();
    closeModal('checkoutModal');
    document.getElementById('checkoutForm').reset();
    
    alert(`Bestellung erfolgreich aufgegeben!\n\nBestellnummer: ${orderId}\n\nSie werden per E-Mail über den Fortschritt informiert.`);
}

// Close modal on outside click
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('active');
        }
    });
});

// Navigation event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Ensure public site is shown when clicking normal nav links
    const publicNavLinks = document.querySelectorAll('.nav-links a[href^="#"]:not(.admin-only a)');
    publicNavLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            showPublicSite();
        });
    });
});

// Handle hash changes to show public site
window.addEventListener('hashchange', function() {
    const hash = window.location.hash;
    if (hash && (hash === '#home' || hash === '#services' || hash === '#gallery' || hash === '#products')) {
        showPublicSite();
    }
});
