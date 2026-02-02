:root {
    --primary-gradient: linear-gradient(135deg, #0066cc 0%, #00cc99 100%);
    --primary-blue: #0066cc;
    --primary-green: #00cc99;
    --dark-bg: #0a0f1a;
    --darker-bg: #050810;
    --card-bg: rgba(20, 30, 48, 0.8);
    --text-primary: #ffffff;
    --text-secondary: #a0aec0;
    --accent-glow: rgba(0, 204, 153, 0.3);
    --border-color: rgba(0, 204, 153, 0.2);
    --red-accent: #ff4444;
    --yellow-accent: #ffaa00;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Inter', sans-serif;
    background: var(--dark-bg);
    color: var(--text-primary);
    line-height: 1.6;
    overflow-x: hidden;
}

.bg-animation {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
    background: linear-gradient(135deg, #0a0f1a 0%, #050810 100%);
    overflow: hidden;
}

.bg-animation::before {
    content: '';
    position: absolute;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle at 20% 50%, rgba(0, 102, 204, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 80%, rgba(0, 204, 153, 0.1) 0%, transparent 50%);
    animation: float 20s ease-in-out infinite;
}

@keyframes float {
    0%, 100% { transform: translate(0, 0) rotate(0deg); }
    33% { transform: translate(30px, -30px) rotate(120deg); }
    66% { transform: translate(-20px, 20px) rotate(240deg); }
}

/* Header */
header {
    position: sticky;
    top: 0;
    z-index: 1000;
    background: rgba(10, 15, 26, 0.95);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--border-color);
    padding: 1rem 0;
}

nav {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
}

.logo-container {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.logo-image {
    height: 70px;
    width: auto;
    transition: transform 0.3s ease;
}

.logo-image:hover {
    transform: scale(1.05);
}

.logo-text {
    font-family: 'Orbitron', sans-serif;
    font-size: 1.8rem;
    font-weight: 700;
    background: var(--primary-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.nav-links {
    display: flex;
    gap: 1.5rem;
    list-style: none;
    align-items: center;
    flex-wrap: wrap;
}

.nav-links a {
    color: var(--text-primary);
    text-decoration: none;
    font-weight: 500;
    transition: all 0.3s ease;
    position: relative;
}

.nav-links a::after {
    content: '';
    position: absolute;
    bottom: -5px;
    left: 0;
    width: 0;
    height: 2px;
    background: var(--primary-gradient);
    transition: width 0.3s ease;
}

.nav-links a:hover::after {
    width: 100%;
}

.btn-primary {
    background: var(--primary-gradient);
    color: white;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(0, 204, 153, 0.3);
    font-family: 'Inter', sans-serif;
}

.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 204, 153, 0.4);
}

.btn-secondary {
    background: transparent;
    color: var(--primary-green);
    padding: 0.75rem 1.5rem;
    border: 2px solid var(--primary-green);
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    font-family: 'Inter', sans-serif;
}

.btn-secondary:hover {
    background: var(--primary-green);
    color: var(--dark-bg);
}

.btn-danger {
    background: var(--red-accent);
    color: white;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    font-family: 'Inter', sans-serif;
}

.btn-danger:hover {
    background: #cc0000;
}

.btn-success {
    background: var(--primary-green);
    color: var(--dark-bg);
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    font-family: 'Inter', sans-serif;
}

.btn-success:hover {
    background: #00aa77;
}

/* Hero */
.hero {
    max-width: 1400px;
    margin: 4rem auto;
    padding: 4rem 2rem;
    text-align: center;
}

.hero h1 {
    font-family: 'Orbitron', sans-serif;
    font-size: 3.5rem;
    font-weight: 900;
    margin-bottom: 1.5rem;
    background: var(--primary-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: fadeInUp 1s ease;
}

.hero p {
    font-size: 1.25rem;
    color: var(--text-secondary);
    max-width: 600px;
    margin: 0 auto 2rem;
    animation: fadeInUp 1s ease 0.2s both;
}

.hero-buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
    animation: fadeInUp 1s ease 0.4s both;
    flex-wrap: wrap;
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Container */
.container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem;
}

section {
    margin-bottom: 4rem;
}

.section-title {
    font-family: 'Orbitron', sans-serif;
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 2rem;
    text-align: center;
    background: var(--primary-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

/* Service Cards */
.services-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 2rem;
}

.service-card {
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 16px;
    padding: 2rem;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
}

.service-card:hover {
    transform: translateY(-5px);
    border-color: var(--primary-green);
    box-shadow: 0 10px 30px var(--accent-glow);
}

.service-card h3 {
    font-family: 'Orbitron', sans-serif;
    font-size: 1.5rem;
    margin-bottom: 1rem;
    color: var(--primary-green);
}

.service-card p {
    color: var(--text-secondary);
    margin-bottom: 1.5rem;
}

/* Product Grid */
.product-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 2rem;
    margin-top: 2rem;
}

.product-card {
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 16px;
    overflow: hidden;
    transition: all 0.3s ease;
    cursor: pointer;
}

.product-card:hover {
    transform: translateY(-5px);
    border-color: var(--primary-green);
    box-shadow: 0 10px 30px var(--accent-glow);
}

.product-image {
    width: 100%;
    height: 200px;
    background: linear-gradient(135deg, rgba(0, 102, 204, 0.2), rgba(0, 204, 153, 0.2));
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 3rem;
    position: relative;
    overflow: hidden;
}

.product-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.product-info {
    padding: 1.5rem;
}

.product-info h4 {
    font-family: 'Orbitron', sans-serif;
    margin-bottom: 0.5rem;
    color: var(--primary-green);
}

.product-price {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--primary-blue);
    margin: 0.5rem 0;
}

/* Modals */
.modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    z-index: 2000;
    justify-content: center;
    align-items: center;
    backdrop-filter: blur(5px);
    overflow-y: auto;
}

