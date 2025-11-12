'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const CardsPage = () => {
  const router = useRouter();

  return (
    <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl sm:text-3xl font-bold">Cartes de Visite Numériques</h1>
      <p className="mt-2 text-sm sm:text-base">
        Cette page permet de gérer et partager vos cartes de visite numériques.
      </p>
      <div className="mt-6 flex flex-col sm:flex-row gap-4">
        <Link href="/account/cards/create">
          <button className="w-full sm:w-auto px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Créer une Nouvelle Carte
          </button>
        </Link>
        <button
          className="w-full sm:w-auto px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          onClick={() => router.push('/account/cards/view')}
        >
          Voir Mes Cartes
        </button>
      </div>
    </div>
  );
};

export default CardsPage;