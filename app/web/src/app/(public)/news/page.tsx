import { fetchPublicContentServer } from "@/lib/public-content-server";
import { NewsPageClient } from "./NewsPageClient";

export default async function NewsPage() {
  // Rendering the list on the server puts the news items in the HTML that
  // search engines and AI crawlers read, instead of a "Loading news..." state.
  const initialItems = await fetchPublicContentServer("news");

  return <NewsPageClient initialItems={initialItems} />;
}
