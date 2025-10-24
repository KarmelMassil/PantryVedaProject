"use client";
import React, { useState } from 'react';
import { usePantryStore, MasterIngredient } from '@/store/pantryStore';
import { Recipe } from '@/types';
import { IngredientAutocomplete } from '@/components/scanner/IngredientAutocomplete';
import { Card } from '@/components/ui/Card';
import { Plus, Trash2, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AddRecipePage() {
    const { masterIngredientList, addRecipe } = usePantryStore();
    const router = useRouter();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [instructions, setInstructions] = useState('');
    const [ingredients, setIngredients] = useState<{ name: string; quantity: number; unit:  'kg' | 'g' | 'l' | 'ml' | 'pcs' | 'bunches'; }[]>([]);
    
    const [currentIngredient, setCurrentIngredient] = useState<MasterIngredient | null>(null);
    const [currentQty, setCurrentQty] = useState('1');

    const handleAddIngredient = () => {
        if (!currentIngredient || !currentQty) return;
        setIngredients([...ingredients, {
            name: currentIngredient.name,
            quantity: parseFloat(currentQty),
            unit: currentIngredient.unit
        }]);
        setCurrentIngredient(null);
        setCurrentQty('1');
    };

    const handleSaveRecipe = () => {
        if (!name || ingredients.length === 0 || !instructions) {
            alert("Please fill in the dish name, add at least one ingredient, and provide instructions.");
            return;
        }
        const newRecipe: Recipe = {
            id: `custom-${crypto.randomUUID()}`,
            name,
            description,
            cuisine: 'Gujarati', // Default for custom
            difficulty: 'intermediate',
            cookingTime: 45,
            servings: 4,
            dietary: ['veg'],
            ingredients,
            instructions: instructions.split('\n'),
            spiceLevel: 'medium',
            image: `https://placehold.co/600x400/FFF8E1/E67E22?text=${name.replace(' ', '+')}`,
        };
        addRecipe(newRecipe);
        alert("Recipe saved successfully!");
        router.push('/recipes');
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold">Add Your Custom Dish</h1>
            <Card className="p-6 space-y-4">
                <input type="text" placeholder="Dish Name (e.g., Vegetable Pulao)" value={name} onChange={e => setName(e.target.value)} className="w-full text-2xl font-bold p-2 border-b-2" />
                <textarea placeholder="A short description of your dish..." value={description} onChange={e => setDescription(e.target.value)} className="w-full p-2 border rounded-md" />
            </Card>

            <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">Ingredients</h2>
                <div className="space-y-2 mb-4">
                    {ingredients.map((ing, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                            <p className="flex-grow">{ing.quantity} {ing.unit} {ing.name}</p>
                            <button onClick={() => setIngredients(ingredients.filter((_, i) => i !== index))}><Trash2 size={16} className="text-red-500"/></button>
                        </div>
                    ))}
                </div>
                <div className="p-4 border-t">
                    <IngredientAutocomplete masterList={masterIngredientList} onSelect={setCurrentIngredient} />
                    {currentIngredient && (
                        <div className="flex items-center gap-2 mt-2">
                           <input type="number" value={currentQty} onChange={e => setCurrentQty(e.target.value)} className="w-24 p-2 border rounded-md" />
                           <span className="font-semibold">{currentIngredient.unit} of {currentIngredient.name}</span>
                           <button onClick={handleAddIngredient} className="ml-auto bg-accent-secondary text-white p-2 rounded-lg"><Plus /></button>
                        </div>
                    )}
                </div>
            </Card>
            
             <Card className="p-6">
                 <h2 className="text-xl font-bold mb-4">Instructions</h2>
                 <textarea placeholder="Enter each step on a new line..." value={instructions} onChange={e => setInstructions(e.target.value)} className="w-full p-2 border rounded-md h-40" />
             </Card>

            <button onClick={handleSaveRecipe} className="w-full flex items-center justify-center gap-2 bg-accent-primary text-white font-bold py-3 rounded-lg text-lg"><Save /> Save Dish</button>
        </div>
    );
}