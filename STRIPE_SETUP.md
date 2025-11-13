# Configuration Stripe pour RentiTool

## 🔧 Variables d'environnement requises

Ajoutez ces variables à votre fichier `.env.local` :

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Application Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:3003
```

## 📋 Étapes de configuration

### 1. Créer un compte Stripe
- Allez sur [stripe.com](https://stripe.com)
- Créez un compte développeur
- Activez le mode test

### 2. Récupérer les clés API
- Dans le dashboard Stripe, allez dans "Developers" > "API keys"
- Copiez la "Secret key" (commence par `sk_test_`)
- Copiez la "Publishable key" (commence par `pk_test_`)

### 3. Configurer le webhook
- Dans le dashboard Stripe, allez dans "Developers" > "Webhooks"
- Cliquez sur "Add endpoint"
- URL : `https://votre-domaine.com/api/stripe/webhook`
- Événements à écouter :
  - `checkout.session.completed`
  - `checkout.session.expired`
- Copiez le "Signing secret" (commence par `whsec_`)

### 4. Tester l'intégration
- Utilisez les cartes de test Stripe :
  - Succès : `4242 4242 4242 4242`
  - Échec : `4000 0000 0000 0002`
  - 3D Secure : `4000 0025 0000 3155`

## 🎯 Flux de paiement

1. **Client clique "Payer avec Stripe"**
   - Bouton visible uniquement pour les réservations confirmées
   - État de chargement pendant le traitement

2. **Création de session Stripe**
   - API : `POST /api/stripe/create-checkout-session`
   - Paramètres : rentalId, amount, toolName, dates
   - Retourne : sessionId, url de redirection

3. **Redirection vers Stripe Checkout**
   - Interface Stripe sécurisée
   - Saisie des informations de paiement
   - Validation 3D Secure si nécessaire

4. **Traitement du paiement**
   - Stripe traite le paiement
   - Webhook reçoit la confirmation
   - Statut mis à jour en base de données

5. **Page de succès**
   - URL : `/payment-success?session_id=...&rental_id=...`
   - Affichage des détails du paiement
   - Liens vers "Mes Locations" et "Mes Paiements"

## 🔐 Sécurité

- **Clés API** : Stockées dans les variables d'environnement
- **Webhooks** : Signature vérifiée avec le secret
- **HTTPS** : Requis en production
- **PCI DSS** : Conformité assurée par Stripe

## 🚀 Déploiement

### Mode Test
- Utilisez les clés de test (`sk_test_`, `pk_test_`)
- Webhook en mode test
- Cartes de test uniquement

### Mode Production
- Remplacez par les clés live (`sk_live_`, `pk_live_`)
- Configurez le webhook en production
- Testez avec de vrais paiements

## 📞 Support

- Documentation Stripe : [stripe.com/docs](https://stripe.com/docs)
- Support technique : [support.stripe.com](https://support.stripe.com)
- Communauté : [github.com/stripe](https://github.com/stripe)

## ✅ Checklist de déploiement

- [ ] Variables d'environnement configurées
- [ ] Clés API Stripe ajoutées
- [ ] Webhook configuré et testé
- [ ] URLs de succès/annulation configurées
- [ ] Tests avec cartes de test effectués
- [ ] Monitoring des erreurs activé
- [ ] Logs de paiement vérifiés
