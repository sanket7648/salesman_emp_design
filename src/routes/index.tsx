import { createFileRoute } from "@tanstack/react-router";
import { SalesPortal } from "@/components/sales-portal";

// The home route ships no og:image, so serve-time hosting can inject the
// project's social preview (explicit og:image or latest screenshot).
export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Nestni Sales Portal" },
      { name: "description", content: "Nestni salesperson and administration portal preview." },
      { property: "og:title", content: "Nestni Sales Portal" },
      { property: "og:description", content: "Nestni salesperson and administration portal preview." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function Index() {
  return <SalesPortal />;
}
