// JT Print - Main JavaScript File (Part 1: Lines 1-400)
// Global State
let cart = [];
let currentProduct = null;
let selectedQuantity = 1;
let selectedColor = '';
let selectedColorIndex = 0;
let allProducts = [];
let chatMessages = [];
let isAdmin = false;
let currentOrderFilter = 'all';

// Sample Products
const sampleProducts = [
    {
        id: '1',
        name: 'Smartphone Halterung',
        description: 'Verstellbare Smartphone-Halterung für den Schreibtisch. Kompatibel mit allen gängigen Smartphones.',
        price: 12.99,
        category: 'internet',
        weight: 45,
        colors: ['#000000', '#FFFFFF', '#0066cc'],
        images: [
            'https://via.placeholder.com/400/000000/FFFFFF?text=Black+Holder',
            'https://via.placeholder.com/400/FFFFFF/000000?text=White+Holder',
            'https://via.placeholder.com/400/0066cc/FFFFFF?text=Blue+Holder'
        ],
        inStock: true
    },
    {
        id: '2',
        name: 'Kabelhalter Set',
        description: 'Praktisches 5er-Set Kabelhalter für einen aufgeräumten Schreibtisch.',
        price: 8.99,
        category: 'internet',
        weight: 20,
        colors: ['#000000', '#FFFFFF'],
        images: [
            'https://via.placeholder.com/400/000000/FFFFFF?text=Cable+Black',
            'https://via.placeholder.com/400/FFFFFF/000000?text=Cable+White'
        ],
        inStock: true
    },
    {
        id: '3',
        name: 'Würfel Organizer',
        description: 'Modularer Würfel-Organizer für Stifte und Kleinteile. Stapelbar.',
        price: 15.99,
        category: 'custom',
        weight: 80,
        colors: ['#0066cc', '#00cc99', '#ff4444'],
        images: [
            'https://via.placeholder.com/400/0066cc/FFFFFF?text=Blue+Box',
            'https://via.placeholder.com/400/00cc99/FFFFFF?text=Green+Box',
            'https://via.placeholder.com/400/ff4444/FFFFFF?text=Red+Box'
        ],
        inStock: true
    }
];

// Material definitions
const materialPrices = {
    'pla': 0,
    'tpu': 15,
    'asa': 12,
    'abs': 10,
    'petg': 8,
    'pla-cf': 18,
    'petg-cf': 20,
    'pla-wood': 12,
    'pla-glow': 10,
    'pla-marble': 14
};

const materialNames = {
    'pla': 'PLA',
    'tpu': 'TPU',
    'asa': 'ASA',
    'abs': 'ABS',
    'petg': 'PETG',
    'pla-cf': 'PLA Carbon Fiber',
    'petg-cf': 'PETG Carbon Fiber',
    'pla-wood': 'PLA Wood',
    'pla-glow': 'PLA Glow',
    'pla-marble': 'PLA Marble'
};

// Initialize functions
function loadSampleProducts() {
    allProducts = sampleProducts;
    displayProducts();
    displayGallery();
}

