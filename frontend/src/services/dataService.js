/**
 * FINSIGHT AI - Local Data & API Service Adapter
 * Bridges frontend services with the Express REST API Backend.
 */

import { apiGetUsers, apiGetEmployees, apiAddEmployee, apiGetDashboardStats, apiGetNotifications, apiGetInventory } from './api';
import { registerUserInSupabase, authenticateUserInSupabase } from './supabaseClient';

// Async helper to fetch live DB users from Express backend
export async function fetchUsersFromBackend() {
  try {
    const res = await apiGetUsers();
    if (res && res.users) {
      localStorage.setItem('finsight_users', JSON.stringify(res.users));
      return res.users;
    }
  } catch (err) {
    console.warn('[User Service]: Falling back to local storage cache for users');
  }
  const cached = localStorage.getItem('finsight_users');
  return cached ? JSON.parse(cached) : [];
}

export function getStoredUsers() {
  try {
    const raw = localStorage.getItem('finsight_users');
    if (raw) return JSON.parse(raw);
  } catch (err) {}
  return [];
}

export async function registerUser(userData) {
  return registerUserInSupabase(userData);
}

export async function authenticateUser(identifier = '', password = '', mobileNumber = '') {
  return authenticateUserInSupabase(identifier, password, mobileNumber);
}

export async function fetchEmployeesFromBackend() {
  try {
    const res = await apiGetEmployees();
    if (res && res.employees) {
      localStorage.setItem('finsight_employees', JSON.stringify(res.employees));
      return res.employees;
    }
  } catch (e) {}
  const raw = localStorage.getItem('finsight_employees');
  return raw ? JSON.parse(raw) : [];
}

export function getStoredEmployees() {
  try {
    const raw = localStorage.getItem('finsight_employees');
    if (raw) return JSON.parse(raw);
  } catch (err) {}
  return [];
}

export async function saveEmployeeToDb(emp) {
  try {
    const res = await apiAddEmployee(emp);
    if (res && res.employees) {
      localStorage.setItem('finsight_employees', JSON.stringify(res.employees));
      return res.employees;
    }
  } catch (e) {
    console.error(e);
  }
  const list = getStoredEmployees();
  list.push(emp);
  return list;
}

export async function fetchInventoryFromBackend() {
  const activeUser = JSON.parse(localStorage.getItem('finsight_active_user') || '{}');
  const activeUserId = activeUser.user_id || activeUser.email || 'user';
  const userKey = String(activeUserId).toLowerCase().replace(/[^a-z0-9]/g, '');
  const localKey = userKey && userKey !== 'user' ? `finsight_stock_inventory_${userKey}` : 'finsight_stock_inventory';

  try {
    const res = await apiGetInventory();
    if (res && res.inventory) {
      localStorage.setItem(localKey, JSON.stringify(res.inventory));
      return res.inventory;
    }
  } catch (e) {
    console.warn('[Inventory Service]: Falling back to local storage cache for inventory');
  }
  const raw = localStorage.getItem(localKey);
  return raw ? JSON.parse(raw) : [];
}

