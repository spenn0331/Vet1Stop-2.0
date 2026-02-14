'use client';

import React, { useState, useEffect } from 'react';

export default function DbDebugPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dbInfo, setDbInfo] = useState<any>(null);
  const [healthResourcesInfo, setHealthResourcesInfo] = useState<any>(null);

  useEffect(() => {
    async function fetchDiagnostics() {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch from our debug endpoint
        const response = await fetch('/api/debug-db');
        if (!response.ok) {
          throw new Error(`API returned ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        setDbInfo(data);
        
        // Also fetch direct data from health resources endpoint
        const healthResponse = await fetch('/api/health-resources');
        if (healthResponse.ok) {
          const healthData = await healthResponse.json();
          setHealthResourcesInfo(healthData);
        }
      } catch (err) {
        setError((err as Error).message);
        console.error('Error fetching database info:', err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchDiagnostics();
  }, []);
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Database Diagnostics</h1>
      
      {loading && <p className="text-gray-600">Loading database information...</p>}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
        </div>
      )}
      
      {dbInfo && (
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded">
            <h2 className="text-xl font-semibold mb-2">Connection Configuration</h2>
            <p><strong>MongoDB URI:</strong> {dbInfo.uri}</p>
            <p><strong>Configured DB Name:</strong> {dbInfo.configuredDbName}</p>
            <p><strong>Connection Status:</strong> {dbInfo.success ? 'Connected' : 'Failed'}</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded">
            <h2 className="text-xl font-semibold mb-2">Available Databases</h2>
            <ul className="list-disc list-inside">
              {dbInfo.allDatabases?.map((db: any, index: number) => (
                <li key={index}>
                  <strong>{db.name}</strong> ({db.sizeOnDisk} bytes)
                  {db.empty && <span className="text-red-500 ml-2">(Empty)</span>}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bg-green-50 p-4 rounded">
            <h2 className="text-xl font-semibold mb-2">Collections with Documents</h2>
            <p><strong>Total Collections Found:</strong> {dbInfo.healthCollections?.length || 0}</p>
            
            <div className="overflow-x-auto mt-4">
              <table className="min-w-full bg-white border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2">Database</th>
                    <th className="border p-2">Collection</th>
                    <th className="border p-2">Document Count</th>
                    <th className="border p-2">Has Title Field</th>
                    <th className="border p-2">Has Category Field</th>
                    <th className="border p-2">Has HealthType Field</th>
                  </tr>
                </thead>
                <tbody>
                  {dbInfo.healthCollections?.map((coll: any, index: number) => (
                    <tr key={index} className={coll.documentCount === 192 ? "bg-yellow-100" : ""}>
                      <td className="border p-2">{coll.database}</td>
                      <td className="border p-2">{coll.collection}</td>
                      <td className="border p-2 font-semibold">{coll.documentCount}</td>
                      <td className="border p-2">{coll.hasTitleField ? "✅" : "❌"}</td>
                      <td className="border p-2">{coll.hasCategoryField ? "✅" : "❌"}</td>
                      <td className="border p-2">{coll.hasHealthTypeField ? "✅" : "❌"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {dbInfo.targetCollection && (
            <div className="bg-yellow-50 p-4 rounded">
              <h2 className="text-xl font-semibold mb-2">Target Collection (192 Documents)</h2>
              <p><strong>Database:</strong> {dbInfo.targetCollection.database}</p>
              <p><strong>Collection:</strong> {dbInfo.targetCollection.collection}</p>
              <p><strong>Document Count:</strong> {dbInfo.targetCollection.documentCount}</p>
              
              <h3 className="text-lg font-semibold mt-4 mb-2">Sample Documents</h3>
              <div className="space-y-4">
                {dbInfo.sampleDocuments?.map((doc: any, index: number) => (
                  <div key={index} className="bg-white p-3 rounded border">
                    <p><strong>ID:</strong> {doc._id}</p>
                    <p><strong>Title:</strong> {doc.title}</p>
                    <p><strong>Category:</strong> {doc.category}</p>
                    <p><strong>Tags:</strong> {Array.isArray(doc.tags) ? doc.tags.join(', ') : 'None'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="bg-purple-50 p-4 rounded">
            <h2 className="text-xl font-semibold mb-2">Health Resources API Response</h2>
            {healthResourcesInfo ? (
              <div>
                <p><strong>Success:</strong> {healthResourcesInfo.success ? 'Yes' : 'No'}</p>
                <p><strong>Resources Returned:</strong> {healthResourcesInfo.data?.length || 0}</p>
                <p><strong>Total Items:</strong> {healthResourcesInfo.pagination?.totalItems || 0}</p>
                <p><strong>Is Using Static Data?</strong> {healthResourcesInfo.data?.length === 9 ? 'Likely YES (9 items)' : 'No'}</p>
                
                {healthResourcesInfo.data?.length > 0 && (
                  <div className="mt-3">
                    <h3 className="text-lg font-semibold mb-2">First Resource:</h3>
                    <pre className="bg-gray-800 text-white p-3 rounded overflow-x-auto">
                      {JSON.stringify(healthResourcesInfo.data[0], null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <p>No health resources information available</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
