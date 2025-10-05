"use client";
import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'webcam-easy';
import { yoloService } from '@/lib/yoloService';
import { Camera, Upload, Video, Circle, StopCircle, Loader2, AlertTriangle } from 'lucide-react';

interface CameraScannerProps {
  onRecognize: (labels: string[]) => void;
}

export const CameraScanner: React.FC<CameraScannerProps> = ({ onRecognize }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const webcamRef = useRef<Webcam | null>(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Effect for cleanup: ensure camera stops when component unmounts
  useEffect(() => {
    return () => {
      // FIX #1: Corrected optional chaining syntax
      if (webcamRef.current?.webcamStarted) {
        webcamRef.current.stop();
      }
    };
  }, []);

  const runDetection = async (source: HTMLVideoElement | HTMLImageElement) => {
    setIsDetecting(true);
    setErrorMsg('');
    try {
      const detections = await yoloService.detectIngredients(source);
      if (detections.length > 0) {
        const labels = detections.map(d => d.label);
        onRecognize(labels);
      } else {
        alert("No ingredients recognized. Please try a clearer picture.");
      }
    } catch (error: any) {
      console.error("Detection failed:", error);
      setErrorMsg(error.message || "Detection failed. Please try again.");
    } finally {
      setIsDetecting(false);
    }
  };

  const handleCapture = async () => {
    if (videoRef.current) {
      webcamRef.current?.snap(); // Draw frame to canvas
      await runDetection(videoRef.current);
    }
  };
  
  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const img = new Image();
      img.src = URL.createObjectURL(event.target.files[0]);
      img.onload = async () => {
        await runDetection(img);
        URL.revokeObjectURL(img.src); // Clean up
      };
    }
  };

  const handleStartCamera = () => {
    if (videoRef.current && canvasRef.current) {
      setErrorMsg('');
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
  
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  if (yoloService.status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-10 text-center">
        <Loader2 className="animate-spin h-10 w-10 text-accent-primary" />
        <p className="mt-4 text-text-secondary">Initializing recognition model...</p>
      </div>
    );
  }

  if (yoloService.status === 'failed') {
    return (
        <div className="flex flex-col items-center justify-center h-full p-10 text-center">
            <AlertTriangle className="h-10 w-10 text-chili-red" />
            <p className="mt-4 font-semibold">Model Failed to Load</p>
            <p className="text-sm text-text-secondary">Refresh the page or check the console for errors.</p>
      </div>
    );
  }

  return (
    <div className="w-full text-center relative">
      <canvas ref={canvasRef} className="hidden"></canvas>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileSelected} 
        accept="image/*" 
        className="hidden"
      />

      {isDetecting && (
        <div className="absolute inset-0 bg-white/70 flex flex-col items-center justify-center z-10 rounded-lg">
          <Loader2 className="animate-spin h-8 w-8 text-accent-primary" />
          <p className="mt-2 font-semibold">Detecting...</p>
        </div>
      )}

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

      {errorMsg && <p className="text-red-500 text-sm mb-4">{errorMsg}</p>}
      
      <div className="space-y-3">
        {!isCameraActive ? (
          <>
            <button onClick={handleStartCamera} disabled={isDetecting} className="bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg w-full flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-50">
              <Camera size={20} /> Start Camera
            </button>
            <button onClick={handleUploadClick} disabled={isDetecting} className="bg-white border border-gray-300 text-text-primary font-semibold px-6 py-2 rounded-lg w-full flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors disabled:opacity-50">
              <Upload size={20} /> Upload Image to Scan
            </button>
          </>
        ) : (
          <div className="flex gap-4">
            <button onClick={handleCapture} disabled={isDetecting} className="bg-accent-secondary text-white font-semibold px-6 py-2 rounded-lg w-full flex items-center justify-center gap-2 hover:bg-green-700 transition-colors disabled:opacity-50">
              <Circle size={20} /> Capture
            </button>
            <button onClick={handleStopCamera} disabled={isDetecting} className="bg-chili-red text-white font-semibold px-6 py-2 rounded-lg w-full flex items-center justify-center gap-2 hover:bg-red-700 transition-colors disabled:opacity-50">
              <StopCircle size={20} /> Stop
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
