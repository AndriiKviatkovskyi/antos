export const formatApt = (octas: string | number) => {
  const value = Number(octas) / 1e8;
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });
};

export const fromOctas = (octas?: string | number) =>
  octas ? (Number(octas) / 1e8).toString() : "0";

export const toOctas = (apt: string | number) =>
  Math.floor(Number(apt || 0) * 1e8);
