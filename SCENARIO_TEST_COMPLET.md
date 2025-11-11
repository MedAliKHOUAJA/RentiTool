# 🎬 Scénario de Test Complet - Gemini AI dans votre Projet

## 📋 Vue d'ensemble

Ce scénario vous guide pas à pas pour tester l'intégration de Gemini AI dans votre système de gestion de réservations.

---

## 🎯 Objectif du test

Vérifier que l'IA génère automatiquement des messages personnalisés lors de :
1. ✅ Création d'une réservation
2. ✅ Acceptation d'une réservation
3. ✅ Rejet d'une réservation

---

## 📍 Prérequis

- [x] Serveur démarré : `npm run dev`
- [x] Clé API Gemini configurée dans `.env.local`
- [x] Au moins un outil disponible dans votre base de données
- [x] Au moins un utilisateur (propriétaire et locataire)

---

## 🎬 Scénario de test complet

### Étape 1 : Préparer l'environnement de test

#### 1.1 Ouvrir deux terminaux

**Terminal 1 - Serveur :**
```bash
npm run dev
```
Gardez ce terminal ouvert pour voir les logs de génération de messages.

**Terminal 2 - Console (optionnel) :**
Pour surveiller les requêtes API si nécessaire.

#### 1.2 Ouvrir le navigateur

Ouvrez votre navigateur et gardez la console développeur ouverte (F12) pour voir les requêtes.

---

### Étape 2 : Test via la page de test dédiée

#### 2.1 Accéder à la page de test

1. Ouvrez : `http://localhost:3000/test-gemini`
2. Vous devriez voir l'interface de test avec les paramètres

#### 2.2 Test 1 : Message de confirmation

**Actions :**
1. **ID de Réservation :** Entrez un ID existant (ex: `14` ou `1`)
2. **Type de Message :** Sélectionnez "Confirmation"
3. **Langue :** Sélectionnez "Français"
4. Cliquez sur **"🚀 Générer le Message"**

**Résultat attendu :**
- ✅ Un message de confirmation en français apparaît
- ✅ Le message contient l'ID de réservation
- ✅ Le message contient les dates de location
- ✅ Le message contient le prix total
- ✅ Le message est personnalisé et professionnel

**Vérification dans le terminal :**
```
✅ Message généré avec succès
```

#### 2.3 Test 2 : Message d'acceptation

**Actions :**
1. Changez le **Type de Message** à "Acceptation"
2. Gardez le même **ID de Réservation**
3. Cliquez sur **"🚀 Générer le Message"**

**Résultat attendu :**
- ✅ Un message d'acceptation positif et professionnel
- ✅ Le message confirme que la réservation est acceptée
- ✅ Le message contient les détails de la réservation

#### 2.4 Test 3 : Message de refus

**Actions :**
1. Changez le **Type de Message** à "Refus"
2. Cliquez sur **"🚀 Générer le Message"**

**Résultat attendu :**
- ✅ Un message de refus respectueux et empathique
- ✅ Le message explique poliment le refus
- ✅ Le message reste professionnel

#### 2.5 Test 4 : Différentes langues

**Test en anglais :**
1. Changez la **Langue** à "English"
2. Changez le **Type de Message** à "Confirmation"
3. Cliquez sur **"🚀 Générer le Message"**

**Résultat attendu :**
- ✅ Le message est généré en anglais
- ✅ Le message est correctement traduit

**Test en arabe :**
1. Changez la **Langue** à "العربية"
2. Cliquez sur **"🚀 Générer le Message"**

**Résultat attendu :**
- ✅ Le message est généré en arabe

---

### Étape 3 : Test via le workflow réel (Création de réservation)

#### 3.1 Créer une nouvelle réservation

**Actions :**
1. Allez sur la page d'accueil : `http://localhost:3000`
2. Naviguez vers un outil disponible
3. Sélectionnez des dates de location
4. Créez la réservation

