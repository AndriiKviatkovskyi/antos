import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { profileStyles as s } from "../styles/componentStyles";
import { MULTISIG_MODULE } from "../constants";

const aptos = new Aptos(
  new AptosConfig({ network: Network.TESTNET })
);

// 🔥 Конвертація hex (0x...) → string
function hexToString(hex: string): string {
  try {
    const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
    if (cleanHex.length === 0) return "";
    const bytes = new Uint8Array(cleanHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    return new TextDecoder().decode(bytes);
  } catch {
    return hex; // fallback
  }
}

export function WalletDetailsPage() {
  const { address } = useParams<{ address: string }>();
  const [resourceData, setResourceData] = useState<any | null>(null);
  const [status, setStatus] = useState("Loading...");

  useEffect(() => {
    if (!address) return;

    const fetchResource = async () => {
      try {
        setStatus("Loading...");

        const resource = await aptos.getAccountResource({
          accountAddress: address,
          resourceType: `${MULTISIG_MODULE}::MultisigStore` as const,
        });

        

        const data = resource;

        // Якщо є name у форматі hex, конвертуємо
        console.log(data);
        if (data.name) {
          data.name = hexToString(data.name);
        }

        setResourceData(data);
        setStatus("");
      } catch (e) {
        console.error(e);
        setStatus("Failed to fetch wallet resource.");
      }
    };

    fetchResource();
  }, [address]);

  return (
    <div style={s.container}>
      <h2 style={s.title}>Wallet Details</h2>

      {status && <p style={s.statusText}>{status}</p>}

      {resourceData && (
        <pre style={{ ...s.formStack, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {JSON.stringify(resourceData, null, 2)}
        </pre>
      )}
    </div>
  );
}