.modal.active {
    display: flex;
}

.modal-content {
    background: var(--darker-bg);
    border: 1px solid var(--border-color);
    border-radius: 16px;
    padding: 2rem;
    max-width: 500px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
    margin: 2rem;
}

.modal-content-large {
    max-width: 800px;
}

.modal-close {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: none;
    border: none;
    color: var(--text-primary);
    font-size: 2rem;
    cursor: pointer;
    line-height: 1;
    transition: color 0.3s ease;
}

.modal-close:hover {
    color: var(--primary-green);
}

.modal h2 {
    font-family: 'Orbitron', sans-serif;
    margin-bottom: 1.5rem;
    color: var(--primary-green);
}

/* Forms */
.form-group {
    margin-bottom: 1.5rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    color: var(--text-secondary);
    font-weight: 500;
}

.form-group input,
.form-group textarea,
.form-group select {
    width: 100%;
    padding: 0.75rem;
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    color: var(--text-primary);
    font-family: 'Inter', sans-serif;
    transition: all 0.3s ease;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
    outline: none;
    border-color: var(--primary-green);
    box-shadow: 0 0 10px var(--accent-glow);
}

.form-group textarea {
    min-height: 100px;
    resize: vertical;
}

/* Price Calculator */
.price-calculator {
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 16px;
    padding: 2rem;
    margin-top: 1rem;
}

.price-result {
    background: var(--primary-gradient);
    padding: 1rem;
    border-radius: 8px;
    margin-top: 1rem;
    text-align: center;
}

.price-result .amount {
    font-family: 'Orbitron', sans-serif;
    font-size: 2rem;
    font-weight: 700;
}

.discount-badge {
    display: inline-block;
    background: var(--red-accent);
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    font-size: 0.875rem;
    font-weight: 700;
    margin-left: 0.5rem;
}

.original-price {
    text-decoration: line-through;
    color: var(--text-secondary);
    font-size: 0.9rem;
    margin-left: 0.5rem;
}

/* Cart */
.cart-icon {
    position: relative;
    cursor: pointer;
}

.cart-count {
    position: absolute;
    top: -8px;
    right: -8px;
    background: var(--primary-green);
    color: var(--dark-bg);
    border-radius: 50%;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 700;
}

/* Utility Classes */
.hidden {
    display: none !important;
}

.error-message {
    color: #ff4444;
    font-size: 0.875rem;
    margin-top: 0.25rem;
}

.success-message {
    color: var(--primary-green);
    font-size: 0.875rem;
    margin-top: 0.25rem;
}

/* Tabs */
.tabs {
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;
    border-bottom: 2px solid var(--border-color);
    flex-wrap: wrap;
}

.tab {
    padding: 1rem 2rem;
    background: none;
    border: none;
    color: var(--text-secondary);
    font-family: 'Orbitron', sans-serif;
    font-size: 1.1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
}

.tab.active {
    color: var(--primary-green);
}

.tab.active::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 100%;
    height: 2px;
    background: var(--primary-gradient);
}

.tab-content {
    display: none;
}

.tab-content.active {
    display: block;
}

/* Chat Widget */
.chat-widget {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    z-index: 1500;
}

.chat-button {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: var(--primary-gradient);
    border: none;
    box-shadow: 0 4px 20px var(--accent-glow);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    transition: all 0.3s ease;
}

.chat-button:hover {
    transform: scale(1.1);
}

.chat-window {
    position: absolute;
    bottom: 80px;
    right: 0;
    width: 350px;
    height: 500px;
    background: var(--darker-bg);
    border: 1px solid var(--border-color);
    border-radius: 16px;
    display: none;
    flex-direction: column;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
}

.chat-window.active {
    display: flex;
}

.chat-header {
    background: var(--primary-gradient);
    padding: 1rem;
    border-radius: 16px 16px 0 0;
    font-family: 'Orbitron', sans-serif;
    font-weight: 700;
    position: relative;
}

