# 🚀 Guide de Test Rapide - Gemini AI

## 📍 Où trouver l'interface de test

### 🎯 Page de test dédiée (Recommandé)
**URL :** `http://localhost:3000/test-gemini`

Cette page vous permet de tester la génération de messages avec différents paramètres en temps réel.

---

## ⚡ Test rapide (2 minutes)

### Étape 1 : Démarrer le serveur
```bash
npm run dev
```

### Étape 2 : Ouvrir la page de test
1. Ouvrez votre navigateur
2. Allez sur : `http://localhost:3000/test-gemini`

### Étape 3 : Tester la génération
1. **ID de Réservation :** Entrez `1` (ou un ID existant dans votre base de données)
2. **Type de Message :** Sélectionnez "Confirmation"
3. **Langue :** Sélectionnez "Français"
4. Cliquez sur **"🚀 Générer le Message"**
5. **Résultat :** Un message personnalisé devrait apparaître !

---

## 🎬 Scénario de test complet

### Scénario 1 : Test via l'interface de test
1. Allez sur `/test-gemini`
2. Testez différents types de messages :
   - Confirmation
   - Acceptation
   - Refus
   - Rappel
3. Testez différentes langues :
   - Français
   - English
   - العربية

### Scénario 2 : Test via le workflow réel
1. Allez sur `/rental-management`
2. Créez une nouvelle réservation
3. **Vérifiez la console du serveur** → Vous devriez voir "Message de confirmation généré"
4. Acceptez ou rejetez une réservation
5. **Vérifiez la console du serveur** → Vous devriez voir "Message acceptance/rejection généré"

---

## ✅ Vérifications

### Console du serveur
Ouvrez le terminal où vous avez lancé `npm run dev` et vérifiez :
```
✅ Message de confirmation généré pour la réservation #1
✅ Message acceptance généré pour la réservation #1
```

### Interface de test
- Les messages apparaissent dans l'interface
- Les messages sont personnalisés avec les détails de la réservation
- Pas d'erreurs affichées

---

## 📋 Checklist de test

- [ ] Page `/test-gemini` accessible
- [ ] Génération de message fonctionne
- [ ] Messages apparaissent dans la console du serveur
- [ ] Messages contiennent les détails de la réservation
- [ ] Pas d'erreurs dans la console

---

## 🐛 Dépannage

### Erreur : "GEMINI_API_KEY is not set"
**Solution :** Vérifiez que `.env.local` existe et contient votre clé API

### Erreur : "Rental not found"
**Solution :** Utilisez un ID de réservation qui existe dans votre base de données

### La page `/test-gemini` n'existe pas
**Solution :** Redémarrez le serveur (`npm run dev`)

---

## 📚 Documentation complète

Pour plus de détails, consultez :
- `SCENARIO_TEST_GEMINI.md` - Scénario de test complet
- `TEST_GEMINI.md` - Guide de test détaillé
- `GEMINI_SETUP.md` - Configuration

---

**Bon test ! 🎉**

