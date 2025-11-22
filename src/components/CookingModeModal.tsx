"use client";
import { Recipe } from '@/types';
import { usePantryStore } from '@/store/pantryStore';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { X, Mic, MicOff, Volume2, VolumeX, ChevronLeft, ChevronRight, Play, Pause, RefreshCw, ChefHat, Save, Flame, Users, Plus, Minus, Clock, Check } from 'lucide-react';
import { scaleRecipeIngredients } from '@/lib/recipeUtils';

// Helper function to parse time from a step
const getTimerFromStep = (step: string): number | null => {
  const match = step.match(/(\d+)\s+(minute|second)s?/i);
  if (!match) return null;
  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  return unit === 'minute' ? value * 60 : value;
};

// Format seconds into MM:SS
const formatTime = (time: number) => {
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

// Format time for speech
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

// Format ingredient for speech
const formatIngredientForSpeech = (ingredient: string) => {
  return ingredient
    .replace(/\bg\b/gi, 'grams')
    .replace(/\bkg\b/gi, 'kilograms')
    .replace(/\bml\b/gi, 'milliliters')
    .replace(/\bl\b/gi, 'liters')
    .replace(/\btsp\b/gi, 'teaspoon')
    .replace(/\btbsp\b/gi, 'tablespoon')
    .replace(/\bpcs\b/gi, 'pieces');
};

// Speech Recognition interfaces
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

interface CookingModeModalProps {
  recipe: Recipe;
  initialServings?: number;
  onClose: () => void;
  onFinishCooking: (recipe: Recipe) => void;
}

export const CookingModeModal: React.FC<CookingModeModalProps> = ({ 
  recipe, 
  initialServings, 
  onClose, 
  onFinishCooking 
}) => {
  const addToast = usePantryStore((state) => state.addToast);
  const [desiredServings, setDesiredServings] = useState(initialServings || recipe.baseServings);
  const [mode, setMode] = useState<'prep' | 'cook'>('prep');
  const [stepIndex, setStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const scaledRecipe = useMemo(() => {
    return scaleRecipeIngredients(recipe, desiredServings);
  }, [recipe, desiredServings]);

  const handleServingsChange = (amount: number) => {
    setDesiredServings(prev => Math.max(1, prev + amount));
  };

  // Timer states
  const [timer, setTimer] = useState<number | null>(null);
  const [originalTimerValue, setOriginalTimerValue] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<number | null>(null);
  const originalTimerRef = useRef<number | null>(null);

  // Voice states
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Current step data
  const steps = mode === 'prep' 
    ? scaledRecipe.ingredients.map(ing => `${ing.quantity % 1 === 0 ? ing.quantity : ing.quantity.toFixed(1)} ${ing.unit} ${ing.name}`) 
    : scaledRecipe.instructions;
  const currentStep = steps[stepIndex];
  const totalSteps = scaledRecipe.ingredients.length + scaledRecipe.instructions.length;
  const currentGlobalStep = mode === 'prep' ? stepIndex + 1 : scaledRecipe.ingredients.length + stepIndex + 1;

  // Keep refs in sync
  useEffect(() => { timerRef.current = timer; }, [timer]);
  useEffect(() => { originalTimerRef.current = originalTimerValue; }, [originalTimerValue]);

  // Text-to-Speech
  const speak = (text: string) => {
    if (!window.speechSynthesis) return;
    speechSynthesis.cancel();
    let speechText = mode === 'prep' ? formatIngredientForSpeech(text) : text;
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

  // Timer Logic
  useEffect(() => {
    if (isTimerRunning && timer !== null && timer > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimer(t => (t ? t - 1 : 0));
      }, 1000);
    } else if (timer === 0) {
      setIsTimerRunning(false);
      speak("Timer finished!");
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTimerRunning, timer]);

  const startTimer = (seconds?: number) => {
    if (seconds) {
      setTimer(seconds);
      setOriginalTimerValue(seconds);
    } else if (!timer) {
      const timeFromStep = getTimerFromStep(currentStep);
      if (timeFromStep) {
        setTimer(timeFromStep);
        setOriginalTimerValue(timeFromStep);
      }
    }
    setIsTimerRunning(true);
  };

  const pauseTimer = () => setIsTimerRunning(false);

  const resetTimer = () => {
    setIsTimerRunning(false);
    if (originalTimerValue) {
      setTimer(originalTimerValue);
    } else {
      const defaultTime = getTimerFromStep(currentStep);
      if (defaultTime) {
        setTimer(defaultTime);
        setOriginalTimerValue(defaultTime);
      }
    }
  };

  // Navigation
  const goToNextStep = useCallback(() => {
    // Mark current step as completed
    setCompletedSteps(prev => new Set(prev).add(`${mode}-${stepIndex}`));
    
    if (stepIndex < steps.length - 1) {
      setStepIndex(stepIndex + 1);
    } else if (mode === 'prep') {
      setMode('cook');
      setStepIndex(0);
    }
  }, [stepIndex, steps.length, mode]);

  const goToPrevStep = useCallback(() => {
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
    } else if (mode === 'cook') {
      setMode('prep');
      setStepIndex(scaledRecipe.ingredients.length - 1);
    }
  }, [stepIndex, mode, scaledRecipe.ingredients.length]);

  const goToNextStepRef = useRef(goToNextStep);
const goToPrevStepRef = useRef(goToPrevStep);
const speakRef = useRef(speak);
const currentStepRef = useRef(currentStep);
const startTimerRef = useRef(startTimer);
const pauseTimerRef = useRef(pauseTimer);
const resetTimerRef = useRef(resetTimer);

useEffect(() => { goToNextStepRef.current = goToNextStep; }, [goToNextStep]);
useEffect(() => { goToPrevStepRef.current = goToPrevStep; }, [goToPrevStep]);
useEffect(() => { speakRef.current = speak; }, [speak]);
useEffect(() => { currentStepRef.current = currentStep; }, [currentStep]);
useEffect(() => { startTimerRef.current = startTimer; }, [startTimer]);
useEffect(() => { pauseTimerRef.current = pauseTimer; }, [pauseTimer]);
useEffect(() => { resetTimerRef.current = resetTimer; }, [resetTimer]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        goToNextStep();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrevStep();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stepIndex, mode, steps.length]);

  // Speech Recognition setup
  useEffect(() => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return;
    
    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const command = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
      
      if (command.includes('next')) {
      goToNextStepRef.current();
    } else if (command.includes('previous') || command.includes('back')) {
      goToPrevStepRef.current();
    } else if (command.includes('repeat')) {
      speakRef.current(currentStepRef.current);
    } else if (command.includes('start timer')) {
      startTimerRef.current();
    } else if (command.includes('pause timer') || command.includes('stop timer')) {
      pauseTimerRef.current();
    } else if (command.includes('reset timer')) {
      resetTimerRef.current();
    }
  };

    recognition.onerror = (e) => {console.error('Speech recognition error:', e); // Add for debugging
    };
    recognition.onend = () => {
      if (isListening && recognitionRef.current) {
        try { recognitionRef.current.start(); } catch (e) { console.error('failed to restart recognition:', e);}
      }
    };
    recognitionRef.current = recognition;
    return () => {
    if (recognitionRef.current) {
      recognitionRef.current.onresult = null;
      recognitionRef.current.onerror = null;
      recognitionRef.current.onend = null;
    }
  };
}, []);

  const toggleListening = useCallback(() => {
  if (isListening) {
    recognitionRef.current?.stop();
    setIsListening(false);
  } else {
    try {
      recognitionRef.current?.start();
      setIsListening(true);
    } catch (e) {
      console.error('Failed to start recognition:', e);
      addToast("Speech recognition not available", 'error');
    }
  }
}, [isListening, addToast]);

