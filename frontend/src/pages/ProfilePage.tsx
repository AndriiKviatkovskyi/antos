import { useState, useEffect } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { profileStyles as s } from "../styles/componentStyles";
import { API_BASE } from "../constants";

export function ProfilePage() {
  const { account } = useWallet();
  const [form, setForm] = useState({ nickname: "", bio: "", pfp: "" });
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (account) {
      fetch(`${API_BASE}/user/${account.address}`)
        .then(res => res.json())
        .then(data => setForm({
          nickname: data.nickname || "",
          bio: data.bio || "",
          pfp: data.pfp || ""
        }));
    }
  }, [account]);

  const handleUpdate = async () => {
    setStatus("Saving...");
    try {
      const res = await fetch(`${API_BASE}/user/${account?.address}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setStatus(res.ok ? "Profile updated!" : "Update failed.");
    } catch {
      setStatus("Server error.");
    }
  };

  return (
    <div style={s.container}>
      <h2 style={s.title}>Profile Settings</h2>
      <div style={s.formStack}>
        {/* Avatar / PFP Section */}
        <div style={s.avatarSection}>
          <div style={s.avatarBox}>
            {form.pfp && <img src={form.pfp} style={s.avatarImg} alt="Profile" />}
          </div>
          <input 
            style={s.pfpInput} 
            placeholder="PFP URL" 
            value={form.pfp} 
            onChange={e => setForm({...form, pfp: e.target.value})} 
          />
        </div>

        {/* Nickname Input */}
        <input 
          style={s.input} 
          placeholder="Nickname" 
          value={form.nickname} 
          onChange={e => setForm({...form, nickname: e.target.value})} 
        />

        {/* Bio Textarea */}
        <textarea 
          style={s.textarea} 
          placeholder="Bio" 
          value={form.bio} 
          onChange={e => setForm({...form, bio: e.target.value})} 
        />

        {/* Submit Action */}
        <button onClick={handleUpdate} style={s.submitBtn}>
          Save Changes
        </button>

        {status && <p style={s.statusText}>{status}</p>}
      </div>
    </div>
  );
}