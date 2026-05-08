// src/styles/componentStyles.ts
import type React from "react";

// ─── Design Tokens ────────────────────────────────────────────────────────────
// Кольорова палітра, відступи та тіні — одне місце для всіх змін

const tokens = {
  // Blues
  blue50:  "#eff6ff",
  blue100: "#dbeafe",
  blue200: "#bfdbfe",
  blue600: "#2563eb",
  blue700: "#1d4ed8",
  blue900: "#1e3a8a",

  // Neutrals
  slate50:  "#f8fafc",
  slate100: "#f1f5f9",
  slate200: "#e2e8f0",
  slate300: "#cbd5e1",
  slate400: "#94a3b8",
  slate500: "#64748b",
  slate600: "#475569",
  slate700: "#334155",
  slate900: "#0f172a",

  // Semantic
  green800: "#2e7d32",
  amber400: "#f59e0b",
  red500:   "#ef4444",
  gray500:  "#6b7280",
  white:    "#ffffff",

  // Shadows
  shadowSm:  "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
  shadowMd:  "0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)",
  shadowLg:  "0 12px 32px rgba(0,0,0,0.10), 0 4px 8px rgba(0,0,0,0.04)",
  shadowXl:  "0 24px 48px rgba(0,0,0,0.14), 0 8px 16px rgba(0,0,0,0.06)",
  shadowBlue:"0 8px 24px rgba(37,99,235,0.20)",

  // Radii
  radiusSm:  "12px",
  radiusMd:  "16px",
  radiusLg:  "24px",
  radiusXl:  "32px",
  radiusFull:"9999px",

  // Transitions
  transition: "all 0.2s ease",
} as const;

// ─── Main / Layout ─────────────────────────────────────────────────────────────

export const mainStyles = {
  welcomeWrapper: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    width: "100%",
    backgroundColor: tokens.slate50,
    textAlign: "center" as const,
    padding: "24px",
  },

  welcomeContainer: {
    maxWidth: "448px",
    width: "100%",
  },

  logoBox: {
    width: "220px",
    margin: "0 auto 12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    fontSize: "48px",
    fontWeight: 900,
    color: tokens.slate900,
    letterSpacing: "-0.03em",
    marginBottom: "24px",
    lineHeight: 1.1,
  },

  titleSmall: {
    fontSize: "24px",
    fontWeight: 900,
    color: tokens.slate900,
    letterSpacing: "-0.03em",
    marginBottom: "24px",
    lineHeight: 1.1,
  },

  walletSelectorWrapper: {
    display: "inline-block",
    padding: "10px",
    backgroundColor: tokens.white,
    borderRadius: tokens.radiusLg,
  },

  loadingText: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    width: "100%",
    padding: "40px",
    textAlign: "center" as const,
    fontWeight: 600,
    color: tokens.slate400,
    fontSize: "18px",
  },

  pageWrapper: {
    minHeight: "100vh",
    width: "100%",
    backgroundColor: tokens.slate50,
    display: "flex",
    flexDirection: "column" as const,
  },

  contentMain: {
    flex: 1,
    width: "100%",
    maxWidth: "1280px",
    margin: "0 auto",
    padding: "48px 24px",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
  },
};

// ─── Onboarding ────────────────────────────────────────────────────────────────

export const onboardingStyles = {
  container: {
    minHeight: "100vh",
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    backgroundColor: tokens.slate50,
  },

  card: {
    maxWidth: "448px",
    width: "100%",
    backgroundColor: tokens.white,
    padding: "48px",
    borderRadius: tokens.radiusXl,
    boxShadow: tokens.shadowXl,
    border: `1px solid ${tokens.slate100}`,
  },

  title: {
    fontSize: "28px",
    fontWeight: 900,
    marginBottom: "6px",
    color: tokens.slate900,
    letterSpacing: "-0.02em",
  },

  subtitle: {
    color: tokens.slate400,
    marginBottom: "32px",
    fontSize: "14px",
    lineHeight: 1.6,
  },

  formStack: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "16px",
  },

  label: {
    fontSize: "11px",
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    color: tokens.slate400,
    marginLeft: "2px",
    display: "block",
    marginBottom: "6px",
  },

  input: {
    width: "100%",
    backgroundColor: tokens.slate50,
    border: `2px solid transparent`,
    padding: "14px 16px",
    borderRadius: tokens.radiusMd,
    outline: "none",
    transition: tokens.transition,
    fontSize: "15px",
    color: tokens.slate900,
  },

  errorText: {
    color: tokens.red500,
    fontSize: "13px",
    marginTop: "12px",
    fontWeight: 600,
  },

  submitBtn: {
    width: "100%",
    marginTop: "32px",
    backgroundColor: tokens.blue600,
    color: tokens.white,
    fontWeight: 700,
    padding: "16px",
    borderRadius: tokens.radiusMd,
    border: "none",
    cursor: "pointer",
    fontSize: "15px",
    boxShadow: tokens.shadowBlue,
    transition: tokens.transition,
  },
};

