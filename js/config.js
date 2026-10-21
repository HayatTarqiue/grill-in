/* =========================================================
   New Grill In — central configuration + menu data
   ---------------------------------------------------------
   👉 OWNER / LAUNCH TODO:
   1. Set RESTAURANT_CONFIG.whatsappNumber to the real number
      (country code + number, digits only, e.g. "919430055199").
      No "+", spaces or dashes. Until then, checkout shows a
      clear "number not configured" notice instead of a broken link.
   2. Replace the MENU items, prices (INR) and availability below
      with the restaurant's VERIFIED menu. Prices here are SAMPLE
      demonstration data.
   ========================================================= */

window.RESTAURANT_CONFIG = {
  name: "New Grill In",
  location: "Nawada, Bihar",

  // WhatsApp number (country code + number, digits only).
  whatsappNumber: "919430055199",

  currency: "INR",
  currencySymbol: "₹",

  // Fulfillment
  deliveryEnabled: true,
  pickupEnabled: true,

  // Charges (INR). deliveryCharge applies to Delivery orders only.
  // Set to 0 for free delivery. freeDeliveryAbove: null to disable.
  deliveryCharge: 0,
  freeDeliveryAbove: null,
  minimumOrderAmount: null,

  // Shown in the checkout payment dropdown. Keep only methods the
  // restaurant actually supports. These are safe, non-committal defaults.
  paymentPreferences: [
    "Cash on delivery / pickup",
    "UPI (confirm with restaurant)",
    "To be confirmed with restaurant"
  ]
};

/* MENU — single source of truth for products.
   id        : stable unique id (used by the cart; never change casually)
   name      : display name
   desc      : short description
   price     : number, INR (no symbol)
   category  : grill | burgers | pizza | sandwiches
   img       : Unsplash photo id (used to build responsive URLs)
   veg       : true = veg, false = non-veg
   available : false = shown as sold out, cannot be ordered
   SAMPLE DATA — replace with verified menu + prices. */
window.MENU = [
  { id: "grill-tikka",     name: "Smoky Charcoal Tikka", desc: "Marinated overnight, grilled over live charcoal with a squeeze of lime.", price: 220, category: "grill",      img: "1544025162-d76694265947", veg: false, available: true },
  { id: "grill-chicken",   name: "Flame-Grilled Chicken", desc: "Half chicken, slow-grilled with house spice rub and smoky char.",        price: 260, category: "grill",      img: "1598515214211-89d3c73ae83b", veg: false, available: true },
  { id: "grill-platter",   name: "Grilled Platter",       desc: "A sharing board of assorted grilled cuts, served sizzling.",               price: 380, category: "grill",      img: "1600891964092-4316c288032e", veg: false, available: true },
  { id: "burger-classic",  name: "The Grill-In Classic",  desc: "Flame-grilled patty, melted cheese, crisp veg and signature sauce.",       price: 180, category: "burgers",    img: "1568901346375-23c9450c58cd", veg: false, available: true },
  { id: "burger-double",   name: "Double Smash Burger",   desc: "Two seared patties stacked tall with pickles and smoky mayo.",             price: 240, category: "burgers",    img: "1550547660-d9450f859349", veg: false, available: true },
  { id: "burger-crispy",   name: "Crispy Chicken Burger", desc: "Golden fried chicken, slaw and chilli mayo in a toasted bun.",             price: 200, category: "burgers",    img: "1606755962773-d324e0a13086", veg: false, available: true },
  { id: "pizza-margherita",name: "Wood-Fired Margherita", desc: "Tomato, mozzarella and basil on a blistered, chewy base.",                 price: 230, category: "pizza",      img: "1604382354936-07c5d9983bd3", veg: true,  available: true },
  { id: "pizza-loaded",    name: "Loaded Grill Pizza",    desc: "Grilled toppings piled high over a rich, slow-proved crust.",              price: 320, category: "pizza",      img: "1513104890138-7c749659a591", veg: false, available: true },
  { id: "pizza-paneer",    name: "Spicy Paneer Pizza",    desc: "Chilli-spiced paneer, peppers and onion with a mozzarella pull.",          price: 280, category: "pizza",      img: "1565299624946-b28f40a0ae38", veg: true,  available: true },
  { id: "sandwich-club",   name: "Grilled Club Sandwich", desc: "Triple-stacked and pressed on the grill until golden.",                    price: 160, category: "sandwiches", img: "1528735602780-2552fd46c7af", veg: false, available: true },
  { id: "sandwich-veg-sub",name: "Smoky Veg Sub",         desc: "Grilled vegetables, melted cheese and herbs in a crusty roll.",            price: 140, category: "sandwiches", img: "1509722747041-616f39b57569", veg: true,  available: false },
  { id: "sandwich-melt",   name: "Chicken Melt",          desc: "Pulled grilled chicken and cheese, toasted to order.",                     price: 190, category: "sandwiches", img: "1539252554453-80ab65ce3586", veg: false, available: true }
];
