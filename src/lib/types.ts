export type Category = "Medicines & Pet Foods" | "Vaccines" | "Accessories";

export type Product = {
  id: string;
  name: string;
  category: Category;
  batchNumber: string;
  source?: string;
  stockInHand: number;
  itemsSold: number;
  price: number;
  expiryDate?: string; // YYYY-MM-DD
  receivedLog: { date: string; quantity: number }[];
};

export type Sale = {
  id: string;
  productId: string;
  productName: string;
  customerName: string;
  quantity: number;
  saleDate: string; // YYYY-MM-DD
  totalAmount: number;
};

export type Pet = {
  species: string;
  breed: string;
  count: number;
};

export type Customer = {
  id: string;
  name: string;
  phoneNumber: string;
  whatsappNumber?: string;
  email?: string;
  pets: Pet[];
};
