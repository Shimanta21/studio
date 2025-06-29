import { collection, writeBatch, doc, type Firestore } from 'firebase/firestore';
import { format, subDays, addDays } from 'date-fns';
import type { Sale, Product, Customer } from '@/lib/types';

// We use custom IDs to easily link sales to products.
const PRODUCT_IDS = {
  CANINE_PLUS: 'prod_canine_plus_food_a',
  FELINE_FINE: 'prod_feline_fine_treats_b',
  RABIES_VAC: 'prod_rabies_vaccine_c',
  LEPTO_VAC: 'prod_lepto_vaccine_d',
  PET_CARRIER: 'prod_pet_carrier_e',
  CHEW_TOY: 'prod_chew_toy_f',
  FLEA_TICK_MED: 'prod_flea_tick_med_g',
  VITAMIN_DROPS: 'prod_vitamin_drops_h',
  GROOM_BRUSH: 'prod_grooming_brush_i',
  NAIL_CLIPPERS: 'prod_nail_clippers_j',
};

// --- PRODUCTS ---
// The initial state of all products in the database.
// Stock levels are pre-calculated based on the sales below.
const productsToSeed: Product[] = [
  {
    id: PRODUCT_IDS.CANINE_PLUS,
    name: 'Canine Plus Dog Food',
    category: 'Medicines & Pet Foods',
    batchNumber: 'CPDF2024A',
    source: 'Pet Food Inc.',
    stockInHand: 85,
    itemsSold: 15,
    price: 1500,
    expiryDate: format(addDays(new Date(), 365), 'yyyy-MM-dd'),
    receivedLog: [{ date: format(subDays(new Date(), 45), 'yyyy-MM-dd'), quantity: 100 }],
  },
  {
    id: PRODUCT_IDS.FELINE_FINE,
    name: 'Feline Fine Cat Treats',
    category: 'Medicines & Pet Foods',
    batchNumber: 'FFCT2024B',
    source: 'Pet Food Inc.',
    stockInHand: 180,
    itemsSold: 20,
    price: 350,
    expiryDate: format(addDays(new Date(), 180), 'yyyy-MM-dd'),
    receivedLog: [{ date: format(subDays(new Date(), 60), 'yyyy-MM-dd'), quantity: 200 }],
  },
  {
    id: PRODUCT_IDS.RABIES_VAC,
    name: 'Rabies Vaccine (1-year)',
    category: 'Vaccines',
    batchNumber: 'RABVAC25A',
    source: 'Vet Pharma',
    stockInHand: 42,
    itemsSold: 8,
    price: 800,
    expiryDate: format(addDays(new Date(), 730), 'yyyy-MM-dd'),
    receivedLog: [{ date: format(subDays(new Date(), 20), 'yyyy-MM-dd'), quantity: 50 }],
  },
  {
    id: PRODUCT_IDS.LEPTO_VAC,
    name: 'Leptospirosis Vaccine',
    category: 'Vaccines',
    batchNumber: 'LEPVAC25B',
    source: 'Vet Pharma',
    stockInHand: 45,
    itemsSold: 5,
    price: 650,
    expiryDate: format(addDays(new Date(), 25), 'yyyy-MM-dd'), // Expiring soon
    receivedLog: [{ date: format(subDays(new Date(), 20), 'yyyy-MM-dd'), quantity: 50 }],
  },
  {
    id: PRODUCT_IDS.PET_CARRIER,
    name: 'Deluxe Pet Carrier',
    category: 'Accessories',
    batchNumber: 'DPCAR24A',
    source: 'Happy Pets Gear',
    stockInHand: 27,
    itemsSold: 3,
    price: 2500,
    receivedLog: [{ date: format(subDays(new Date(), 90), 'yyyy-MM-dd'), quantity: 30 }],
  },
  {
    id: PRODUCT_IDS.CHEW_TOY,
    name: 'Durable Chew Toy',
    category: 'Accessories',
    batchNumber: 'DCTOY24B',
    source: 'Happy Pets Gear',
    stockInHand: 88,
    itemsSold: 12,
    price: 400,
    receivedLog: [{ date: format(subDays(new Date(), 15), 'yyyy-MM-dd'), quantity: 100 }],
  },
  {
    id: PRODUCT_IDS.FLEA_TICK_MED,
    name: 'Flea & Tick Prevention',
    category: 'Medicines & Pet Foods',
    batchNumber: 'FTP2024C',
    source: 'Vet Pharma',
    stockInHand: 55,
    itemsSold: 5,
    price: 950,
    expiryDate: format(addDays(new Date(), 400), 'yyyy-MM-dd'),
    receivedLog: [{ date: format(subDays(new Date(), 35), 'yyyy-MM-dd'), quantity: 60 }],
  },
  {
    id: PRODUCT_IDS.VITAMIN_DROPS,
    name: 'Multi-Vitamin Drops',
    category: 'Medicines & Pet Foods',
    batchNumber: 'MVD2024D',
    source: 'Vet Pharma',
    stockInHand: 68,
    itemsSold: 7,
    price: 550,
    expiryDate: format(addDays(new Date(), 15), 'yyyy-MM-dd'), // Expiring soon
    receivedLog: [{ date: format(subDays(new Date(), 40), 'yyyy-MM-dd'), quantity: 75 }],
  },
   {
    id: PRODUCT_IDS.GROOM_BRUSH,
    name: 'Grooming Brush',
    category: 'Accessories',
    batchNumber: 'GRB24C',
    source: 'Happy Pets Gear',
    stockInHand: 35,
    itemsSold: 15,
    price: 700,
    receivedLog: [{ date: format(subDays(new Date(), 10), 'yyyy-MM-dd'), quantity: 50 }],
  },
   {
    id: PRODUCT_IDS.NAIL_CLIPPERS,
    name: 'Nail Clippers',
    category: 'Accessories',
    batchNumber: 'NLC24D',
    source: 'Happy Pets Gear',
    stockInHand: 42,
    itemsSold: 8,
    price: 600,
    receivedLog: [{ date: format(subDays(new Date(), 25), 'yyyy-MM-dd'), quantity: 50 }],
  },
];


