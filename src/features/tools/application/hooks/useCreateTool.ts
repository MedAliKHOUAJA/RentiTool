'use client';

import { useState } from 'react';
import { ToolFormData, CreateToolResult } from '../../domain/tool.types';

export function useCreateTool() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fraudSimilarity, setFraudSimilarity] = useState<number | null>(null);

  const createTool = async (
    data: ToolFormData,
    images?: File[]
  ): Promise<string | number | null> => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setFraudSimilarity(null);

    try {
      // If images are provided, use FormData instead of JSON
      let response;
      
      if (images && images.length > 0) {
        const formData = new FormData();
        
        // Add tool data
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, String(value));
          }
        });

        // Add images
        images.forEach((file, index) => {
          formData.append(`image_${index}`, file);
        });

        response = await fetch('/api/tools', {
          method: 'POST',
          body: formData,
        });
      } else {
        // No images, use JSON
        response = await fetch('/api/tools', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
      }

      const result = await response.json();

      if (!result.success) {
        // Check for fraud similarity in error response
        if (result.fraudSimilarity !== undefined) {
          setFraudSimilarity(result.fraudSimilarity);
        }
        
        const errorMsg = result.error || 'Failed to create tool';
        setError(errorMsg);
        return null;
      }

      // Success
      setSuccess(result.message || 'Tool created successfully!');
      
      // Store fraud similarity if provided
      if (result.fraudSimilarity !== undefined) {
        setFraudSimilarity(result.fraudSimilarity);
      }

      return result.tool.toolId;
    } catch (err) {
      console.error('Error creating tool:', err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'An error occurred while creating the tool';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
    setFraudSimilarity(null);
  };

  return {
    createTool,
    create: createTool, // ✅ Alias for backward compatibility
    loading,
    error,
    success,
    fraudSimilarity,
    clearMessages,
  };
}