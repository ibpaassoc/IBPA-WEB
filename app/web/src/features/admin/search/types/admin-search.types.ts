export type AdminSearchResultItem = {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
};

export type AdminSearchGroupKey = "users" | "profiles" | "applications" | "events" | "certificates";

export type AdminSearchGroup = {
  key: AdminSearchGroupKey;
  label: string;
  items: AdminSearchResultItem[];
};