export const DEFAULT_OFFICIAL_GST_RATES = [
  // ── 1. GROCERY & STAPLES ──────────────────────────────────────────────
  { id: 1, category: 'Rice (unbranded)', example: 'Unbranded raw/steamed rice', rate: 0, display: '0% (Exempted)' },
  { id: 2, category: 'Branded Rice', example: 'Packaged branded basmati/rice', rate: 5, display: '5% GST' },
  { id: 3, category: 'Wheat', example: 'Whole wheat grains', rate: 0, display: '0% (Exempted)' },
  { id: 4, category: 'Wheat Flour (Atta)', example: 'Packaged wheat flour / Atta', rate: 5, display: '5% GST' },
  { id: 5, category: 'Maida', example: 'Refined wheat flour', rate: 5, display: '5% GST' },
  { id: 6, category: 'Rava (Sooji)', example: 'Semolina / Sooji / Rava', rate: 5, display: '5% GST' },
  { id: 7, category: 'Besan', example: 'Gram flour', rate: 5, display: '5% GST' },
  { id: 8, category: 'Toor Dal', example: 'Unbranded pulses / Toor dal', rate: 0, display: '0% (Exempted)' },
  { id: 9, category: 'Urad Dal', example: 'Unbranded Urad dal', rate: 0, display: '0% (Exempted)' },
  { id: 10, category: 'Moong Dal', example: 'Unbranded Moong dal', rate: 0, display: '0% (Exempted)' },
  { id: 11, category: 'Chana Dal', example: 'Unbranded Chana dal', rate: 0, display: '0% (Exempted)' },
  { id: 12, category: 'Masoor Dal', example: 'Unbranded Masoor dal', rate: 0, display: '0% (Exempted)' },
  { id: 13, category: 'Sugar', example: 'Refined white/brown sugar', rate: 5, display: '5% GST' },
  { id: 14, category: 'Jaggery', example: 'Natural jaggery / Gur', rate: 5, display: '5% GST' },
  { id: 15, category: 'Salt', example: 'Common iodized salt', rate: 0, display: '0% (Exempted)' },
  { id: 16, category: 'Tea Powder', example: 'Packaged tea leaves / dust', rate: 5, display: '5% GST' },
  { id: 17, category: 'Coffee Powder', example: 'Coffee beans & instant powder', rate: 5, display: '5% GST' },
  { id: 18, category: 'Milk', example: 'Fresh liquid milk', rate: 0, display: '0% (Exempted)' },
  { id: 19, category: 'Curd', example: 'Fresh plain curd / Dahi', rate: 0, display: '0% (Exempted)' },
  { id: 20, category: 'Butter', example: 'Dairy butter / Salted butter', rate: 12, display: '12% GST' },
  { id: 21, category: 'Cheese', example: 'Processed cheese / Processed slices', rate: 12, display: '12% GST' },
  { id: 22, category: 'Paneer', example: 'Fresh cottage cheese / Paneer', rate: 5, display: '5% GST' },
  { id: 23, category: 'Ghee', example: 'Pure cow/buffalo ghee', rate: 12, display: '12% GST' },
  { id: 24, category: 'Cooking Oil', example: 'Edible cooking oil', rate: 5, display: '5% GST' },
  { id: 25, category: 'Mustard Oil', example: 'Kachi ghani mustard oil', rate: 5, display: '5% GST' },
  { id: 26, category: 'Sunflower Oil', example: 'Refined sunflower oil', rate: 5, display: '5% GST' },
  { id: 27, category: 'Coconut Oil (edible)', example: 'Pure edible coconut oil', rate: 5, display: '5% GST' },
  { id: 28, category: 'Pickle', example: 'Bottled mango/lemon pickles', rate: 12, display: '12% GST' },
  { id: 29, category: 'Jam', example: 'Fruit jams & preserves', rate: 12, display: '12% GST' },
  { id: 30, category: 'Honey', example: 'Natural processed honey', rate: 5, display: '5% GST' },
  { id: 31, category: 'Biscuit', example: 'Sweet & salted biscuits', rate: 18, display: '18% GST' },
  { id: 32, category: 'Chocolate', example: 'Milk & dark chocolates', rate: 18, display: '18% GST' },
  { id: 33, category: 'Soft Drinks', example: 'Carbonated aerated beverages', rate: 28, display: '28% GST' },
  { id: 34, category: 'Mineral Water', example: 'Packaged drinking water', rate: 18, display: '18% GST' },
  { id: 35, category: 'Fruit Juice', example: 'Packaged fruit drinks & juice', rate: 12, display: '12% GST' },
  { id: 36, category: 'Noodles', example: 'Instant noodles & ramen', rate: 18, display: '18% GST' },
  { id: 37, category: 'Pasta', example: 'Dry durum wheat pasta', rate: 18, display: '18% GST' },
  { id: 38, category: 'Corn Flakes', example: 'Breakfast corn cereals', rate: 18, display: '18% GST' },
  { id: 39, category: 'Oats', example: 'Rolled & instant breakfast oats', rate: 5, display: '5% GST' },
  { id: 40, category: 'Spices', example: 'Whole spices (Cumin, Mustard)', rate: 5, display: '5% GST' },
  { id: 41, category: 'Turmeric Powder', example: 'Ground turmeric / Haldi', rate: 5, display: '5% GST' },
  { id: 42, category: 'Chilli Powder', example: 'Ground red chilli powder', rate: 5, display: '5% GST' },
  { id: 43, category: 'Coriander Powder', example: 'Ground coriander / Dhaniya', rate: 5, display: '5% GST' },
  { id: 44, category: 'Dry Fruits', example: 'Cashews, Almonds, Raisins', rate: 12, display: '12% GST' },
  { id: 45, category: 'Ice Cream', example: 'Dairy ice creams & frozen desserts', rate: 18, display: '18% GST' },
  { id: 46, category: 'Bakery Cake', example: 'Fresh cakes & pastries', rate: 18, display: '18% GST' },
  { id: 47, category: 'Bread', example: 'Fresh sliced loaf bread', rate: 0, display: '0% (Exempted)' },
  { id: 48, category: 'Eggs', example: 'Fresh poultry farm eggs', rate: 0, display: '0% (Exempted)' },
  { id: 49, category: 'Fresh Vegetables', example: 'Fresh market vegetables', rate: 0, display: '0% (Exempted)' },
  { id: 50, category: 'Fresh Fruits', example: 'Fresh seasonal fruits', rate: 0, display: '0% (Exempted)' },

  // ── 2. TEXTILES & APPAREL ─────────────────────────────────────────────
  { id: 51, category: 'Cotton Shirt', example: 'Men/Women cotton shirts', rate: 5, display: '5% GST' },
  { id: 52, category: 'T-Shirt', example: 'Casual polo & round neck t-shirts', rate: 5, display: '5% GST' },
  { id: 53, category: 'Jeans', example: 'Denim jeans pants', rate: 12, display: '12% GST' },
  { id: 54, category: 'Trousers', example: 'Formal & casual trousers', rate: 12, display: '12% GST' },
  { id: 55, category: 'Shorts', example: 'Cotton shorts & Bermudas', rate: 5, display: '5% GST' },
  { id: 56, category: 'Skirt', example: 'Women skirts', rate: 5, display: '5% GST' },
  { id: 57, category: 'Kurti', example: 'Ethnic kurtis & tops', rate: 5, display: '5% GST' },
  { id: 58, category: 'Saree', example: 'Traditional sarees', rate: 5, display: '5% GST' },
  { id: 59, category: 'Silk Saree', example: 'Pure silk sarees', rate: 5, display: '5% GST' },
  { id: 60, category: 'Cotton Saree', example: 'Handloom cotton sarees', rate: 5, display: '5% GST' },
  { id: 61, category: 'Salwar Suit', example: 'Readymade salwar suit set', rate: 5, display: '5% GST' },
  { id: 62, category: 'Leggings', example: 'Cotton elastic leggings', rate: 5, display: '5% GST' },
  { id: 63, category: 'Dupatta', example: 'Cotton & silk dupattas', rate: 5, display: '5% GST' },
  { id: 64, category: 'Shawl', example: 'Woolen & pashmina shawls', rate: 5, display: '5% GST' },
  { id: 65, category: 'Sweater', example: 'Knitted winter sweaters', rate: 12, display: '12% GST' },
  { id: 66, category: 'Jacket', example: 'Winter & casual jackets', rate: 12, display: '12% GST' },
  { id: 67, category: 'Coat', example: 'Overcoats & formal coats', rate: 12, display: '12% GST' },
  { id: 68, category: 'Blazer', example: 'Formal suiting blazers', rate: 12, display: '12% GST' },
  { id: 69, category: 'School Uniform', example: 'School dresses & shirts', rate: 5, display: '5% GST' },
  { id: 70, category: 'Socks', example: 'Cotton socks', rate: 5, display: '5% GST' },
  { id: 71, category: 'Gloves', example: 'Winter gloves', rate: 5, display: '5% GST' },
  { id: 72, category: 'Cap', example: 'Sports & casual caps', rate: 5, display: '5% GST' },
  { id: 73, category: 'Hat', example: 'Sun hats & felt hats', rate: 5, display: '5% GST' },
  { id: 74, category: 'Handkerchief', example: 'Cotton handkerchiefs', rate: 5, display: '5% GST' },
  { id: 75, category: 'Bedsheet', example: 'Cotton double bedsheet', rate: 12, display: '12% GST' },
  { id: 76, category: 'Pillow Cover', example: 'Pillow cases & covers', rate: 12, display: '12% GST' },
  { id: 77, category: 'Curtain', example: 'Door & window curtains', rate: 12, display: '12% GST' },
  { id: 78, category: 'Blanket', example: 'Fleece & mink blankets', rate: 12, display: '12% GST' },
  { id: 79, category: 'Quilt', example: 'Cotton quilts & comforters', rate: 12, display: '12% GST' },
  { id: 80, category: 'Mattress Cover', example: 'Protective mattress covers', rate: 12, display: '12% GST' },
  { id: 81, category: 'Towel', example: 'Bath & hand cotton towels', rate: 12, display: '12% GST' },
  { id: 82, category: 'Bath Robe', example: 'Terry towel bathrobe', rate: 12, display: '12% GST' },
  { id: 83, category: 'Track Pant', example: 'Sports track pants', rate: 12, display: '12% GST' },
  { id: 84, category: 'Sports Jersey', example: 'Team jerseys & athletic tops', rate: 12, display: '12% GST' },
  { id: 85, category: 'Sports Shorts', example: 'Athletic shorts', rate: 12, display: '12% GST' },
  { id: 86, category: 'Baby Dress', example: 'Infant clothing & dresses', rate: 5, display: '5% GST' },
  { id: 87, category: 'Baby Blanket', example: 'Soft baby wrappers & blankets', rate: 12, display: '12% GST' },
  { id: 88, category: 'Raincoat', example: 'Waterproof rain jackets & suits', rate: 18, display: '18% GST' },
  { id: 89, category: 'Leather Jacket', example: 'Genuine leather jackets', rate: 18, display: '18% GST' },
  { id: 90, category: 'Belt', example: 'Leather & synthetic waist belts', rate: 18, display: '18% GST' },
  { id: 91, category: 'Wallet', example: 'Leather pocket wallets', rate: 18, display: '18% GST' },
  { id: 92, category: 'Tie', example: 'Formal neckties', rate: 12, display: '12% GST' },
  { id: 93, category: 'Scarf', example: 'Fashion scarves', rate: 5, display: '5% GST' },
  { id: 94, category: 'Innerwear', example: 'Men/Women innerwear garments', rate: 5, display: '5% GST' },
  { id: 95, category: 'Bra', example: 'Lingerie & brassieres', rate: 5, display: '5% GST' },
  { id: 96, category: 'Night Dress', example: 'Night suits & nightwear', rate: 5, display: '5% GST' },
  { id: 97, category: 'Pajama', example: 'Cotton pajamas', rate: 5, display: '5% GST' },
  { id: 98, category: 'Hoodie', example: 'Fleece hoodies & sweatshirts', rate: 12, display: '12% GST' },
  { id: 99, category: 'Denim Jacket', example: 'Denim outerwear jackets', rate: 12, display: '12% GST' },
  { id: 100, category: 'Fabric Roll', example: 'Textile fabric rolls & unstitched material', rate: 5, display: '5% GST' },

  // ── 3. HARDWARE & ELECTRICALS ──────────────────────────────────────────
  { id: 101, category: 'Hammer', example: 'Claw & ball peen hammers', rate: 18, display: '18% GST' },
  { id: 102, category: 'Screwdriver', example: 'Manual & insulated screwdrivers', rate: 18, display: '18% GST' },
  { id: 103, category: 'Spanner', example: 'Ring & open spanner sets', rate: 18, display: '18% GST' },
  { id: 104, category: 'Drill Machine', example: 'Electric impact drills', rate: 18, display: '18% GST' },
  { id: 105, category: 'Electric Saw', example: 'Circular & jig saws', rate: 18, display: '18% GST' },
  { id: 106, category: 'Nails', example: 'Steel & iron construction nails', rate: 18, display: '18% GST' },
  { id: 107, category: 'Screws', example: 'Wood & drywall screws', rate: 18, display: '18% GST' },
  { id: 108, category: 'Bolts', example: 'Hexagonal steel bolts', rate: 18, display: '18% GST' },
  { id: 109, category: 'Nuts', example: 'Steel nuts & fasteners', rate: 18, display: '18% GST' },
  { id: 110, category: 'Washers', example: 'Flat & spring washers', rate: 18, display: '18% GST' },
  { id: 111, category: 'PVC Pipe', example: 'Plumbing PVC pipes', rate: 18, display: '18% GST' },
  { id: 112, category: 'GI Pipe', example: 'Galvanized iron pipes', rate: 18, display: '18% GST' },
  { id: 113, category: 'Water Tap', example: 'Brass & chrome water taps', rate: 18, display: '18% GST' },
  { id: 114, category: 'Valve', example: 'Gate & ball valves', rate: 18, display: '18% GST' },
  { id: 115, category: 'Door Lock', example: 'Mortise & padlocks', rate: 18, display: '18% GST' },
  { id: 116, category: 'Door Handle', example: 'Stainless steel door handles', rate: 18, display: '18% GST' },
  { id: 117, category: 'Hinges', example: 'Cabinet & door hinges', rate: 18, display: '18% GST' },
  { id: 118, category: 'Paint', example: 'Emulsion & enamel paints', rate: 18, display: '18% GST' },
  { id: 119, category: 'Paint Brush', example: 'Wall painting brushes', rate: 18, display: '18% GST' },
  { id: 120, category: 'Roller Brush', example: 'Paint roller brushes', rate: 18, display: '18% GST' },
  { id: 121, category: 'Cement', example: 'OPC & PPC cement bags', rate: 28, display: '28% GST' },
  { id: 122, category: 'White Cement', example: 'White cement & wall putty', rate: 28, display: '28% GST' },
  { id: 123, category: 'Tiles', example: 'Vitrified & ceramic floor tiles', rate: 28, display: '28% GST' },
  { id: 124, category: 'Granite Slab', example: 'Polished granite slabs', rate: 28, display: '28% GST' },
  { id: 125, category: 'Marble', example: 'Natural marble stone', rate: 28, display: '28% GST' },
  { id: 126, category: 'PVC Wire', example: 'Insulated copper electric wires', rate: 18, display: '18% GST' },
  { id: 127, category: 'Electrical Switch', example: 'Modular electrical switches', rate: 18, display: '18% GST' },
  { id: 128, category: 'Socket', example: '5-pin & 15-pin power sockets', rate: 18, display: '18% GST' },
  { id: 129, category: 'LED Bulb', example: 'Energy-saving LED bulbs', rate: 12, display: '12% GST' },
  { id: 130, category: 'Tube Light', example: 'LED battens & tube lights', rate: 12, display: '12% GST' },
  { id: 131, category: 'Ceiling Fan', example: 'High-speed ceiling fans', rate: 18, display: '18% GST' },
  { id: 132, category: 'Exhaust Fan', example: 'Kitchen & bathroom exhaust fans', rate: 18, display: '18% GST' },
  { id: 133, category: 'Water Pump', example: 'Monoblock water pumps', rate: 18, display: '18% GST' },
  { id: 134, category: 'Electric Motor', example: 'Single & 3-phase electric motors', rate: 18, display: '18% GST' },
  { id: 135, category: 'Welding Rod', example: 'Arc welding electrodes', rate: 18, display: '18% GST' },
  { id: 136, category: 'Grinder Machine', example: 'Handheld angle grinders', rate: 18, display: '18% GST' },
  { id: 137, category: 'Measuring Tape', example: 'Steel measuring tapes', rate: 18, display: '18% GST' },
  { id: 138, category: 'Spirit Level', example: 'Aluminum spirit levels', rate: 18, display: '18% GST' },
  { id: 139, category: 'Ladder', example: 'Aluminum folding ladders', rate: 18, display: '18% GST' },
  { id: 140, category: 'Chain', example: 'Steel link chains', rate: 18, display: '18% GST' },
  { id: 141, category: 'Rope', example: 'Nylon & PP ropes', rate: 12, display: '12% GST' },
  { id: 142, category: 'PVC Adhesive', example: 'Pipe jointing solvent cement', rate: 18, display: '18% GST' },
  { id: 143, category: 'Silicone Sealant', example: 'Waterproof silicone sealants', rate: 18, display: '18% GST' },
  { id: 144, category: 'Safety Helmet', example: 'Construction safety helmets', rate: 18, display: '18% GST' },
  { id: 145, category: 'Safety Gloves', example: 'Industrial safety hand gloves', rate: 18, display: '18% GST' },
  { id: 146, category: 'PVC Tank', example: 'Water storage tanks', rate: 18, display: '18% GST' },
  { id: 147, category: 'Water Filter Housing', example: 'RO & UV water filter housings', rate: 18, display: '18% GST' },
  { id: 148, category: 'Pliers', example: 'Combination & nose pliers', rate: 18, display: '18% GST' },
  { id: 149, category: 'Chisel', example: 'Wood & masonry chisels', rate: 18, display: '18% GST' },
  { id: 150, category: 'Angle Grinder', example: 'Power angle grinding machines', rate: 18, display: '18% GST' },

  // ── 4. PHARMACY & MEDICINES ────────────────────────────────────────────
  { id: 151, category: 'Paracetamol', example: 'Fever & pain relief tablets', rate: 12, display: '12% GST' },
  { id: 152, category: 'Ibuprofen', example: 'Anti-inflammatory tablets', rate: 12, display: '12% GST' },
  { id: 153, category: 'Amoxicillin', example: 'Antibiotic capsules', rate: 12, display: '12% GST' },
  { id: 154, category: 'Azithromycin', example: 'Antibiotic tablets', rate: 12, display: '12% GST' },
  { id: 155, category: 'Cetirizine', example: 'Anti-allergy tablets', rate: 12, display: '12% GST' },
  { id: 156, category: 'ORS Packet', example: 'Oral rehydration salts', rate: 5, display: '5% GST' },
  { id: 157, category: 'Vitamin Tablets', example: 'Vitamin B-Complex & C tablets', rate: 12, display: '12% GST' },
  { id: 158, category: 'Calcium Tablets', example: 'Calcium + D3 supplements', rate: 12, display: '12% GST' },
  { id: 159, category: 'Iron Tablets', example: 'Folic acid & iron tablets', rate: 12, display: '12% GST' },
  { id: 160, category: 'Multivitamin Syrup', example: 'Health multivitamin syrups', rate: 12, display: '12% GST' },
  { id: 161, category: 'Cough Syrup', example: 'Expectorant cough syrups', rate: 12, display: '12% GST' },
  { id: 162, category: 'Antacid', example: 'Acidity relief liquids & tablets', rate: 12, display: '12% GST' },
  { id: 163, category: 'Insulin', example: 'Diabetic insulin injections', rate: 5, display: '5% GST' },
  { id: 164, category: 'Glucose Powder', example: 'Instant energy glucose drink', rate: 5, display: '5% GST' },
  { id: 165, category: 'Baby Formula', example: 'Infant milk powder formula', rate: 5, display: '5% GST' },
  { id: 166, category: 'Adult Diaper', example: 'Incontinence adult diapers', rate: 12, display: '12% GST' },
  { id: 167, category: 'Surgical Gloves', example: 'Sterile latex examination gloves', rate: 12, display: '12% GST' },
  { id: 168, category: 'Face Mask', example: '3-Ply & N95 protective masks', rate: 5, display: '5% GST' },
  { id: 169, category: 'Hand Sanitizer', example: 'Alcohol-based hand rubs', rate: 18, display: '18% GST' },
  { id: 170, category: 'Cotton Roll', example: 'Absorbent medical cotton', rate: 5, display: '5% GST' },
  { id: 171, category: 'Bandage', example: 'Sterile gauze bandages', rate: 12, display: '12% GST' },
  { id: 172, category: 'Crepe Bandage', example: 'Elastic crepe support bandages', rate: 12, display: '12% GST' },
  { id: 173, category: 'Surgical Tape', example: 'Medical adhesive tape', rate: 12, display: '12% GST' },
  { id: 174, category: 'Thermometer', example: 'Digital & mercury thermometers', rate: 12, display: '12% GST' },
  { id: 175, category: 'BP Monitor', example: 'Digital blood pressure monitors', rate: 12, display: '12% GST' },
  { id: 176, category: 'Glucometer', example: 'Blood glucose testing meters', rate: 12, display: '12% GST' },
  { id: 177, category: 'Glucose Test Strip', example: 'Blood sugar test strips', rate: 12, display: '12% GST' },
  { id: 178, category: 'Nebulizer', example: 'Compressor nebulizer machines', rate: 12, display: '12% GST' },
  { id: 179, category: 'Wheelchair', example: 'Folding patient wheelchairs', rate: 5, display: '5% GST' },
  { id: 180, category: 'Walking Stick', example: 'Orthopedic walking sticks', rate: 5, display: '5% GST' },
  { id: 181, category: 'Hearing Aid', example: 'Digital acoustic hearing aids', rate: 5, display: '5% GST' },
  { id: 182, category: 'Adult Syringe', example: 'Hypodermic medical needles', rate: 12, display: '12% GST' },
  { id: 183, category: 'Disposable Syringe', example: 'Single-use plastic syringes', rate: 12, display: '12% GST' },
  { id: 184, category: 'IV Set', example: 'Intravenous infusion drip sets', rate: 12, display: '12% GST' },
  { id: 185, category: 'Saline Bottle', example: 'Normal saline & Dextrose IV fluid', rate: 5, display: '5% GST' },
  { id: 186, category: 'Antiseptic Solution', example: 'Chlorhexidine & Dettol liquid', rate: 12, display: '12% GST' },
  { id: 187, category: 'Antifungal Cream', example: 'Skin fungal infection creams', rate: 12, display: '12% GST' },
  { id: 188, category: 'Antibiotic Ointment', example: 'Topical wound healing creams', rate: 12, display: '12% GST' },
  { id: 189, category: 'Eye Drops', example: 'Antibiotic & lubricating eye drops', rate: 12, display: '12% GST' },
  { id: 190, category: 'Ear Drops', example: 'Wax removal & ear pain drops', rate: 12, display: '12% GST' },
  { id: 191, category: 'Nasal Spray', example: 'Decongestant nasal sprays', rate: 12, display: '12% GST' },
  { id: 192, category: 'Pregnancy Test Kit', example: 'HCG home test cassettes', rate: 12, display: '12% GST' },
  { id: 193, category: 'Surgical Blade', example: 'Scalpel blades for surgery', rate: 12, display: '12% GST' },
  { id: 194, category: 'Disposable Razor (medical)', example: 'Surgical skin prep razors', rate: 18, display: '18% GST' },
  { id: 195, category: 'Alcohol Swab', example: 'Pre-injection antiseptic wipes', rate: 12, display: '12% GST' },
  { id: 196, category: 'Medical PPE Kit', example: 'Full body protection suit sets', rate: 12, display: '12% GST' },
  { id: 197, category: 'Stethoscope', example: 'Medical diagnostic stethoscopes', rate: 12, display: '12% GST' },
  { id: 198, category: 'Pulse Oximeter', example: 'Fingertip blood oxygen monitors', rate: 12, display: '12% GST' },
  { id: 199, category: 'Digital Weighing Scale', example: 'Medical body weight scales', rate: 18, display: '18% GST' },
  { id: 200, category: 'First Aid Kit', example: 'Emergency medical response box', rate: 12, display: '12% GST' },
];