useEffect(() => {
  if (!recognitionRef.current) return;
  
  if (isListening) {
    try {
      recognitionRef.current.start();
    } catch (e) {
      // Already started, ignore
    }
  } else {
    try {
      recognitionRef.current.stop();
    } catch (e) {
      // Already stopped, ignore
    }
  }
}, [isListening]);

  // Auto-read step on change
  useEffect(() => {
    pauseTimer();
    const timeInStep = getTimerFromStep(currentStep);
    setTimer(timeInStep);
    setOriginalTimerValue(timeInStep);
    speak(currentStep);
  }, [stepIndex, mode]);

  const handleFinish = () => {
    onFinishCooking(scaledRecipe);
    onClose();
  };

  const isFirstStep = mode === 'prep' && stepIndex === 0;
  const isLastStep = mode === 'cook' && stepIndex === steps.length - 1;
  const progressPercent = (currentGlobalStep / totalSteps) * 100;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-orange-50 to-amber-50 z-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{recipe.name}</h1>
              <p className="text-sm text-gray-500">Cooking Mode</p>
            </div>
            
            {/* Servings Control */}
            <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full">
              <button 
                onClick={() => handleServingsChange(-1)} 
                className="w-7 h-7 flex items-center justify-center rounded-full bg-white hover:bg-gray-200 transition-colors"
              >
                <Minus size={14} />
              </button>
              <div className="flex items-center gap-2 px-2">
                <Users size={16} className="text-gray-500" />
                <span className="font-semibold">{desiredServings}</span>
              </div>
              <button 
                onClick={() => handleServingsChange(1)} 
                className="w-7 h-7 flex items-center justify-center rounded-full bg-white hover:bg-gray-200 transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={28} className="text-gray-600" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="max-w-6xl mx-auto mt-4">
          <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
            <span>Progress</span>
            <span>{currentGlobalStep} of {totalSteps} steps</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col max-w-6xl mx-auto w-full p-6 overflow-hidden">
        {/* Mode Tabs */}
        <div className="flex justify-center gap-4 mb-6">
          <button 
            onClick={() => { setMode('prep'); setStepIndex(0); }} 
            className={`flex items-center gap-2 px-8 py-3 rounded-full font-semibold transition-all ${
              mode === 'prep' 
                ? 'bg-orange-500 text-white shadow-lg' 
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ChefHat size={20} />
            Preparation
            {mode === 'prep' && (
              <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-sm">
                {stepIndex + 1}/{scaledRecipe.ingredients.length}
              </span>
            )}
          </button>
          <button 
            onClick={() => { setMode('cook'); setStepIndex(0); }} 
            className={`flex items-center gap-2 px-8 py-3 rounded-full font-semibold transition-all ${
              mode === 'cook' 
                ? 'bg-orange-500 text-white shadow-lg' 
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Flame size={20} />
            Cooking
            {mode === 'cook' && (
              <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-sm">
                {stepIndex + 1}/{scaledRecipe.instructions.length}
              </span>
            )}
          </button>
        </div>

        {/* Step Content */}
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-white rounded-3xl shadow-xl p-12 max-w-4xl w-full text-center">
            {/* Step Number */}
            <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 text-orange-600 rounded-full text-2xl font-bold mb-6">
              {stepIndex + 1}
            </div>

            {/* Step Text */}
            <p className="text-3xl md:text-4xl font-semibold text-gray-800 leading-relaxed mb-8">
              {currentStep}
            </p>

            {/* Timer (if detected) */}
            {timer !== null && (
              <div className="inline-flex flex-col items-center bg-gray-50 rounded-2xl p-6 mb-8">
                <div className="flex items-center gap-2 text-gray-500 mb-2">
                  <Clock size={18} />
                  <span className="text-sm font-medium">Timer</span>
                </div>
                <p className={`text-5xl font-mono font-bold ${timer <= 10 && timer > 0 ? 'text-red-500' : 'text-gray-800'}`}>
                  {formatTime(timer)}
                </p>
                <div className="flex gap-3 mt-4">
                  <button 
                    onClick={() => isTimerRunning ? pauseTimer() : startTimer()}
                    className={`p-3 rounded-full transition-colors ${
                      isTimerRunning 
                        ? 'bg-orange-500 text-white' 
                        : 'bg-green-500 text-white'
                    }`}
                  >
                    {isTimerRunning ? <Pause size={24} /> : <Play size={24} />}
                  </button>
                  <button 
                    onClick={resetTimer}
                    className="p-3 bg-gray-200 hover:bg-gray-300 rounded-full transition-colors"
                  >
                    <RefreshCw size={24} />
                  </button>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-center gap-6">
              <button 
                onClick={goToPrevStep}
                disabled={isFirstStep}
                className="flex items-center gap-2 px-8 py-4 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-semibold transition-colors"
              >
                <ChevronLeft size={24} />
                Previous
              </button>
              
              {isLastStep ? (
                <button 
                  onClick={handleFinish}
                  className="flex items-center gap-2 px-10 py-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold shadow-lg transition-colors"
                >
                  <Check size={24} />
                  Finish Cooking
                </button>
              ) : (
                <button 
                  onClick={goToNextStep}
                  className="flex items-center gap-2 px-10 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold shadow-lg transition-colors"
                >
                  Next
                  <ChevronRight size={24} />
                </button>
              )}
            </div>

            {/* Keyboard & Voice Hints */}
            <div className="mt-6 space-y-2">
              <p className="text-sm text-gray-400">
                Use ← → arrow keys or Space to navigate
              </p>
              {isListening && (
                <div className="inline-flex flex-col items-center bg-red-50 border border-red-200 rounded-xl px-6 py-3 mt-2">
                  <p className="text-sm font-medium text-red-600 mb-2">
                    🎤 Voice Commands Available:
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 text-xs">
                    <span className="bg-white px-3 py-1 rounded-full text-gray-600 border">"Next"</span>
                    <span className="bg-white px-3 py-1 rounded-full text-gray-600 border">"Previous" / "Back"</span>
                    <span className="bg-white px-3 py-1 rounded-full text-gray-600 border">"Repeat"</span>
                    <span className="bg-white px-3 py-1 rounded-full text-gray-600 border">"Start timer"</span>
                    <span className="bg-white px-3 py-1 rounded-full text-gray-600 border">"Pause timer"</span>
                    <span className="bg-white px-3 py-1 rounded-full text-gray-600 border">"Reset timer"</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Control Bar */}
      <footer className="bg-white border-t px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Voice Controls */}
          <div className="flex items-center gap-3">
            <button 
              onClick={isSpeaking ? stopSpeaking : () => speak(currentStep)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-colors ${
                isSpeaking 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {isSpeaking ? <VolumeX size={20} /> : <Volume2 size={20} />}
              {isSpeaking ? 'Stop' : 'Read Aloud'}
            </button>
            
            <button 
              onClick={toggleListening}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-colors ${
                isListening 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
              {isListening ? 'Listening...' : 'Voice Control'}
            </button>
          </div>

          {/* Quick Info */}
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Clock size={16} />
              {recipe.cookingTime} min total
            </span>
            <span className="flex items-center gap-1">
              <ChefHat size={16} />
              {scaledRecipe.ingredients.length} ingredients
            </span>
          </div>

          {/* Finish Button */}
          <button 
            onClick={handleFinish}
            className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold transition-colors"
          >
            <Save size={20} />
            Finish & Log
          </button>
        </div>
      </footer>
    </div>
  );
};