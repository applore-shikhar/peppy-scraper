export interface ProductData {
  productName: string | null;
  productUrl: string | null;
  imageUrl: string | null;       // primary image (first)
  imageUrls: string[];           // all images from this retailer's page
  price: number | null;
  currency: string | null;
  ratings: number | null;
  reviewCount: number | null;
  description: string | null;
  inStock: boolean | null;
  category: string | null;
  broadCategory?: string | null;
  subCategory?: string | null;
}

export type Parser = (htmlOrJson: any, url: string) => ProductData;

// --- Bundled product types ---

export interface RetailerOffer {
  retailerId: string;
  retailerName: string;
  price: number | null;
  currency: string;
  inStock: boolean | null;
  productUrl: string | null;
  imageUrl: string | null;
  ratings: number | null;
  reviewCount: number | null;
}

export interface BundledProduct {
  name: string | null;
  description: string | null;
  category: string;
  broadCategory: string;
  subCategory: string;
  tags: string[];
  images: string[];
  lowestPrice: number | null;
  highestPrice: number | null;
  rating: number | null;
  reviewCount: number | null;
  retailerCount: number;
  retailers: RetailerOffer[];
  embedding?: number[];
}
