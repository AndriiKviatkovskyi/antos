import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { MainNavigator } from "./components/MainNavigator.js";

function App() {
  return (
    // autoConnect ensures the user stays logged in on refresh
    <AptosWalletAdapterProvider autoConnect={true}>
      <MainNavigator />
    </AptosWalletAdapterProvider>
  );
}

export default App;