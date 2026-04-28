import type { Metadata } from "next";
import { ProductsPage } from "./ProductsPage";

type Props = {
  searchParams: Promise<{ category?: string; search?: string }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { category, search } = await searchParams;

  if (search) {
    return {
      title: `Search: "${search}" | FarmX`,
      description: `Browse farm-fresh results for "${search}" on FarmX. Direct from verified farmers.`,
    };
  }

  if (category) {
    const cap = category.charAt(0).toUpperCase() + category.slice(1);
    return {
      title: `Fresh ${cap} | FarmX`,
      description: `Shop fresh ${cap.toLowerCase()} directly from verified local farmers on FarmX. Best prices, guaranteed quality.`,
      openGraph: {
        title: `Fresh ${cap} | FarmX`,
        description: `Shop fresh ${cap.toLowerCase()} directly from verified local farmers on FarmX.`,
      },
    };
  }

  return {
    title: "All Products | FarmX",
    description:
      "Browse all fresh farm products on FarmX — vegetables, fruits, dairy, grains and more. Sourced directly from verified farmers.",
    openGraph: {
      title: "All Products | FarmX",
      description:
        "Browse all fresh farm products — sourced directly from verified farmers.",
    },
  };
}

export default function Page(props: Props) {
  return <ProductsPage />;
}
