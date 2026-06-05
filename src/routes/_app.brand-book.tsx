import { createFileRoute } from "@tanstack/react-router";
import BrandBook from "@/design/BrandBook";

export const Route = createFileRoute("/_app/brand-book")({
  head: () => ({ meta: [{ title: "Brand book — +QAmigo" }] }),
  component: BrandBook,
});