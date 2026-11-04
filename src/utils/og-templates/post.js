import satori from "satori";
import { SITE } from "@/config";
import loadGoogleFonts from "../loadGoogleFont";
import { C, h, label, hostname, profilePhoto } from "./paper";

export default async post => {
  const photo = await profilePhoto();
  const host = hostname(SITE.website);
  const { title, category } = post.data;
  const eyebrow = `${SITE.title} · ${category}`;

  return satori(
    h(
      "div",
      {
        width: "100%",
        height: "100%",
        background: C.ground,
        alignItems: "center",
        justifyContent: "center",
      },
      [
        h(
          "div",
          {
            width: 1032,
            height: 500,
            flexDirection: "column",
            justifyContent: "space-between",
          },
          [
            label(eyebrow),
            h(
              "div",
              {
                fontFamily: "Literata",
                fontWeight: 700,
                fontSize: title.length > 60 ? 60 : 72,
                lineHeight: 1.12,
                letterSpacing: "-0.012em",
                color: C.ink,
                width: "100%",
                maxHeight: 340,
                overflow: "hidden",
              },
              title
            ),
            h(
              "div",
              {
                alignItems: "center",
                justifyContent: "space-between",
                borderTop: `2px solid ${C.rule}`,
                paddingTop: 26,
              },
              [
                h("div", { alignItems: "center", gap: 18 }, [
                  {
                    type: "img",
                    props: {
                      src: photo,
                      width: 56,
                      height: 56,
                      style: { borderRadius: 9999 },
                    },
                  },
                  h(
                    "div",
                    { fontFamily: "Fira Sans", fontSize: 28, color: C.ink },
                    SITE.title
                  ),
                ]),
                label(host, { fontSize: 20 }),
              ]
            ),
          ]
        ),
      ]
    ),
    {
      width: 1200,
      height: 630,
      embedFont: true,
      fonts: await loadGoogleFonts(eyebrow + title + SITE.title + host),
    }
  );
};
