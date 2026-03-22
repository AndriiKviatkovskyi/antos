import { useState } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import type { InputEntryFunctionData } from "@aptos-labs/ts-sdk";
import { profileStyles as s } from "../styles/componentStyles";
import { MULTISIG_MODULE } from "../constants";
import { toOctas } from "../utils/formatters";

const aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));

export function CreateWalletPage() {
  const { account, signAndSubmitTransaction } = useWallet();

  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState("");

  // Basic
  const [seed, setSeed] = useState("");
  const [maxOwners, setMaxOwners] = useState(5);
  const [walletMode, setWalletMode] = useState(0); // 0 = Flexible, 1 = Safe, 2 = Charity
  const [entryFee, setEntryFee] = useState("");
  const [monthlyFee, setMonthlyFee] = useState("");

  // Expanded
  const [onlyAdminsInitiate, setOnlyAdminsInitiate] = useState(false);
  const [adminsCanVeto, setAdminsCanVeto] = useState(false);
  const [votingMode, setVotingMode] = useState(1);
  const [tierTwo, setTierTwo] = useState("");
  const [tierThree, setTierThree] = useState("");
  const [dailyLimit, setDailyLimit] = useState("");
  const [weeklyLimit, setWeeklyLimit] = useState("");
  const [monthlyLimit, setMonthlyLimit] = useState("");
  const [filterWhitelist, setFilterWhitelist] = useState(false);

  const toOctasOrMinusOne = (val: string) =>
    val === "" ? -1 : toOctas(Number(val));

  const handleSubmit = async () => {
    if (!account) {
      setStatus("Connect wallet first.");
      return;
    }

    try {
      setStatus("Submitting transaction...");

      const seedBytes = new TextEncoder().encode(seed);

      let payload: InputEntryFunctionData;

      if (!expanded) {
        payload = {
          function: `${MULTISIG_MODULE}::initialize`,
          typeArguments: [],
          functionArguments: [
            Array.from(seedBytes),
            Number(maxOwners),
            Number(walletMode),
            walletMode === 2 ? toOctasOrMinusOne(entryFee) : 0,,
            walletMode === 2 ? toOctasOrMinusOne(monthlyFee) : 0,
          ],
        };
      } else {
        payload = {
          function: `${MULTISIG_MODULE}::initialize_custom`,
          typeArguments: [],
          functionArguments: [
            Array.from(seedBytes),
            Number(maxOwners),
            Number(walletMode),
            walletMode === 2 ? toOctasOrMinusOne(entryFee) : 0,
            walletMode === 2 ? toOctasOrMinusOne(monthlyFee) : 0,
            onlyAdminsInitiate,
            adminsCanVeto,
            Number(votingMode),
            votingMode === 4 ? toOctasOrMinusOne(tierTwo) : 0,
            votingMode === 4 ? toOctasOrMinusOne(tierThree) : 0,
            toOctasOrMinusOne(dailyLimit),
            toOctasOrMinusOne(weeklyLimit),
            toOctasOrMinusOne(monthlyLimit),
            filterWhitelist,
          ],
        };
      }

      const response = await signAndSubmitTransaction({ data: payload });

      await aptos.waitForTransaction({ transactionHash: response.hash });

      setStatus("Wallet successfully created!");
    } catch (err) {
      console.error(err);
      setStatus("Transaction failed.");
    }
  };

  return (
    <div style={s.container}>
      <h2 style={s.title}>Create Multisig Wallet</h2>

      <div style={s.formStack}>
        <label>
          Wallet Name (Seed)
          <input
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
          />
        </label>

        <label>
          Max Owners
          <input
            type="number"
            value={maxOwners}
            onChange={(e) => setMaxOwners(Number(e.target.value))}
          />
        </label>

        <label>
          Wallet Mode
          <select
            value={walletMode}
            onChange={(e) => setWalletMode(Number(e.target.value))}
          >
            <option value={0}>Flexible</option>
            <option value={1}>Safe</option>
            <option value={2}>Charity</option>
          </select>
        </label>

        {walletMode === 2 && (
          <>
            <label>
              Entry Fee
              <input
                type="number"
                value={entryFee}
                onChange={(e) => setEntryFee(e.target.value)}
              />
            </label>

            <label>
              Monthly Fee
              <input
                type="number"
                value={monthlyFee}
                onChange={(e) => setMonthlyFee(e.target.value)}
              />
            </label>
          </>
        )}

        <label>
          Expanded Mode
          <input
            type="checkbox"
            checked={expanded}
            onChange={(e) => setExpanded(e.target.checked)}
          />
        </label>

        {expanded && (
          <>
            <label>
              Only Admins Can Initiate
              <input
                type="checkbox"
                checked={onlyAdminsInitiate}
                onChange={(e) => setOnlyAdminsInitiate(e.target.checked)}
              />
            </label>

            <label>
              Admins Can Veto
              <input
                type="checkbox"
                checked={adminsCanVeto}
                onChange={(e) => setAdminsCanVeto(e.target.checked)}
              />
            </label>

            <label>
              Voting Mode
              <select
                value={votingMode}
                onChange={(e) => setVotingMode(Number(e.target.value))}
              >
                <option value={1}>Majority</option>
                <option value={2}>Two Thirds</option>
                <option value={3}>Unanimous</option>
                <option value={4}>Combined</option>
              </select>
            </label>

            {votingMode === 4 && (
              <>
                <label>
                  Tier Two Threshold
                  <input
                    type="number"
                    value={tierTwo}
                    onChange={(e) => setTierTwo(e.target.value)}
                  />
                </label>

                <label>
                  Tier Three Threshold
                  <input
                    type="number"
                    value={tierThree}
                    onChange={(e) => setTierThree(e.target.value)}
                  />
                </label>
              </>
            )}

            <label>
              Daily Limit
              <input
                type="number"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(e.target.value)}
              />
            </label>

            <label>
              Weekly Limit
              <input
                type="number"
                value={weeklyLimit}
                onChange={(e) => setWeeklyLimit(e.target.value)}
              />
            </label>

            <label>
              Monthly Limit
              <input
                type="number"
                value={monthlyLimit}
                onChange={(e) => setMonthlyLimit(e.target.value)}
              />
            </label>

            <label>
              Use Recipient Whitelist
              <input
                type="checkbox"
                checked={filterWhitelist}
                onChange={(e) => setFilterWhitelist(e.target.checked)}
              />
            </label>
          </>
        )}

        <button onClick={handleSubmit}>Create Wallet</button>

        {status && <p style={s.statusText}>{status}</p>}
      </div>
    </div>
  );
}