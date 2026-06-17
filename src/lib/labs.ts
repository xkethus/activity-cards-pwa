export const LAB_OPTIONS = [
  "Laboratorio de Realidad Virtual y Videojuegos",
  "Laboratorio de Gráfica Digital",
  "Laboratorio de Audio",
  "Laboratorio de Robótica e Interfaces Electrónicas",
  "Laboratorio de Investigación",
  "Laboratorio de Imágenes en Movimiento",
  "Laboratorio de Publicaciones Digitales y Sistemas Interactivos",
];

export const PLACE_OPTIONS = [
  "Sala Mac",
  "Sala PC",
  "Área Común (PICNIC)",
  "Galería Manuel Felguerez",
  "Foro Negro",
  "Foro Blanco",
  "Varios",
  "Otros",
] as const;

export type PlaceOption = (typeof PLACE_OPTIONS)[number];

/** Valores que activan un campo de texto adicional */
export const PLACE_NEEDS_DESC: PlaceOption[] = ["Varios", "Otros"];

/** Separador entre la opción y su descripción al guardar */
export const PLACE_SEP = " — ";

/** Extrae la opción base y la descripción de un valor guardado */
export function parsePlaceValue(value: string): { base: string; desc: string } {
  for (const opt of PLACE_NEEDS_DESC) {
    if (value === opt) return { base: opt, desc: "" };
    if (value.startsWith(opt + PLACE_SEP)) return { base: opt, desc: value.slice(opt.length + PLACE_SEP.length) };
  }
  return { base: value, desc: "" };
}
