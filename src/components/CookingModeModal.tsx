"use client";
import { Recipe } from '@/types';
import { usePantryStore } from '@/store/pantryStore';
import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, MicOff, Volume2, VolumeX, SkipBack, SkipForward, Play, Pause, RefreshCw, Clock, ChefHat, Save, Flame } from 'lucide-react';

const addToast = usePantryStore((state) => state.addToast);

// Helper function to parse time from a step, e.g., "cook for 10 minutes"
const getTimerFromStep = (step: string): number | null => {
    const match = step.match(/(\d+)\s+(minute|second)s?/i);
    if (!match) return null;
    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    return unit === 'minute' ? value * 60 : value;
};

// Helper to format seconds into MM:SS
const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

// Helper to format time for speech
const formatTimeForSpeech = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    if (minutes > 0 && seconds > 0) {
        return `${minutes} minute${minutes !== 1 ? 's' : ''} and ${seconds} second${seconds !== 1 ? 's' : ''}`;
    } else if (minutes > 0) {
        return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else {
        return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    }
};

// Helper to format ingredient text for speech
const formatIngredientForSpeech = (ingredient: string) => {
    return ingredient
        .replace(/\bg\b/gi, 'grams')
        .replace(/\bkg\b/gi, 'kilograms')
        .replace(/\bmg\b/gi, 'milligrams')
        .replace(/\bml\b/gi, 'milliliters')
        .replace(/\bl\b/gi, 'liters')
        .replace(/\btsp\b/gi, 'teaspoon')
        .replace(/\btbsp\b/gi, 'tablespoon')
        .replace(/\boz\b/gi, 'ounces')
        .replace(/\blb\b/gi, 'pounds')
        .replace(/\bcup\b/gi, 'cup')
        .replace(/\bcups\b/gi, 'cups')
        .replace(/\bpcs\b/gi, 'pieces');
};

// --- Web Speech API Interfaces (for TypeScript) ---
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  readonly isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: { new(): SpeechRecognition };
    webkitSpeechRecognition: { new(): SpeechRecognition };
  }
}
// --------------------------------------------------

interface CookingModeModalProps {
  recipe: Recipe;
  onClose: () => void;
  onFinishCooking: (recipe: Recipe) => void; // This will handle the logging
}

