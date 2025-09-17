"use client";
import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'webcam-easy';
import { Camera, Upload, Video, Circle, StopCircle } from 'lucide-react';

interface CameraScannerProps {
  onRecognize: () => void; // Callback to notify parent of a "scan"
}

export const CameraScanner: React.FC<CameraScannerProps> = ({ onRecognize }) => {
  // Refs for DOM elements and webcam instance
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const webcamRef = useRef<Webcam | null>(null);

  // State to manage camera activity and errors
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Effect for cleanup: ensure camera stops when component unmounts
  useEffect(() => {
    return () => {
      if (webcamRef.current && webcamRef.current.webcamStarted) {
        webcamRef.current.stop();
      }
    };
  }, []);

  const handleStartCamera = () => {
    if (videoRef.current && canvasRef.current) {
      setErrorMsg('');
      // Initialize webcam-easy
      const webcam = new Webcam(videoRef.current, 'user', canvasRef.current);
      webcamRef.current = webcam;

      webcam.start()
        .then(result => {
          console.log("Webcam started");
          setIsCameraActive(true);
        })
        .catch(err => {
          console.error(err);
          setErrorMsg("Could not start camera. Please allow camera permissions.");
        });
    }
  };

  const handleStopCamera = () => {
    if (webcamRef.current) {
      webcamRef.current.stop();
      setIsCameraActive(false);
    }
  };

  const handleCapture = () => {
    if (webcamRef.current) {
      const picture = webcamRef.current.snap();
      console.log("Captured picture:", picture); // This is the base64 image data URL
      // Simulate recognition
      onRecognize();
    }
  };
  
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      console.log("Uploaded file:", file.name);
      // Simulate recognition from the uploaded file
      onRecognize();
    }
  };

  return (
    <div className="w-full text-center">
      {/* Hidden canvas for webcam-easy and file input */}
      <canvas ref={canvasRef} className="hidden"></canvas>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileSelected} 
        accept="image/*" 
        className="hidden"
      />

      {/* Camera Preview Area */}
      <div className="relative w-full aspect-video bg-gray-200 rounded-lg overflow-hidden mb-4 border-2 border-dashed border-gray-300">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className={`w-full h-full object-cover ${!isCameraActive && 'hidden'}`}
        ></video>
        {!isCameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
            <Video size={48} />
            <p className="mt-2">Camera preview will appear here</p>
          </div>
        )}
      </div>

      {/* Error Message Display */}
      {errorMsg && <p className="text-red-500 text-sm mb-4">{errorMsg}</p>}
      
      {/* Control Buttons */}
      <div className="space-y-3">
        {!isCameraActive ? (
          <>
            <button onClick={handleStartCamera} className="bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg w-full flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors">
              <Camera size={20} /> Start Camera
            </button>
            <button onClick={handleUploadClick} className="bg-white border border-gray-300 text-text-primary font-semibold px-6 py-2 rounded-lg w-full flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
              <Upload size={20} /> Upload Image to Scan
            </button>
          </>
        ) : (
          <div className="flex gap-4">
            <button onClick={handleCapture} className="bg-accent-secondary text-white font-semibold px-6 py-2 rounded-lg w-full flex items-center justify-center gap-2 hover:bg-green-700 transition-colors">
              <Circle size={20} /> Capture
            </button>
            <button onClick={handleStopCamera} className="bg-chili-red text-white font-semibold px-6 py-2 rounded-lg w-full flex items-center justify-center gap-2 hover:bg-red-700 transition-colors">
              <StopCircle size={20} /> Stop
            </button>
          </div>
        )}
      </div>
    </div>
  );
};