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

// Sample Products
const sampleProducts = [
    {
        id: '1', name: 'Smartphone Halterung',
        description: 'Verstellbare Smartphone-Halterung für den Schreibtisch. Kompatibel mit allen gängigen Smartphones.',
        price: 12.99, category: 'internet', weight: 45,
        colors: ['#000000', '#FFFFFF', '#0066cc', '#ff4444', '#00cc99'],
        image: '📱', inStock: true
    },
    {
        id: '2', name: 'Kabelhalter Set',
        description: 'Praktisches 5er-Set Kabelhalter für einen aufgeräumten Schreibtisch. Selbstklebend.',
        price: 8.99, category: 'internet', weight: 20,
        colors: ['#000000', '#FFFFFF', '#808080'],
        image: '🔌', inStock: true
    },
    {
        id: '3', name: 'Würfel Organizer',
        description: 'Modularer Würfel-Organizer für Stifte, Büroklammern und Kleinteile. Stapelbar.',
        price: 15.99, category: 'custom', weight: 80,
        colors: ['#0066cc', '#00cc99', '#ff4444', '#ffaa00', '#9933cc'],
        image: '📦', inStock: true
    }
];

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing...');
    initializeEventListeners();
    loadSampleProducts();
});

function initializeEventListeners() {
    // Logo
    const logoBtn = document.getElementById('logoBtn');
    if (logoBtn) logoBtn.addEventListener('click', goToHome);

    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            showPublicSite();
            const target = this.getAttribute('data-target');
            if (target) {
                const element = document.getElementById(target);
                if (element) element.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Admin Navigation
    document.querySelectorAll('.admin-nav').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            showAdminPanel(section);
        });
    });

    // Buttons
    safeAddListener('loginBtn', 'click', showLoginModal);
    safeAddListener('settingsBtn', 'click', showSettingsModal);
    safeAddListener('cartBtn', 'click', showCart);
    safeAddListener('uploadBtn', 'click', showUploadModal);
    safeAddListener('customDesignBtn', 'click', showCustomDesignModal);
    
    // Chat
    safeAddListener('chatToggleBtn', 'click', toggleChat);
    safeAddListener('chatCloseBtn', 'click', toggleChat);
    safeAddListener('chatSendBtn', 'click', sendChatMessage);
    safeAddListener('chatInput', 'keypress', function(e) {
        if (e.key === 'Enter') sendChatMessage();
    });

    // Modal close buttons
    document.querySelectorAll('[data-modal]').forEach(btn => {
        btn.addEventListener('click', function() {
            closeModal(this.getAttribute('data-modal'));
        });
    });

    // Forms
    safeAddListener('loginForm', 'submit', handleLogin);
    safeAddListener('registerForm', 'submit', handleRegister);
    safeAddListener('showRegisterLink', 'click', function(e) {
        e.preventDefault();
        showRegisterModal();
    });

    // Tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            switchTab(this.getAttribute('data-tab'));
        });
    });

    // Price calculator inputs
    ['weight', 'material', 'nozzle', 'express'].forEach(id => {
        safeAddListener(id, 'change', calculatePrice);
        safeAddListener(id, 'input', calculatePrice);
    });

    console.log('Event listeners initialized');
}

function safeAddListener(id, event, handler) {
    const element = document.getElementById(id);
    if (element) {
        element.addEventListener(event, handler);
    }
}

function goToHome() {
    showPublicSite();
    window.location.hash = 'home';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showPublicSite() {
    const publicSite = document.getElementById('publicSite');
    const adminPanel = document.getElementById('adminPanel');
    if (publicSite) publicSite.classList.remove('hidden');
    if (adminPanel) adminPanel.classList.add('hidden');
}

function showAdminPanel(section) {
    if (!isAdmin) return;
    
    const publicSite = document.getElementById('publicSite');
    const adminPanel = document.getElementById('adminPanel');
    if (publicSite) publicSite.classList.add('hidden');
    if (adminPanel) adminPanel.classList.remove('hidden');
    
    document.querySelectorAll('.admin-section').forEach(s => s.classList.add('hidden'));
    
    if (section === 'orders') {
        document.getElementById('adminOrders')?.classList.remove('hidden');
    } else if (section === 'products') {
        document.getElementById('adminProducts')?.classList.remove('hidden');
    } else if (section === 'chat') {
        document.getElementById('adminChat')?.classList.remove('hidden');
    }
}

// Modal Functions
function showLoginModal() {
    document.getElementById('loginModal')?.classList.add('active');
}

function showRegisterModal() {
    closeModal('loginModal');
    document.getElementById('registerModal')?.classList.add('active');
}

function showSettingsModal() {
    if (!window.firebaseAuth?.currentUser || !currentUserData) return;
    
    const nameInput = document.getElementById('settingsName');
    const emailInput = document.getElementById('settingsEmail');
    const memberInput = document.getElementById('settingsMemberSince');
    
    if (nameInput) nameInput.value = currentUserData.name || '';
    if (emailInput) emailInput.value = currentUserData.email || '';
    if (memberInput && currentUserData.createdAt) {
        memberInput.value = new Date(currentUserData.createdAt).toLocaleDateString('de-DE');
    }
    
    document.getElementById('settingsModal')?.classList.add('active');
}

function showUploadModal() {
    if (!window.firebaseAuth?.currentUser) {
        alert('Bitte melden Sie sich zuerst an!');
        showLoginModal();
        return;
    }
    document.getElementById('uploadModal')?.classList.add('active');
}

function showCustomDesignModal() {
    if (!window.firebaseAuth?.currentUser) {
        alert('Bitte melden Sie sich zuerst an!');
        showLoginModal();
        return;
    }
    toggleChat();
}

function showCart() {
    updateCartDisplay();
    document.getElementById('cartModal')?.classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId)?.classList.remove('hidden');
}