export const CookingModeModal: React.FC<CookingModeModalProps> = ({ recipe, onClose, onFinishCooking }) => {
  const [mode, setMode] = useState<'prep' | 'cook'>('prep');
  const [stepIndex, setStepIndex] = useState(0);

  const [timer, setTimer] = useState<number | null>(null);
  const [originalTimerValue, setOriginalTimerValue] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<number | null>(null);
  const originalTimerRef = useRef<number | null>(null);

  // Keep refs in sync with state
  useEffect(() => {
    timerRef.current = timer;
  }, [timer]);

  useEffect(() => {
    originalTimerRef.current = originalTimerValue;
  }, [originalTimerValue]);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const steps = mode === 'prep' ? recipe.ingredients.map(ing => `${ing.quantity} ${ing.unit} ${ing.name}`) : recipe.instructions;
  const currentStep = steps[stepIndex];

  // --- Text-to-Speech (TTS) Logic ---
  const speak = (text: string) => {
    if (!window.speechSynthesis) return;
    speechSynthesis.cancel(); // Stop any previous speech
    
    // Format the text for better speech
    let speechText = text;
    if (mode === 'prep') {
      speechText = formatIngredientForSpeech(text);
    }
    
    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  // --- Timer Logic ---
  useEffect(() => {
    if (isTimerRunning && timer !== null && timer > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimer(t => (t ? t - 1 : 0));
      }, 1000);
    } else if (timer === 0) {
      setIsTimerRunning(false);
      speak("Timer finished");
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTimerRunning, timer]);

  const startTimer = (seconds?: number) => {
    // Only set new time if seconds is explicitly provided, otherwise just resume
    if (seconds) {
      setTimer(seconds);
      setOriginalTimerValue(seconds);
    } else if (!timer) {
      // If there's no current timer, get it from the step
      const timeFromStep = getTimerFromStep(currentStep);
      if (timeFromStep) {
        setTimer(timeFromStep);
        setOriginalTimerValue(timeFromStep);
      }
    }
    // In all cases, start running
    setIsTimerRunning(true);
    if (timer) {
      speak(`Starting timer for ${formatTimeForSpeech(timer)}`);
    }
  };
  
  const pauseTimer = () => setIsTimerRunning(false);
  
  const resetTimer = () => {
    setIsTimerRunning(false);
    // Use the original timer value that was set when timer started
    if (originalTimerValue) {
      setTimer(originalTimerValue);
    } else {
      // Fallback to step time
      const defaultTime = getTimerFromStep(currentStep);
      if (defaultTime) {
        setTimer(defaultTime);
        setOriginalTimerValue(defaultTime);
      }
    }
  };

  // --- Navigation Logic ---
  const goToNextStep = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex(stepIndex + 1);
    } else if (mode === 'prep') {
      setMode('cook');
      setStepIndex(0);
    }
  };
  const goToPrevStep = () => {
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
    } else if (mode === 'cook') {
      setMode('prep');
      setStepIndex(recipe.ingredients.length - 1);
    }
  };

  // --- Speech Recognition Logic ---
  useEffect(() => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      console.warn("Speech recognition not supported in this browser.");
      return;
    }
    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const command = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
      console.log("Command received:", command);
      
      if (command.includes('next')) {
        setStepIndex(prev => {
          const currentSteps = mode === 'prep' ? recipe.ingredients.map(ing => `${ing.quantity} ${ing.unit} ${ing.name}`) : recipe.instructions;
          if (prev < currentSteps.length - 1) return prev + 1;
          if (mode === 'prep') {
            setMode('cook');
            return 0;
          }
          return prev;
        });
      }
      else if (command.includes('previous') || command.includes('back')) {
        setStepIndex(prev => {
          if (prev > 0) return prev - 1;
          if (mode === 'cook') {
            setMode('prep');
            return recipe.ingredients.length - 1;
          }
          return prev;
        });
      }
      else if (command.includes('repeat')) speak(currentStep);
      else if (command.includes('start timer')) {
        // Check if timer already exists (resume) or needs to be created
        const currentTimerValue = timerRef.current;
        if (currentTimerValue && currentTimerValue > 0) {
          // Resume existing timer
          setIsTimerRunning(true);
          speak(`Starting timer`);
        } else {
          // Start new timer from step
          const timeInStep = getTimerFromStep(currentStep);
          if (timeInStep) {
            setTimer(timeInStep);
            setOriginalTimerValue(timeInStep);
            setIsTimerRunning(true);
            speak(`Starting timer for ${formatTimeForSpeech(timeInStep)}`);
          }
        }
      }
      else if (command.includes('pause timer')) {
        setIsTimerRunning(false);
        speak("Timer paused");
      }
      else if (command.includes('reset timer')) {
        setIsTimerRunning(false);
        // Use the original timer value from ref
        const origValue = originalTimerRef.current;
        if (origValue) {
          setTimer(origValue);
          speak(`Timer reset to ${formatTimeForSpeech(origValue)}`);
        } else {
          const defaultTime = getTimerFromStep(currentStep);
          if (defaultTime) {
            setTimer(defaultTime);
            setOriginalTimerValue(defaultTime);
            speak(`Timer reset to ${formatTimeForSpeech(defaultTime)}`);
          }
        }
      }
      else if (command.includes('preparation') || command.includes('prep mode')) {
        setMode('prep');
        setStepIndex(0);
      }
      else if (command.includes('cooking') || command.includes('cook mode')) {
        setMode('cook');
        setStepIndex(0);
      }
    };
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      // Don't stop listening on errors, just log them
      if (event.error === 'no-speech' || event.error === 'audio-capture') {
        // These are recoverable errors, keep listening
        return;
      }
    };
    recognition.onend = () => {
      if (isListening) {
        try {
          recognition.start(); // Restart if it's supposed to be on
        } catch (e) {
          console.error('Error restarting recognition:', e);
        }
      }
    };
    recognitionRef.current = recognition;
  }, [isListening, currentStep, mode, recipe.ingredients.length, recipe.instructions.length]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        setIsListening(true);
        recognitionRef.current.start();
      } catch (e) {
        console.error('Error starting recognition:', e);
        setIsListening(false);
      }
    } else if (!recognitionRef.current) {
      addToast("Speech recognition is not available on this browser.", 'error');
    }
  };
  const stopListening = () => {
    if (recognitionRef.current) {
      setIsListening(false);
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error('Error stopping recognition:', e);
      }
    }
  };

  // Effect to manage side-effects when step changes
  useEffect(() => {
    // Reset and auto-check for timer
    pauseTimer();
    const timeInStep = getTimerFromStep(currentStep);
    setTimer(timeInStep);
    setOriginalTimerValue(timeInStep);
    // Auto-read the step
    speak(currentStep);
  }, [stepIndex, mode]);

  const handleFinish = () => {
    onFinishCooking(recipe);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b">
        <h2 className="text-2xl font-bold text-accent-primary">{recipe.name}</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
          <X size={32} />
        </button>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row p-6 gap-6 overflow-y-auto">
        {/* Left Side: Step-by-Step */}
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 rounded-lg p-8">
          <div className="flex gap-4 mb-4">
            <button onClick={() => { setMode('prep'); setStepIndex(0); }} className={`flex items-center gap-2 px-6 py-2 rounded-full font-semibold ${mode === 'prep' ? 'bg-accent-primary text-white' : 'bg-gray-200'}`}><ChefHat /> Preparation</button>
            <button onClick={() => { setMode('cook'); setStepIndex(0); }} className={`flex items-center gap-2 px-6 py-2 rounded-full font-semibold ${mode === 'cook' ? 'bg-accent-primary text-white' : 'bg-gray-200'}`}><Flame /> Cooking</button>
          </div>
          <p className="text-sm text-gray-500 uppercase">Step {stepIndex + 1} of {steps.length}</p>
          <p className="text-3xl md:text-5xl font-bold text-center my-10 min-h-[150px]">{currentStep}</p>
          <div className="flex gap-4">
            <button onClick={goToPrevStep} className="p-4 bg-gray-200 rounded-full hover:bg-gray-300 disabled:opacity-50" disabled={mode === 'prep' && stepIndex === 0}><SkipBack /></button>
            <button onClick={goToNextStep} className="p-4 bg-gray-200 rounded-full hover:bg-gray-300 disabled:opacity-50" disabled={mode === 'cook' && stepIndex === steps.length - 1}><SkipForward /></button>
          </div>
        </div>
        
        {/* Right Side: Controls */}
        <div className="w-full md:w-80 flex flex-col gap-4">
          {/* Timer Control */}
          {timer !== null && (
            <div className="bg-gray-50 rounded-lg p-4 flex flex-col items-center">
              <p className="text-6xl font-mono">{formatTime(timer)}</p>
              <div className="flex gap-2 mt-4">
                <button onClick={() => isTimerRunning ? pauseTimer() : startTimer()} className="bg-accent-secondary text-white p-2 rounded-full">{isTimerRunning ? <Pause /> : <Play />}</button>
                <button onClick={resetTimer} className="bg-gray-200 p-2 rounded-full"><RefreshCw /></button>
              </div>
            </div>
          )}
          {/* Voice Controls */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
             <button onClick={isSpeaking ? stopSpeaking : () => speak(currentStep)} className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold ${isSpeaking ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                {isSpeaking ? <VolumeX /> : <Volume2 />} {isSpeaking ? "Stop Speaking" : "Read Aloud"}
             </button>
             <button onClick={isListening ? stopListening : startListening} className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold ${isListening ? 'bg-red-500 text-white' : 'bg-gray-200'}`}>
                {isListening ? <MicOff /> : <Mic />} {isListening ? "Listening..." : "Start Listening"}
             </button>
          </div>
          <button onClick={handleFinish} className="mt-auto w-full bg-accent-secondary text-white font-bold py-3 rounded-lg text-lg flex items-center justify-center gap-2"><Save /> Finish & Log</button>
        </div>
      </main>
    </div>
  );
};