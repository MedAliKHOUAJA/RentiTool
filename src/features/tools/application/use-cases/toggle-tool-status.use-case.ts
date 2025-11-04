'use client';

interface ToggleToolStatusParams {
  toolId: number;
  isActive: boolean;
}

export async function toggleToolStatus({ toolId, isActive }: ToggleToolStatusParams) {
  try {
    const response = await fetch(`/api/tools/${toolId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isActive }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error toggling tool status:', error);
    return {
      success: false,
      error: 'Failed to update tool status',
    };
  }
}