import { API_BASE } from "../constants";

export const fetchNicknameByAddress = async (address: string): Promise<string | null> => {
  try {
    const res = await fetch(`${API_BASE}/user/${address}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.nickname || null;
  } catch (error) {
    console.error("Error fetching nickname:", error);
    return null;
  }
};