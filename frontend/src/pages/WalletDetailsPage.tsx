import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { profileStyles as s } from "../styles/componentStyles";
import { MULTISIG_MODULE } from "../constants";

const aptos = new Aptos(
  new AptosConfig({ network: Network.TESTNET })
);

interface WalletInfo {
  name: string;
  owners: string[];
  admins: string[];
  balance: string;
  is_charity: boolean;
  entry_fee: string;
  monthly_fee: string;
  voting_mode: number;
  recipient_filter_is_whitelist: boolean;
}

// 🔥 Конвертація hex (0x...) → string
function hexToString(hex: string): string {
  try {
    const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;

    if (cleanHex.length === 0) return "";

    const bytes = new Uint8Array(
      cleanHex.match(/.{1,2}/g)!.map(byte =>
        parseInt(byte, 16)
      )
    );

    return new TextDecoder().decode(bytes);
  } catch {
    return hex; // fallback якщо щось піде не так
  }
}

export function WalletDetailsPage() {
  const { address } = useParams();
  const [info, setInfo] = useState<WalletInfo | null>(null);
  const [status, setStatus] = useState("Loading...");

  useEffect(() => {
    if (!address) return;

    const fetchInfo = async () => {
      try {
        setStatus("Loading...");

        const response = await aptos.view({
          payload: {
            function: `${MULTISIG_MODULE}::get_wallet_info`,
            typeArguments: [],
            functionArguments: [address],
          },
        });

        const rawData = response[0] as WalletInfo;

        // 🔥 Нормалізація даних
        const parsedData: WalletInfo = {
          ...rawData,
          name: hexToString(rawData.name),
        };

        setInfo(parsedData);
        setStatus("");
      } catch (e) {
        console.error(e);
        setStatus("Failed to fetch wallet info.");
      }
    };

    fetchInfo();
  }, [address]);

  return (
    <div style={s.container}>
      <h2 style={s.title}>Wallet Details</h2>

      {status && <p style={s.statusText}>{status}</p>}

      {info && (
        <div style={s.formStack}>
          <p><strong>Address:</strong> {address}</p>
          <p><strong>Name:</strong> {info.name}</p>
          <p><strong>Balance:</strong> {info.balance}</p>
          <p><strong>Is Charity:</strong> {info.is_charity ? "Yes" : "No"}</p>

          {info.is_charity && (
            <>
              <p><strong>Entry Fee:</strong> {info.entry_fee}</p>
              <p><strong>Monthly Fee:</strong> {info.monthly_fee}</p>
            </>
          )}

          <p><strong>Voting Mode:</strong> {info.voting_mode}</p>
          <p>
            <strong>Recipient Filter:</strong>{" "}
            {info.recipient_filter_is_whitelist
              ? "Whitelist"
              : "Blacklist"}
          </p>

          <div>
            <strong>Owners:</strong>
            <ul>
              {info.owners.map(o => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          </div>

          <div>
            <strong>Admins:</strong>
            <ul>
              {info.admins.map(a => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
