import { MatchedRecipe } from '@/lib/recipeMatcher';
import { Flame, Clock, Users, ShoppingCart } from 'lucide-react'; // Add ShoppingCart icon
import React from 'react';
import { usePantryStore } from '@/store/pantryStore'; // Import store
import { generateFromRecipe } from '@/lib/shoppingListGenerator'; // Import generator

export const RecipeCard: React.FC<{ recipe: MatchedRecipe }> = ({ recipe }) => {
  const { inventory, addItemsToShoppingList, masterIngredientList } = usePantryStore(); // Get state and action

  const handleAddMissing = () => {
    const missing = generateFromRecipe(recipe, inventory, masterIngredientList);
    if (missing.length > 0) {
      addItemsToShoppingList(missing);
      alert(`Added ${missing.length} missing item(s) to your shopping list!`);
    } else {
      alert("You already have all ingredients for this recipe!");
    }
  };

  const getMatchColor = () => {
    if (recipe.matchPercentage === 100) return 'bg-green-100 text-green-800';
    if (recipe.matchPercentage >= 80) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-lg border border-gray-200 flex flex-col">
      <div className="relative">
        <img src={recipe.image} alt={recipe.name} className="w-full h-48 object-cover" />
        <span className={`absolute top-2 right-2 text-xs font-bold px-2 py-1 rounded-full ${getMatchColor()}`}>
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

        <div>
          {recipe.matchPercentage === 100 ? (
            <div className="bg-curry-green/10 text-curry-green text-sm p-2 rounded-md font-semibold text-center">
              You have all ingredients!
            </div>
          ) : (
            <div className="bg-chili-red/10 text-chili-red text-sm p-2 rounded-md">
              <p className="font-semibold">Missing ({recipe.missingIngredients.length}):</p>
              <p className="text-xs">{recipe.missingIngredients.join(', ')}</p>
            </div>
          )}
        </div>
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