'use client';

import React, { useEffect, useState } from 'react';

const DebugPage = () => {
  const [healthData, setHealthData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHealthData();
  }, []);

  const fetchHealthData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/health');
      const data = await response.json();
      setHealthData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const setupDatabase = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/setup-database', { method: 'POST' });
      const data = await response.json();
      alert(`Database setup result: ${data.message}`);
      fetchHealthData(); // Refresh health data
    } catch (err: any) {
      alert(`Setup failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testRentalUpdate = async () => {
    try {
      setLoading(true);
      
      // First, get current rentals
      const rentalsResponse = await fetch('/api/rentals-real');
      const rentalsData = await rentalsResponse.json();
      
      if (rentalsData.success && rentalsData.rentals.length > 0) {
        const firstRental = rentalsData.rentals[0];
        console.log('Testing update for rental:', firstRental.rentalId);
        
        // Try to update the first rental's status
        const updateResponse = await fetch('/api/rentals-real', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            rentalId: firstRental.rentalId, 
            statusId: 2 // Accept the rental
          })
        });
        
        if (updateResponse.ok) {
          const updateData = await updateResponse.json();
          alert(`✅ Test successful! ${updateData.message}`);
        } else {
          const errorData = await updateResponse.json();
          alert(`❌ Test failed: ${errorData.error}`);
        }
      } else {
        alert('No rentals found to test with. Please create a rental first.');
      }
    } catch (err: any) {
      alert(`Test failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fixDatabase = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/fix-database', { method: 'POST' });
      const data = await response.json();
      alert(`Fix result: ${data.message}`);
    } catch (err: any) {
      alert(`Fix failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fixToolsStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/fix-tools-status', { method: 'POST' });
      const data = await response.json();
      alert(`Tools Status Fix: ${data.message}\n\n${data.results?.join('\n') || ''}`);
    } catch (err: any) {
      alert(`Tools Status Fix failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const forceFixDatabase = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/force-fix-database', { method: 'POST' });
      const data = await response.json();
      alert(`Force Fix: ${data.message}\n\n${data.results?.join('\n') || ''}`);
    } catch (err: any) {
      alert(`Force Fix failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const removeTrigger = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/remove-trigger', { method: 'POST' });
      const data = await response.json();
      alert(`Remove Trigger: ${data.message}\n\n${data.results?.join('\n') || ''}`);
    } catch (err: any) {
      alert(`Remove Trigger failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const restoreCleanProject = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/restore-clean-project', { method: 'POST' });
      const data = await response.json();
      alert(`Restore Clean Project: ${data.message}\n\n${data.results?.join('\n') || ''}`);
    } catch (err: any) {
      alert(`Restore Clean Project failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testRentalStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/test-rental-status', { method: 'GET' });
      const data = await response.json();
      console.log('Test rental-status result:', data);
      alert(`Test Rental Status: ${data.success ? 'SUCCESS' : 'FAILED'}\n\n${JSON.stringify(data, null, 2)}`);
    } catch (err: any) {
      alert(`Test Rental Status failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="container py-10">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900"></div>
          <span className="ml-2">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Database Debug Page</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
      )}

      {healthData && (
        <div className="space-y-6">
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Database Status</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <strong>Status:</strong> 
                <span className={`ml-2 px-2 py-1 rounded text-sm ${
                  healthData.status === 'ok' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {healthData.status}
                </span>
              </div>
              <div>
                <strong>Database:</strong> 
                <span className={`ml-2 px-2 py-1 rounded text-sm ${
                  healthData.database === 'connected' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {healthData.database}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Tables Status</h2>
            <div className="space-y-2">
              <div>
                <strong>Tools Table:</strong> 
                <span className={`ml-2 px-2 py-1 rounded text-sm ${
                  healthData.tables?.toolsTableFound ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {healthData.tables?.toolsTableName || 'Not found'}
                </span>
              </div>
              <div>
                <strong>Existing Tables:</strong> 
                <span className="ml-2 text-sm text-gray-600">
                  {healthData.tables?.existing?.join(', ') || 'None'}
                </span>
              </div>
              <div>
                <strong>Missing Tables:</strong> 
                <span className={`ml-2 text-sm ${
                  healthData.tables?.missing?.length === 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {healthData.tables?.missing?.join(', ') || 'None'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Actions</h2>
            <div className="space-y-4">
              <button
                onClick={setupDatabase}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Setup Database Tables
              </button>
              <button
                onClick={testRentalUpdate}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 ml-2"
              >
                Test Rental Update
              </button>
              <button
                onClick={fixDatabase}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 ml-2"
              >
                Fix UpdatedAt Error
              </button>
              <button
                onClick={fixToolsStatus}
                className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 ml-2"
              >
                Fix Tools StatusId NULL
              </button>
              <button
                onClick={forceFixDatabase}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 ml-2"
              >
                FORCE FIX UpdatedAt
              </button>
              <button
                onClick={removeTrigger}
                className="px-4 py-2 bg-red-800 text-white rounded hover:bg-red-900 ml-2"
              >
                REMOVE TRIGGER
              </button>
              <button
                onClick={restoreCleanProject}
                className="px-4 py-2 bg-green-800 text-white rounded hover:bg-green-900 ml-2"
              >
                RESTORE CLEAN PROJECT
              </button>
              <button
                onClick={testRentalStatus}
                className="px-4 py-2 bg-blue-800 text-white rounded hover:bg-blue-900 ml-2"
              >
                TEST RENTAL STATUS
              </button>
              <button
                onClick={fetchHealthData}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 ml-2"
              >
                Refresh Status
              </button>
            </div>
          </div>

          <div className="bg-gray-100 border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Raw Data</h2>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(healthData, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebugPage;
