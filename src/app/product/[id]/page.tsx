import type { Metadata } from "next";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ProductDetails } from "./ProductDetails";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { id } = await params;
    const snap = await getDoc(doc(db, "products", id));

    if (!snap.exists()) {
      return {
        title: "Product Not Found | FarmX",
        description: "This product could not be found.",
      };
    }

    const product = snap.data();
    const name = product.name ?? "Fresh Product";
    const description = product.description
      ? product.description.slice(0, 155)
      : `Buy fresh ${name} directly from verified farmers on FarmX. ₹${product.price}${product.unit ? "/" + product.unit : ""}.`;
    const image = product.image ?? product.images?.[0] ?? null;

    return {
      title: `${name} | FarmX`,
      description,
      openGraph: {
        title: `${name} | FarmX`,
        description,
        ...(image && { images: [{ url: image, width: 800, height: 600, alt: name }] }),
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: `${name} | FarmX`,
        description,
        ...(image && { images: [image] }),
      },
    };
  } catch {
    return {
      title: "FarmX – Fresh Direct from Farmers",
      description: "Buy fresh farm products directly from verified farmers.",
    };
  }
}

export default function Page(props: Props) {
  return <ProductDetails {...props} />;
}
