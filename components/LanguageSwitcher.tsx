"use client";

import { useRouter, usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";

export default function LanguageSwitcher() {
  const t = useTranslations("LanguageSwitcher");
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();

  const switchLocale = (newLocale: string) => {
    // Replace the current locale in the pathname with the new one
    const newPathname = pathname.replace(`/${currentLocale}`, `/${newLocale}`);
    router.push(newPathname);
  };

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-muted-foreground">{t("label")}</label>
      <select
        value={currentLocale}
        onChange={(e) => switchLocale(e.target.value)}
        className="rounded px-2 py-1 bg-secondary border border-border"
      >
        <option value="en">{t("english")}</option>
        <option value="si">{t("sinhala")}</option>
      </select>
    </div>
  );
}
