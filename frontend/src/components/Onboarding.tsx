import { useState } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { onboardingStyles as s } from "../styles/componentStyles";

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
      const sigStr = Array.from(new Uint8Array(rawData))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

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
    <div className={s.container}>
      <div className={s.card}>
        <h2 className={s.title}>Create Profile</h2>
        <p className={s.subtitle}>Tell the world who you are on-chain.</p>
        
        <div className={s.formStack}>
          <div>
            <label className={s.label}>Nickname *</label>
            <input 
              className={s.input} 
              placeholder="Vitalik"
              value={form.nickname}
              onChange={(e) => setForm({...form, nickname: e.target.value})}
            />
          </div>
          <div>
            <label className={s.label}>Bio (Optional)</label>
            <textarea 
              className={s.input} 
              placeholder="Building the future..."
              value={form.bio}
              onChange={(e) => setForm({...form, bio: e.target.value})}
            />
          </div>
        </div>

        {error && <p className={s.errorText}>{error}</p>}
        
        <button onClick={handleRegister} className={s.submitBtn}>
          Sign & Create
        </button>
      </div>
    </div>
  );
}