import { useState } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";

export function Onboarding({ onComplete }: { onComplete: () => void }) {
  const { account, signMessage } = useWallet();
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");

  const handleRegister = async () => {
  // 1. Guard clauses: Ensure wallet is connected and state is valid
  if (!account || !signMessage) {
    setError("Wallet not connected correctly.");
    return;
  }

  if (!nickname || nickname.length < 3) {
    setError("Nickname must be at least 3 characters long.");
    return;
  }

  setError(""); // Clear previous errors

  const message = `Registering nickname: ${nickname}`;

  try {
    const response: any = await signMessage({ message, nonce: "1" });

    // 1. Dig into the nested structure you found
    // We check for response.signature.data.data OR response.signature.data
    const rawData = response.signature?.data?.data || response.signature?.data || response.signature;

    if (!rawData) throw new Error("Signature data not found in wallet response");

    // 2. Convert Uint8Array/Array to Hex String
    // This handles both a raw array of numbers and a Uint8Array
    const sigStr = Array.from(new Uint8Array(rawData))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (!sigStr) {
      throw new Error("Failed to retrieve signature from wallet.");
    }

    // 4. Send the payload to your Node.js backend
    const res = await fetch("http://localhost:3001/api/user", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({
        address: account.address,
        nickname: nickname,
        signature: sigStr,
        publicKey: account.publicKey?.toString(), 
      }),
    });

    const data = await res.json();

    // 5. Handle Server Responses
    if (res.ok) {
      console.log("Registration successful:", data);
      onComplete(); // Callback to refresh the view/navigator
    } else {
      // Handle specific errors like 409 (Conflict/Nickname taken)
      setError(data.error || "Registration failed. Please try again.");
    }

  } catch (err: any) {
    console.error("Onboarding Error:", err);
    
    // Check if user rejected the transaction/signature
    if (err.name === "UserRejectedRequestError" || err.message?.includes("rejected")) {
      setError("Signature request was rejected in the wallet.");
    } else {
      setError(err.message || "An unexpected error occurred.");
    }
  } finally {
    console.log("hurray");
  }
};

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-3xl shadow-2xl">
      <h2 className="text-2xl font-bold mb-2">Welcome to the App</h2>
      <p className="text-gray-500 mb-6 text-sm">Please set a unique nickname to continue.</p>
      
      <input 
        className="w-full border-2 border-gray-100 p-3 rounded-xl mb-2 focus:border-blue-500 outline-none transition-all" 
        placeholder="Choose your nickname..."
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
      />
      {error && <p className="text-red-500 text-xs mb-4 px-1">{error}</p>}
      
      <button 
        onClick={handleRegister} 
        className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-200"
      >
        Sign & Create Profile
      </button>
    </div>
  );
}