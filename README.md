# JT Print - 3D-Druck Service Website

## 🎯 Features

### Für Kunden
- **3D-Druck Upload:** STL/3MF Dateien hochladen oder Link angeben
- **Custom Design:** Individuelles 3D-Modell designen lassen
- **Produktkatalog:** Fertige Produkte direkt bestellen
- **Preiskalkulator:** Live-Preisberechnung mit Material-Optionen
- **Warenkorb & Checkout:** Vollständiger Bestellprozess
- **Account-System:** Registrierung, Login, Einstellungen
- **Benachrichtigungen:** Push-Notifications für Bestellupdates
- **Chat:** Direkter Kontakt für Custom Designs

### Für Admin (jona.thielgen@gmail.com)
- **Bestellverwaltung:** Alle Bestellungen einsehen und Status ändern
- **Produktverwaltung:** Produkte erstellen, bearbeiten, löschen
- **Galerie-Editor:** Portfolio-Galerie verwalten
- **Chat mit Kunden:** Direkt auf Anfragen antworten
- **Benachrichtigungen:** Kunden über Änderungen informieren

## 🛠️ Technologie

- **Frontend:** HTML, CSS, JavaScript (Vanilla)
- **Backend:** Firebase (Firestore, Authentication)
- **Design:** Moderne Dark-Mode UI mit Gradients
- **Features:** Real-time Updates, Responsive Design

## 🚀 Preisgestaltung

### 3D-Druck
- **Grundpreis:** 8€ (PLA: 4€ mit 50% Rabatt!)
- **Material:** 0.05€ pro Gramm (5 Cent/g)
- **Material-Aufpreis:** +10€ (außer PLA)
- **0.2mm Düse:** +4€ (nur PLA)
- **Express:** +30% Aufpreis

**Beispielrechnung (PLA, 100g):**
- Grundpreis: 4€ (-50%)
- Material: 100g × 0.05€ = 5€
- **Gesamt: 9€**

**Beispielrechnung (PETG, 100g, Express):**
- Grundpreis: 8€
- Material-Aufpreis: 10€
- Material: 100g × 0.05€ = 5€
- Zwischensumme: 23€
- Express (+30%): 29.90€

### Custom Design
- **Stundensatz:** 20€/h (Standard)
- **Verhandelbar:** 15€/h oder 25€/h wählbar
- **Optional:** Design + Druck kombinierbar

### Versand
- **Abholung:** Kostenlos
- **Standard:** 4,99€ - 8,99€ (nach Gewicht)
- **Express:** 9,99€

## 📁 Dateien

```
├── index.html           - Hauptseite mit allen Modals
├── script.js            - Core: Auth, State, Products, Notifications
├── script_shop.js       - Shop: Upload, Produkte, Cart, Checkout
├── script_admin.js      - Admin: Orders, Products, Gallery
├── style.css            - Haupt-Styling
├── style_admin.css      - Admin Panel Styling
└── BUG_FIXES.md        - Detaillierte Änderungsdokumentation
```

## 🔥 Firebase Setup

Die Firebase-Konfiguration ist bereits eingetragen:
- Project ID: `d-druckservice-jtprint`
- Collections: `products`, `orders`, `notifications`
- Admin Email: `jona.thielgen@gmail.com`

## 🧪 Lokale Installation

1. **Dateien in ein Verzeichnis kopieren**
2. **Live Server starten** (VS Code Extension oder Python HTTP Server)
   ```bash
   # Python 3
   python -m http.server 8000
   
   # VS Code
   Rechtsklick auf index.html → "Open with Live Server"
   ```
3. **Browser öffnen:** http://localhost:8000

**⚠️ Wichtig:** Die Website muss über einen Server laufen (nicht `file://`), damit Firebase funktioniert!

## 👤 Test-Accounts

### Admin
- Email: `jona.thielgen@gmail.com`
- (Passwort in Firebase erstellen)

### Kunden
- Beliebige Email-Registrierung möglich

## ✨ Was ist neu (v1.2)

### Bugs behoben
- ✅ scrollTo TypeError behoben
- ✅ Firebase deleteDoc/updateDoc hinzugefügt
- ✅ "Alle gelesen" speichert persistent
- ✅ Benachrichtigungen werden geladen
- ✅ Alle Firebase-Operationen funktional

### Neue Features
- ✅ Custom Design vollständig bestellbar
- ✅ Echte Datei-Uploads (STL/3MF)
- ✅ Tab-System: Datei oder Link
- ✅ File Preview mit Größe

### Korrekturen
- ✅ Filamentpreis: 0.05€/g (vorher 0.20€/g)
- ✅ Original-Design wiederhergestellt

## 📖 Nutzung

### Als Kunde
1. Account erstellen / Anmelden
2. **Option A:** 3D-Druck hochladen
   - Datei oder Link angeben
   - Material & Optionen wählen
   - Preis wird live berechnet
3. **Option B:** Custom Design anfragen
   - Chat öffnen
   - "Custom Design bestellen" klicken
   - Projekt beschreiben
   - Stundensatz & Zeitaufwand angeben
4. **Option C:** Produkt aus Katalog
   - Produkt anklicken
   - Farbe & Menge wählen
5. Warenkorb → Kasse → Bestellen

### Als Admin
1. Mit Admin-Email anmelden
2. Oben rechts: "🛡️ Admin Panel"
3. **Tab: 📦 Bestellungen**
   - Status ändern
   - Chat mit Kunden
   - Kunde benachrichtigen
   - Fertig & Entfernen
4. **Tab: 🏷️ Produkte**
   - Produkte hinzufügen/bearbeiten
   - Farben & Bilder verwalten
5. **Tab: 🖼️ Galerie**
   - Portfolio-Galerie verwalten

## 🎨 Design-Philosophie

- **Dark Mode:** Reduziert Augenbelastung
- **Gradients:** Moderne, futuristische Ästhetik
- **Card-based:** Übersichtliche Struktur
- **Glassmorphism:** Backdrop-Blur Effekte
- **Responsive:** Mobile-freundlich
- **Micro-interactions:** Hover-Effekte, Transitions

## 🔐 Sicherheit

- Firebase Authentication
- Email-Verifizierung
- Admin-Rechte nur für eine Email
- Firestore Security Rules empfohlen

## 📱 Browser-Unterstützung

- Chrome/Edge (empfohlen)
- Firefox
- Safari
- Mobile Browsers

## 🤝 Support

Bei Fragen oder Problemen:
- Email: jona.thielgen@gmail.com
- Oder Feedback über das Chat-Widget

## 📄 Lizenz

© 2026 JT Print – Alle Rechte vorbehalten

---

**Made with ❤️ by JT Print Team**