function toggleChat() {
    document.getElementById('chatWindow')?.classList.toggle('active');
}

function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');
    document.getElementById(`${tabName}-tab`)?.classList.add('active');
}

// Auth Functions
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail')?.value;
    const password = document.getElementById('loginPassword')?.value;
    const errorDiv = document.getElementById('loginError');
    
    if (errorDiv) errorDiv.classList.add('hidden');

    try {
        await window.firebaseAuthFunctions.signInWithEmailAndPassword(
            window.firebaseAuth, email, password
        );
        closeModal('loginModal');
    } catch (error) {
        if (!errorDiv) return;
        
        let errorMessage = 'Fehler beim Anmelden';
        
        if (error.code === 'auth/invalid-credential' || 
            error.code === 'auth/wrong-password' || 
            error.code === 'auth/user-not-found') {
            errorMessage = 'Falsches Passwort oder E-Mail-Adresse';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Ungültige E-Mail-Adresse';
        } else if (error.code === 'auth/user-disabled') {
            errorMessage = 'Dieser Account wurde deaktiviert';
        } else if (error.code === 'auth/too-many-requests') {
            errorMessage = 'Zu viele fehlgeschlagene Versuche';
        }
        
        errorDiv.textContent = errorMessage;
        errorDiv.classList.remove('hidden');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('registerName')?.value;
    const birthdate = document.getElementById('registerBirthdate')?.value;
    const email = document.getElementById('registerEmail')?.value;
    const password = document.getElementById('registerPassword')?.value;
    const passwordConfirm = document.getElementById('registerPasswordConfirm')?.value;

    const errorDiv = document.getElementById('registerError');
    const successDiv = document.getElementById('registerSuccess');
    
    if (errorDiv) errorDiv.classList.add('hidden');
    if (successDiv) successDiv.classList.add('hidden');

    if (password !== passwordConfirm) {
        if (errorDiv) {
            errorDiv.textContent = 'Passwörter stimmen nicht überein!';
            errorDiv.classList.remove('hidden');
        }
        return;
    }

    try {
        const userCredential = await window.firebaseAuthFunctions.createUserWithEmailAndPassword(
            window.firebaseAuth, email, password
        );

        await window.firebaseAuthFunctions.sendEmailVerification(userCredential.user);
        await window.firebaseDbFunctions.setDoc(
            window.firebaseDbFunctions.doc(window.firebaseDb, 'users', userCredential.user.uid),
            { name, birthdate, email, createdAt: new Date().toISOString() }
        );

        if (successDiv) {
            successDiv.textContent = 'Registrierung erfolgreich!';
            successDiv.classList.remove('hidden');
        }
        document.getElementById('registerEmailInfo')?.classList.remove('hidden');

        setTimeout(() => closeModal('registerModal'), 5000);
    } catch (error) {
        if (errorDiv) {
            errorDiv.textContent = 'Fehler: ' + error.message;
            errorDiv.classList.remove('hidden');
        }
    }
}

// Products
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
        loadSampleProducts();
    }
}

