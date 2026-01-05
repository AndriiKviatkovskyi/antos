import { useState } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";

export function Onboarding({ onComplete }: { onComplete: () => void }) {
  const { account, signMessage } = useWallet();
  const [form, setForm] = useState({ nickname: "", bio: "", pfp: "" });
  const [error, setError] = useState("");

  const handleRegister = async () => {
    if (!account || !signMessage) return;
    if (form.nickname.length < 3) {
      setError("Nickname must be at least 3 characters.");
      return;
    }

    try {
      const message = `Registering nickname: ${form.nickname}`;
      const response: any = await signMessage({ message, nonce: "1" });
      
      const rawData = response.signature?.data?.data || response.signature?.data || response.signature;
      const sigStr = Array.from(new Uint8Array(rawData)).map(b => b.toString(16).padStart(2, '0')).join('');

      const res = await fetch("http://localhost:3001/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: account.address.toString(),
          nickname: form.nickname,
          bio: form.bio,
          pfp: form.pfp,
          signature: `0x${sigStr}`,
          publicKey: account.publicKey?.toString(), 
        }),
      });

      if (res.ok) onComplete();
      else setError("Username taken or server error.");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100">
        <h2 className="text-3xl font-black mb-2">Create Profile</h2>
        <p className="text-slate-400 mb-8 text-sm">Tell the world who you are on-chain.</p>
        
        <div className="space-y-4">
          <div>
            <label className="text-xs font-black uppercase text-slate-400 ml-1">Nickname *</label>
            <input 
              className="w-full bg-slate-50 border-2 border-transparent p-4 rounded-2xl focus:border-blue-500 outline-none transition-all" 
              placeholder="Vitalik"
              value={form.nickname}
              onChange={(e) => setForm({...form, nickname: e.target.value})}
            />
          </div>
          <div>
            <label className="text-xs font-black uppercase text-slate-400 ml-1">Bio (Optional)</label>
            <textarea 
              className="w-full bg-slate-50 border-2 border-transparent p-4 rounded-2xl focus:border-blue-500 outline-none transition-all" 
              placeholder="Building the future..."
              onChange={(e) => setForm({...form, bio: e.target.value})}
            />
          </div>
        </div>

        {error && <p className="text-red-500 text-xs mt-4">{error}</p>}
        
        <button 
          onClick={handleRegister} 
          className="w-full mt-8 bg-blue-600 text-white font-black py-5 rounded-2xl hover:bg-blue-700 hover:-translate-y-1 transition-all shadow-xl shadow-blue-200"
        >
          Sign & Create
        </button>
      </div>
    </div>
  );
}