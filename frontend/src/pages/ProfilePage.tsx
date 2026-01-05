import { useState, useEffect } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { profileStyles as s } from "../styles/componentStyles";

export function ProfilePage() {
  const { account } = useWallet();
  const [form, setForm] = useState({ nickname: "", bio: "", pfp: "" });
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (account) {
      fetch(`http://localhost:3001/api/user/${account.address}`)
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
      const res = await fetch(`http://localhost:3001/api/user/${account?.address}`, {
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
    <div className={s.container}>
      <h2 className={s.title}>Profile Settings</h2>
      <div className={s.formStack}>
        {/* Avatar / PFP Section */}
        <div className={s.avatarSection}>
          <div className={s.avatarBox}>
            {form.pfp && <img src={form.pfp} className={s.avatarImg} alt="Profile" />}
          </div>
          <input 
            className={s.pfpInput} 
            placeholder="PFP URL" 
            value={form.pfp} 
            onChange={e => setForm({...form, pfp: e.target.value})} 
          />
        </div>

        {/* Nickname Input */}
        <input 
          className={s.input} 
          placeholder="Nickname" 
          value={form.nickname} 
          onChange={e => setForm({...form, nickname: e.target.value})} 
        />

        {/* Bio Textarea */}
        <textarea 
          className={s.textarea} 
          placeholder="Bio" 
          value={form.bio} 
          onChange={e => setForm({...form, bio: e.target.value})} 
        />

        {/* Submit Action */}
        <button onClick={handleUpdate} className={s.submitBtn}>
          Save Changes
        </button>

        {status && <p className={s.statusText}>{status}</p>}
      </div>
    </div>
  );
}