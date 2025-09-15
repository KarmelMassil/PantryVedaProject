import { Camera, Upload } from 'lucide-react';
import React from 'react';

export const CameraScanner = () => {
  return (
    <div className="bg-gray-100/50 border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-center h-full">
      <Camera className="text-gray-400 mb-4" size={48} />
      <h3 className="text-lg font-semibold text-text-primary">Camera not active</h3>
      <p className="text-sm text-text-secondary mb-4">Start the camera to begin scanning ingredients</p>
      <button className="bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg mb-3 hover:bg-blue-700 transition-colors">
        Start Camera
      </button>
      <button className="bg-white border border-gray-300 text-text-primary font-semibold px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors">
        Upload Image to Scan
      </button>
    </div>
  );
};