function displayProducts() {
    const internetGrid = document.getElementById('internet-products');
    const customGrid = document.getElementById('custom-products');
    
    if (!internetGrid || !customGrid) return;
    
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
    
    const imageContent = product.images && product.images.length > 0
        ? `<img src="${product.images[0]}" alt="${product.name}" onerror="this.parentElement.innerHTML='📦'">`
        : (product.image || '📦');
    
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
    if (!galleryGrid) return;
    
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
    selectedColorIndex = 0;
    
    const detailImage = document.getElementById('detailImage');
    const detailThumbnails = document.getElementById('detailThumbnails');
    
    if (product.images && product.images.length > 0) {
        detailImage.innerHTML = `<img src="${product.images[0]}" alt="${product.name}" onerror="this.parentElement.innerHTML='📦'">`;
        
        detailThumbnails.innerHTML = product.images.map((img, index) => `
            <div class="thumbnail ${index === 0 ? 'active' : ''}" onclick="selectProductImage(${index})">
                <img src="${img}" alt="${product.name}" onerror="this.parentElement.innerHTML='📦'">
            </div>
        `).join('');
    } else {
        detailImage.innerHTML = product.image || '📦';
        detailThumbnails.innerHTML = '';
    }
    
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

function selectProductImage(index) {
    if (!currentProduct || !currentProduct.images) return;
    
    selectedColorIndex = index;
    const detailImage = document.getElementById('detailImage');
    detailImage.innerHTML = `<img src="${currentProduct.images[index]}" alt="${currentProduct.name}" onerror="this.parentElement.innerHTML='📦'">`;
    
    document.querySelectorAll('.thumbnail').forEach((thumb, i) => {
        if (i === index) {
            thumb.classList.add('active');
        } else {
            thumb.classList.remove('active');
        }
    });
}

function selectColor(element, color, index) {
    document.querySelectorAll('.color-option').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    selectedColor = color;
    
    if (currentProduct && currentProduct.images && currentProduct.images[index]) {
        selectProductImage(index);
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
        colorIndex: selectedColorIndex,
        price: currentProduct.price * selectedQuantity
    });
    
    updateCartCount();
    closeModal('productDetailModal');
    alert('Produkt wurde zum Warenkorb hinzugefügt!');
}

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
    document.getElementById('settingsModal').classList.add('active');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    event.target.classList.add('active');
    const tabContent = document.getElementById(tabName + '-tab');
    if (tabContent) {
        tabContent.classList.add('active');
    }
}