.chat-messages {
    flex: 1;
    padding: 1rem;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.chat-message {
    padding: 0.75rem;
    border-radius: 8px;
    max-width: 80%;
    word-wrap: break-word;
}

.chat-message.user {
    background: var(--primary-gradient);
    align-self: flex-end;
    margin-left: auto;
}

.chat-message.admin {
    background: var(--card-bg);
    border: 1px solid var(--border-color);
}

.chat-input-container {
    padding: 1rem;
    border-top: 1px solid var(--border-color);
    display: flex;
    gap: 0.5rem;
}

.chat-input {
    flex: 1;
    padding: 0.75rem;
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    color: var(--text-primary);
    font-family: 'Inter', sans-serif;
}

.chat-input:focus {
    outline: none;
    border-color: var(--primary-green);
}

/* Product Detail */
.product-detail-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
}

.color-selector {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-top: 0.5rem;
}

.color-option {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 2px solid var(--border-color);
    cursor: pointer;
    transition: all 0.3s ease;
}

.color-option.selected {
    border-color: var(--primary-green);
    box-shadow: 0 0 10px var(--accent-glow);
}

.quantity-selector {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-top: 0.5rem;
}

.quantity-btn {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    color: var(--text-primary);
    font-size: 1.25rem;
    cursor: pointer;
    transition: all 0.3s ease;
}

.quantity-btn:hover {
    border-color: var(--primary-green);
}

.quantity-display {
    font-size: 1.25rem;
    font-weight: 700;
    min-width: 40px;
    text-align: center;
}

/* Admin Panel */
.admin-section {
    min-height: 60vh;
}

.order-card {
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 16px;
    padding: 2rem;
    margin-bottom: 2rem;
    transition: all 0.3s ease;
}

.order-card:hover {
    border-color: var(--primary-green);
    box-shadow: 0 5px 20px var(--accent-glow);
}

.order-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
    gap: 1rem;
}

.order-status {
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.875rem;
}

.status-pending {
    background: rgba(255, 170, 0, 0.2);
    color: var(--yellow-accent);
}

.status-processing {
    background: rgba(0, 102, 204, 0.2);
    color: var(--primary-blue);
}

.status-designing {
    background: rgba(153, 51, 204, 0.2);
    color: #9933cc;
}

.status-printing {
    background: rgba(0, 204, 153, 0.2);
    color: var(--primary-green);
}

.status-shipping {
    background: rgba(0, 170, 255, 0.2);
    color: #00aaff;
}

.status-questions {
    background: rgba(255, 68, 68, 0.2);
    color: var(--red-accent);
}

.status-rejected {
    background: rgba(255, 0, 0, 0.2);
    color: #ff0000;
}

.status-completed {
    background: rgba(0, 204, 153, 0.2);
    color: var(--primary-green);
}

.order-items {
    margin: 1rem 0;
}

.order-item {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    margin-bottom: 0.5rem;
}

.order-item-image {
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, rgba(0, 102, 204, 0.2), rgba(0, 204, 153, 0.2));
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    flex-shrink: 0;
}

.order-item-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 8px;
}

.order-actions {
    display: flex;
    gap: 1rem;
    margin-top: 1.5rem;
    flex-wrap: wrap;
}

.admin-product-card {
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 16px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    transition: all 0.3s ease;
}

.admin-product-card:hover {
    border-color: var(--primary-green);
}

.admin-product-info {
    flex: 1;
}

.admin-product-actions {
    display: flex;
    gap: 0.5rem;
}

.chat-card {
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 16px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    transition: all 0.3s ease;
}

.chat-card:hover {
    border-color: var(--primary-green);
}

.chat-preview {
    background: rgba(0, 0, 0, 0.3);
    padding: 1rem;
    border-radius: 8px;
    margin: 1rem 0;
    max-height: 200px;
    overflow-y: auto;
}

.notification-item {
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1rem;
}

.notification-unread {
    border-color: var(--primary-green);
    background: rgba(0, 204, 153, 0.05);
}

/* Responsive */
@media (max-width: 1024px) {
    .nav-links {
        gap: 1rem;
        font-size: 0.9rem;
    }

    .product-detail-grid {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 768px) {
    .hero h1 {
        font-size: 2.5rem;
    }

    .services-grid,
    .product-grid {
        grid-template-columns: 1fr;
    }

    .tabs {
        flex-direction: column;
        gap: 0;
    }

    .tab {
        padding: 0.75rem;
        text-align: left;
        border-bottom: 1px solid var(--border-color);
    }

    .chat-window {
        width: 90vw;
        right: 5vw;
    }

    .chat-widget {
        right: 1rem;
    }

    .order-header {
        flex-direction: column;
        align-items: flex-start;
    }

    .order-actions {
        flex-direction: column;
    }

    .admin-product-card {
        flex-direction: column;
        align-items: flex-start;
    }

    nav {
        flex-direction: column;
        gap: 1rem;
    }

    .nav-links {
        flex-direction: row;
        justify-content: center;
        width: 100%;
    }
}

@media (max-width: 480px) {
    .hero h1 {
        font-size: 2rem;
    }

    .section-title {
        font-size: 2rem;
    }

    .modal-content {
        padding: 1.5rem;
    }

    .btn-primary,
    .btn-secondary {
        padding: 0.6rem 1.2rem;
        font-size: 0.9rem;
    }
}
