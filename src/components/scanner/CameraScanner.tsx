"use client";
import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'webcam-easy';
import { yoloService } from '@/lib/yoloService';
import { Camera, Upload, Video, Circle, StopCircle, Loader2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { set } from 'date-fns';
import { usePantryStore } from '@/store/pantryStore';

interface CameraScannerProps {
  onRecognize: (labels: string[]) => void;
}

export const CameraScanner: React.FC<CameraScannerProps> = ({ onRecognize }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const webcamRef = useRef<Webcam | null>(null);
  const addToast = usePantryStore((state) => state.addToast);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
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
        addToast("No ingredients recognized. Please try a clearer picture.", 'error');
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
      webcamRef.current?.snap();
      await runDetection(videoRef.current);
    }
  };
  
  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
  if (event.target.files && event.target.files[0]) {
    const file = event.target.files[0];
    const imageURL = URL.createObjectURL(file);
    setUploadedPreview(imageURL); 
    const img = new Image();
    img.src = imageURL;
    img.onload = async () => {
      await runDetection(img);
    };
  }
};

  const handleStartCamera = () => {
    setUploadedPreview(null);
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
        {uploadedPreview ? (
          <img
            src={uploadedPreview}
            alt="Uploaded preview"
            className="w-full h-full object-cover"
          />
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className={`w-full h-full object-cover ${!isCameraActive && 'hidden'}`}
            ></video>
            {!isCameraActive && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-gray-50">
                    <p className="font-semibold text-gray-700 mb-4 text-center">Photo Tips for Best Results:</p>
                    <div className="grid grid-cols-2 gap-4 w-full">
                      <div className="text-center">
                        <img src="/images/good-scan-example.jpg" alt="Good lighting, clear view" className="rounded-md border-2 border-green-400 aspect-square object-cover" />
                        <div className="flex items-center justify-center mt-1">
                          <CheckCircle size={16} className="text-green-600 mr-1" />
                          <p className="text-xs font-medium text-gray-600">Clear & Well-Lit</p>
                        </div>
                      </div>
                      <div className="text-center">
                        <img src="/images/bad-scan-example.jpg" alt="Blurry, dark, or cluttered" className="rounded-md border-2 border-red-400 aspect-square object-cover" />
                         <div className="flex items-center justify-center mt-1">
                          <XCircle size={16} className="text-red-600 mr-1" />
                          <p className="text-xs font-medium text-gray-600">Blurry & Dark</p>
                        </div>
                      </div>
                    </div>
                </div>
            )}
          </>
        )}
      </div>

      {errorMsg && <p className="text-red-500 text-sm mb-4">{errorMsg}</p>}
      
      <div className="space-y-3">
        {!isCameraActive ? (
          <>
            <button onClick={handleStartCamera} disabled={isDetecting} className="bg-primary text-white font-semibold px-6 py-3 rounded-lg w-full flex items-center justify-center gap-2 hover:bg-orange-600 transition-all duration-300 transform hover:scale-105 shadow-md disabled:opacity-50">
              <Camera size={20} /> Start Camera
            </button>
            <button onClick={handleUploadClick} disabled={isDetecting} className="bg-white border-2 border-gray-300 text-text-primary font-semibold px-6 py-2.5 rounded-lg w-full flex items-center justify-center gap-2 hover:bg-gray-100 hover:border-gray-400 transition-colors disabled:opacity-50">
              <Upload size={20} /> Upload Image to Scan
            </button>
          </>
        ) : (
          <div className="flex gap-4">
            <button onClick={handleCapture} disabled={isDetecting} className="bg-green-500 text-white font-semibold px-6 py-2 rounded-lg w-full flex items-center justify-center gap-2 hover:bg-green-600 transition-colors disabled:opacity-50">
              <Circle size={20} /> Capture
            </button>
            <button onClick={handleStopCamera} disabled={isDetecting} className="bg-red-500 text-white font-semibold px-6 py-2 rounded-lg w-full flex items-center justify-center gap-2 hover:bg-red-600 transition-colors disabled:opacity-50">
              <StopCircle size={20} /> Stop
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