**Vérification dans le Terminal 1 (serveur) :**
```
✅ Message de confirmation généré pour la réservation #X
```

**Ce qui se passe automatiquement :**
- L'IA génère un message de confirmation
- Le message est loggé dans la console du serveur
- Le message contient tous les détails de la réservation

#### 3.2 Vérifier le message généré

**Dans le terminal du serveur, vous devriez voir :**
```
✅ Message de confirmation généré pour la réservation #X: 
Bonjour,

Votre demande de réservation #X pour "Outil #Y" a été reçue avec succès.

Période: [dates]
Prix total: [prix] TND

Votre demande est en attente de confirmation par le propriétaire...
```

---

### Étape 4 : Test via le workflow réel (Acceptation/Rejet)

#### 4.1 Accéder à la page de gestion

1. Allez sur : `http://localhost:3000/rental-management`
2. Vous devriez voir la liste des réservations

#### 4.2 Accepter une réservation

**Actions :**
1. Trouvez une réservation avec le statut **"Pending"** (En attente)
2. Cliquez sur le bouton **"Accept"** (vert)
3. Attendez la confirmation

**Vérification dans le Terminal 1 (serveur) :**
```
✅ Message acceptance généré pour la réservation #X
```

**Ce qui se passe automatiquement :**
- Le statut de la réservation change à "Confirmed"
- L'IA génère un message d'acceptation
- Le message est loggé dans la console

**Message attendu dans la console :**
```
✅ Message acceptance généré pour la réservation #X: 
Bonjour,

Excellente nouvelle ! Votre réservation #X pour "Outil #Y" a été acceptée.

Période: [dates]
Prix total: [prix] TND

Vous pouvez maintenant procéder au paiement...
```

#### 4.3 Rejeter une réservation

**Actions :**
1. Trouvez une autre réservation avec le statut **"Pending"**
2. Cliquez sur le bouton **"Reject"** (rouge)
3. Attendez la confirmation

**Vérification dans le Terminal 1 (serveur) :**
```
✅ Message rejection généré pour la réservation #X
```

**Message attendu dans la console :**
```
✅ Message rejection généré pour la réservation #X: 
Bonjour,

Nous regrettons de vous informer que votre demande de réservation #X 
pour "Outil #Y" n'a pas pu être acceptée.

Le propriétaire a dû refuser cette demande...
```

---

### Étape 5 : Test complet du cycle de vie

#### 5.1 Cycle complet : Création → Acceptation

**Actions :**
1. **Créer une réservation** (Étape 3.1)
   - ✅ Vérifiez : Message de confirmation généré

2. **Accepter la réservation** (Étape 4.2)
   - ✅ Vérifiez : Message d'acceptation généré

3. **Résultat :**
   - ✅ Deux messages générés automatiquement
   - ✅ Messages personnalisés avec les détails
   - ✅ Messages dans la langue configurée (français)

#### 5.2 Cycle complet : Création → Rejet

**Actions :**
1. **Créer une réservation**
   - ✅ Vérifiez : Message de confirmation généré

2. **Rejeter la réservation**
   - ✅ Vérifiez : Message de refus généré

3. **Résultat :**
   - ✅ Deux messages générés automatiquement
   - ✅ Messages respectueux et professionnels

---

## ✅ Checklist de vérification

### Tests de base
- [ ] Page `/test-gemini` accessible et fonctionnelle
- [ ] Génération de message de confirmation fonctionne
- [ ] Génération de message d'acceptation fonctionne
- [ ] Génération de message de refus fonctionne
- [ ] Messages apparaissent dans l'interface

### Tests des langues
- [ ] Message en français fonctionne
- [ ] Message en anglais fonctionne
- [ ] Message en arabe fonctionne

### Tests du workflow automatique
- [ ] Création de réservation génère un message (console serveur)
- [ ] Acceptation de réservation génère un message (console serveur)
- [ ] Rejet de réservation génère un message (console serveur)

