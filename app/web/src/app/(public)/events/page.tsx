import { fetchPublicContentServer } from "@/lib/public-content-server";
import { EventsPageClient } from "./EventsPageClient";

export default async function EventsPage() {
  // Rendering the list on the server puts the events in the HTML that search
  // engines and AI crawlers read, instead of only the built-in fallback event.
  const initialItems = await fetchPublicContentServer("events");

  return <EventsPageClient initialItems={initialItems} />;
}
