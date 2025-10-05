
import React from 'react';

const PrivacyPage = () => {
  return (
    <div className="container py-10 lg:py-16">
      <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-neutral-100 mb-8 lg:mb-12 text-center">
        Politique de Confidentialité
      </h1>
      <div className="max-w-3xl mx-auto space-y-6 text-neutral-700 dark:text-neutral-300">
        <p>La présente Politique de Confidentialité décrit comment RentiTool collecte, utilise et protège vos informations personnelles.</p>
        <h2 className="text-2xl font-semibold mt-8">1. Collecte des Informations</h2>
        <p>Nous collectons les informations que vous nous fournissez directement, telles que votre nom, adresse e-mail, numéro de téléphone, etc.</p>
        <h2 className="text-2xl font-semibold mt-8">2. Utilisation des Informations</h2>
        <p>Nous utilisons vos informations pour fournir, maintenir et améliorer nos services, traiter les transactions et communiquer avec vous.</p>
        <h2 className="text-2xl font-semibold mt-8">3. Partage des Informations</h2>
        <p>Nous ne partageons pas vos informations personnelles avec des tiers, sauf si nécessaire pour la fourniture de nos services ou si requis par la loi.</p>
        <p>...</p>
      </div>
    </div>
  );
};

export default PrivacyPage;
