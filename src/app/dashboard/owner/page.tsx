'use client';
import { useEffect, useState } from 'react';
import { Tool } from '@/features/tools/domain/tool';

export default function OwnerDashboard() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTools = async () => {
      try {
        const response = await fetch('/api/tools/my-tools');
        if (response.ok) {
          const data = await response.json();
          setTools(data.tools);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des outils:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTools();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Chargement...</div>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <h2 className="text-2xl font-semibold mb-4">Mes outils</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => (
            <div key={tool.toolId} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <h3 className="text-lg font-medium text-gray-900">{tool.title}</h3>
                <p className="mt-2 text-sm text-gray-500">{tool.description}</p>
                <div className="mt-4">
                  <span className="text-lg font-bold">{tool.rentalPricePerDay} €</span>
                  <span className="text-sm text-gray-500"> / jour</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}