export function getOfficialGstRates() {
  return DEFAULT_OFFICIAL_GST_RATES;
}

export function addOfficialGstRate(newCategory) {
  const current = getOfficialGstRates();
  const rateObj = {
    id: current.length + 1,
    category: newCategory.category,
    example: newCategory.example || newCategory.category,
    rate: parseFloat(newCategory.rate) || 18,
    display: `${newCategory.rate}%`,
  };
  return [rateObj, ...current];
}

export function verifyVendorBillGst(items = []) {
  const officialRates = getOfficialGstRates();
  const alerts = [];
  items.forEach(item => {
    const name = (item.name || item.description || '').toLowerCase();
    const chargedGstNum = parseFloat((item.gst || '5%').replace(/[^0-9.]/g, '')) || 0;
    const match = officialRates.find(r => name.includes(r.category.toLowerCase()));
    if (match && chargedGstNum > match.rate) {
      alerts.push({
        itemName: item.name || item.description,
        chargedGst: `${chargedGstNum}%`,
        officialGst: match.display,
        matchedCategory: match.category,
        message: `GST Warning: Vendor charged ${chargedGstNum}%, expected rate is ${match.display}.`,
      });
    }
  });
  return { isCompliant: alerts.length === 0, alerts, totalAlerts: alerts.length };
}

