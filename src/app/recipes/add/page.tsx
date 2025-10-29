"use client";
import React, { useState } from 'react';
import { usePantryStore, MasterIngredient } from '@/store/pantryStore';
import { Recipe } from '@/types';
import { IngredientAutocomplete } from '@/components/scanner/IngredientAutocomplete';
import { Card } from '@/components/ui/Card';
import { Plus, Trash2, Save, PlusCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AddIngredientModal } from '@/components/AddIngredientModal'; // Import the modal

// Helper function to format ingredient names to Title Case
const toTitleCase = (str: string): string => {
  if (!str) return '';
  return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export default function AddRecipePage() {
    const { masterIngredientList, addRecipe, addMasterIngredient } = usePantryStore();
    const router = useRouter();

    // --- NEW STATE FOR RECIPE DETAILS ---
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [instructions, setInstructions] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [cuisine, setCuisine] = useState<Recipe['cuisine']>('North Indian');
    const [spiceLevel, setSpiceLevel] = useState<Recipe['spiceLevel']>('medium');
    const [cookingTime, setCookingTime] = useState(30);
    const [servings, setServings] = useState(4);
    const [ingredients, setIngredients] = useState<
        { name: string; quantity: number; unit: "kg" | "g" | "l" | "ml" | "pcs" | "bunches" }[]
    >([]);

    const [currentIngredient, setCurrentIngredient] = useState<MasterIngredient | null>(null);
    const [currentQty, setCurrentQty] = useState('1');
    const [isAddIngredientModalOpen, setIsAddIngredientModalOpen] = useState(false);

    const handleAddIngredientToList = () => {
        if (!currentIngredient || !currentQty || parseFloat(currentQty) <= 0) return;
        setIngredients([...ingredients, {
            name: currentIngredient.name,
            quantity: parseFloat(currentQty),
            // Use cookingUnit if available, otherwise fall back to storageUnit
            unit: currentIngredient.unit
        }]);
        setCurrentIngredient(null);
        setCurrentQty('1');
    };

    const handleSaveNewIngredientAndAddToRecipe = (newDbIngredient: MasterIngredient) => {
        const formattedName = toTitleCase(newDbIngredient.name.trim());
        if (!formattedName) return alert("Ingredient name cannot be empty.");
        const isDuplicate = masterIngredientList.some(
            item => item.name.toLowerCase() === formattedName.toLowerCase()
        );
        if (isDuplicate) return alert(`'${formattedName}' already exists!`);

        const finalIngredientData = { ...newDbIngredient, name: formattedName };
        
        addMasterIngredient(finalIngredientData);
        alert(`'${formattedName}' added to database.`);
        setIngredients([...ingredients, {
            name: finalIngredientData.name,
            quantity: 1, // Default to 1
            unit: finalIngredientData.unit
        }]);
    };

    const handleSaveRecipe = () => {
        if (!name || ingredients.length === 0 || !instructions || cookingTime <= 0 || servings <= 0) {
            alert("Please fill in all required fields (Dish Name, Ingredients, Instructions, Time, Servings).");
            return;
        }
        const newRecipe: Recipe = {
            id: `custom-${crypto.randomUUID()}`,
            name: toTitleCase(name.trim()),
            description,
            cuisine,
            difficulty: 'intermediate',
            cookingTime,
            servings,
            dietary: ['veg'],
            ingredients,
            instructions: instructions.split('\n').filter(line => line.trim() !== ''), // Split and remove empty lines
            spiceLevel,
            image: imageUrl || `https://placehold.co/600x400/FFF8E1/E67E22?text=${name.replace(' ', '+')}`,
        };
        addRecipe(newRecipe);
        alert("Recipe saved successfully!");
        router.push('/recipes');
    };

    return (
        <>
            {/* --- RENDER THE ADD INGREDIENT MODAL --- */}
            <AddIngredientModal
                isOpen={isAddIngredientModalOpen}
                onClose={() => setIsAddIngredientModalOpen(false)}
                onSave={handleSaveNewIngredientAndAddToRecipe}
            />

            <div className="space-y-6 max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold">Add Your Custom Dish</h1>
                
                {/* --- UPDATED RECIPE DETAILS CARD --- */}
                <Card className="p-6 space-y-4">
                    <input type="text" placeholder="Dish Name (e.g., Vegetable Pulao)" value={name} onChange={e => setName(e.target.value)} className="w-full text-2xl font-bold p-2 border-b-2 focus:outline-none focus:border-accent-primary" />
                    <textarea placeholder="A short description of your dish..." value={description} onChange={e => setDescription(e.target.value)} className="w-full p-2 border rounded-md h-20" />
                    <input type="url" placeholder="Image URL (optional)" value={imageUrl} onChange={e => setImageUrl(e.target.value)} className="w-full p-2 border rounded-md" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Cuisine</label>
                            <select value={cuisine} onChange={e => setCuisine(e.target.value as any)} className="mt-1 block w-full border rounded-md p-2">
                                <option>North Indian</option>
                                <option>South Indian</option>
                                <option>Bengali</option>
                                <option>Gujarati</option>
                                <option>Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Spice Level</label>
                            <select value={spiceLevel} onChange={e => setSpiceLevel(e.target.value as any)} className="mt-1 block w-full border rounded-md p-2">
                                <option>mild</option>
                                <option>medium</option>
                                <option>hot</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Prep Time (min)</label>
                            <input type="number" value={cookingTime} onChange={e => setCookingTime(parseInt(e.target.value) || 0)} className="mt-1 block w-full border rounded-md p-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Servings</label>
                            <input type="number" value={servings} onChange={e => setServings(parseInt(e.target.value) || 1)} className="mt-1 block w-full border rounded-md p-2" />
                        </div>
                    </div>
                </Card>

                {/* --- UPDATED INGREDIENTS CARD --- */}
                <Card className="p-6">
                    <h2 className="text-xl font-bold mb-4">Ingredients</h2>
                    <div className="space-y-2 mb-4">
                        {ingredients.map((ing, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                                <p className="flex-grow">{ing.quantity} {ing.unit} {ing.name}</p>
                                <button onClick={() => setIngredients(ingredients.filter((_, i) => i !== index))}><Trash2 size={16} className="text-red-500"/></button>
                            </div>
                        ))}
                         {ingredients.length === 0 && <p className="text-sm text-gray-500 text-center">No ingredients added yet.</p>}
                    </div>
                    <div className="p-4 border-t space-y-3">
                        <IngredientAutocomplete masterList={masterIngredientList} onSelect={setCurrentIngredient} />
                        {currentIngredient && (
                            <div className="flex items-center gap-2">
                               <input type="number" value={currentQty} onChange={e => setCurrentQty(e.target.value)} className="w-24 p-2 border rounded-md" placeholder='Qty'/>
                               <span className="font-semibold">{currentIngredient.unit} of {currentIngredient.name}</span>
                               <button onClick={handleAddIngredientToList} className="ml-auto bg-accent-secondary text-white p-2 rounded-lg"><Plus /></button>
                            </div>
                        )}
                        {/* --- BUTTON TO ADD NEW INGREDIENT TO DATABASE --- */}
                        <button 
                            onClick={() => setIsAddIngredientModalOpen(true)}
                            className="w-full text-sm flex items-center justify-center gap-1 text-accent-secondary font-semibold hover:underline mt-2"
                        >
                            <PlusCircle size={16} />
                            Ingredient not found? Add to Database
                        </button>
                    </div>
                </Card>
                
                <Card className="p-6">
                    <h2 className="text-xl font-bold mb-4">Instructions</h2>
                    <textarea placeholder="Enter each step on a new line..." value={instructions} onChange={e => setInstructions(e.target.value)} className="w-full p-2 border rounded-md h-40" />
                </Card>

                <button onClick={handleSaveRecipe} className="w-full flex items-center justify-center gap-2 bg-accent-primary text-white font-bold py-3 rounded-lg text-lg hover:bg-orange-700 transition-colors"><Save /> Save Dish</button>
            </div>
        </>
    );
}