# ⚡ Test Rapide - 5 Minutes

## 🎯 Objectif
Tester rapidement que l'IA Gemini fonctionne dans votre projet.

---

## ⏱️ Test en 5 étapes (5 minutes)

### Étape 1 : Démarrer le serveur (30 secondes)
```bash
npm run dev
```
Gardez ce terminal ouvert pour voir les messages générés.

---

### Étape 2 : Tester via la page de test (2 minutes)

1. **Ouvrez :** `http://localhost:3000/test-gemini`

2. **Test rapide :**
   - ID de Réservation : `14` (ou un ID existant)
   - Type de Message : "Confirmation"
   - Langue : "Français"
   - Cliquez sur **"🚀 Générer le Message"**

3. **Résultat attendu :**
   - ✅ Un message en français apparaît
   - ✅ Le message contient les détails de la réservation

---

### Étape 3 : Vérifier la console serveur (30 secondes)

**Dans le terminal où vous avez lancé `npm run dev`, vous devriez voir :**
```
✅ Message généré avec succès
```

Si vous voyez cela, l'IA fonctionne ! ✅

---

### Étape 4 : Tester l'acceptation automatique (1 minute)

1. **Allez sur :** `http://localhost:3000/rental-management`

2. **Trouvez une réservation "Pending"** et cliquez sur **"Accept"**

3. **Vérifiez le terminal serveur :**
   ```
   ✅ Message acceptance généré pour la réservation #X
   ```

Si vous voyez cela, l'intégration automatique fonctionne ! ✅

---

### Étape 5 : Vérification finale (1 minute)

**Checklist rapide :**
- [ ] Page de test accessible
- [ ] Message généré dans l'interface
- [ ] Message dans la console du serveur
- [ ] Acceptation génère un message automatiquement

**Si toutes les cases sont cochées :** 🎉 **L'IA fonctionne parfaitement !**

---

## 🐛 Si ça ne fonctionne pas

### Erreur : "GEMINI_API_KEY is not set"
→ Vérifiez que `.env.local` existe et contient votre clé API

### Erreur : "Rental not found"
→ Utilisez un ID de réservation qui existe dans votre base de données

### Pas de message dans la console
→ Redémarrez le serveur après avoir modifié `.env.local`

---

## ✅ Résultat attendu

Après 5 minutes, vous devriez avoir :
- ✅ Testé la génération de message
- ✅ Vérifié que l'IA fonctionne
- ✅ Confirmé l'intégration automatique

**C'est tout ! 🚀**

