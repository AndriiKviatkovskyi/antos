// src/styles/componentStyles.ts

export const mainStyles = {
  welcomeWrapper: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    minHeight: '100vh', width: '100%', backgroundColor: '#f8fafc', textAlign: 'center' as const, padding: '24px'
  } as const,
  welcomeContainer: { maxWidth: '448px', width: '100%' },
  logoBox: {
    width: '220px',
    margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: '48px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.025em', marginBottom: '24px' },
  walletSelectorWrapper: { display: 'inline-block', padding: '8px', backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', border: '1px solid #f1f5f9' },
  loadingText: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', width: '100%', padding: '40px', textAlign: 'center' as const, fontWeight: 'bold', color: '#94a3b8', fontSize: '20px' },
  pageWrapper: { minHeight: '100vh', width: '100%', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column' as const },
  contentMain: { flex: 1, width: '100%', maxWidth: '1280px', margin: '0 auto', padding: '48px 24px', display: 'flex', flexDirection: 'column' as const, alignItems: 'center' }
};

export const onboardingStyles = {
  container: { minHeight: '100vh', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', backgroundColor: '#f8fafc' },
  card: { maxWidth: '448px', width: '100%', backgroundColor: 'white', padding: '40px', borderRadius: '40px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #f1f5f9' },
  title: { fontSize: '30px', fontWeight: 900, marginBottom: '8px', color: '#0f172a' },
  subtitle: { color: '#94a3b8', marginBottom: '32px', fontSize: '14px' },
  formStack: { display: 'flex', flexDirection: 'column' as const, gap: '16px' },
  label: { fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' as const, color: '#94a3b8', marginLeft: '4px', display: 'block', marginBottom: '4px' },
  input: { width: '100%', backgroundColor: '#f8fafc', border: '2px solid transparent', padding: '16px', borderRadius: '16px', outline: 'none', transition: 'all 0.2s', fontSize: '16px' },
  errorText: { color: '#ef4444', fontSize: '12px', marginTop: '16px', fontWeight: 'bold' },
  submitBtn: { width: '100%', marginTop: '32px', backgroundColor: '#2563eb', color: 'white', fontWeight: 900, padding: '20px', borderRadius: '16px', border: 'none', cursor: 'pointer', boxShadow: '0 20px 25px -5px rgba(59, 130, 246, 0.2)' }
};

export const navStyles = {
  wrapper: { position: 'sticky' as const, top: '16px', zIndex: 50, width: '100%', maxWidth: '1280px', margin: '0 auto', padding: '0 16px' },
  container: { backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', borderRadius: '24px', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  leftSection: { display: 'flex', alignItems: 'center', gap: '32px' },
  logo: { color: '#2563eb', fontWeight: 900, fontSize: '20px', textDecoration: 'none' },
  linkGroup: { display: 'flex', gap: '24px' },
  linkBase: { fontSize: '14px', fontWeight: 'bold', textDecoration: 'none', transition: 'color 0.2s' },
  linkActive: { color: '#2563eb' },
  linkInactive: { color: '#64748b' },
  linkDisabled: { color: '#cbd5e1', fontSize: '14px', fontWeight: 'bold', cursor: 'not-allowed' },
  rightSection: { display: 'flex', alignItems: 'center', gap: '16px' },
  balanceBadge: { backgroundColor: '#eff6ff', padding: '8px 16px', borderRadius: '12px', color: '#1d4ed8', fontWeight: 'bold', fontFamily: 'monospace' },
  logoutBtn: { padding: '8px', color: '#94a3b8', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '9999px' }
};

export const dashboardStyles = {
  card: { width: '100%', maxWidth: '672px', backgroundColor: 'white', padding: '40px', borderRadius: '40px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', textAlign: 'center' as const },
  label: { color: '#94a3b8', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: '12px' },
  balanceText: { fontSize: '60px', fontFamily: 'monospace', fontWeight: 900, color: '#0f172a', margin: 0 },
  unit: { fontSize: '24px', marginLeft: '8px', color: '#2563eb', fontWeight: 900, fontFamily: 'sans-serif' }
};

export const profileStyles = {
  container: { width: '100%', maxWidth: '672px', margin: '0 auto', backgroundColor: 'white', padding: '48px', borderRadius: '48px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #f1f5f9' },
  title: { fontSize: '30px', fontWeight: 900, marginBottom: '32px', color: '#0f172a' },
  formStack: { display: 'flex', flexDirection: 'column' as const, gap: '24px' },
  avatarSection: { display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '24px', border: '1px solid #f1f5f9' },
  avatarBox: { width: '80px', height: '80px', backgroundColor: '#e2e8f0', borderRadius: '16px', overflow: 'hidden', flexShrink: 0, border: '2px solid white' },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' as const },
  pfpInput: { flex: 1, backgroundColor: 'transparent', border: 'none', outline: 'none', fontSize: '14px', color: '#475569' },
  input: { width: '100%', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '16px', border: '2px solid transparent', fontSize: '16px', outline: 'none' },
  textarea: { width: '100%', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '16px', border: '2px solid transparent', fontSize: '16px', height: '160px', outline: 'none', resize: 'none' as const },
  submitBtn: { width: '100%', backgroundColor: '#0f172a', color: 'white', fontWeight: 900, padding: '20px', borderRadius: '16px', border: 'none', cursor: 'pointer', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' },
  statusText: { textAlign: 'center' as const, fontSize: '14px', fontWeight: 900, color: '#2563eb', marginTop: '16px' }
};

export const walletStyles = {
  container: {
    width: "100%",
    padding: "48px",
  },

  pageGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 2fr 1fr",
    gap: "32px",
    alignItems: "start",
  },

  sideBox: {
    backgroundColor: "white",
    borderRadius: "20px",
    padding: "20px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 6px 20px rgba(0,0,0,0.05)",
  },

  sideHeader: {
    fontWeight: 700,
    marginBottom: "16px",
    fontSize: "16px",
  },

  sideBody: {
    fontSize: "14px",
  },

  walletBox: {
    borderRadius: "20px",
    overflow: "hidden",
    border: "1px solid #e2e8f0",
    boxShadow: "0 6px 20px rgba(0,0,0,0.05)",
  },

  walletHeader: {
    padding: "20px",
    color: "white",
  },

  walletHeaderNormal: { backgroundColor: "#1976d2" },
  walletHeaderCharity: { backgroundColor: "#2e7d32" },
  walletHeaderSafe: { backgroundColor: "#6b7280" },

  walletName: { fontSize: "18px", fontWeight: 600 },
  walletAddress: { fontSize: "13px", opacity: 0.9 },

  walletBody: { padding: "20px" },

  ownersHeader: {
    marginTop: "16px",
    cursor: "pointer",
    userSelect: "none" as const,
    fontWeight: 600,
  },

  ownersList: {
    paddingLeft: "20px",
    marginTop: "8px",
  },

  ownerItem: {
    marginBottom: "6px",
    fontFamily: "monospace",
    fontSize: "14px",
  },

  adminStar: {
    marginLeft: "6px",
    color: "#f59e0b",
  },

  primaryButton: {
    backgroundColor: "#2563eb",
    color: "white",
    border: "none",
    padding: "10px 16px",
    borderRadius: "8px",
    cursor: "pointer",
  },

  secondaryButton: {
    backgroundColor: "#e2e8f0",
    border: "none",
    padding: "10px 16px",
    borderRadius: "8px",
    cursor: "pointer",
  },

  modalOverlay: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.4)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },

  modal: {
    backgroundColor: "white",
    padding: "24px",
    borderRadius: "16px",
    width: "400px",
  },

  listsModal: {
    position: "relative" as const,
    backgroundColor: "white",
    padding: "24px",
    borderRadius: "16px",
    width: "60%",
    maxHeight: "80vh",
    marginTop: "6%",
    overflowY: "auto",
  } as React.CSSProperties,

  input: {
    width: "100%",
    padding: "8px",
    marginBottom: "12px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
  },

  select: {
    width: "100%",
    padding: "8px",
    marginBottom: "12px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
  },

  modalButtons: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "12px",
  },

  errorText: {
    color: "red",
    fontSize: "13px",
    marginBottom: "8px",
  },

  statusText: {
    textAlign: "center" as const,
    marginBottom: "20px",
  },
    checkboxRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "10px",
  },

  limitsModal: {
    backgroundColor: "white",
    padding: "32px",
    borderRadius: "20px",
    width: "70%",
    maxWidth: "1000px",
  },

  limitsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "24px",
    marginTop: "24px",
    marginBottom: "24px",
  },

  limitCard: {
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "20px",
    textAlign: "center" as const,
    boxShadow: "0 6px 20px rgba(0,0,0,0.05)",
  },

  proposalsModal: {
    position: "relative" as const,
    backgroundColor: "white",
    padding: "32px",
    borderRadius: "20px",
    width: "85%",
    maxHeight: "85vh",
    height: "70%",
    marginTop: "5%",
    overflowY: "auto",
  } as const,

proposalCard: {
  border: "1px solid #e2e8f0",
  borderRadius: "16px",
  padding: "20px",
  marginBottom: "20px",
  display: "flex",
  justifyContent: "space-between",
  gap: "24px",
  boxShadow: "0 6px 20px rgba(0,0,0,0.05)",
},

closeCross: {
    position: "absolute" as const,
    top: "16px",
    right: "20px",
    fontSize: "28px",
    fontWeight: "bold",
    color: "#dc2626",
    background: "none",
    border: "none",
    cursor: "pointer",
    lineHeight: "1",
    padding: "4px",
    zIndex: 10,
    transition: "transform 0.2s",
  },
};
