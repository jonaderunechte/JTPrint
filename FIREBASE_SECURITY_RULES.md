# 🔐 Firebase Security Rules - JT Print

## ⚠️ WICHTIG: Diese Rules MÜSSEN in Firebase Console gesetzt werden!

Die Website hat jetzt obfuskierte API-Keys, aber **Firebase Security Rules** sind der wichtigste Schutz!

---

## 📋 Firestore Security Rules

Kopiere diese Rules in die Firebase Console:  
**Firebase Console → Firestore Database → Rules**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ════════════════════════════════════════════════════
    // ORDERS COLLECTION
    // ════════════════════════════════════════════════════
    match /orders/{orderId} {
      // Lesen: Nur eigene Bestellungen oder Admin
      allow read: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         request.auth.token.email == 'jona.thielgen@gmail.com');
      
      // Erstellen: Nur eingeloggte User
      allow create: if request.auth != null &&
        request.resource.data.userId == request.auth.uid;
      
      // Update/Delete: Nur Admin
      allow update, delete: if request.auth != null && 
        request.auth.token.email == 'jona.thielgen@gmail.com';
    }
    
    // ════════════════════════════════════════════════════
    // PRODUCTS COLLECTION
    // ════════════════════════════════════════════════════
    match /products/{productId} {
      // Lesen: Alle (auch nicht eingeloggt)
      allow read: if true;
      
      // Schreiben: Nur Admin
      allow create, update, delete: if request.auth != null && 
        request.auth.token.email == 'jona.thielgen@gmail.com';
    }
    
    // ════════════════════════════════════════════════════
    // NOTIFICATIONS COLLECTION
    // ════════════════════════════════════════════════════
    match /notifications/{notificationId} {
      // Lesen: Nur eigene Benachrichtigungen oder System
      allow read: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         resource.data.userId == 'system');
      
      // Erstellen: Alle eingeloggten User
      allow create: if request.auth != null;
      
      // Update: Nur eigene Benachrichtigungen
      allow update: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      
      // Delete: Nur Admin
      allow delete: if request.auth != null && 
        request.auth.token.email == 'jona.thielgen@gmail.com';
    }
    
    // ════════════════════════════════════════════════════
    // GALLERY COLLECTION
    // ════════════════════════════════════════════════════
    match /gallery/{galleryId} {
      // Lesen: Alle
      allow read: if true;
      
      // Schreiben: Nur Admin
      allow create, update, delete: if request.auth != null && 
        request.auth.token.email == 'jona.thielgen@gmail.com';
    }
    
    // ════════════════════════════════════════════════════
    // ALLE ANDEREN COLLECTIONS: DENY
    // ════════════════════════════════════════════════════
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 🔒 Firebase Authentication Settings

### Email/Password aktivieren:
1. Firebase Console → Authentication → Sign-in method
2. Email/Password aktivieren
3. Email link (passwordless sign-in) OPTIONAL

### Email Verification (empfohlen):
```javascript
// Bereits implementiert in script.js:
await window.fbFuncs.sendVerifyEmail(cred.user);
```

---

## 📊 Rate Limiting (App Check - Optional)

Für zusätzlichen Schutz gegen Missbrauch:

1. Firebase Console → App Check
2. reCAPTCHA v3 aktivieren
3. Site Key generieren
4. In index.html einfügen:

```html
<script src="https://www.google.com/recaptcha/api.js?render=YOUR_SITE_KEY"></script>
<script>
  grecaptcha.ready(function() {
    grecaptcha.execute('YOUR_SITE_KEY', {action: 'submit'});
  });
</script>
```

---

## 🚫 API Key Restrictions (Google Cloud Console)

Obwohl API-Keys obfuskiert sind, sollten sie in Google Cloud Console eingeschränkt werden:

1. Google Cloud Console → APIs & Services → Credentials
2. Wähle deinen API Key
3. **Application restrictions:**
   - HTTP referrers
   - Hinzufügen: `https://jonaderunechte.github.io/*`
   - Hinzufügen: `http://localhost:*` (für Testing)

4. **API restrictions:**
   - Nur folgende APIs erlauben:
     - Identity Toolkit API
     - Cloud Firestore API
     - Token Service API

---

## 📈 Quotas & Limits setzen

Firebase Console → Usage and billing → Details