export function getStoredFraudAlerts() {
  const raw = localStorage.getItem('finsight_fraud_alerts');
  return raw ? JSON.parse(raw) : [];
}

export function getStoredInvoices(userId) {
  try {
    let key = 'finsight_ocr_invoices';
    if (userId) {
      const cleanKey = String(userId).toLowerCase().replace(/[^a-z0-9]/g, '');
      key = `finsight_ocr_invoices_${cleanKey}`;
    } else {
      const activeUser = JSON.parse(localStorage.getItem('finsight_active_user') || '{}');
      if (activeUser.user_id || activeUser.email) {
        const cleanKey = String(activeUser.user_id || activeUser.email).toLowerCase().replace(/[^a-z0-9]/g, '');
        key = `finsight_ocr_invoices_${cleanKey}`;
      }
    }
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

export function saveInvoiceToStore(inv, userId) {
  const current = getStoredInvoices(userId);
  current.unshift(inv);
  let key = 'finsight_ocr_invoices';
  if (userId) {
    const cleanKey = String(userId).toLowerCase().replace(/[^a-z0-9]/g, '');
    key = `finsight_ocr_invoices_${cleanKey}`;
  } else {
    const activeUser = JSON.parse(localStorage.getItem('finsight_active_user') || '{}');
    if (activeUser.user_id || activeUser.email) {
      const cleanKey = String(activeUser.user_id || activeUser.email).toLowerCase().replace(/[^a-z0-9]/g, '');
      key = `finsight_ocr_invoices_${cleanKey}`;
    }
  }
  localStorage.setItem(key, JSON.stringify(current));
  return current;
}

export function checkDuplicateInvoiceAndFraud(newInvoice = {}, userId) {
  const storedInvoices = getStoredInvoices(userId);
  const normNo = (newInvoice.invoiceNumber || newInvoice.invoice_number || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const normSupplier = (newInvoice.supplierName || newInvoice.supplier_name || '').toLowerCase().trim();
  const totalVal = parseFloat(String(newInvoice.grandTotal || newInvoice.grand_total || '0').replace(/[^0-9.]/g, '')) || 0;

  for (const inv of storedInvoices) {
    const existingNormNo = (inv.invoice_number || inv.invoiceNumber || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const existingNormSupplier = (inv.supplier_name || inv.supplierName || '').toLowerCase().trim();
    const existingTotal = parseFloat(String(inv.grand_total || inv.grandTotal || '0').replace(/[^0-9.]/g, '')) || 0;

    // Check 1: Invoice Number Match
    if (normNo && existingNormNo && normNo === existingNormNo) {
      return {
        isDuplicate: true,
        alert: {
          title: '⚠️ DUPLICATE INVOICE DETECTED',
          message: `Invoice #${inv.invoice_number || inv.invoiceNumber} from ${inv.supplier_name || inv.supplierName} was already uploaded and recorded previously!`,
          matchedInvoice: inv,
        }
      };
    }

    // Check 2: Same Supplier + Same Total Amount Match
    if (normSupplier && existingNormSupplier && (normSupplier.includes(existingNormSupplier) || existingNormSupplier.includes(normSupplier))) {
      if (totalVal > 0 && Math.abs(totalVal - existingTotal) < 5) {
        return {
          isDuplicate: true,
          alert: {
            title: '⚠️ DUPLICATE BILL WARNING',
            message: `A bill of ₹ ${totalVal.toLocaleString('en-IN')} from ${inv.supplier_name || inv.supplierName} was already recorded previously.`,
            matchedInvoice: inv,
          }
        };
      }
    }
  }

  return { isDuplicate: false };
}
