import { breadcrumbJsonLd, serializeJsonLd, type JsonLdObject } from "@/lib/seo/json-ld";

/** Renders one JSON-LD block into the server-rendered HTML. */
export function JsonLd({ data }: { data: JsonLdObject | readonly JsonLdObject[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}

/** BreadcrumbList for a top-level page: Home > {page}. */
export function BreadcrumbJsonLd({ page }: { page: { path: string; breadcrumb: string } }) {
  return <JsonLd data={breadcrumbJsonLd([{ name: page.breadcrumb, path: page.path }])} />;
}
