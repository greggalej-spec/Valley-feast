/* ============================================================
   Valley Feast Kitchen Delight — shared data layer
   ------------------------------------------------------------
   This file is the "published" menu database. The public pages
   read it directly. The admin dashboard loads it, overlays any
   local edits (localStorage), and can re-export this exact file
   for publishing.
   ============================================================ */

window.VF_DATA = {
  version: 3,

  settings: {
    name: "Valley Feast",
    fullName: "Valley Feast Kitchen Delight",
    tagline: "Real Trini food, cooked in the valley.",
    blurb: "Kitchen delight & catering services from the heart of Maracas Valley — breakfast, lunch and celebration food made the way home tastes.",
    phone: "(868) 731-1531",
    whatsapp: "18687311531",
    email: "alaban@yahoo.com",
    jobsEmail: "alaban@yahoo.com",
    address: "Maracas Royal Road, St. Joseph — just before Maracas Gardens, Trinidad",
    addressShort: "Maracas, St. Joseph",
    hours: [
      { d: "Mon – Fri", h: "6:00 AM – 3:00 PM" },
      { d: "Saturday", h: "6:00 AM – 1:00 PM" },
      { d: "Sunday", h: "Closed — catering only" }
    ],
    currency: "TT$",
    facebook: "#",
    instagram: "#",
    cateringNote: "From 20 guests to 500+. Weddings, corporate limes, prayers, birthdays and everything between."
  },

  categories: [
    { id: "breakfast", name: "Breakfast", note: "Served from 6:00 AM while it lasts", img: "assets/img/bake-saltfish.jpg", order: 1 },
    { id: "lunch", name: "Lunch & Mains", note: "Pots change daily — call for today's lineup", img: "assets/img/buss-up-shut.jpg", order: 2 },
    { id: "soups", name: "Soups", note: "Friday favourite, ladled hot", img: "assets/img/corn-soup.jpg", order: 3 },
    { id: "sides", name: "Sides & Veggies", note: "Market-fresh from the valley", img: "assets/img/sides-veg.jpg", order: 4 },
    { id: "bites", name: "Pies & Small Bites", note: "Warm from the fryer all morning", img: "assets/img/pholourie.jpg", order: 5 }
  ],

  items: [
    /* ---- Breakfast ---- */
    { id: "sada-plain",      category: "breakfast", name: "Sada Roti (plain)",          price: 10,   desc: "Soft, pillowy flatbread straight off the tawa.", tags: ["veg"], available: true, order: 1 },
    { id: "fry-bake",        category: "breakfast", name: "Fry Bake (plain)",           price: 10,   desc: "Golden, puffed and ready for any filling.", tags: ["veg"], available: true, order: 2 },
    { id: "saltfish",        category: "breakfast", name: "Saltfish & Tomato",          price: 22,   desc: "Flaked saltfish sautéed down with tomato, onion and herbs.", tags: ["seafood", "popular"], available: true, order: 3 },
    { id: "smoke-herring",   category: "breakfast", name: "Smoked Herring & Tomato",    price: 22,   desc: "Smoky, savoury and made for a hot sada.", tags: ["seafood"], available: true, order: 4 },
    { id: "sausage-eggs",    category: "breakfast", name: "Sausage & Eggs",             price: null, desc: "Pan-fried sausage with soft scrambled eggs.", tags: [], available: true, order: 5 },
    { id: "fried-liver",     category: "breakfast", name: "Fried Liver",                price: null, desc: "Seasoned well and fried down with plenty onion.", tags: [], available: true, order: 6 },
    { id: "curried-gizzard", category: "breakfast", name: "Curried Gizzard",            price: null, desc: "Slow-cooked in golden curry until tender.", tags: ["spicy"], available: true, order: 7 },
    { id: "coffee-tea",      category: "breakfast", name: "Coffee & Tea",               price: 10,   desc: "Hot, sweet and brewed like home.", tags: ["veg"], available: true, order: 8 },

    /* ---- Lunch & Mains ---- */
    { id: "mix-meat",        category: "lunch", name: "Mixed Plate — Meat / Veggie",    price: 26,   desc: "Rice or provision with your pick of the day's pots.", tags: ["popular"], available: true, order: 1 },
    { id: "curried-chicken", category: "lunch", name: "Rice, Dhal & Curried Chicken",   price: null, desc: "The classic — rich dhal over rice with curried chicken.", tags: ["popular"], available: true, order: 2 },
    { id: "stew-chicken",    category: "lunch", name: "Rice, Stewed Lentils & Stew Chicken", price: null, desc: "Browned-down chicken with sweet, dark stew gravy.", tags: [], available: true, order: 3 },
    { id: "buss-up",         category: "lunch", name: "Buss Up Shut Roti",              price: null, desc: "Torn paratha with curried chicken, potato, channa, pumpkin and mango.", tags: ["popular"], available: true, order: 4 },
    { id: "chicken-dhalpuri",category: "lunch", name: "Chicken Dhalpuri",               price: null, desc: "Split-pea filled roti wrapped around curried chicken.", tags: [], available: true, order: 5 },
    { id: "beef-dhalpuri",   category: "lunch", name: "Beef Dhalpuri",                  price: null, desc: "Slow-cooked curried beef in a soft dhalpuri wrap.", tags: [], available: true, order: 6 },
    { id: "bbq-chicken",     category: "lunch", name: "BBQ Chicken",                    price: null, desc: "Grilled over flame, glazed with our own barbecue sauce.", tags: [], available: true, order: 7 },
    { id: "bbq-pork",        category: "lunch", name: "BBQ Pork",                       price: null, desc: "Sticky, smoky and falling off the bone.", tags: [], available: true, order: 8 },
    { id: "fried-rice",      category: "lunch", name: "Fried Rice",                     price: null, desc: "Wok-tossed with local seasoning and vegetables.", tags: [], available: true, order: 9 },
    { id: "curry-crab",      category: "lunch", name: "Curry Crab & Dumplings",         price: null, desc: "A Sunday treasure — blue crab in coconut curry with flour dumplings.", tags: ["seafood", "spicy", "popular"], available: true, order: 10 },
    { id: "bhagee-rice",     category: "lunch", name: "Bhagi Rice",                     price: null, desc: "Seasoned rice cooked down with dasheen bush and coconut.", tags: ["veg"], available: true, order: 11 },
    { id: "pelau",           category: "lunch", name: "Pelau",                          price: null, desc: "Caramelised chicken, rice and pigeon peas in one sweet pot.", tags: ["popular"], available: true, order: 12 },

    /* ---- Soups ---- */
    { id: "beef-soup",       category: "soups", name: "Beef Soup",                      price: null, desc: "Hearty beef with ground provision and dumplings.", tags: [], available: true, order: 1 },
    { id: "cowheel-soup",    category: "soups", name: "Cow Heel Soup",                  price: null, desc: "Slow-simmered until silky, thick with provision.", tags: ["popular"], available: true, order: 2 },
    { id: "pigtail-soup",    category: "soups", name: "Pig Tail Soup",                  price: null, desc: "Salted pig tail, split peas and dumplings — old-time goodness.", tags: [], available: true, order: 3 },
    { id: "corn-soup",       category: "soups", name: "Corn Soup",                      price: null, desc: "The lime favourite — sweet corn, split peas and dumplings.", tags: ["veg", "popular"], available: true, order: 4 },

    /* ---- Sides & Veggies ---- */
    { id: "bhagi",           category: "sides", name: "Bhagi",                          price: 16,   desc: "Dasheen bush steamed down with coconut milk and garlic.", tags: ["veg"], available: true, order: 1 },
    { id: "baigan",          category: "sides", name: "Baigan",                         price: 16,   desc: "Melongene cooked soft with seasoning.", tags: ["veg"], available: true, order: 2 },
    { id: "baigan-choka",    category: "sides", name: "Baigan Choka",                   price: null, desc: "Fire-roasted melongene, mashed with garlic and hot oil.", tags: ["veg"], available: true, order: 3 },
    { id: "fried-aloo",      category: "sides", name: "Fried Aloo",                     price: null, desc: "Potato fried down with onion, pepper and geera.", tags: ["veg"], available: true, order: 4 },
    { id: "cabbage",         category: "sides", name: "Cabbage",                        price: 16,   desc: "Quick-steamed with carrot, still with a little crunch.", tags: ["veg"], available: true, order: 5 },
    { id: "ochro",           category: "sides", name: "Ochro",                          price: 16,   desc: "Sautéed okra, seasoned simple and true.", tags: ["veg"], available: true, order: 6 },
    { id: "caraili",         category: "sides", name: "Caraili",                        price: 16,   desc: "Bitter melon fried crisp — bitter done right.", tags: ["veg"], available: true, order: 7 },
    { id: "bodi",            category: "sides", name: "Bodi",                           price: null, desc: "Long beans sautéed with garlic and tomato.", tags: ["veg"], available: true, order: 8 },
    { id: "fried-plantain",  category: "sides", name: "Fried Plantain",                 price: null, desc: "Sweet, caramelised and golden at the edges.", tags: ["veg", "popular"], available: true, order: 9 },
    { id: "coleslaw",        category: "sides", name: "Coleslaw",                       price: null, desc: "Creamy, cool and crunchy.", tags: ["veg"], available: true, order: 10 },
    { id: "macaroni-salad",  category: "sides", name: "Macaroni Salad",                 price: null, desc: "A picnic classic, made fresh daily.", tags: ["veg"], available: true, order: 11 },
    { id: "potato-salad",    category: "sides", name: "Potato Salad",                   price: null, desc: "Rich and creamy with fresh herbs.", tags: ["veg"], available: true, order: 12 },
    { id: "fresh-salad",     category: "sides", name: "Fresh Salad",                    price: null, desc: "Crisp valley greens, tomato and cucumber.", tags: ["veg"], available: true, order: 13 },
    { id: "fries",           category: "sides", name: "Fries",                          price: null, desc: "Hand-cut and double-fried.", tags: ["veg"], available: true, order: 14 },
    { id: "mix-veggie",      category: "sides", name: "Mixed Veggie Plate",             price: 22,   desc: "A generous plate of the day's garden pots.", tags: ["veg"], available: true, order: 15 },

    /* ---- Pies & Small Bites ---- */
    { id: "chicken-pie",     category: "bites", name: "Chicken Pie",                    price: 9,    desc: "Flaky pastry, well-seasoned chicken filling.", tags: ["popular"], available: true, order: 1 },
    { id: "beef-pie",        category: "bites", name: "Beef Pie",                       price: 9,    desc: "Peppery minced beef in golden pastry.", tags: [], available: true, order: 2 },
    { id: "aloo-pie",        category: "bites", name: "Aloo Pie",                       price: 7,    desc: "Fried soft, stuffed with spiced potato — add channa.", tags: ["veg", "popular"], available: true, order: 3 },
    { id: "cheese-pie",      category: "bites", name: "Cheese Pie",                     price: null, desc: "Melty, salty, gone in three bites.", tags: ["veg"], available: true, order: 4 },
    { id: "fish-pie",        category: "bites", name: "Fish Pie",                       price: null, desc: "Seasoned local fish wrapped in crisp pastry.", tags: ["seafood"], available: true, order: 5 },
    { id: "pholourie",       category: "bites", name: "Pholourie",                      price: null, desc: "Split-pea fritters with tamarind and mango chutney.", tags: ["veg", "popular"], available: true, order: 6 },
    { id: "saheena",         category: "bites", name: "Saheena",                        price: null, desc: "Dasheen leaf and split-pea rolls, fried crisp.", tags: ["veg"], available: true, order: 7 },
    { id: "katchouri",       category: "bites", name: "Katchouri",                      price: null, desc: "Crunchy split-pea drops, made for chutney.", tags: ["veg"], available: true, order: 8 },
    { id: "kuchela",         category: "bites", name: "Kuchela",                        price: null, desc: "Green mango pickle with amchar masala — hot and haunting.", tags: ["veg", "spicy"], available: true, order: 9 },
    { id: "chutneys",        category: "bites", name: "House Chutneys",                 price: null, desc: "Tamarind, mango and pepper — made in small batches.", tags: ["veg", "spicy"], available: true, order: 10 }
  ]
};
