/**
 * This is the mapping from the YOLO model's raw output labels (all lowercase)
 * to the official name in your Master Ingredient Database.
 * * Add a new line for every ingredient your model can recognize.
 * * Example: if your model outputs 'tomato_fresh', you map it to 'Tomato'.
 */
const labelMap: Record<string, string> = {
    "Apple" : "Apple",
    "Banana" : "Banana",
    "Apricot": "Apricot",
    "Beetroot" : "Beetroot",
    "Black_Grapes" : "Black Grapes",
    "Brinjal" : "Brinjal",
    "Broccoli" : "Broccoli",
    "Cabbage" : "Cabbage",
    "Carrot" : "Carrot",
    "Cauliflower" : "Cauliflower",
    "Cherry_Tomato_Red" : "Cherry Tomato Red",
    "Chinese_Cabbage" : "Chinese Cabbage",
    "Crown_White_Pear" : "Crown White Pear",
    "Cucumber" : "Cucumber",
    "Fuji_Apple" : "Fuji Apple",
    "Garlic" : "Garlic",
    "Granny_smith_apple" : "Granny Smith Apple",
    "Grape_Fruit" : "Grape Fruit",
    "Green_Bell_Pepper" : "Green Bell Pepper",
    "Green_Chili_Pepper" : "Green Chili Pepper",
    "Green_zucchini" : "Green Zucchini",
    "Hass_Avocado" : "Hass Avocado",
    "Lemon" : "Lemon",
    "Lettuce" : "Lettuce",
    "Lime" : "Lime",
    "Mango" : "Mango",
    "Melon" : "Melon",
    "Meyer_Lemon" : "Meyer Lemon",
    "Nectarine_Peach" : "Nectarine Peach",
    "Onion White" : "Onion_White",
    "Orange" : "Orange",
    "Peach" : "Peach",
    "Pear_Williams_Rouge" : "Pear Williams Rouge",
    "Pink_Grapes" : "Pink Grapes",
    "Pomegranate" : "Pomegranate",
    "Potato" : "Potato",
    "Pumpkin" : "Pumpkin",
    "RedBell_Pepper" : "Red Bell Pepper",
    "Red_Chili" : "Red Chili",
    "Red_Chili_Pepper" : "Red Chili Pepper",
    "Red_Onion" : "Red Onion",
    "Red_Radish" : "Red Radish",
    "Red_Tomato" : "Tomato",
    "Red_pomelo" : "Red Pomelo",
    "Sweet_Corn" : "Sweet Corn",
    "Sweet_potato" : "Sweet Potato",
    "Watermelon" : "Watermelon",
    "White_zucchini" : "White Zucchini",
    "Yellow_Bell_Pepper" : "Yellow Bell Pepper",
    "Yellow_Cherry_Tomato" : "Yellow Cherry Tomato",
    "Yellow_Tomato" : "Yellow Tomato",
    "avacado" : "Avocado",
    "grapes" : "Grapes",
    "kiwi" : "Kiwi",
    "null": "Unknown",
    "pear" : "Pear",
    "pink_plum" : "Pink Plum",
    "plum" : "Plum",
    "pomelo" : "Pomelo",
    "purple_plum " : "Purple Plum",
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