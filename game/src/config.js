// Sizzle & Serve — recipes, ingredients and kitchen constants.
// Every dish is a set of ingredients; some need prep before they can be
// plated. Prep turns a raw ingredient into its cooked or chopped form.

export const VIEW = { w: 1280, h: 800 };

export const SHIFT_SECONDS = 180;
export const TARGET_COINS = 120;
export const MAX_HEARTS = 3;
export const ORDER_TIME = 75;
export const MAX_ORDERS = 4;

// Pantry ingredients: what the chef can grab straight off the shelf.
// prep: null means ready to plate; otherwise the station and seconds needed.
export const INGREDIENTS = {
  bun: { name: 'Bun', color: '#e8b06a', dark: '#b97f3e', prep: null },
  pattyRaw: { name: 'Raw Patty', color: '#d96a6a', dark: '#a03d3d', prep: { station: 'grill', seconds: 5, result: 'patty' } },
  patty: { name: 'Grilled Patty', color: '#8a5a33', dark: '#5f3a1e', prep: null },
  lettuce: { name: 'Lettuce', color: '#7ed957', dark: '#4da32e', prep: { station: 'board', seconds: 0, hits: 3, result: 'lettuceChopped' } },
  lettuceChopped: { name: 'Chopped Lettuce', color: '#8fe36b', dark: '#4da32e', prep: null },
  tomato: { name: 'Tomato', color: '#ff5a4e', dark: '#c22e24', prep: { station: 'board', seconds: 0, hits: 3, result: 'tomatoChopped' } },
  tomatoChopped: { name: 'Chopped Tomato', color: '#ff7a6e', dark: '#c22e24', prep: null },
  cucumber: { name: 'Cucumber', color: '#4ecb71', dark: '#2a8f4a', prep: { station: 'board', seconds: 0, hits: 3, result: 'cucumberChopped' } },
  cucumberChopped: { name: 'Chopped Cucumber', color: '#7fe39a', dark: '#2a8f4a', prep: null },
  cheese: { name: 'Cheese', color: '#ffd23e', dark: '#d9a400', prep: null },
  dough: { name: 'Dough', color: '#f7ead0', dark: '#d9c39a', prep: null },
  pasta: { name: 'Pasta', color: '#f2c94c', dark: '#c79a1d', prep: { station: 'pot', seconds: 5, result: 'pastaBoiled' } },
  pastaBoiled: { name: 'Boiled Pasta', color: '#f7d774', dark: '#c79a1d', prep: null },
  sauce: { name: 'Sauce', color: '#e23b2e', dark: '#9e1f14', prep: null },
  shell: { name: 'Taco Shell', color: '#f0a832', dark: '#b97a1a', prep: null },
};

// What the pantry shelves hold (the raw ingredients a chef can grab).
export const PANTRY = ['bun', 'pattyRaw', 'lettuce', 'tomato', 'cucumber', 'cheese', 'dough', 'pasta', 'sauce', 'shell'];

// Recipes: the dishes customers order. bake means the assembled dish must
// spend seconds in the oven before it is a finished dish.
export const RECIPES = [
  { id: 'burger', name: 'Burger', price: 25, bake: 0, ingredients: ['bun', 'patty', 'lettuceChopped', 'tomatoChopped'] },
  { id: 'salad', name: 'Garden Salad', price: 20, bake: 0, ingredients: ['lettuceChopped', 'tomatoChopped', 'cucumberChopped'] },
  { id: 'pizza', name: 'Pizza', price: 30, bake: 6, ingredients: ['dough', 'sauce', 'cheese'] },
  { id: 'pasta', name: 'Pasta', price: 28, bake: 0, ingredients: ['pastaBoiled', 'sauce', 'cheese'] },
  { id: 'taco', name: 'Taco', price: 22, bake: 0, ingredients: ['shell', 'patty', 'lettuceChopped', 'cheese'] },
];

export function recipeById(id) {
  return RECIPES.find((r) => r.id === id);
}

// A finished dish is the plate whose contents match a recipe exactly.
export function dishForPlate(plate) {
  const sorted = [...plate].sort().join('|');
  return RECIPES.find((r) => [...r.ingredients].sort().join('|') === sorted) ?? null;
}

// Kitchen layout, in logical pixels. Stations are the rectangles the chef
// walks to and interacts with; the open floor is everything else.
export const LAYOUT = {
  // Order board tickets live in the top strip; tickets are drawn by render.
  board: { x: 24, y: 66, w: 1232, h: 104 },
  // Assembly plate in the middle of the floor.
  plate: { x: 520, y: 300, w: 240, h: 150 },
  // Serving window on the right of the floor.
  window: { x: 1020, y: 200, w: 236, h: 140 },
  // Trash bin for discarding a carried item or clearing the plate.
  trash: { x: 24, y: 200, w: 110, h: 90 },
  // Bottom row of work stations.
  pantry: { x: 24, y: 620, w: 420, h: 156 },
  grill: { x: 464, y: 620, w: 180, h: 156 },
  board2: { x: 664, y: 620, w: 180, h: 156 },
  pot: { x: 864, y: 620, w: 160, h: 156 },
  oven: { x: 1044, y: 620, w: 212, h: 156 },
};

// Pantry bins inside the pantry rect: 5 columns x 2 rows.
export function pantryBinRect(index) {
  const cols = 5;
  const col = index % cols;
  const row = Math.floor(index / cols);
  return {
    x: LAYOUT.pantry.x + 12 + col * 80,
    y: LAYOUT.pantry.y + 34 + row * 62,
    w: 68,
    h: 52,
  };
}