function displayProducts() {
    const internetGrid = document.getElementById('internet-products');
    const customGrid = document.getElementById('custom-products');
    
    if (internetGrid) internetGrid.innerHTML = '';
    if (customGrid) customGrid.innerHTML = '';

    allProducts.forEach(product => {
        const card = createProductCard(product);
        if (product.category === 'internet' && internetGrid) {
            internetGrid.appendChild(card);
        } else if (customGrid) {
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
        galleryGrid.appendChild(createProductCard(product));
    });
}

function showProductDetail(product) {
    currentProduct = product;
    selectedQuantity = 1;
    
    const detailImage = document.getElementById('detailImage');
    const detailName = document.getElementById('detailName');
    const detailDescription = document.getElementById('detailDescription');
    const detailPrice = document.getElementById('detailPrice');
    const quantityDisplay = document.getElementById('quantityDisplay');
    
    if (detailImage) detailImage.innerHTML = product.image;
    if (detailName) detailName.textContent = product.name;
    if (detailDescription) detailDescription.textContent = product.description;
    if (detailPrice) detailPrice.textContent = product.price.toFixed(2) + '€';
    if (quantityDisplay) quantityDisplay.textContent = '1';
    
    document.getElementById('productDetailModal')?.classList.add('active');
}

// Cart
function updateCartCount() {
    const countElement = document.querySelector('.cart-count');
    if (countElement) countElement.textContent = cart.length;
}

function updateCartDisplay() {
    const cartItemsDiv = document.getElementById('cartItems');
    const totalElement = document.getElementById('totalAmount');
    
    if (!cartItemsDiv) return;
    
    if (cart.length === 0) {
        cartItemsDiv.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Ihr Warenkorb ist leer</p>';
        if (totalElement) totalElement.textContent = '0.00€';
        return;
    }

    let total = 0;
    cartItemsDiv.innerHTML = cart.map((item, index) => {
        total += item.price;
        return `<div style="background: var(--card-bg); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
            <h4 style="color: var(--primary-green);">${item.product?.name || 'Custom Upload'}</h4>
            <p class="product-price">${item.price.toFixed(2)}€</p>
            <button onclick="window.removeFromCart(${index})" style="color: #ff4444; background: none; border: none; cursor: pointer;">Entfernen</button>
        </div>`;
    }).join('');

    if (totalElement) totalElement.textContent = total.toFixed(2) + '€';
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartCount();
    updateCartDisplay();
}

// Price Calculator
function calculatePrice() {
    const weight = parseFloat(document.getElementById('weight')?.value) || 0;
    const material = document.getElementById('material')?.value || 'pla';
    const nozzle = document.getElementById('nozzle')?.value || '0.4';
    const express = document.getElementById('express')?.value || 'no';

    if (weight === 0) {
        document.getElementById('priceResult')?.classList.add('hidden');
        return;
    }

    if (nozzle === '0.2' && material !== 'pla') {
        alert('0.2mm Nozzle ist nur mit PLA kompatibel!');
        const nozzleSelect = document.getElementById('nozzle');
        if (nozzleSelect) nozzleSelect.value = '0.4';
        return;
    }

    const isPLA = material === 'pla';
    const basePrice = isPLA ? 4 : 8;
    const pricePerGram = 0.20;
    let total = basePrice + (weight * pricePerGram);

    if (material !== 'pla') total += 10;
    if (nozzle === '0.2') total += 4;
    if (express === 'yes') total *= 1.30;

    const priceAmount = document.getElementById('priceAmount');
    const priceBreakdown = document.getElementById('priceBreakdown');
    const priceResult = document.getElementById('priceResult');

    if (priceAmount) priceAmount.textContent = total.toFixed(2) + '€';
    if (priceBreakdown) priceBreakdown.innerHTML = `Grundpreis: ${basePrice}€<br>Material: ${(weight * pricePerGram).toFixed(2)}€`;
    if (priceResult) priceResult.classList.remove('hidden');

    return total;
}

function sendChatMessage() {
    const input = document.getElementById('chatInput');
    if (!input) return;
    
    const message = input.value.trim();
    if (!message) return;
    
    const messagesDiv = document.getElementById('chatMessages');
    if (!messagesDiv) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message user';
    messageDiv.textContent = message;
    messagesDiv.appendChild(messageDiv);
    
    input.value = '';
    chatMessages.push({ sender: 'user', text: message, timestamp: new Date().toISOString() });
    
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Make functions globally available
window.showPublicSite = showPublicSite;
window.showAdminPanel = showAdminPanel;
window.showLoginModal = showLoginModal;
window.showSettingsModal = showSettingsModal;
window.loadProducts = loadProducts;
window.loadUserData = async function(user) {
    try {
        const userDoc = await window.firebaseDbFunctions.getDocs(
            window.firebaseDbFunctions.query(
                window.firebaseDbFunctions.collection(window.firebaseDb, 'users'),
                window.firebaseDbFunctions.where('email', '==', user.email)
            )
        );
        
        if (!userDoc.empty) {
            window.currentUserData = userDoc.docs[0].data();
            window.currentUserData.uid = user.uid;
        }
    } catch (error) {
        console.log('Error loading user data:', error);
    }
};
window.removeFromCart = removeFromCart;
window.loadOrders = function() { console.log('Load orders placeholder'); };
window.loadChats = function() { console.log('Load chats placeholder'); };

console.log('Script loaded successfully');