// --- SALES ---
// A record of historical sales.
const salesToSeed: Omit<Sale, 'id'>[] = [
  // Today's Sales
  { productId: PRODUCT_IDS.CANINE_PLUS, productName: 'Canine Plus Dog Food', customerName: 'Ravi Kumar', quantity: 1, saleDate: format(new Date(), 'yyyy-MM-dd'), totalAmount: 1500 * 1 },
  { productId: PRODUCT_IDS.CHEW_TOY, productName: 'Durable Chew Toy', customerName: 'Priya Sharma', quantity: 2, saleDate: format(new Date(), 'yyyy-MM-dd'), totalAmount: 400 * 2 },

  // Yesterday's Sales
  { productId: PRODUCT_IDS.FELINE_FINE, productName: 'Feline Fine Cat Treats', customerName: 'Anjali Verma', quantity: 3, saleDate: format(subDays(new Date(), 1), 'yyyy-MM-dd'), totalAmount: 350 * 3 },
  { productId: PRODUCT_IDS.RABIES_VAC, productName: 'Rabies Vaccine (1-year)', customerName: 'Suresh Gupta', quantity: 1, saleDate: format(subDays(new Date(), 1), 'yyyy-MM-dd'), totalAmount: 800 * 1 },
  { productId: PRODUCT_IDS.GROOM_BRUSH, productName: 'Grooming Brush', customerName: 'Anjali Verma', quantity: 1, saleDate: format(subDays(new Date(), 1), 'yyyy-MM-dd'), totalAmount: 700 * 1 },

  // Sales from the last 30 days
  { productId: PRODUCT_IDS.CANINE_PLUS, productName: 'Canine Plus Dog Food', customerName: 'Amit Singh', quantity: 5, saleDate: format(subDays(new Date(), 3), 'yyyy-MM-dd'), totalAmount: 1500 * 5 },
  { productId: PRODUCT_IDS.PET_CARRIER, productName: 'Deluxe Pet Carrier', customerName: 'Sunita Rao', quantity: 1, saleDate: format(subDays(new Date(), 4), 'yyyy-MM-dd'), totalAmount: 2500 * 1 },
  { productId: PRODUCT_IDS.NAIL_CLIPPERS, productName: 'Nail Clippers', customerName: 'Vikram Mehta', quantity: 1, saleDate: format(subDays(new Date(), 5), 'yyyy-MM-dd'), totalAmount: 600 * 1 },
  { productId: PRODUCT_IDS.FELINE_FINE, productName: 'Feline Fine Cat Treats', customerName: 'Rina Desai', quantity: 10, saleDate: format(subDays(new Date(), 6), 'yyyy-MM-dd'), totalAmount: 350 * 10 },
  { productId: PRODUCT_IDS.LEPTO_VAC, productName: 'Leptospirosis Vaccine', customerName: 'Deepak Kumar', quantity: 2, saleDate: format(subDays(new Date(), 7), 'yyyy-MM-dd'), totalAmount: 650 * 2 },
  { productId: PRODUCT_IDS.CHEW_TOY, productName: 'Durable Chew Toy', customerName: 'Amit Singh', quantity: 5, saleDate: format(subDays(new Date(), 8), 'yyyy-MM-dd'), totalAmount: 400 * 5 },
  { productId: PRODUCT_IDS.VITAMIN_DROPS, productName: 'Multi-Vitamin Drops', customerName: 'Priya Sharma', quantity: 2, saleDate: format(subDays(new Date(), 9), 'yyyy-MM-dd'), totalAmount: 550 * 2 },
  { productId: PRODUCT_IDS.FLEA_TICK_MED, productName: 'Flea & Tick Prevention', customerName: 'Ravi Kumar', quantity: 1, saleDate: format(subDays(new Date(), 10), 'yyyy-MM-dd'), totalAmount: 950 * 1 },
  { productId: PRODUCT_IDS.GROOM_BRUSH, productName: 'Grooming Brush', customerName: 'Sunita Rao', quantity: 3, saleDate: format(subDays(new Date(), 12), 'yyyy-MM-dd'), totalAmount: 700 * 3 },
  { productId: PRODUCT_IDS.CANINE_PLUS, productName: 'Canine Plus Dog Food', customerName: 'Vikram Mehta', quantity: 3, saleDate: format(subDays(new Date(), 15), 'yyyy-MM-dd'), totalAmount: 1500 * 3 },
  { productId: PRODUCT_IDS.RABIES_VAC, productName: 'Rabies Vaccine (1-year)', customerName: 'Rina Desai', quantity: 5, saleDate: format(subDays(new Date(), 18), 'yyyy-MM-dd'), totalAmount: 800 * 5 },
  { productId: PRODUCT_IDS.FELINE_FINE, productName: 'Feline Fine Cat Treats', customerName: 'Suresh Gupta', quantity: 5, saleDate: format(subDays(new Date(), 20), 'yyyy-MM-dd'), totalAmount: 350 * 5 },
  { productId: PRODUCT_IDS.NAIL_CLIPPERS, productName: 'Nail Clippers', customerName: 'Deepak Kumar', quantity: 4, saleDate: format(subDays(new Date(), 22), 'yyyy-MM-dd'), totalAmount: 600 * 4 },
  { productId: PRODUCT_IDS.CHEW_TOY, productName: 'Durable Chew Toy', customerName: 'Anjali Verma', quantity: 5, saleDate: format(subDays(new Date(), 25), 'yyyy-MM-dd'), totalAmount: 400 * 5 },
  { productId: PRODUCT_IDS.PET_CARRIER, productName: 'Deluxe Pet Carrier', customerName: 'Amit Singh', quantity: 2, saleDate: format(subDays(new Date(), 28), 'yyyy-MM-dd'), totalAmount: 2500 * 2 },
];


