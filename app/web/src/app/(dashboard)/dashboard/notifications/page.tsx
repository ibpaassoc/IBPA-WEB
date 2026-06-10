"use client";

import { UnderDevelopmentPage } from "@/shared/components/UnderDevelopment";
import { useI18n } from "@/lib/i18n";

export default function NotificationsPage() {
  const { t } = useI18n();

  return (
    <UnderDevelopmentPage
      title={t.dashboard.notifications.title}
      description={t.dashboard.notifications.description}
      expectedLabel={t.dashboard.notifications.expectedLabel}
      backLabel={t.dashboard.notifications.backLabel}
      notifyLabel={t.dashboard.notifications.notifyLabel}
      items={t.dashboard.notifications.items}
    />
  );
}
