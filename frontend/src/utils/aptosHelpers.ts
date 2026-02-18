export const hexToString = (hex: string) => {
  try {
    const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
    if (!cleanHex) return "";
    return new TextDecoder().decode(
      new Uint8Array(
        cleanHex.match(/.{1,2}/g)!.map((b) => parseInt(b, 16))
      )
    );
  } catch {
    return hex;
  }
};

export const bytesToHex = (bytes: Uint8Array) =>
  "0x" +
  Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
