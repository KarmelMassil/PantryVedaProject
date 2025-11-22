"use client";
import React from 'react';
import { ShoppingListItem as ShoppingListItemType } from '@/store/pantryStore';
import { Trash2, Edit, Save, X } from 'lucide-react';
import { getApproximateWeightDisplay } from '@/lib/unitConverter';
import { format } from 'date-fns';

interface ShoppingListItemProps {
  item: ShoppingListItemType;
  onUpdate: (id: string, updates: Partial<ShoppingListItemType>) => void;
  onDelete: (id: string) => void;
  isEditing: boolean;
  onEditStart: (item: ShoppingListItemType) => void;
  onEditCancel: () => void;
  onEditSave: (id: string) => void;
}

const ShoppingListItemComponent: React.FC<ShoppingListItemProps> = ({
  item,
  onUpdate,
  onDelete,
  isEditing,
  onEditStart,
  onEditCancel,
  onEditSave,
}) => {
  const totalPrice = (item.quantity * (item.price || 0)).toFixed(2);
  const approxWeight = getApproximateWeightDisplay(item.quantity, item.unit, item.name);

  if (isEditing) {
    return (
      <li className="p-3 bg-blue-50 rounded-lg border border-blue-300">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          {/* Info Column */}
          <div className="font-semibold">{item.name}</div>

          {/* Inputs Column */}
          <div className="md:col-span-2 grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Quantity</label>
              <input
                type="number"
                value={item.quantity}
                onChange={(e) => onUpdate(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                className="w-full p-2 border rounded-md bg-white"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Price/Unit</label>
              <div className="relative">
                 <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  value={item.price || ''}
                  onChange={(e) => onUpdate(item.id, { price: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2 pl-6 border rounded-md bg-white"
                  placeholder="Price"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Expiry</label>
              <input
                type="date"
                value={item.expiryDate ? format(new Date(item.expiryDate), 'yyyy-MM-dd') : ''}
                onChange={(e) => onUpdate(item.id, { expiryDate: e.target.valueAsDate?.toISOString() })}
                className="w-full p-2 border rounded-md bg-white"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={() => onEditSave(item.id)} className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm font-semibold">
            <Save size={16} />
            Save
          </button>
          <button onClick={onEditCancel} className="flex items-center justify-center gap-2 bg-white border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-100 text-sm font-semibold">
            <X size={16} />
            Cancel
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className={`transition-all duration-200 rounded-lg group ${item.checked ? 'bg-gray-100' : 'bg-white hover:bg-gray-50'}`}>
      <div className="flex items-center gap-4 p-3">
        <input
          type="checkbox"
          checked={item.checked}
          onChange={(e) => onUpdate(item.id, { checked: e.target.checked })}
          className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary transition-all duration-200 flex-shrink-0"
        />

        <div className="flex-grow">
          <p className={`font-medium transition-colors ${item.checked ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
            {item.name}
          </p>
          <div className={`flex items-center gap-4 text-sm transition-colors ${item.checked ? 'text-gray-400' : 'text-gray-500'}`}>
            <span>{item.quantity} {item.unit}</span>
            {approxWeight && (
              <span className="text-xs italic text-gray-400">
                ({approxWeight})
              </span>
            )}
            <span className="text-gray-300">|</span>
            <span>₹{item.price?.toFixed(2) ?? '0.00'} / {item.unit}</span>
            {item.expiryDate && (
              <>
                <span className="text-gray-300">|</span>
                <span>Expires: {format(new Date(item.expiryDate), 'do MMMM yyyy')}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-right">
            <p className={`font-semibold transition-colors text-lg ${item.checked ? 'text-gray-400' : 'text-primary'}`}>
              ₹{totalPrice}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => onEditStart(item)} aria-label="Edit" className="p-2 hover:bg-blue-100 rounded-full text-blue-500">
              <Edit size={16} />
            </button>
            <button onClick={() => onDelete(item.id)} aria-label="Delete" className="p-2 hover:bg-red-100 rounded-full text-red-500">
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </li>
  );
};

ShoppingListItemComponent.displayName = 'ShoppingListItem';

export const ShoppingListItem = React.memo(ShoppingListItemComponent);
