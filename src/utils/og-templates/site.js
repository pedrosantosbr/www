import satori from "satori";
import { SITE } from "@/config";
import loadGoogleFonts from "../loadGoogleFont";
import { C, h, label, hostname, profilePhoto } from "./paper";

const FOCUS = ["AI", "Healthcare", "Data"];

export default async () => {
  const photo = await profilePhoto();
  const host = hostname(SITE.website);

  return satori(
    h(
      "div",
      {
        width: "100%",
        height: "100%",
        background: C.ground,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      },
      [
        {
          type: "img",
          props: {
            src: photo,
            width: 180,
            height: 180,
            style: {
              borderRadius: 9999,
              border: `2px solid ${C.rule}`,
              padding: 6,
            },
          },
        },
        h(
          "div",
          {
            marginTop: 28,
            fontFamily: "Fira Sans",
            fontSize: 32,
            color: C.soft,
          },
          SITE.title
        ),
        h(
          "div",
          {
            fontFamily: "Literata",
            fontWeight: 700,
            fontSize: 104,
            lineHeight: 1.05,
            letterSpacing: "-0.015em",
            color: C.ink,
          },
          "Builder."
        ),
        h(
          "div",
          {
            marginTop: 28,
            padding: "14px 6px",
            borderTop: `2px solid ${C.rule}`,
            borderBottom: `2px solid ${C.rule}`,
            alignItems: "center",
            gap: 22,
          },
          FOCUS.flatMap((item, i) => [
            ...(i > 0 ? [label("•", { color: C.accent })] : []),
            label(item),
          ])
        ),
        label(host, {
          position: "absolute",
          bottom: 36,
          fontSize: 18,
        }),
      ]
    ),
    {
      width: 1200,
      height: 630,
      embedFont: true,
      fonts: await loadGoogleFonts(
        SITE.title + "Builder." + FOCUS.join("") + host
      ),
    }
  );
};
