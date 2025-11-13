#!/bin/bash

# Configuration optimisée pour Azure Student
RESOURCE_GROUP="rg-sentiment-analysis"
NAMESPACE_NAME="sb-rentitool"  # Nom plus court
TOPIC_NAME="notifications"
SKU="Basic"  # Basic au lieu de Standard pour économiser (si suffisant)
# Note: Basic ne supporte pas les Topics, donc on utilisera Standard

echo "🎓 Création Azure Service Bus pour RentiTool (Azure Student)"
echo "📦 Resource Group: $RESOURCE_GROUP"

# 1. Vérifier l'abonnement actif
echo ""
echo "🔍 Vérification de l'abonnement Azure Student..."
SUBSCRIPTION_NAME=$(az account show --query name --output tsv)
SUBSCRIPTION_ID=$(az account show --query id --output tsv)
echo "   ✅ Abonnement actif: $SUBSCRIPTION_NAME"
echo "   📝 ID: $SUBSCRIPTION_ID"

# 2. Vérifier la région du resource group
echo ""
echo "📍 Récupération de la région..."
LOCATION=$(az group show --name $RESOURCE_GROUP --query location --output tsv)
echo "   ✅ Région: $LOCATION"

# 3. Vérifier si le namespace existe déjà
echo ""
echo "🔍 Vérification si le namespace existe déjà..."
EXISTING_NS=$(az servicebus namespace show \
  --name $NAMESPACE_NAME \
  --resource-group $RESOURCE_GROUP 2>/dev/null)

if [ -n "$EXISTING_NS" ]; then
  echo "   ⚠️  Le namespace $NAMESPACE_NAME existe déjà!"
  echo "   Voulez-vous continuer avec celui-ci? (y/n)"
  read -r response
  if [[ "$response" != "y" ]]; then
    echo "   ❌ Opération annulée"
    exit 1
  fi
else
  # 4. Créer le Namespace (Standard car Basic ne supporte pas Topics)
  echo ""
  echo "🏗️  Création du Service Bus Namespace (Standard SKU)..."
  echo "   💡 Note: SKU Standard requis pour les Topics/Subscriptions"
  echo "   💰 Coût estimé: ~13€/mois (inclus dans vos crédits Student)"
  
  az servicebus namespace create \
    --name $NAMESPACE_NAME \
    --resource-group $RESOURCE_GROUP \
    --location $LOCATION \
    --sku Standard \
    --tags Environment=Development Project=RentiTool Owner=MedAliKHOUAJA

  echo "   ⏳ Attente de la création (1-2 minutes)..."
  az servicebus namespace wait \
    --name $NAMESPACE_NAME \
    --resource-group $RESOURCE_GROUP \
    --created
fi

# 5. Créer le Topic
echo ""
echo "📢 Création du Topic notifications..."
az servicebus topic create \
  --name $TOPIC_NAME \
  --namespace-name $NAMESPACE_NAME \
  --resource-group $RESOURCE_GROUP \
  --max-size 1024 \
  --default-message-time-to-live P7D \
  --enable-partitioning false 2>/dev/null || echo "   ℹ️  Topic déjà existant"

# 6. Créer les Subscriptions
echo ""
echo "📬 Création des subscriptions..."

# Email subscription
echo "   → email-subscription"
az servicebus topic subscription create \
  --name "email-subscription" \
  --topic-name $TOPIC_NAME \
  --namespace-name $NAMESPACE_NAME \
  --resource-group $RESOURCE_GROUP \
  --max-delivery-count 5 \
  --lock-duration PT3M \
  --enable-batched-operations true \
  --default-message-time-to-live P7D 2>/dev/null || echo "      ℹ️  Déjà existante"

# In-App subscription
echo "   → inapp-subscription"
az servicebus topic subscription create \
  --name "inapp-subscription" \
  --topic-name $TOPIC_NAME \
  --namespace-name $NAMESPACE_NAME \
  --resource-group $RESOURCE_GROUP \
  --max-delivery-count 5 \
  --lock-duration PT3M \
  --enable-batched-operations true \
  --default-message-time-to-live P7D 2>/dev/null || echo "      ℹ️  Déjà existante"

# Push notification subscription (optionnel)
echo "   → push-subscription"
az servicebus topic subscription create \
  --name "push-subscription" \
  --topic-name $TOPIC_NAME \
  --namespace-name $NAMESPACE_NAME \
  --resource-group $RESOURCE_GROUP \
  --max-delivery-count 5 \
  --lock-duration PT3M \
  --enable-batched-operations true \
  --default-message-time-to-live P7D 2>/dev/null || echo "      ℹ️  Déjà existante"

