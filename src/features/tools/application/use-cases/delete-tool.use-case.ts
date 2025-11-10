'use client';

export async function deleteTool(toolId: number) {
  try {
    const response = await fetch(`/api/tools/${toolId}`, {
      method: 'DELETE',
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting tool:', error);
    return {
      success: false,
      error: 'Failed to delete tool',
    };
  }
}