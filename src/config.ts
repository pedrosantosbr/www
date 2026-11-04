export const SITE = {
  website: "https://www-alpha-bice.vercel.app/", // update if a custom domain is added
  author: "Pedro Santos",
  profile: "https://www.linkedin.com/in/pedro-henrique-souza-santos-920268220/",
  desc: "Builder — AI, Healthcare, Data. Notes on building software for healthcare.",
  title: "Pedro Santos",
  ogImage: "astropaper-og.jpg",
  lightAndDarkMode: true,
  postPerIndex: 4,
  postPerPage: 4,
  scheduledPostMargin: 15 * 60 * 1000, // 15 minutes
  showArchives: true,
  showBackButton: true, // show back button in post detail
  editPost: {
    enabled: true,
    text: "Edit page",
    url: "https://github.com/pedrosantosbr/www/edit/main/",
  },
  dynamicOgImage: true,
  dir: "ltr", // "rtl" | "auto"
  lang: "en", // html lang code. Set this empty and default will be "en"
  timezone: "Europe/Lisbon", // Default global timezone (IANA format) https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
} as const;
