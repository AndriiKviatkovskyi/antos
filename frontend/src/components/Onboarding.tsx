import { useState } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";

export function Onboarding({ onComplete }: { onComplete: () => void }) {
  const { account, signMessage } = useWallet();
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");

  const handleRegister = async () => {
    if (!account || !signMessage) return;
    if (nickname.length < 3) return setError("Nickname too short");

    try {
      const message = `Registering nickname: ${nickname}`;
      const response = await signMessage({ message, nonce: "1" });

      const res = await fetch("http://localhost:3001/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: account.address,
          nickname,
          signature: response.signature,
          publicKey: account.publicKey,
        }),
      });

      if (res.status === 409) return setError("Nickname already taken!");
      if (res.ok) onComplete();
      else setError("Server error during registration");

    } catch (err) {
      setError("Signature rejected or failed.");
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