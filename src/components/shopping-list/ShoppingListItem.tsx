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

export const ShoppingListItem: React.FC<ShoppingListItemProps> = ({
  item,
  onUpdate,
  onDelete,
  isEditing,
  onEditStart,
  onEditCancel,
  onEditSave,
}) => {
  const totalPrice = (item.quantity * (item.price || 0)).toFixed(2);

  if (isEditing) {
    return (
      <li className="p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
        <div className="grid grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Item Name</label>
            <input
              type="text"
              value={item.name}
              disabled
              className="w-full p-2 border rounded-md bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Quantity</label>
            <div className="flex items-center">
              <input
                type="number"
                value={item.quantity}
                onChange={(e) => onUpdate(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                className="w-full p-2 border rounded-md"
              />
              <span className="ml-2 text-sm text-gray-500">{item.unit}</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Price/Unit</label>
            <input
              type="number"
              value={item.price || ''}
              onChange={(e) => onUpdate(item.id, { price: parseFloat(e.target.value) || 0 })}
              className="w-full p-2 border rounded-md"
              placeholder="Price"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Expiry</label>
            <input
              type="date"
              value={item.expiryDate ? format(new Date(item.expiryDate), 'yyyy-MM-dd') : ''}
              onChange={(e) => onUpdate(item.id, { expiryDate: e.target.valueAsDate?.toISOString() })}
              className="w-full p-2 border rounded-md"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={() => onEditSave(item.id)} className="flex items-center justify-center gap-2 bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600">
            <Save size={18} />
            Save
          </button>
          <button onClick={onEditCancel} className="flex items-center justify-center gap-2 bg-white border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-100">
            <X size={18} />
            Cancel
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className={`flex items-center gap-4 p-3 ${item.checked ? 'bg-gray-100/50 opacity-70' : ''}`}>
      <input
        type="checkbox"
        checked={item.checked}
        onChange={(e) => onUpdate(item.id, { checked: e.target.checked })}
        className="h-5 w-5 rounded border-gray-300 text-accent-secondary focus:ring-accent-secondary flex-shrink-0"
      />
      <div className={`flex-grow ${item.checked ? 'text-gray-400' : ''}`}>
        <p className={`font-semibold text-lg ${item.checked ? 'line-through' : ''}`}>{item.name}</p>
        <div className="flex items-center gap-4 text-sm text-text-secondary mt-1">
            <span>{item.quantity} {item.unit} {getApproximateWeightDisplay(item.quantity, item.name)}</span>
            <span>₹{item.price?.toFixed(2) ?? 'N/A'} / {item.unit}</span>
            <span>{item.expiryDate ? format(new Date(item.expiryDate), 'MMM dd, yyyy') : 'N/A'}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <p className="font-bold text-xl w-24 text-right">₹{totalPrice}</p>
        <button onClick={() => onEditStart(item)} className="text-gray-500 hover:text-blue-600 p-2">
          <Edit size={18}/>
        </button>
        <button onClick={() => onDelete(item.id)} className="text-gray-500 hover:text-red-600 p-2">
          <Trash2 size={18}/>
        </button>
      </div>
    </li>
  );
};
