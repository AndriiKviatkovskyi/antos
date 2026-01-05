// src/styles/componentStyles.ts

export const mainStyles = {
  // Welcome / Login Screen
  welcomeWrapper: "flex flex-col items-center justify-center min-h-screen w-full bg-slate-50 text-center p-6",
  welcomeContainer: "max-w-md w-full space-y-8",
  logoBox: "w-20 h-20 bg-blue-600 rounded-3xl mx-auto flex items-center justify-center shadow-xl shadow-blue-200 text-white text-3xl font-black",
  title: "text-5xl font-black text-slate-900 tracking-tight leading-tight",
  walletSelectorWrapper: "inline-block p-2 bg-white rounded-2xl shadow-xl border border-slate-100",

  // Loading States
  loadingText: "flex items-center justify-center min-h-screen w-full p-10 text-center animate-pulse font-bold text-slate-400 text-xl",

  // Main Layout - This ensures the content sits in the middle of the screen
  pageWrapper: "min-h-screen w-full bg-slate-50 flex flex-col",
  contentMain: "flex-1 w-full max-w-7xl mx-auto p-6 lg:p-12 flex flex-col items-center", 
};

export const onboardingStyles = {
  container: "min-h-screen w-full flex items-center justify-center p-6 bg-slate-50",
  card: "max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100",
  title: "text-3xl font-black mb-2 text-slate-900",
  subtitle: "text-slate-400 mb-8 text-sm",
  formStack: "space-y-4",
  label: "text-xs font-black uppercase text-slate-400 ml-1",
  input: "w-full bg-slate-50 border-2 border-transparent p-4 rounded-2xl focus:border-blue-500 outline-none transition-all text-slate-900",
  errorText: "text-red-500 text-xs mt-4 font-bold",
  submitBtn: "w-full mt-8 bg-blue-600 text-white font-black py-5 rounded-2xl hover:bg-blue-700 hover:-translate-y-1 transition-all shadow-xl shadow-blue-200 active:scale-95",
};

export const navStyles = {
  wrapper: "sticky top-4 z-50 w-full max-w-7xl mx-auto px-4",
  container: "bg-white/80 backdrop-blur-xl border border-white/20 shadow-lg rounded-3xl p-4 flex justify-between items-center px-8",
  leftSection: "flex items-center gap-8",
  logo: "text-blue-600 font-black text-xl tracking-tighter",
  linkGroup: "hidden md:flex gap-6",
  
  linkBase: "text-sm font-bold transition-all duration-200",
  linkActive: "text-blue-600 scale-105",
  linkInactive: "text-slate-500 hover:text-blue-400",
  linkDisabled: "text-slate-300 font-bold text-sm cursor-not-allowed",

  rightSection: "flex items-center gap-4",
  balanceBadge: "bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 text-blue-700 font-mono font-bold whitespace-nowrap",
  logoutBtn: "p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200",
};

export const dashboardStyles = {
  // Added w-full and max-w-2xl to ensure it doesn't just stick to the left
  card: "w-full max-w-2xl bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center text-center",
  label: "text-slate-400 text-xs font-black uppercase tracking-widest mb-3 block",
  balanceText: "text-6xl font-mono font-black text-slate-900 break-all",
  unit: "text-2xl ml-2 text-blue-600 font-sans font-black"
};

export const profileStyles = {
  container: "w-full max-w-2xl mx-auto bg-white p-12 rounded-[3rem] shadow-sm border border-slate-100",
  title: "text-3xl font-black mb-8 text-slate-900",
  formStack: "space-y-6",
  avatarSection: "flex items-center gap-4 p-5 bg-slate-50 rounded-3xl border border-slate-100",
  avatarBox: "w-20 h-20 bg-slate-200 rounded-2xl overflow-hidden shadow-inner flex-shrink-0 border-2 border-white",
  avatarImg: "w-full h-full object-cover",
  pfpInput: "flex-1 bg-transparent outline-none text-sm font-medium text-slate-600 placeholder:text-slate-300",
  input: "w-full bg-slate-50 p-4 rounded-2xl border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all text-slate-900 font-medium",
  textarea: "w-full bg-slate-50 p-4 rounded-2xl border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all h-40 resize-none text-slate-900 font-medium",
  submitBtn: "w-full bg-slate-900 text-white font-black py-5 rounded-2xl hover:bg-black hover:-translate-y-1 active:scale-95 transition-all shadow-xl shadow-slate-200",
  statusText: "text-center text-sm font-black text-blue-600 mt-4 animate-bounce",
};