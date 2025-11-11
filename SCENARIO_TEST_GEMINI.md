# 🎬 Scénario de Test Complet - Gemini AI Messages Personnalisés

## 📍 Où trouver l'interface de test

### Option 1 : Page de test dédiée (Recommandé)
**URL :** `http://localhost:3000/test-gemini`

Cette page vous permet de tester la génération de messages avec différents paramètres.

### Option 2 : Interface de gestion des réservations
**URL :** `http://localhost:3000/rental-management`

L'IA est intégrée automatiquement dans cette page. Les messages sont générés en arrière-plan lorsque vous acceptez/rejetez des réservations.

---

## 🎯 Scénario de test complet

### Prérequis
- ✅ Serveur démarré : `npm run dev`
- ✅ Clé API Gemini configurée dans `.env.local`
- ✅ Au moins une réservation dans la base de données

---

## 📋 Scénario 1 : Test via la page de test dédiée

### Étape 1 : Accéder à la page de test
1. Ouvrez votre navigateur
2. Allez sur : `http://localhost:3000/test-gemini`
3. Vous devriez voir l'interface de test avec les paramètres

### Étape 2 : Tester un message de confirmation
1. **ID de Réservation :** Entrez `1` (ou un ID existant)
2. **Type de Message :** Sélectionnez "Confirmation"
3. **Langue :** Sélectionnez "Français"
4. Cliquez sur **"🚀 Générer le Message"**
5. **Résultat attendu :** Un message de confirmation en français devrait apparaître

### Étape 3 : Tester un message d'acceptation
1. Changez le **Type de Message** à "Acceptation"
2. Cliquez sur **"🚀 Générer le Message"**
3. **Résultat attendu :** Un message d'acceptation personnalisé

### Étape 4 : Tester un message de refus
1. Changez le **Type de Message** à "Refus"
2. Cliquez sur **"🚀 Générer le Message"**
3. **Résultat attendu :** Un message de refus respectueux

### Étape 5 : Tester différentes langues
1. Changez la **Langue** à "English"
2. Cliquez sur **"🚀 Générer le Message"**
3. **Résultat attendu :** Le message devrait être en anglais

---

## 📋 Scénario 2 : Test via l'interface de gestion des réservations

### Étape 1 : Accéder à la page de gestion
1. Ouvrez : `http://localhost:3000/rental-management`
2. Vous devriez voir la liste des réservations

### Étape 2 : Créer une nouvelle réservation
1. Allez sur une page de détail d'outil
2. Créez une nouvelle réservation
3. **Vérifiez la console du serveur** (terminal où vous avez lancé `npm run dev`)
4. **Résultat attendu :** Vous devriez voir :
   ```
   ✅ Message de confirmation généré pour la réservation #X
   ```

### Étape 3 : Accepter une réservation
1. Sur la page `/rental-management`
2. Trouvez une réservation avec le statut "Pending"
3. Cliquez sur le bouton **"Accept"** (vert)
4. **Vérifiez la console du serveur**
5. **Résultat attendu :** Vous devriez voir :
   ```
   ✅ Message acceptance généré pour la réservation #X
   ```

### Étape 4 : Rejeter une réservation
1. Sur la page `/rental-management`
2. Trouvez une réservation avec le statut "Pending"
3. Cliquez sur le bouton **"Reject"** (rouge)
4. **Vérifiez la console du serveur**
5. **Résultat attendu :** Vous devriez voir :
   ```
   ✅ Message rejection généré pour la réservation #X
   ```

---

## 📋 Scénario 3 : Test complet du workflow

### Étape 1 : Créer une réservation
1. Naviguez vers un outil disponible
2. Sélectionnez des dates de location
3. Créez la réservation
4. **Vérification :** Console serveur affiche "Message de confirmation généré"

### Étape 2 : Accepter la réservation
1. Allez sur `/rental-management`
2. Trouvez votre réservation (statut "Pending")
3. Cliquez sur "Accept"
4. **Vérification :** 
   - Le statut change à "Confirmed"
   - Console serveur affiche "Message acceptance généré"

### Étape 3 : Vérifier les messages générés
1. Ouvrez la console du serveur
2. Vous devriez voir les messages générés avec les détails de la réservation
3. Les messages sont personnalisés avec :
   - ID de réservation
   - Nom de l'outil
   - Dates de location
   - Prix total

---

## 🔍 Vérifications à faire

### ✅ Vérification 1 : Messages dans la console
Ouvrez le terminal où vous avez lancé `npm run dev` et vérifiez :
```
✅ Message de confirmation généré pour la réservation #1
✅ Message acceptance généré pour la réservation #1
```

### ✅ Vérification 2 : Messages générés correctement
Les messages devraient contenir :
- ✅ ID de réservation
- ✅ Détails de l'outil
- ✅ Dates de location
- ✅ Prix total
- ✅ Ton professionnel et personnalisé

### ✅ Vérification 3 : Pas d'erreurs
Vérifiez qu'il n'y a pas d'erreurs dans la console :
- ❌ Pas d'erreur "GEMINI_API_KEY is not set"
- ❌ Pas d'erreur "Rental not found"
- ❌ Pas d'erreur de connexion

## 🐛 Dépannage du scénario

### Problème : La page `/test-gemini` n'existe pas
**Solution :** Redémarrez le serveur (`npm run dev`)

### Problème : Erreur "Rental not found"
**Solution :** Utilisez un ID de réservation qui existe dans votre base de données

### Problème : Pas de message généré
**Vérifications :**
1. Vérifiez que `.env.local` contient `GEMINI_API_KEY`
2. Redémarrez le serveur après avoir modifié `.env.local`
3. Vérifiez la console du serveur pour les erreurs

### Problème : Message de fallback utilisé
**Explication :** Si Gemini n'est pas disponible, le système utilise automatiquement des messages pré-définis. C'est normal et ne bloque pas le processus.

---

## 📊 Checklist de test

### Test de base
- [ ] Page `/test-gemini` accessible
- [ ] Génération de message de confirmation fonctionne
- [ ] Génération de message d'acceptation fonctionne
- [ ] Génération de message de refus fonctionne

### Test des langues
- [ ] Message en français fonctionne
- [ ] Message en anglais fonctionne
- [ ] Message en arabe fonctionne

### Test du workflow
- [ ] Création de réservation génère un message
- [ ] Acceptation de réservation génère un message
- [ ] Rejet de réservation génère un message

### Vérifications
- [ ] Messages apparaissent dans la console du serveur
- [ ] Messages contiennent les détails de la réservation
- [ ] Pas d'erreurs dans la console

---

## 🎉 Résultat attendu

Après avoir suivi ce scénario, vous devriez :
- ✅ Avoir testé tous les types de messages
- ✅ Avoir vu les messages générés dans la console
- ✅ Avoir vérifié que l'IA fonctionne correctement
- ✅ Comprendre comment l'IA est intégrée dans votre workflow

---

## 📝 Notes importantes

1. **Les messages sont générés automatiquement** - Vous n'avez pas besoin de faire quoi que ce soit de spécial
2. **Les messages sont loggés dans la console** - Ouvrez le terminal du serveur pour les voir
3. **Les messages peuvent être envoyés** - Actuellement, ils sont seulement générés. Vous pouvez les intégrer dans un système d'email/SMS plus tard

---

**Bon test ! 🚀**

