import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";

export default getRequestConfig(async () => {
  // Prefer cookie, fall back to accept-language header
  const store = await cookies();
  const cookieLocale = store.get("locale")?.value;

  if (cookieLocale) {
    const locale = cookieLocale;
    return {
      locale,
      messages: (await import(`../messages/${locale}.json`)).default,
    };
  }

  const headerStore = await headers();
  const header = headerStore.get("accept-language") || "";
  const preferred = header.split(",")[0]?.split("-")[0] || "en";
  const locale = preferred === "si" ? "si" : "en";

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