### Empfohlene Limits:
```
Firestore Reads:     50,000/day (Free Tier: 50,000)
Firestore Writes:    20,000/day (Free Tier: 20,000)
Authentication:      3,000/day (Free Tier unbegrenzt)
```

Bei Überschreitung: E-Mail-Benachrichtigung aktivieren

---

## 🧪 Rules Testing

### In Firebase Console testen:
1. Firestore → Rules → Playground
2. Simuliere verschiedene Szenarien:

```javascript
// Test 1: User liest eigene Bestellung
Authenticated: yes
User UID: abc123
Operation: get
Path: /orders/ORD-123
Expected: ALLOW (wenn userId == abc123)

// Test 2: User liest fremde Bestellung
Authenticated: yes
User UID: abc123
Operation: get
Path: /orders/ORD-456
Expected: DENY (wenn userId != abc123)

// Test 3: Admin liest alle
Authenticated: yes
Email: jona.thielgen@gmail.com
Operation: get
Path: /orders/ORD-456
Expected: ALLOW

// Test 4: Nicht eingeloggt
Authenticated: no
Operation: get
Path: /orders/ORD-123
Expected: DENY
```

---

## ⚡ Performance Rules

### Indizes erstellen (für schnelle Queries):

Firebase Console → Firestore → Indexes

```javascript
// Collection: orders
// Fields to index:
- userId (Ascending)
- status (Ascending)
- createdAt (Descending)

// Collection: notifications  
// Fields to index:
- userId (Ascending)
- read (Ascending)
- timestamp (Descending)
```

---

## 🔍 Monitoring & Logs

### Firestore Usage überwachen:
Firebase Console → Firestore → Usage

**Wichtig überwachen:**
- Document reads/writes (Kosten!)
- Document size (Max 1 MB!)
- Failed operations (Security Violations)

### Security Violations ansehen:
Firebase Console → Firestore → Rules → Denied requests

---

## 🛡️ Best Practices

### ✅ DO:
- Immer `request.auth != null` prüfen
- User ID validieren (`request.auth.uid`)
- Admin-Email prüfen für sensitive Operationen
- Indizes für häufige Queries
- Rate Limiting aktivieren
- Regelmäßig Rules testen

### ❌ DON'T:
- Niemals `allow read, write: if true` für sensitive Daten
- Keine sensiblen Daten im Frontend hardcoden
- Admin-Email nicht im Client-Code (ist ok, da nur Prüfung)
- Keine unbegrenzten Queries

---

## 📝 Admin-E-Mail ändern

Falls Admin-E-Mail geändert werden soll:

### 1. In Security Rules:
```javascript
// Ersetze:
request.auth.token.email == 'jona.thielgen@gmail.com'

// Mit:
request.auth.token.email == 'neue-admin@email.de'
```

### 2. In script.js:
```javascript
// Zeile 4:
const ADMIN_EMAIL = 'neue-admin@email.de';
```

### 3. In index.html (Firebase Init):
```javascript
// Zeile ~503:
window.isAdmin = (user.email === 'neue-admin@email.de');
```

---

## 🚀 Deployment Checklist

Vor dem Live-Gang:

- [ ] Firestore Rules gesetzt
- [ ] Authentication aktiviert
- [ ] API Key Restrictions gesetzt
- [ ] Rate Limiting konfiguriert
- [ ] Quotas & Limits gesetzt
- [ ] Indizes erstellt
- [ ] Rules getestet
- [ ] Monitoring aktiviert
- [ ] Backup-Strategie definiert

---

## 💾 Backup-Strategie

### Automatische Backups:
Firebase Console → Firestore → Backups

**Empfehlung:**
- Tägliches Backup
- Retention: 30 Tage
- Location: europe-west3 (Frankfurt)

### Manuelles Export:
```bash
gcloud firestore export gs://your-bucket/backups/$(date +%Y-%m-%d)
```

---

## 📞 Support

Bei Problemen:
- Firebase Support: https://firebase.google.com/support
- Stack Overflow: Tag `firebase` + `firestore`
- Firebase Status: https://status.firebase.google.com

---

**Erstellt**: 09.02.2026  
**Version**: 1.0  
**Status**: Produktionsbereit  
**Kritikalität**: 🔴 SEHR HOCH - MUSS gesetzt werden!