// --- CUSTOMERS ---
const customersToSeed: Omit<Customer, 'id'>[] = [
  {
    name: 'Ravi Kumar',
    phoneNumber: '9876543210',
    whatsappNumber: '9876543210',
    email: 'ravi.k@example.com',
    pets: [
      { species: 'Dog', breed: 'Labrador Retriever', count: 1 },
    ]
  },
  {
    name: 'Priya Sharma',
    phoneNumber: '9876543211',
    email: 'priya.s@example.com',
    pets: [
      { species: 'Cat', breed: 'Siamese', count: 2 },
      { species: 'Dog', breed: 'Golden Retriever', count: 1 }
    ]
  },
  {
    name: 'Anjali Verma',
    phoneNumber: '9876543212',
    whatsappNumber: '9876543212',
    email: 'anjali.v@example.com',
    pets: [
      { species: 'Cat', breed: 'Persian', count: 1 },
    ]
  },
  {
    name: 'Suresh Gupta',
    phoneNumber: '9876543213',
    pets: [
      { species: 'Dog', breed: 'German Shepherd', count: 1 },
    ]
  },
  {
    name: 'Amit Singh',
    phoneNumber: '9876543214',
    email: 'amit.s@example.com',
    pets: [
        { species: 'Dog', breed: 'Pug', count: 2 }
    ]
  },
  {
    name: 'Sunita Rao',
    phoneNumber: '9876543215',
    pets: [
        { species: 'Dog', breed: 'Beagle', count: 1 }
    ]
  },
    {
    name: 'Vikram Mehta',
    phoneNumber: '9876543216',
    email: 'vikram.m@example.com',
    pets: [
        { species: 'Parrot', breed: 'Macaw', count: 2 }
    ]
  },
  {
    name: 'Rina Desai',
    phoneNumber: '9876543217',
    pets: [
        { species: 'Cat', breed: 'Maine Coon', count: 1 }
    ]
  },
  {
    name: 'Deepak Kumar',
    phoneNumber: '9876543218',
    whatsappNumber: '9876543218',
    pets: [
        { species: 'Rabbit', breed: 'Holland Lop', count: 3 }
    ]
  }
];

export async function seedDatabase(db: Firestore) {
  const batch = writeBatch(db);

  // Set Products
  productsToSeed.forEach(product => {
    const { id, ...productData } = product;
    const docRef = doc(db, 'products', id);
    batch.set(docRef, productData);
  });

  // Set Sales
  salesToSeed.forEach(sale => {
    const docRef = doc(collection(db, 'sales'));
    batch.set(docRef, sale);
  });

  // Set Customers
  customersToSeed.forEach(customer => {
    const docRef = doc(collection(db, 'customers'));
    batch.set(docRef, customer);
  });

  try {
    await batch.commit();
    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw new Error('Failed to seed database.');
  }
}