// Chat Functions
function toggleChat() {
    const chatWindow = document.getElementById('chatWindow');
    if (chatWindow) {
        chatWindow.classList.toggle('active');
    }
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
    
    if (window.firebaseAuth && window.firebaseAuth.currentUser) {
        const chatData = {
            userId: window.firebaseAuth.currentUser.uid,
            userEmail: window.firebaseAuth.currentUser.email,
            message: message,
            timestamp: new Date().toISOString(),
            status: 'pending'
        };
        
        try {
            await window.firebaseDbFunctions.addDoc(
                window.firebaseDbFunctions.collection(window.firebaseDb, 'chatRequests'),
                chatData
            );
        } catch (error) {
            console.error('Error saving chat:', error);
        }
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

// Price Calculator
function calculatePrice() {
    const weight = parseFloat(document.getElementById('weight').value) || 0;
    const nozzleSize = document.getElementById('nozzleSize').value;
    const material = document.getElementById('material').value;
    const express = document.getElementById('express').value;

    if (weight === 0) {
        document.getElementById('priceResult').classList.add('hidden');
        return;
    }

    if (nozzleSize === '0.2' && material !== 'pla') {
        alert('Die 0,2mm Nozzle ist nur für PLA verfügbar!');
        document.getElementById('nozzleSize').value = '0.4';
        return;
    }

    const isPLA = material === 'pla';
    const basePrice = isPLA ? 4 : 8;
    const pricePerGram = 0.20;
    let total = basePrice + (weight * pricePerGram);

    total += materialPrices[material] || 0;

    if (nozzleSize === '0.2') {
        total += 4;
    }

    if (express === 'yes') {
        total *= 1.30;
    }

    let breakdown = `Grundpreis: ${basePrice}€`;
    if (isPLA) {
        breakdown += ' <span class="discount-badge">-50%</span> <span class="original-price">8€</span>';
    }
    breakdown += `<br>Material (${materialNames[material]}): ${((weight * pricePerGram) + (materialPrices[material] || 0)).toFixed(2)}€`;
    if (nozzleSize === '0.2') breakdown += `<br>0,2mm Nozzle: +4€`;
    if (express === 'yes') breakdown += `<br>Express: +30%`;

    document.getElementById('priceAmount').textContent = total.toFixed(2) + '€';
    document.getElementById('priceBreakdown').innerHTML = breakdown;
    document.getElementById('priceResult').classList.remove('hidden');

    return total;
}
// JT Print - JavaScript Part 2: Admin Panel & Additional Functions
// Load this file after script.js

// Admin Panel Functions
function switchAdminTab(tabName) {
    document.querySelectorAll('.admin-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.admin-content').forEach(content => content.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById('admin-' + tabName).classList.add('active');
}

async function loadAdminData() {
    loadOrders();
    loadAdminProducts();
    loadAdminGallery();
    loadChatRequests();
}

async function loadOrders() {
    try {
        const ordersQuery = await window.firebaseDbFunctions.getDocs(
            window.firebaseDbFunctions.query(
                window.firebaseDbFunctions.collection(window.firebaseDb, 'orders'),
                window.firebaseDbFunctions.orderBy('createdAt', 'desc')
            )
        );
        
        const orders = [];
        ordersQuery.forEach((doc) => {
            orders.push({ id: doc.id, ...doc.data() });
        });
        
        displayOrders(orders);
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

function displayOrders(orders) {
    const ordersList = document.getElementById('ordersList');
    if (!ordersList) return;
    
    const filtered = currentOrderFilter === 'all' 
        ? orders 
        : orders.filter(o => o.status === currentOrderFilter);
    
    if (filtered.length === 0) {
        ordersList.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Keine Bestellungen gefunden</p>';
        return;
    }
    
    ordersList.innerHTML = filtered.map(order => `
        <div class="order-card">
            <div class="order-header">
                <div>
                    <span class="order-id">#${order.id.substring(0, 8)}</span>
                    <p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 0.25rem;">
                        ${order.userEmail} | ${new Date(order.createdAt).toLocaleString('de-DE')}
                    </p>
                </div>
                <span class="order-status ${order.status}">${getStatusText(order.status)}</span>
            </div>
            
            <div class="order-items">
                ${order.items.map(item => {
                    if (item.type === 'product') {
                        const imgUrl = item.product.images && item.product.images[item.colorIndex] || '';
                        return `
                            <div class="order-item">
                                <div class="order-item-image">
                                    ${imgUrl ? `<img src="${imgUrl}">` : '📦'}
                                </div>
                                <div class="order-item-info">
                                    <strong>${item.product.name}</strong>
                                    <p style="color: var(--text-secondary); font-size: 0.875rem;">
                                        Menge: ${item.quantity} | ${item.price.toFixed(2)}€
                                    </p>
                                </div>
                            </div>
                        `;
                    } else {
                        return `
                            <div class="order-item">
                                <div class="order-item-image">🖨️</div>
                                <div class="order-item-info">
                                    <strong>Custom Upload</strong>
                                    <p style="color: var(--text-secondary); font-size: 0.875rem;">
                                        ${item.weight}g ${item.materialName} | ${item.price.toFixed(2)}€
                                    </p>
                                    <p style="color: var(--text-secondary); font-size: 0.875rem;">
                                        ${item.description.substring(0, 50)}...
                                    </p>
                                </div>
                            </div>
                        `;
                    }
                }).join('')}
            </div>
            
            <div style="margin: 1rem 0; padding: 1rem; background: var(--darker-bg); border-radius: 8px;">
                <p><strong>Gesamt:</strong> ${order.total.toFixed(2)}€</p>
                <p><strong>Versand:</strong> ${order.shippingMethod === 'pickup' ? 'Selbstabholung' : order.shippingMethod === 'standard' ? 'Standard' : 'Express'}</p>
                <p><strong>Zahlung:</strong> ${order.paymentMethod}</p>
                ${order.address ? `<p><strong>Adresse:</strong> ${order.address.street}, ${order.address.zipCode} ${order.address.city}</p>` : ''}
            </div>
            
            <div class="order-actions">
                <select onchange="updateOrderStatus('${order.id}', this.value)" style="padding: 0.5rem; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary);">
                    <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Bestellung aufgegeben</option>
                    <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Wird bearbeitet</option>
                    <option value="designing" ${order.status === 'designing' ? 'selected' : ''}>Wird designed</option>
                    <option value="printing" ${order.status === 'printing' ? 'selected' : ''}>Wird gedruckt</option>
                    <option value="shipping" ${order.status === 'shipping' ? 'selected' : ''}>Wird versendet</option>
                    <option value="questions" ${order.status === 'questions' ? 'selected' : ''}>Rückfragen</option>
                    <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Abgeschlossen</option>
                    <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Abgelehnt</option>
                </select>
                <button class="btn-secondary" onclick="notifyCustomer('${order.id}', '${order.userId}')">Kunde benachrichtigen</button>
                <button class="btn-primary" onclick="viewOrderDetails('${order.id}')">Details</button>
                ${order.status === 'completed' || order.status === 'cancelled' ? `
                    <button class="btn-secondary" onclick="deleteOrder('${order.id}')" style="background: #ff4444; color: white; border: none;">Entfernen</button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function getStatusText(status) {
    const statusMap = {
        'pending': 'Ausstehend',
        'processing': 'In Bearbeitung',
        'designing': 'Wird designed',
        'printing': 'Wird gedruckt',
        'shipping': 'Auf dem Weg',
        'questions': 'Rückfragen',
        'completed': 'Abgeschlossen',
        'cancelled': 'Abgelehnt'
    };
    return statusMap[status] || status;
}

function filterOrders(status) {
    currentOrderFilter = status;
    loadOrders();
}

async function updateOrderStatus(orderId, newStatus) {
    try {
        await window.firebaseDbFunctions.updateDoc(
            window.firebaseDbFunctions.doc(window.firebaseDb, 'orders', orderId),
            { status: newStatus }
        );
        loadOrders();
    } catch (error) {
        console.error('Error updating status:', error);
    }
}

function viewOrderDetails(orderId) {
    // Implementation for detailed view
    alert('Detailansicht für Bestellung: ' + orderId);
}

async function deleteOrder(orderId) {
    if (!confirm('Möchten Sie diese Bestellung wirklich entfernen?')) return;
    
    try {
        await window.firebaseDbFunctions.deleteDoc(
            window.firebaseDbFunctions.doc(window.firebaseDb, 'orders', orderId)
        );
        loadOrders();
    } catch (error) {
        console.error('Error deleting order:', error);
    }
}

function notifyCustomer(orderId, userId) {
    document.getElementById('notifyOrderId').value = orderId;
    document.getElementById('notifyCustomerModal').classList.add('active');
}

async function handleNotifyCustomer(event) {
    event.preventDefault();
    
    const orderId = document.getElementById('notifyOrderId').value;
    const type = document.getElementById('notifyType').value;
    const message = document.getElementById('notifyMessage').value;
    
    try {
        // Get order to find user
        const orderDoc = await window.firebaseDbFunctions.getDocs(
            window.firebaseDbFunctions.query(
                window.firebaseDbFunctions.collection(window.firebaseDb, 'orders'),
                window.firebaseDbFunctions.where('__name__', '==', orderId)
            )
        );
        
        if (!orderDoc.empty) {
            const order = orderDoc.docs[0].data();
            const userId = order.userId;
            
            // Get user doc
            const userDocRef = window.firebaseDbFunctions.doc(window.firebaseDb, 'users', userId);
            const userDoc = await window.firebaseDbFunctions.getDocs(
                window.firebaseDbFunctions.query(
                    window.firebaseDbFunctions.collection(window.firebaseDb, 'users'),
                    window.firebaseDbFunctions.where('__name__', '==', userId)
                )
            );
            
            if (!userDoc.empty) {
                const userData = userDoc.docs[0].data();
                const notifications = userData.notifications || [];
                
                notifications.push({
                    type: type,
                    message: message,
                    orderId: orderId,
                    timestamp: new Date().toISOString(),
                    read: false
                });
                
                await window.firebaseDbFunctions.updateDoc(userDocRef, {
                    notifications: notifications
                });
                
                alert('Benachrichtigung wurde gesendet!');
                closeModal('notifyCustomerModal');
                document.getElementById('notifyForm').reset();
            }
        }
    } catch (error) {
        console.error('Error notifying customer:', error);
        alert('Fehler beim Senden der Benachrichtigung');
    }
}

// Product Management
async function loadAdminProducts() {
    try {
        const productsQuery = await window.firebaseDbFunctions.getDocs(
            window.firebaseDbFunctions.collection(window.firebaseDb, 'products')
        );
        
        const products = [];
        productsQuery.forEach((doc) => {
            products.push({ id: doc.id, ...doc.data() });
        });
        
        displayAdminProducts(products);
    } catch (error) {
        console.error('Error loading admin products:', error);
        displayAdminProducts(allProducts);
    }
}

function displayAdminProducts(products) {
    const productsList = document.getElementById('productsList');
    if (!productsList) return;
    
    productsList.innerHTML = products.map(product => `
        <div class="admin-product-card">
            <div class="product-image">
                ${product.images && product.images.length > 0 ? `<img src="${product.images[0]}">` : (product.image || '📦')}
            </div>
            <div class="product-info">
                <h4>${product.name}</h4>
                <p class="product-price">${product.price.toFixed(2)}€</p>
            </div>
            <div class="admin-product-actions">
                <button class="btn-secondary" onclick="editProduct('${product.id}')">Bearbeiten</button>
                <button class="btn-secondary" onclick="deleteProduct('${product.id}')" style="background: #ff4444; color: white; border: none;">Löschen</button>
            </div>
        </div>
    `).join('');
}

function showAddProductModal() {
    document.getElementById('productModalTitle').textContent = 'Neues Produkt hinzufügen';
    document.getElementById('editProductId').value = '';
    document.getElementById('addProductForm').reset();
    document.getElementById('addProductModal').classList.add('active');
}

function editProduct(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    document.getElementById('productModalTitle').textContent = 'Produkt bearbeiten';
    document.getElementById('editProductId').value = productId;
    document.getElementById('productName').value = product.name;
    document.getElementById('productDescription').value = product.description;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productWeight').value = product.weight;
    document.getElementById('productCategory').value = product.category;
    document.getElementById('productImages').value = (product.images || []).join('\n');
    document.getElementById('productColors').value = product.colors.join('\n');
    document.getElementById('productInStock').value = product.inStock.toString();
    
    document.getElementById('addProductModal').classList.add('active');
}

async function handleAddProduct(event) {
    event.preventDefault();
    
    const productId = document.getElementById('editProductId').value;
    const productData = {
        name: document.getElementById('productName').value,
        description: document.getElementById('productDescription').value,
        price: parseFloat(document.getElementById('productPrice').value),
        weight: parseInt(document.getElementById('productWeight').value),
        category: document.getElementById('productCategory').value,
        images: document.getElementById('productImages').value.split('\n').filter(img => img.trim()),
        colors: document.getElementById('productColors').value.split('\n').filter(color => color.trim()),
        inStock: document.getElementById('productInStock').value === 'true'
    };
    
    try {
        if (productId) {
            await window.firebaseDbFunctions.updateDoc(
                window.firebaseDbFunctions.doc(window.firebaseDb, 'products', productId),
                productData
            );
        } else {
            await window.firebaseDbFunctions.addDoc(
                window.firebaseDbFunctions.collection(window.firebaseDb, 'products'),
                productData
            );
        }
        
        closeModal('addProductModal');
        loadAdminProducts();
        window.loadProducts();
        alert('Produkt gespeichert!');
    } catch (error) {
        console.error('Error saving product:', error);
        alert('Fehler beim Speichern');
    }
}

async function deleteProduct(productId) {
    if (!confirm('Möchten Sie dieses Produkt wirklich löschen?')) return;
    
    try {
        await window.firebaseDbFunctions.deleteDoc(
            window.firebaseDbFunctions.doc(window.firebaseDb, 'products', productId)
        );
        loadAdminProducts();
        window.loadProducts();
    } catch (error) {
        console.error('Error deleting product:', error);
    }
}

// Gallery Management
async function loadAdminGallery() {
    try {
        const galleryQuery = await window.firebaseDbFunctions.getDocs(
            window.firebaseDbFunctions.collection(window.firebaseDb, 'gallery')
        );
        
        const galleryItems = [];
        galleryQuery.forEach((doc) => {
            galleryItems.push({ id: doc.id, ...doc.data() });
        });
        
        displayAdminGallery(galleryItems);
    } catch (error) {
        console.error('Error loading gallery:', error);
    }
}

function displayAdminGallery(items) {
    const list = document.getElementById('galleryList');
    if (!list) return;
    
    list.innerHTML = items.map(item => `
        <div class="admin-product-card">
            <div class="product-image">
                ${item.image ? `<img src="${item.image}">` : '🎨'}
            </div>
            <div class="product-info">
                <h4>${item.name}</h4>
            </div>
            <div class="admin-product-actions">
                <button class="btn-secondary" onclick="deleteGalleryItem('${item.id}')" style="background: #ff4444; color: white; border: none;">Löschen</button>
            </div>
        </div>
    `).join('');
}

function showAddGalleryModal() {
    alert('Galerie-Funktion: Fügen Sie Bilder über Firebase Console hinzu');
}

async function deleteGalleryItem(itemId) {
    if (!confirm('Möchten Sie dieses Galerie-Bild wirklich löschen?')) return;
    
    try {
        await window.firebaseDbFunctions.deleteDoc(
            window.firebaseDbFunctions.doc(window.firebaseDb, 'gallery', itemId)
        );
        loadAdminGallery();
    } catch (error) {
        console.error('Error deleting gallery item:', error);
    }
}

// Chat Requests Management
async function loadChatRequests() {
    try {
        const chatQuery = await window.firebaseDbFunctions.getDocs(
            window.firebaseDbFunctions.query(
                window.firebaseDbFunctions.collection(window.firebaseDb, 'chatRequests'),
                window.firebaseDbFunctions.orderBy('timestamp', 'desc')
            )
        );
        
        const requests = [];
        chatQuery.forEach((doc) => {
            requests.push({ id: doc.id, ...doc.data() });
        });
        
        displayChatRequests(requests);
    } catch (error) {
        console.error('Error loading chat requests:', error);
    }
}

function displayChatRequests(requests) {
    const list = document.getElementById('chatRequestsList');
    if (!list) return;
    
    if (requests.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Keine Chat-Anfragen</p>';
        return;
    }
    
    list.innerHTML = requests.map(req => `
        <div class="chat-request-card">
            <p><strong>Von:</strong> ${req.userEmail}</p>
            <p><strong>Datum:</strong> ${new Date(req.timestamp).toLocaleString('de-DE')}</p>
            <p><strong>Nachricht:</strong></p>
            <p style="background: var(--darker-bg); padding: 1rem; border-radius: 8px; margin: 0.5rem 0;">${req.message}</p>
            <p><strong>Status:</strong> ${req.status === 'pending' ? 'Offen' : 'Beantwortet'}</p>
            <div style="margin-top: 1rem;">
                <button class="btn-secondary" onclick="markChatAsAnswered('${req.id}')">Als beantwortet markieren</button>
            </div>
        </div>
    `).join('');
}

async function markChatAsAnswered(chatId) {
    try {
        await window.firebaseDbFunctions.updateDoc(
            window.firebaseDbFunctions.doc(window.firebaseDb, 'chatRequests', chatId),
            { status: 'answered' }
        );
        loadChatRequests();
    } catch (error) {
        console.error('Error updating chat:', error);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadSampleProducts();
    
    // Close modals on outside click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        });
    });
});
