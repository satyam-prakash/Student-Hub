// Category and Subcategory configuration
export const CATEGORIES_WITH_SUBCATEGORIES = [
  {
    category: "Food",
    subcategories: ["Groceries", "Dining Out", "Snacks", "Beverages"]
  },
  {
    category: "Transportation",
    subcategories: ["Fuel", "Public Transport", "Taxi/Ride Share", "Parking", "Toll"]
  },
  {
    category: "Bills",
    subcategories: ["Electricity", "Water", "Gas", "Internet", "Mobile Recharge"]
  },
  {
    category: "Shopping",
    subcategories: ["Clothing", "Electronics", "Accessories", "Home Items"]
  },
  {
    category: "Health",
    subcategories: ["Medicines", "Doctor Visits", "Lab Tests", "Health Insurance"]
  },
  {
    category: "Entertainment",
    subcategories: ["Movies", "Games", "Events", "Streaming Subscriptions"]
  },
  {
    category: "Travel",
    subcategories: ["Flights", "Hotels", "Local Transport", "Travel Food"]
  },
  {
    category: "Education",
    subcategories: ["Courses", "Books", "Exam Fees", "Certifications"]
  },
  {
    category: "Utilities",
    subcategories: ["House Maintenance", "Cleaning", "Repairs"]
  },
  {
    category: "Finance",
    subcategories: ["Rent", "Loan EMI", "Insurance", "Taxes", "Investments"]
  },
  {
    category: "Personal Care",
    subcategories: ["Salon", "Skincare", "Grooming", "Fitness"]
  },
  {
    category: "Digital",
    subcategories: ["Apps", "Software", "Cloud Storage", "Online Services"]
  },
  {
    category: "Family",
    subcategories: ["Household Support", "Children Expenses", "Elder Care"]
  },
  {
    category: "Gifts & Donations",
    subcategories: ["Gifts", "Charity", "Festivals"]
  },
  {
    category: "Pets",
    subcategories: ["Food", "Vet", "Accessories"]
  },
  {
    category: "Other",
    subcategories: ["Miscellaneous"]
  }
];

// Helper function to get subcategories for a category
export function getSubcategories(category) {
  const cat = CATEGORIES_WITH_SUBCATEGORIES.find(c => c.category === category);
  return cat ? cat.subcategories : [];
}

// Get all category names
export const CATEGORY_NAMES = CATEGORIES_WITH_SUBCATEGORIES.map(c => c.category);
