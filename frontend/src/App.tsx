import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MainNavigator } from "./components/MainNavigator";
import { Dashboard } from "./components/Dashboard.js";
import { ProfilePage } from "./pages/ProfilePage.js";
import { MyWalletsPage } from "./pages/MyWalletsPage.js";
import { CreateWalletPage } from "./pages/CreateWalletPage.js";
import { WalletDetailsPage } from "./pages/WalletDetailsPage.js";
import { InvitesPage } from "./pages/InvitesPage.js";
import { CharityWalletsPage } from "./pages/CharityWalletsPage.js";

function App() {
  return (
    <AptosWalletAdapterProvider autoConnect={true}>
      <BrowserRouter>
        <Routes>
          {/* MainNavigator acts as the Logic Guard and Layout */}
          <Route path="/" element={<MainNavigator />}>
            <Route index element={<Dashboard />} />
            <Route path="myprofile" element={<ProfilePage />} />
            <Route path="mywallets" element={<MyWalletsPage />} />
            <Route path="createwallet" element={<CreateWalletPage />} />
            <Route path="/wallet/:address" element={<WalletDetailsPage />} />
            <Route path="invites" element={<InvitesPage />} />
            <Route path="charity-wallets" element={<CharityWalletsPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AptosWalletAdapterProvider>
  );
}

export default App;