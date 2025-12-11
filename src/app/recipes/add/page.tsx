"use client";
import React, { useState, useRef } from 'react';
import { usePantryStore, MasterIngredient } from '@/store/pantryStore';
import { Recipe } from '@/types';
import { IngredientAutocomplete } from '@/components/scanner/IngredientAutocomplete';
import { Card } from '@/components/ui/Card';
import { Plus, Trash2, Save, Upload, Clock, Users, Flame, GripVertical, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AddIngredientModal } from '@/components/AddIngredientModal';

const toTitleCase = (str: string): string => {
  if (!str) return '';
  return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const generateImagePath = (dishName: string): string => {
  const formatted = dishName.trim().toLowerCase().replace(/\s+/g, '-');
  return `/images/${formatted}.jpg`;
};

export default function AddRecipePage() {
  const { masterIngredientList, addRecipe, addMasterIngredient, addToast } = usePantryStore();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [cuisine, setCuisine] = useState<Recipe['cuisine']>('North Indian');
  const [spiceLevel, setSpiceLevel] = useState<Recipe['spiceLevel']>('medium');
  const [cookingTime, setCookingTime] = useState(30);
  const [servings, setServings] = useState(4);
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'expert'>('intermediate');

  const [ingredients, setIngredients] = useState<
    { name: string; quantity: number; unit: "kg" | "g" | "l" | "ml" | "pcs" | "bunches" }[]
  >([]);
  const [ingredientQuery, setIngredientQuery] = useState('');
  const [isAddIngredientModalOpen, setIsAddIngredientModalOpen] = useState(false);

  const [steps, setSteps] = useState<string[]>(['']);
  const [newStepText, setNewStepText] = useState('');

  // Image handling
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        addToast('Image must be less than 5MB', 'error');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      if (file.size > 5 * 1024 * 1024) {
        addToast('Image must be less than 5MB', 'error');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Ingredient handling - Quick Add (adds directly with default qty of 1)
  const handleQuickAddIngredient = (ing: MasterIngredient) => {
    // Check if ingredient already exists in list
    const exists = ingredients.some(i => i.name.toLowerCase() === ing.name.toLowerCase());
    if (exists) {
      addToast(`${ing.name} is already in the list`, 'info');
      return;
    }
    
    setIngredients([...ingredients, {
      name: ing.name,
      quantity: 1, // Default qty, user can edit inline
      unit: ing.unit
    }]);
    setIngredientQuery('');
  };

  const handleSaveNewIngredientAndAddToRecipe = (newDbIngredient: MasterIngredient) => {
    const formattedName = toTitleCase(newDbIngredient.name.trim());
    if (!formattedName) return addToast("Ingredient name cannot be empty.", 'error');
    
    const isDuplicate = masterIngredientList.some(
      item => item.name.toLowerCase() === formattedName.toLowerCase()
    );
    if (isDuplicate) {
      addToast(`'${formattedName}' already exists!`, 'info');
      const existing = masterIngredientList.find(item => item.name.toLowerCase() === formattedName.toLowerCase());
      if (existing) handleQuickAddIngredient(existing);
      return;
    }

    const finalIngredientData = { ...newDbIngredient, name: formattedName };
    addMasterIngredient(finalIngredientData);
    addToast(`'${formattedName}' added to database.`, 'success');
    
    // Also add to recipe ingredients list
    handleQuickAddIngredient(finalIngredientData);
    setIsAddIngredientModalOpen(false);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredientQty = (index: number, qty: number) => {
    const newIngredients = [...ingredients];
    newIngredients[index].quantity = qty;
    setIngredients(newIngredients);
  };

  // Steps handling
  const addStep = () => {
    if (newStepText.trim()) {
      setSteps([...steps.filter(s => s.trim()), newStepText.trim()]);
      setNewStepText('');
    }
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, value: string) => {
    const newSteps = [...steps];
    newSteps[index] = value;
    setSteps(newSteps);
  };

  // Save recipe
  const handleSaveRecipe = async () => {
    const filteredSteps = steps.filter(s => s.trim());
    
    if (!name.trim()) {
      addToast("Please enter a dish name.", 'error');
      return;
    }
    if (ingredients.length === 0) {
      addToast("Please add at least one ingredient.", 'error');
      return;
    }
    if (filteredSteps.length === 0) {
      addToast("Please add at least one instruction step.", 'error');
      return;
    }
    if (cookingTime <= 0 || servings <= 0) {
      addToast("Please enter valid cooking time and servings.", 'error');
      return;
    }

    // Generate image path from dish name
    const imagePath = generateImagePath(name);

    // If there's an uploaded image, save it
    if (imageFile) {
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('filename', imagePath.replace('/images/', ''));
      
      try {
        // You'll need to create this API route to handle image uploads
        await fetch('/api/upload-image', {
          method: 'POST',
          body: formData,
        });
      } catch (error) {
        console.error('Failed to upload image:', error);
        // Continue without image if upload fails
      }
    }

    const newRecipe: Recipe = {
      id: `custom-${crypto.randomUUID()}`,
      name: toTitleCase(name.trim()),
      description,
      cuisine,
      difficulty,
      cookingTime,
      baseServings: servings,
      dietary: ['veg'],
      ingredients,
      instructions: filteredSteps,
      spiceLevel,
      // Use uploaded image path, or a local default image
      image: imageFile ? imagePath : '/images/default-dish.jpg',
    };

    addRecipe(newRecipe);
    addToast("Recipe saved successfully!", 'success');
    router.push('/recipes');
  };

  const spiceLevels = [
    { value: 'mild', label: 'Mild', emoji: '😊' },
    { value: 'medium', label: 'Medium', emoji: '🔥' },
    { value: 'hot', label: 'Hot', emoji: '🔥🔥' },
  ];

  return (
    <>
      <AddIngredientModal
        isOpen={isAddIngredientModalOpen}
        onClose={() => setIsAddIngredientModalOpen(false)}
        onSave={handleSaveNewIngredientAndAddToRecipe}
      />

      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Add Your Custom Dish</h1>
          <p className="text-gray-500 mt-1">Create a recipe to add to your collection</p>
        </div>

        {/* Section 1: Basic Information */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-orange-600 font-bold">1</span>
            </div>
            <h2 className="text-xl font-bold text-gray-800">Basic Information</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Dish Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Vegetable Pulao"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none transition-colors text-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description <span className="text-gray-400">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A short description of your dish..."
                rows={2}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none transition-colors resize-none"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Cuisine</label>
                <select
                  value={cuisine}
                  onChange={(e) => setCuisine(e.target.value as any)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none bg-white"
                >
                  <option>North Indian</option>
                  <option>South Indian</option>
                  <option>Bengali</option>
                  <option>Gujarati</option>
                  <option>Chinese</option>
                  <option>Italian</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none bg-white"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Clock size={14} className="inline mr-1" />
                  Prep Time
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={cookingTime}
                    onChange={(e) => setCookingTime(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">min</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Users size={14} className="inline mr-1" />
                  Servings
                </label>
                <input
                  type="number"
                  value={servings}
                  onChange={(e) => setServings(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Flame size={14} className="inline mr-1" />
                Spice Level
              </label>
              <div className="flex gap-3">
                {spiceLevels.map((level) => (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() => setSpiceLevel(level.value as any)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      spiceLevel === level.value
                        ? 'bg-orange-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {level.emoji} {level.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Section 2: Dish Image */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-orange-600 font-bold">2</span>
            </div>
            <h2 className="text-xl font-bold text-gray-800">Dish Image</h2>
            <span className="text-sm text-gray-400">(optional)</span>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
          />

          {imagePreview ? (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-64 object-cover rounded-xl"
              />
              <button
                onClick={() => {
                  setImageFile(null);
                  setImagePreview(null);
                }}
                className="absolute top-3 right-3 p-2 hover:bg-red-100 rounded-full text-red-500"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-orange-400 hover:bg-orange-50 transition-all cursor-pointer"
            >
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload size={32} className="text-gray-400" />
              </div>
              <p className="text-lg font-semibold text-gray-700 mb-2">Drop image here or click to upload</p>
              <p className="text-sm text-gray-500">Supports: JPG, PNG, WebP (max 5MB)</p>
              <button
                type="button"
                className="mt-4 px-6 py-2 bg-orange-100 text-orange-600 rounded-lg font-semibold hover:bg-orange-200 transition-colors"
              >
                Choose File
              </button>
            </div>
          )}
        </Card>

        {/* Section 3: Ingredients */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-orange-600 font-bold">3</span>
            </div>
            <h2 className="text-xl font-bold text-gray-800">Ingredients</h2>
            <span className="text-red-500">*</span>
          </div>

          {/* Search and Add */}
          <div className="mb-4">
            <IngredientAutocomplete
              masterList={masterIngredientList}
              value={ingredientQuery}
              onChange={setIngredientQuery}
              onSelect={(ing) => {
                handleQuickAddIngredient(ing);
              }}
              onAddNew={() => setIsAddIngredientModalOpen(true)}
            />
          </div>

          {/* Ingredients List */}
          {ingredients.length === 0 ? (
            <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
              <Search size={48} className="mx-auto mb-2 opacity-50" />
              <p>No ingredients added yet</p>
              <p className="text-sm">Search above to add ingredients</p>
            </div>
          ) : (
            <div className="space-y-2">
              {ingredients.map((ing, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                >
                  <GripVertical size={20} className="text-gray-300" />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{ing.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={ing.quantity}
                      onChange={(e) => updateIngredientQty(idx, parseFloat(e.target.value) || 0)}
                      className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-center"
                    />
                    <span className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium min-w-[60px] text-center">
                      {ing.unit}
                    </span>
                  </div>
                  <button
                    onClick={() => removeIngredient(idx)}
                    className="p-2 text-red-500 hover:bg-red-100 rounded-lg"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Section 4: Instructions */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-orange-600 font-bold">4</span>
            </div>
            <h2 className="text-xl font-bold text-gray-800">Cooking Instructions</h2>
            <span className="text-red-500">*</span>
          </div>

          {/* Steps List */}
          <div className="space-y-3 mb-4">
            {steps.filter(s => s.trim()).map((step, idx) => (
              <div key={idx} className="flex items-start gap-3 group">
                <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0 mt-2">
                  {idx + 1}
                </div>
                <textarea
                  value={step}
                  onChange={(e) => updateStep(idx, e.target.value)}
                  rows={2}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none resize-none"
                />
                <button
                  onClick={() => removeStep(idx)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg mt-4"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>

          {/* Add New Step */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center font-bold flex-shrink-0 mt-2">
              {steps.filter(s => s.trim()).length + 1}
            </div>
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={newStepText}
                onChange={(e) => setNewStepText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addStep()}
                placeholder="Type next step and press Enter..."
                className="flex-1 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
              />
              <button
                onClick={addStep}
                disabled={!newStepText.trim()}
                className="px-4 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white rounded-lg font-semibold transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
        </Card>

        {/* Bottom Save Bar */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              <span className="text-red-500">*</span> Required fields
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.back()}
                className="px-8 py-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRecipe}
                className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold flex items-center gap-2 shadow-md transition-all"
              >
                <Save size={20} />
                Save Recipe
              </button>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}