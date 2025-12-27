/*
 * This is the mapping from the YOLO model's raw output labels (all lowercase)
 * to the official name in your Master Ingredient Database.
 */
const labelMap: Record<string, string> = {
    "Apple" : "Apple",
    "Banana" : "Banana",
    "Apricot": "Apricot",
    "Beetroot" : "Beetroot",
    "Black_Grapes" : "Grapes",
    "Brinjal" : "Brinjal",
    "Broccoli" : "Broccoli",
    "Cabbage" : "Cabbage",
    "Carrot" : "Carrot",
    "Cauliflower" : "Cauliflower",
    "Cherry_Tomato_Red" : "Cherry Tomato",
    "Chinese_Cabbage" : "Chinese Cabbage",
    "Crown_White_Pear" : "Pear",
    "Cucumber" : "Cucumber",
    "Fuji_Apple" : "Apple",
    "Garlic" : "Garlic",
    "Granny_smith_apple" : "Apple",
    "Grape_Fruit" : "Grape Fruit",
    "Green_Bell_Pepper" : "Bell Pepper",
    "Green_Chili_Pepper" : "Green Chili",
    "Green_zucchini" : "Zucchini",
    "Hass_Avocado" : "HAvocado",
    "Lemon" : "Lemon",
    "Lettuce" : "Lettuce",
    "Lime" : "Lime",
    "Mango" : "Mango",
    "Melon" : "Melon",
    "Meyer_Lemon" : "Lemon",
    "Nectarine_Peach" : "Nectarine",
    "Onion White" : "Onion",
    "Orange" : "Orange",
    "Peach" : "Peach",
    "Pear_Williams_Rouge" : "Pear",
    "Pink_Grapes" : "Grapes",
    "Pomegranate" : "Pomegranate",
    "Potato" : "Potato",
    "Pumpkin" : "Pumpkin",
    "RedBell_Pepper" : "Bell Pepper",
    "Red_Chili" : "Red Chili",
    "Red_Chili_Pepper" : "Red Chili",
    "Red_Onion" : "Onion",
    "Red_Radish" : "Radish",
    "Red_Tomato" : "Tomato",
    "Red_pomelo" : "Pomelo",
    "Sweet_Corn" : "Sweet Corn",
    "Sweet_potato" : "Sweet Potato",
    "Watermelon" : "Watermelon",
    "White_zucchini" : "Zucchini",
    "Yellow_Bell_Pepper" : "Bell Pepper",
    "Yellow_Cherry_Tomato" : "Cherry Tomato",
    "Yellow_Tomato" : "Tomato",
    "avacado" : "Avocado",
    "grapes" : "Grapes",
    "kiwi" : "Kiwi",
    "null": "Unknown",
    "pear" : "Pear",
    "pink_plum" : "Plum",
    "plum" : "Plum",
    "pomelo" : "Pomelo",
    "purple_plum " : "Plum",
};

/**
 * Takes a raw label from the YOLO model and returns the official database name.
 * @param label The raw label predicted by the model.
 * @returns The official database name, or null if no mapping is found.
 */
export function mapLabelToDbName(label: string): string | null {
  const cleanedLabel = label.trim();
  return labelMap[cleanedLabel] || null;
}