# 7. Créer une policy d'accès personnalisée
echo ""
echo "🔐 Création de la policy d'accès..."
az servicebus namespace authorization-rule create \
  --name "RentiToolAppPolicy" \
  --namespace-name $NAMESPACE_NAME \
  --resource-group $RESOURCE_GROUP \
  --rights Send Listen 2>/dev/null || echo "   ℹ️  Policy déjà existante"

# 8. Récupérer les connection strings
echo ""
echo "✅ ============================================"
echo "✅ Infrastructure créée avec succès!"
echo "✅ ============================================"
echo ""

# Connection String App Policy
APP_CONNECTION_STRING=$(az servicebus namespace authorization-rule keys list \
  --name "RentiToolAppPolicy" \
  --namespace-name $NAMESPACE_NAME \
  --resource-group $RESOURCE_GROUP \
  --query primaryConnectionString \
  --output tsv)

# Connection String Root (pour admin)
ROOT_CONNECTION_STRING=$(az servicebus namespace authorization-rule keys list \
  --name "RootManageSharedAccessKey" \
  --namespace-name $NAMESPACE_NAME \
  --resource-group $RESOURCE_GROUP \
  --query primaryConnectionString \
  --output tsv)

echo "🔑 CONNECTION STRING (Application - Send + Listen):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "$APP_CONNECTION_STRING"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "📋 Résumé de l'infrastructure:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "👤 Propriétaire:     MedAliKHOUAJA"
echo "🎓 Abonnement:       Azure Student"
echo "📦 Resource Group:   $RESOURCE_GROUP"
echo "🚀 Namespace:        $NAMESPACE_NAME"
echo "📢 Topic:            $TOPIC_NAME"
echo "💰 SKU:              Standard"
echo "📍 Location:         $LOCATION"
echo ""

# Afficher les subscriptions
echo "📬 Subscriptions créées:"
az servicebus topic subscription list \
  --topic-name $TOPIC_NAME \
  --namespace-name $NAMESPACE_NAME \
  --resource-group $RESOURCE_GROUP \
  --output table

# Récupérer les métriques de coûts
echo ""
echo "💰 Utilisation des Crédits Azure Student:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Service Bus Standard: ~13€/mois"
echo "12.5M opérations/mois: incluses"
echo "Au-delà: 0.05€ par million"
echo ""
echo "💡 Conseil: Surveillez vos crédits Student sur le portail Azure"

echo ""
echo "🔧 PROCHAINES ÉTAPES:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1️⃣  Ajouter dans .env.local:"
echo "────────────────────────────────────────────────────────"
echo "AZURE_SERVICE_BUS_CONNECTION_STRING=\"$APP_CONNECTION_STRING\""
echo ""
echo "2️⃣  Ajouter dans Vercel:"
echo "────────────────────────────────────────────────────────"
echo "vercel env add AZURE_SERVICE_BUS_CONNECTION_STRING production"
echo ""
echo "3️⃣  Installer le package:"
echo "────────────────────────────────────────────────────────"
echo "npm install @azure/service-bus"
echo ""
echo "4️⃣  Tester la connexion:"
echo "────────────────────────────────────────────────────────"
echo "npx tsx test-servicebus.ts"
echo ""

# Sauvegarder la configuration
CONFIG_FILE="servicebus-config-$(date +%Y%m%d).txt"
cat > $CONFIG_FILE <<EOF
# Configuration Azure Service Bus - RentiTool
# Créé par: MedAliKHOUAJA
# Date: $(date)
# Abonnement: Azure Student

Resource Group: $RESOURCE_GROUP
Namespace: $NAMESPACE_NAME
Location: $LOCATION
Topic: $TOPIC_NAME
SKU: Standard

# Connection String (Application - RentiToolAppPolicy)
AZURE_SERVICE_BUS_CONNECTION_STRING=$APP_CONNECTION_STRING

# Connection String (Root - Admin uniquement)
# À NE PAS utiliser dans l'application!
AZURE_SERVICE_BUS_ROOT_CONNECTION_STRING=$ROOT_CONNECTION_STRING

# Subscriptions:
- email-subscription (pour l'envoi d'emails)
- inapp-subscription (pour les notifications in-app)
- push-subscription (pour les notifications push)

# Azure Portal:
https://portal.azure.com/#@/resource/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.ServiceBus/namespaces/$NAMESPACE_NAME/overview

# Service Bus Explorer (Azure Portal):
https://portal.azure.com/#@/resource/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.ServiceBus/namespaces/$NAMESPACE_NAME/topics/$TOPIC_NAME/overview

# Surveillance des Crédits Student:
https://www.microsoftazuresponsorships.com/Balance
EOF

echo "💾 Configuration sauvegardée: $CONFIG_FILE"
echo ""
echo "🎉 TERMINÉ! Bonne chance avec RentiTool! 🚀"