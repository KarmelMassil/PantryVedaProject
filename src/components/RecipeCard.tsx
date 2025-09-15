// ... imports
import { MatchedRecipe } from '@/lib/recipeMatcher';
import { Flame, Clock, Users, ShoppingCart } from 'lucide-react'; // Add ShoppingCart icon
import React from 'react';
import { usePantryStore } from '@/store/pantryStore'; // Import store
import { generateFromRecipe } from '@/lib/shoppingListGenerator'; // Import generator

export const RecipeCard: React.FC<{ recipe: MatchedRecipe }> = ({ recipe }) => {
  const { inventory, addItemsToShoppingList } = usePantryStore(); // Get state and action

  const handleAddMissing = () => {
    const missing = generateFromRecipe(recipe, inventory);
    if (missing.length > 0) {
      addItemsToShoppingList(missing);
      alert(`Added ${missing.length} missing item(s) to your shopping list!`);
    } else {
      alert("You already have all ingredients for this recipe!");
    }
  };
  
  // ... getMatchColor function is the same

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-lg border border-gray-200 flex flex-col">
       {/* ... Image and Title section is the same */}
      <div className="relative">
        <img src={recipe.image} alt={recipe.name} className="w-full h-48 object-cover" />
        <span className={`absolute top-2 right-2 text-xs font-bold px-2 py-1 rounded-full`}>
          {recipe.matchPercentage}% Match
        </span>
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-xl font-bold text-text-primary mb-1">{recipe.name}</h3>
        <p className="text-sm text-text-secondary mb-3 flex-grow">{recipe.description}</p>
        <div className="flex justify-between items-center text-xs text-text-secondary mb-4">
          <div className="flex items-center gap-1"><Clock size={14} /> {recipe.cookingTime}m</div>
          <div className="flex items-center gap-1"><Users size={14} /> {recipe.servings} servings</div>
          <div className="flex items-center gap-1 capitalize"><Flame size={14} /> {recipe.spiceLevel}</div>
        </div>

        {/* ... Missing ingredients display is the same */}
        
        {/* --- NEW BUTTON --- */}
        <button
          onClick={handleAddMissing}
          className="mt-4 w-full bg-accent-primary/10 text-accent-primary font-semibold py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-accent-primary/20 transition-colors"
        >
          <ShoppingCart size={16} /> Add Missing to List
        </button>
      </div>
    </div>
  );
};