// ─── Navigation ────────────────────────────────────────────────────────────────

export const navStyles = {
  wrapper: {
    position: "sticky" as const,
    top: "16px",
    zIndex: 50,
    width: "100%",
    maxWidth: "1280px",
    margin: "0 auto",
    padding: "0 16px",
  },

  container: {
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: `1px solid rgba(255,255,255,0.6)`,
    boxShadow: tokens.shadowMd,
    borderRadius: tokens.radiusLg,
    padding: "14px 28px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  leftSection: {
    display: "flex",
    alignItems: "center",
    gap: "28px",
  },

  logo: {
    color: tokens.blue600,
    fontWeight: 900,
    fontSize: "18px",
    textDecoration: "none",
    letterSpacing: "-0.02em",
  },

  linkGroup: {
    display: "flex",
    gap: "20px",
  },

  linkBase: {
    fontSize: "14px",
    fontWeight: 600,
    textDecoration: "none",
    transition: tokens.transition,
  },

  linkActive:   { color: tokens.blue600 },
  linkInactive: { color: tokens.slate500 },

  linkDisabled: {
    color: tokens.slate300,
    fontSize: "14px",
    fontWeight: 600,
    cursor: "not-allowed",
    userSelect: "none" as const,
  },

  rightSection: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  balanceBadge: {
    backgroundColor: tokens.blue50,
    padding: "6px 14px",
    borderRadius: tokens.radiusSm,
    color: tokens.blue700,
    fontWeight: 700,
    fontFamily: "monospace",
    fontSize: "14px",
    border: `1px solid ${tokens.blue100}`,
  },

  logoutBtn: {
    padding: "8px",
    color: tokens.slate400,
    backgroundColor: "transparent",
    border: "none",
    cursor: "pointer",
    borderRadius: tokens.radiusFull,
    transition: tokens.transition,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};

// ─── Dashboard ─────────────────────────────────────────────────────────────────

export const dashboardStyles = {
  card: {
    width: "100%",
    maxWidth: "600px",
    backgroundColor: tokens.white,
    padding: "48px 40px",
    borderRadius: tokens.radiusXl,
    boxShadow: tokens.shadowMd,
    border: `1px solid ${tokens.slate100}`,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    textAlign: "center" as const,
  },

  label: {
    color: tokens.slate400,
    fontSize: "11px",
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.1em",
    marginBottom: "12px",
  },

  balanceText: {
    fontSize: "56px",
    fontFamily: "monospace",
    fontWeight: 900,
    color: tokens.slate900,
    margin: 0,
    lineHeight: 1,
  },

  aboutText: {
    fontSize: "15px",
    color: tokens.slate500,
    lineHeight: 1.7,
    maxWidth: "480px",
    margin: "0 auto",
  },

  unit: {
    fontSize: "22px",
    marginLeft: "8px",
    color: tokens.blue600,
    fontWeight: 700,
    fontFamily: "sans-serif",
  },
};

// ─── Profile ────────────────────────────────────────────────────────────────────

export const profileStyles = {
  container: {
    width: "100%",
    maxWidth: "640px",
    margin: "0 auto",
    backgroundColor: tokens.white,
    padding: "48px",
    borderRadius: tokens.radiusXl,
    boxShadow: tokens.shadowMd,
    border: `1px solid ${tokens.slate100}`,
  },

  title: {
    fontSize: "28px",
    fontWeight: 900,
    marginBottom: "32px",
    color: tokens.slate900,
    letterSpacing: "-0.02em",
  },

  balanceCard: {
    backgroundColor: tokens.blue50,
    border: `1px solid ${tokens.blue100}`,
    borderRadius: tokens.radiusMd,
    padding: "24px 32px",
    marginBottom: "32px",
    textAlign: "center" as const,
  },

  formStack: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "20px",
  },

  avatarSection: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "20px",
    backgroundColor: tokens.slate50,
    borderRadius: tokens.radiusLg,
    border: `1px solid ${tokens.slate100}`,
  },

  avatarBox: {
    width: "72px",
    height: "72px",
    backgroundColor: tokens.slate200,
    borderRadius: tokens.radiusMd,
    overflow: "hidden",
    flexShrink: 0,
    border: `2px solid ${tokens.white}`,
    boxShadow: tokens.shadowSm,
  },

  avatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
  },

  pfpInput: {
    flex: 1,
    backgroundColor: "transparent",
    border: "none",
    outline: "none",
    fontSize: "14px",
    color: tokens.slate600,
  },

  input: {
    width: "100%",
    backgroundColor: tokens.slate50,
    padding: "14px 16px",
    borderRadius: tokens.radiusMd,
    border: `2px solid transparent`,
    fontSize: "15px",
    outline: "none",
    color: tokens.slate900,
    transition: tokens.transition,
  },

  textarea: {
    width: "100%",
    backgroundColor: tokens.slate50,
    padding: "14px 16px",
    borderRadius: tokens.radiusMd,
    border: `2px solid transparent`,
    fontSize: "15px",
    height: "148px",
    outline: "none",
    resize: "none" as const,
    color: tokens.slate900,
    transition: tokens.transition,
  },

  submitBtn: {
    width: "100%",
    backgroundColor: tokens.slate900,
    color: tokens.white,
    fontWeight: 700,
    padding: "16px",
    borderRadius: tokens.radiusMd,
    border: "none",
    cursor: "pointer",
    fontSize: "15px",
    boxShadow: tokens.shadowMd,
    transition: tokens.transition,
  },

  statusText: {
    textAlign: "center" as const,
    fontSize: "14px",
    fontWeight: 700,
    color: tokens.blue600,
    marginTop: "16px",
  },
};

