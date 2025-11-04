'use client';

import { useEffect, useState } from 'react';

export default function TestToolPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [tool, setTool] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchTool() {
      try {
        const res = await fetch(`/api/tools/${id}`);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        setTool(data);
      } catch (e: any) {
        setError(e.message);
      }
    }

    fetchTool();
  }, [id]);

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!tool) {
    return <div>Loading...</div>;
  }

  return <pre>{JSON.stringify(tool, null, 2)}</pre>;
}
