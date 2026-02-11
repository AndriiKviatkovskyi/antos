import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MainNavigator } from "./components/MainNavigator";
import { Dashboard } from "./components/Dashboard.js";
import { ProfilePage } from "./pages/ProfilePage.js";
import { MyWalletsPage } from "./pages/MyWalletsPage.js";

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
            <Route path="*" element={<Navigate to="/" />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AptosWalletAdapterProvider>
  );
}

export default App;