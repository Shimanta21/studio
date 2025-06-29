# **App Name**: StockPilot

## Core Features:

- Inventory Master: Categorize inventory items into master categories such as Medicines & Pet Foods, Vaccines (Canine, Poultry, Misc), and Accessories, with sub-categorization by Expiry/Non-expiry type.
- Stock Entry Module: Enable users to add stock per product via a UI form. Include a dropdown or search for existing items, with an option to create a new item if not found.  Automatically update the product's Quantity (credit), Stock in Hand, and creates a log of 'Received on' dates.
- Sales Module: Provide a simple sales form with fields for Date, Product name (dropdown), and Quantity sold.  Automatically update 'No. of items sold', 'Items left', and 'Stock in hand'. Offer an option to edit/correct the last entry.
- Search & Filter: Implement search and filtering capabilities to locate inventory items and sales records efficiently.
- Expiry Notification System: Use a background process to monitor item expiration dates and trigger notifications using an AI tool when items are nearing expiration.
- Daily Sales View: Generate a view to display daily sales data, providing insights into sales trends and inventory turnover.

## Style Guidelines:

- Primary color: Soft Blue (#A0D2EB) for a calm and organized feel, suggesting reliability and trustworthiness.
- Background color: Light Grey (#F0F4F8), desaturated to 20%, providing a neutral backdrop that enhances readability.
- Accent color: Pale Green (#B2EBB2), contrasting with the blue to draw attention to important actions and notifications.
- Body and headline font: 'Inter' sans-serif for a modern and neutral feel.
- Use minimalist, line-style icons to represent inventory categories and actions, ensuring clarity and avoiding visual clutter.
- Implement a clean and structured layout with clear section headings and consistent spacing to facilitate easy navigation and data entry.
- Incorporate subtle animations for loading states and transitions to enhance user experience without being distracting.