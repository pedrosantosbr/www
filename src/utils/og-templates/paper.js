// Shared bits for the Paper OG templates (light palette from global.css)
import { readFile } from "node:fs/promises";
import sharp from "sharp";

export const C = {
  ground: "#f7f5ef",
  sheet: "#efece3",
  ink: "#17160f",
  soft: "#403e35",
  subtle: "#6a675c",
  rule: "rgba(23,22,15,0.13)",
  accent: "#b32b19",
};

export const h = (type, style, children) => ({
  type,
  props: { style: { display: "flex", ...style }, children },
});

export const label = (text, style = {}) =>
  h(
    "div",
    {
      fontFamily: "Fira Code",
      fontSize: 22,
      letterSpacing: "0.14em",
      textTransform: "uppercase",
      color: C.subtle,
      ...style,
    },
    text
  );

export const hostname = website => new URL(website).hostname;

let photo;
/** Profile photo as a square PNG data URI (cropped toward the face). */
export async function profilePhoto() {
  if (!photo) {
    const src = await readFile("src/assets/images/pedro-profile.png");
    const png = await sharp(src)
      .resize(360, 360, { fit: "cover", position: "north" })
      .png()
      .toBuffer();
    photo = `data:image/png;base64,${png.toString("base64")}`;
  }
  return photo;
}
