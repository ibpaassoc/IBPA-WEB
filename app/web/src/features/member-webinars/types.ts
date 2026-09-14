export type MemberSubtitleLanguage = "ru" | "en";

export type MemberWebinar = {
  id: string;
  title: string;
  recordedAt: string;
  durationSeconds: number;
  publishedAt: string | null;
  subtitleLanguages: MemberSubtitleLanguage[];
};
