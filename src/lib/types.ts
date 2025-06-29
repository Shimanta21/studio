export type Category = "Medicines & Pet Foods" | "Vaccines" | "Accessories";

export type SubCategory = "Canine" | "Poultry" | "Misc" | "Expiry" | "Non-expiry";

export type Product = {
  id: string;
  name: string;
  category: Category;
  subCategory: SubCategory;
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
  quantity: number;
  saleDate: string; // YYYY-MM-DD
  totalAmount: number;
};
