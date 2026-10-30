export const brand = {
  color: { orange: "#FF7A00", blue: "#0029FF", ivory: "#FFF5D5" },
  font: { family: '"Glacial Indifference", "Segoe UI", system-ui, sans-serif' },
} as const;
export type Brand = typeof brand;
