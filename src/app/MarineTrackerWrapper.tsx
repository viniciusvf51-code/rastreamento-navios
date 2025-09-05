import dynamic from 'next/dynamic';

"use client";
// Importação dinâmica do componente principal para evitar problemas de SSR com Leaflet
const MarineTrackerComponent = dynamic(() => import('./MarineTrackerComponent'), {
  ssr: false,
  loading: () => (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Carregando MarineTracker...</p>
      </div>
    </div>
  )
});

export default function MarineTracker() {
  return <MarineTrackerComponent />;
  
}
