
import React from 'react';

const TermsPage = () => {
  return (
    <div className="container py-10 lg:py-16">
      <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-neutral-100 mb-8 lg:mb-12 text-center">
        Conditions Générales d'Utilisation
      </h1>
      <div className="max-w-3xl mx-auto space-y-6 text-neutral-700 dark:text-neutral-300">
        <p>Bienvenue sur RentiTool. En utilisant notre plateforme, vous acceptez les présentes conditions générales d'utilisation.</p>
        <h2 className="text-2xl font-semibold mt-8">1. Acceptation des Conditions</h2>
        <p>L'accès et l'utilisation de RentiTool sont soumis à votre acceptation et au respect des présentes Conditions Générales d'Utilisation.</p>
        <h2 className="text-2xl font-semibold mt-8">2. Services Proposés</h2>
        <p>RentiTool est une plateforme de mise en relation pour la location d'outils entre particuliers.</p>
        <h2 className="text-2xl font-semibold mt-8">3. Responsabilités</h2>
        <p>Les utilisateurs sont responsables de leurs interactions et des outils loués ou mis en location.</p>
        <p>...</p>
      </div>
    </div>
  );
};

export default TermsPage;