// ─── Wallet ─────────────────────────────────────────────────────────────────────

export const walletStyles = {
  container: {
    width: "100%",
    padding: "48px",
  },

  pageGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 2fr 1fr",
    gap: "28px",
    alignItems: "start",
  },

  // Sidebar
  sideBox: {
    backgroundColor: tokens.white,
    borderRadius: tokens.radiusMd,
    padding: "20px",
    border: `1px solid ${tokens.slate200}`,
    boxShadow: tokens.shadowMd,
  },

  sideHeader: {
    fontWeight: 700,
    marginBottom: "14px",
    fontSize: "15px",
    color: tokens.slate900,
  },

  sideBody: {
    fontSize: "14px",
    color: tokens.slate600,
    lineHeight: 1.6,
  },

  // Wallet card
  walletBox: {
    borderRadius: tokens.radiusMd,
    overflow: "hidden",
    border: `1px solid ${tokens.slate200}`,
    boxShadow: tokens.shadowMd,
  },

  walletHeader: {
    padding: "20px 24px",
    color: tokens.white,
  },

  walletHeaderNormal:  { backgroundColor: "#1976d2" },
  walletHeaderCharity: { backgroundColor: "#2e7d32" },
  walletHeaderSafe:    { backgroundColor: tokens.gray500 },

  walletName: {
    fontSize: "17px",
    fontWeight: 700,
    letterSpacing: "-0.01em",
  },

  walletAddress: {
    fontSize: "13px",
    opacity: 0.85,
    fontFamily: "monospace",
    marginTop: "4px",
  },

  walletBody: {
    padding: "20px 24px",
  },

  ownersHeader: {
    marginTop: "16px",
    cursor: "pointer",
    userSelect: "none" as const,
    fontWeight: 600,
    fontSize: "14px",
    color: tokens.slate600,
  },

  ownersList: {
    paddingLeft: "16px",
    marginTop: "8px",
  },

  ownerItem: {
    marginBottom: "6px",
    fontFamily: "monospace",
    fontSize: "13px",
    color: tokens.slate700 as string,
  } as React.CSSProperties,

  adminStar: {
    marginLeft: "6px",
    color: tokens.amber400,
  },

  // Buttons
  primaryButton: {
    backgroundColor: tokens.blue600,
    color: tokens.white,
    border: "none",
    padding: "10px 18px",
    borderRadius: tokens.radiusSm,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "14px",
    transition: tokens.transition,
  },

  secondaryButton: {
    backgroundColor: tokens.slate100,
    color: tokens.slate700 as string,
    border: "none",
    padding: "10px 18px",
    borderRadius: tokens.radiusSm,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "14px",
    transition: tokens.transition,
  } as React.CSSProperties,

  // Modals
  modalOverlay: {
    position: "fixed" as const,
    inset: 0,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    backdropFilter: "blur(4px)",
    WebkitBackdropFilter: "blur(4px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },

  modal: {
    backgroundColor: tokens.white,
    padding: "32px",
    borderRadius: tokens.radiusLg,
    width: "420px",
    boxShadow: tokens.shadowXl,
    border: `1px solid ${tokens.slate100}`,
  },

  listsModal: {
    position: "relative" as const,
    backgroundColor: tokens.white,
    padding: "32px",
    borderRadius: tokens.radiusLg,
    width: "60%",
    maxHeight: "80vh",
    marginTop: "6%",
    overflowY: "auto",
    boxShadow: tokens.shadowXl,
    border: `1px solid ${tokens.slate100}`,
  } as React.CSSProperties,

  input: {
    width: "100%",
    padding: "10px 12px",
    marginBottom: "12px",
    borderRadius: tokens.radiusSm,
    border: `1.5px solid ${tokens.slate200}`,
    fontSize: "14px",
    outline: "none",
    transition: tokens.transition,
    color: tokens.slate900,
  },

  select: {
    width: "100%",
    padding: "10px 12px",
    marginBottom: "12px",
    borderRadius: tokens.radiusSm,
    border: `1.5px solid ${tokens.slate200}`,
    fontSize: "14px",
    outline: "none",
    backgroundColor: tokens.white,
    color: tokens.slate900,
  },

  modalButtons: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    marginTop: "16px",
  },

  errorText: {
    color: tokens.red500,
    fontSize: "13px",
    marginBottom: "10px",
    fontWeight: 500,
  },

  statusText: {
    textAlign: "center" as const,
    marginBottom: "20px",
    fontSize: "14px",
    color: tokens.slate500,
  },

  checkboxRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "10px",
  },

  // Limits modal
  limitsModal: {
    backgroundColor: tokens.white,
    padding: "36px",
    borderRadius: tokens.radiusLg,
    width: "70%",
    maxWidth: "960px",
    boxShadow: tokens.shadowXl,
    border: `1px solid ${tokens.slate100}`,
  },

  limitsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "20px",
    marginTop: "24px",
    marginBottom: "24px",
  },

  limitCard: {
    border: `1px solid ${tokens.slate200}`,
    borderRadius: tokens.radiusMd,
    padding: "20px",
    textAlign: "center" as const,
    boxShadow: tokens.shadowSm,
    backgroundColor: tokens.white,
  },

  // Proposals modal
  proposalsModal: {
    position: "relative" as const,
    backgroundColor: tokens.white,
    padding: "36px",
    borderRadius: tokens.radiusLg,
    width: "85%",
    maxHeight: "85vh",
    height: "70%",
    marginTop: "5%",
    overflowY: "auto",
    boxShadow: tokens.shadowXl,
    border: `1px solid ${tokens.slate100}`,
  } as const,

  proposalCard: {
    border: `1px solid ${tokens.slate200}`,
    borderRadius: tokens.radiusMd,
    padding: "20px 24px",
    marginBottom: "16px",
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    boxShadow: tokens.shadowSm,
    backgroundColor: tokens.white,
    transition: tokens.transition,
  },

  closeCross: {
    position: "absolute" as const,
    top: "16px",
    right: "20px",
    fontSize: "24px",
    fontWeight: 700,
    color: tokens.slate400,
    background: "none",
    border: "none",
    cursor: "pointer",
    lineHeight: 1,
    padding: "4px 6px",
    borderRadius: tokens.radiusSm,
    zIndex: 10,
    transition: tokens.transition,
  },
};