### Vérifications de qualité
- [ ] Messages contiennent l'ID de réservation
- [ ] Messages contiennent les dates de location
- [ ] Messages contiennent le prix total
- [ ] Messages sont personnalisés et professionnels
- [ ] Pas d'erreurs dans la console du serveur
- [ ] Pas d'erreurs dans la console du navigateur

---

## 🔍 Points de vérification détaillés

### 1. Vérification des messages générés

**Dans la console du serveur, vérifiez que :**
- ✅ Les messages sont générés sans erreur
- ✅ Les messages contiennent les détails de la réservation
- ✅ Les messages sont dans la bonne langue
- ✅ Les messages sont personnalisés (pas génériques)

### 2. Vérification de la personnalisation

**Les messages devraient contenir :**
- ✅ ID de réservation (#X)
- ✅ ID ou nom de l'outil
- ✅ Dates de début et de fin
- ✅ Prix total
- ✅ Ton adapté au type de message

### 3. Vérification des performances

**Temps de génération :**
- ✅ Les messages sont générés rapidement (< 5 secondes)
- ✅ Pas de timeout
- ✅ Pas d'erreur de connexion

---

## 🐛 Dépannage pendant le test

### Problème : Pas de message dans la console

**Solutions :**
1. Vérifiez que le serveur est bien démarré
2. Vérifiez que `.env.local` contient `GEMINI_API_KEY`
3. Redémarrez le serveur après modification de `.env.local`

### Problème : Erreur "Rental not found"

**Solutions :**
1. Utilisez un ID de réservation qui existe dans votre base de données
2. Vérifiez votre base de données pour les IDs disponibles

### Problème : Message de fallback utilisé

**Explication :**
Si vous voyez un message pré-défini (non généré par Gemini), cela signifie :
- Gemini n'est pas disponible temporairement, OU
- La clé API n'est pas valide

**Solution :**
- Vérifiez votre clé API Gemini
- Le système utilise automatiquement des messages de fallback pour ne pas bloquer

---

## 📊 Résultats attendus

### Après avoir suivi ce scénario, vous devriez avoir :

1. ✅ **Testé tous les types de messages** :
   - Confirmation
   - Acceptation
   - Refus
   - Rappel (via page de test)
   - Fin de réservation (via page de test)
   - Annulation (via page de test)

2. ✅ **Testé toutes les langues** :
   - Français
   - Anglais
   - Arabe

3. ✅ **Vérifié le workflow automatique** :
   - Messages générés lors de la création
   - Messages générés lors de l'acceptation
   - Messages générés lors du rejet

4. ✅ **Confirmé la qualité des messages** :
   - Messages personnalisés
   - Messages professionnels
   - Messages contenant tous les détails

---

## 🎉 Prochaines étapes (optionnel)

Une fois les tests réussis, vous pouvez :

1. **Intégrer l'envoi par email** : Envoyer les messages générés par email
2. **Intégrer l'envoi par SMS** : Envoyer les messages par SMS
3. **Créer des notifications push** : Notifier les utilisateurs en temps réel
4. **Sauvegarder les messages** : Stocker les messages dans la base de données

---

## 📝 Notes importantes

1. **Les messages sont générés automatiquement** - Vous n'avez pas besoin de faire quoi que ce soit de spécial
2. **Les messages sont loggés dans la console** - Ouvrez le terminal du serveur pour les voir
3. **Les messages peuvent être personnalisés** - Gemini adapte le message selon le contexte
4. **Le système est non-bloquant** - Si Gemini échoue, des messages de fallback sont utilisés

---

**Bon test ! 🚀**

Si vous rencontrez des problèmes, consultez les fichiers :
- `TEST_GEMINI.md` - Guide de test détaillé
- `GEMINI_SETUP.md` - Configuration
- `GUIDE_TEST_RAPIDE.md` - Guide rapide

