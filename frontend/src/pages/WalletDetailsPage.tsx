import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import type { InputEntryFunctionData } from "@aptos-labs/ts-sdk";
import { walletStyles as s } from "../styles/componentStyles";
import { MULTISIG_MODULE } from "../constants";
import { useWallet } from "@aptos-labs/wallet-adapter-react";

import { formatApt, fromOctas, toOctas } from "../utils/formatters";
import { hexToString, bytesToHex } from "../utils/aptosHelpers";
import { calculateLimit } from "../utils/limitCalculator";


const aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));

const MODE_MAJORITY = 1;
const MODE_COMBINED = 4;

export function WalletDetailsPage() {
  const { address } = useParams<{ address: string }>();
  const { account, signAndSubmitTransaction } = useWallet();
  const currentUserHex = account?.address?.data ? bytesToHex(account.address.data) : null;

  const [walletData, setWalletData] = useState<any | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [status, setStatus] = useState("Loading...");
  const [showOwners, setShowOwners] = useState(false);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteAddress, setInviteAddress] = useState("");
  const [inviteRole, setInviteRole] = useState<"owner" | "admin">("owner");

  const [showGovernanceModal, setShowGovernanceModal] = useState(false);
  const [onlyAdminsInitiate, setOnlyAdminsInitiate] = useState(false);
  const [onlyAdminsVote, setOnlyAdminsVote] = useState(false);
  const [adminsCanVeto, setAdminsCanVeto] = useState(false);
  const [votingMode, setVotingMode] = useState<number>(MODE_MAJORITY);
  const [tierTwo, setTierTwo] = useState("");
  const [tierThree, setTierThree] = useState("");

  const [showListsModal, setShowListsModal] = useState(false);
  const [membershipBlacklist, setMembershipBlacklist] = useState<string[]>([]);
  const [recipientWhitelist, setRecipientWhitelist] = useState<string[]>([]);
  const [recipientBlacklist, setRecipientBlacklist] = useState<string[]>([]);
  const [useWhitelist, setUseWhitelist] = useState(false);
  const [newListAddress, setNewListAddress] = useState("");
  const [showFundModal, setShowFundModal] = useState(false);
  const [fundAmount, setFundAmount] = useState("");

  const [showLimitsModal, setShowLimitsModal] = useState(false);
  const [showUpdateLimitsModal, setShowUpdateLimitsModal] = useState(false);
  const [dailyLimitInput, setDailyLimitInput] = useState("");
  const [weeklyLimitInput, setWeeklyLimitInput] = useState("");
  const [monthlyLimitInput, setMonthlyLimitInput] = useState("");

  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showKickModal, setShowKickModal] = useState(false);
  const [ownerToKick, setOwnerToKick] = useState<string | null>(null);

  const [showProposeModal, setShowProposeModal] = useState(false);  
  const [proposalRecipient, setProposalRecipient] = useState("");
  const [proposalAmount, setProposalAmount] = useState("");
  const [proposalTimelock, setProposalTimelock] = useState("");
  const [proposalExecWindow, setProposalExecWindow] = useState("");
  const [proposalError, setProposalError] = useState<string | null>(null);

  const [showProposalsModal, setShowProposalsModal] = useState(false);
  const [expandedApprovals, setExpandedApprovals] = useState<number | null>(null);

  async function fetchData() {
    if (!address) return;
    try {
      setStatus("Loading...");

      const resource = await aptos.getAccountResource({
        accountAddress: address,
        resourceType: `${MULTISIG_MODULE}::MultisigStore` as const
      });

      if (resource.name) resource.name = hexToString(resource.name);
      setWalletData(resource);
      
      const walletInfo = await aptos.view({
        payload:{
          function: `${MULTISIG_MODULE}::get_wallet_info`,
          typeArguments: [],
          functionArguments: [address]
        }
      });

      setBalance((walletInfo[0] as any).balance);
      setStatus("");
    } catch (e) {
      console.error(e);
      setStatus("Failed to fetch wallet data.");
    }
  }

  useEffect(() => { fetchData(); }, [address]);

  const isOwner = currentUserHex && 
    walletData?.owners?.some((o: string) => 
      o.toLowerCase() === currentUserHex.toLowerCase()
    );

  const isAdmin = currentUserHex &&
    walletData?.admins?.some((a: string) =>
      a.toLowerCase() === currentUserHex.toLowerCase()
    );

  const isLastAdmin = isAdmin && walletData?.admins?.length === 1;
  const walletFull = walletData && walletData.owners.length >= walletData.max_owners;

  const isBlacklisted = walletData &&
    walletData.membership_blacklist?.some((addr: string) =>
      addr.toLowerCase() === inviteAddress.toLowerCase()
    );

  async function handleInvite() {
    if (!address || !inviteAddress) return;

    const payload: InputEntryFunctionData = {
      function: `${MULTISIG_MODULE}::invite_owner`,
      typeArguments: [],
      functionArguments: [address, inviteAddress, inviteRole === "admin"]
    };

    await signAndSubmitTransaction({ data: payload });

    setShowInviteModal(false);
    setInviteAddress("");
  }

  function openGovernanceModal() {
    if (!walletData) return;
    setOnlyAdminsInitiate(walletData.only_admins_can_initiate);
    setOnlyAdminsVote(walletData.only_admins_can_vote);
    setAdminsCanVeto(walletData.admins_can_veto);
    setVotingMode(walletData.voting_mode);
    setTierTwo(fromOctas(walletData.tier_two_threshold));
    setTierThree(fromOctas(walletData.tier_three_threshold));
    setShowGovernanceModal(true);
  }

  async function handleGovernanceUpdate() {
    if (!account || !address) return;
    try {
      setStatus("Updating governance config...");
      const payload: InputEntryFunctionData = {
        function: `${MULTISIG_MODULE}::update_governance_configs`,
        typeArguments: [],
        functionArguments: [
          address,
          onlyAdminsInitiate,
          onlyAdminsVote,
          adminsCanVeto,
          votingMode,
          votingMode===MODE_COMBINED ? toOctas(tierTwo) : 0,
          votingMode===MODE_COMBINED ? toOctas(tierThree) : 0,
        ],
      };
      const response = await signAndSubmitTransaction({ data: payload });
      await aptos.waitForTransaction({ transactionHash: response.hash });
      setShowGovernanceModal(false);
      await new Promise(r=>setTimeout(r,800));
      await fetchData();
      setStatus("Governance config updated.");
    } catch(e) {
      console.error(e);
      setStatus("Transaction failed.");
    }
  }

  async function openListsModal() {
    if (!walletData) return;
    setMembershipBlacklist(walletData.membership_blacklist || []);
    setRecipientWhitelist(walletData.recipient_whitelist || []);
    setRecipientBlacklist(walletData.recipient_blacklist || []);
    setUseWhitelist(walletData.recipient_filter_is_whitelist);
    setNewListAddress("");
    setShowListsModal(true);
  }

  async function handleAddToList(listName: "membership"|"recipient") {
    if (!newListAddress || !account || !address) return;
    let payload: InputEntryFunctionData;
    if (listName==="membership") {
      payload = {
        function:`${MULTISIG_MODULE}::edit_membership_blacklist`,
        typeArguments:[],
        functionArguments:[address,newListAddress,true]
      };
      await signAndSubmitTransaction({ data: payload });
      setMembershipBlacklist([...membershipBlacklist,newListAddress]);
    } else {
      payload = {
        function:`${MULTISIG_MODULE}::edit_recipient_list`,
        typeArguments:[],
        functionArguments:[address,newListAddress,true,useWhitelist]
      };
      await signAndSubmitTransaction({ data: payload });
      if (useWhitelist) setRecipientWhitelist([...recipientWhitelist,newListAddress]);
      else setRecipientBlacklist([...recipientBlacklist,newListAddress]);
    }
    setNewListAddress("");
  }

  async function handleRemoveFromList(listName: "membership"|"recipient", addr: string) {
    if (!account || !address) return;
    let payload: InputEntryFunctionData;
    if (listName==="membership") {
      payload = {
        function:`${MULTISIG_MODULE}::edit_membership_blacklist`,
        typeArguments:[],
        functionArguments:[address,addr,false]
      };
      await signAndSubmitTransaction({ data: payload });
      setMembershipBlacklist(membershipBlacklist.filter(a => a!==addr));
    } else {
      payload = {
        function:`${MULTISIG_MODULE}::edit_recipient_list`,
        typeArguments:[],
        functionArguments:[address,addr,false,useWhitelist]
      };
      await signAndSubmitTransaction({ data: payload });
      if (useWhitelist) setRecipientWhitelist(recipientWhitelist.filter(a => a!==addr));
      else setRecipientBlacklist(recipientBlacklist.filter(a => a!==addr));
    }
  }

  async function handleToggleRecipientMode() {
    if (!account || !address) return;

    const payload: InputEntryFunctionData = {
      function: `${MULTISIG_MODULE}::toggle_recipient_filter_mode`,
      typeArguments: [],
      functionArguments: [address, !useWhitelist]
    };

    await signAndSubmitTransaction({ data: payload });
    setUseWhitelist(!useWhitelist);
  }

  async function handleFundWallet() {
    if (!account || !address || !fundAmount) return;
    try {
      setStatus("Sending funds...");
      
      const payload: InputEntryFunctionData = {
        function: `${MULTISIG_MODULE}::fund_voluntarily`,
        typeArguments: [],
        functionArguments: [
          address,
          toOctas(fundAmount)
        ],
      };

      const response = await signAndSubmitTransaction({ data: payload });
      await aptos.waitForTransaction({ transactionHash: response.hash });
      setShowFundModal(false);
      setFundAmount("");
      await fetchData();
      setStatus("Funds sent successfully.");
    } catch (e) {
      console.error(e);
      setStatus("Funding transaction failed.");
    }
  }

  const daily = walletData
    ? calculateLimit(walletData.daily_limit, 1)
    : null;

  const weekly = walletData
    ? calculateLimit(walletData.weekly_limit, 7)
    : null;

  const monthly = walletData
    ? calculateLimit(walletData.monthly_limit, 30)
    : null;

  const proposalAmountOctas = proposalAmount ? toOctas(proposalAmount) : 0;

  const nowSeconds = Math.floor(Date.now() / 1000);

  let timelockSeconds;
  let timelockAbsolute = nowSeconds;

  if (proposalTimelock) {
    const selected = Math.floor(new Date(proposalTimelock).getTime() / 1000);
    if (selected > nowSeconds) {
      timelockSeconds = selected - nowSeconds;
      timelockAbsolute = selected;
    }
  }

  let executionWindow;

  if (proposalExecWindow && proposalTimelock) {
    const execTime = Math.floor(new Date(proposalExecWindow).getTime() / 1000);
    if (execTime > timelockAbsolute) {
      executionWindow = execTime - timelockAbsolute;
    }
  }

  function openUpdateLimitsModal() {
    if (!walletData) return;

    const getLimit = (limitObj: any) => {
      const vec = limitObj?.max_amount?.vec;
      if (!vec || vec.length === 0) return "";
      return fromOctas(vec[0]);
    };

    setDailyLimitInput(getLimit(walletData.daily_limit));
    setWeeklyLimitInput(getLimit(walletData.weekly_limit));
    setMonthlyLimitInput(getLimit(walletData.monthly_limit));

    setShowUpdateLimitsModal(true);
  }

  async function handleUpdateLimits() {
    if (!account || !address || !walletData) return;

    try {
      setStatus("Updating limits...");

      const dailyOctas = toOctas(dailyLimitInput);
      const weeklyOctas = toOctas(weeklyLimitInput);
      const monthlyOctas = toOctas(monthlyLimitInput);

      if (
        walletData.daily_limit?.accumulated_amount &&
        dailyOctas < Number(walletData.daily_limit.accumulated_amount)
      ) {
        setStatus("Daily limit cannot be below already spent amount.");
        return;
      }

      if (
        walletData.weekly_limit?.accumulated_amount &&
        weeklyOctas < Number(walletData.weekly_limit.accumulated_amount)
      ) {
        setStatus("Weekly limit cannot be below already spent amount.");
        return;
      }

      if (
        walletData.monthly_limit?.accumulated_amount &&
        monthlyOctas < Number(walletData.monthly_limit.accumulated_amount)
      ) {
        setStatus("Monthly limit cannot be below already spent amount.");
        return;
      }

      const payload: InputEntryFunctionData = {
        function: `${MULTISIG_MODULE}::set_transaction_limits`,
        typeArguments: [],
        functionArguments: [
          address,
          dailyOctas,
          weeklyOctas,
          monthlyOctas,
        ],
      };

      const response = await signAndSubmitTransaction({ data: payload });
      await aptos.waitForTransaction({ transactionHash: response.hash });

      setShowUpdateLimitsModal(false);
      await fetchData();
      setStatus("Limits updated successfully.");
    } catch (e) {
      console.error(e);
      setStatus("Failed to update limits.");
    }
  }

  async function handleSelfRemove() {
    if (!account || !address) return;

    try {
      setStatus("Leaving wallet...");

      const payload: InputEntryFunctionData = {
        function: `${MULTISIG_MODULE}::self_remove`,
        typeArguments: [],
        functionArguments: [address],
      };

      const response = await signAndSubmitTransaction({ data: payload });
      await aptos.waitForTransaction({ transactionHash: response.hash });

      setShowLeaveModal(false);
      setStatus("You have left the wallet.");
      window.location.href = "/";
    } catch (e) {
      console.error(e);
      setStatus("Failed to leave wallet.");
    }
  }


  async function handleKickOwner() {
    if (!account || !address || !ownerToKick) return;

    try {
      setStatus("Removing owner...");

      const payload: InputEntryFunctionData = {
        function: `${MULTISIG_MODULE}::remove_owner`,
        typeArguments: [],
        functionArguments: [address, ownerToKick],
      };

      const response = await signAndSubmitTransaction({ data: payload });
      await aptos.waitForTransaction({ transactionHash: response.hash });

      setShowKickModal(false);
      setOwnerToKick(null);
      await fetchData();
      setStatus("Owner removed successfully.");
    } catch (e) {
      console.error(e);
      setStatus("Failed to remove owner.");
    }
  }

  async function handleProposeTransfer() {
    if (!account || !address || !proposalRecipient || !proposalAmount || proposalError) return;

    try {
      setStatus("Creating proposal...");

      const nowSeconds = Math.floor(Date.now() / 1000);
      const amountOctas = toOctas(proposalAmount);
      let timelockSeconds = 0;

      if (proposalTimelock) {
        const selected = Math.floor(new Date(proposalTimelock).getTime() / 1000);
        timelockSeconds = selected > nowSeconds ? selected - nowSeconds : 0;
      }

      const TEN_YEARS_SECONDS = 10 * 365 * 24 * 60 * 60;
      
      let executionWindow = TEN_YEARS_SECONDS;
      
      if (proposalExecWindow && proposalTimelock) {
        const execTime = Math.floor(new Date(proposalExecWindow).getTime() / 1000);
        const timelockAbs = nowSeconds + timelockSeconds;
        executionWindow = execTime > timelockAbs ? execTime - timelockAbs : 0;
      }

      const payload: InputEntryFunctionData = {
        function: `${MULTISIG_MODULE}::propose_transfer`,
        typeArguments: [],
        functionArguments: [
          address,
          proposalRecipient,
          amountOctas,
          timelockSeconds,
          executionWindow,
        ],
      };

      const response = await signAndSubmitTransaction({ data: payload });
      await aptos.waitForTransaction({ transactionHash: response.hash });

      setShowProposeModal(false);
      setProposalRecipient("");
      setProposalAmount("");
      setProposalTimelock("");
      setProposalExecWindow("");

      await fetchData();

      setStatus("Proposal created successfully.");
    } catch (e) {
      console.error(e);
      setStatus("Failed to create proposal.");
    }
  }

  async function handleVote(proposalId: number) {
    if (!account || !address) return;

    try {
      setStatus("Voting...");

      const payload: InputEntryFunctionData = {
        function: `${MULTISIG_MODULE}::approve`,
        typeArguments: [],
        functionArguments: [address, proposalId],
      };

      const response = await signAndSubmitTransaction({ data: payload });
      await aptos.waitForTransaction({ transactionHash: response.hash });

      await fetchData();
      setStatus("Vote submitted.");
    } catch (e) {
      console.error(e);
      setStatus("Vote failed.");
    }
  }

  useEffect(() => {
    if (!walletData) return;
    setProposalError(null);
    if (!proposalRecipient) return;

    const whitelistEnabled = walletData.whitelist_enabled;
    setRecipientWhitelist(walletData.recipient_whitelist || []);
    setRecipientBlacklist(walletData.recipient_blacklist || []);

    if (whitelistEnabled) {
      if (!recipientWhitelist.includes(proposalRecipient)) {
        setProposalError("Recipient not in whitelist.");
        return;
      }
    } else {
      if (recipientBlacklist.includes(proposalRecipient)) {
        setProposalError("Recipient is blacklisted.");
        return;
      }
    }

    if (proposalExecWindow && proposalTimelock) {
      const execTime = new Date(proposalExecWindow).getTime();
      const timelockTime = new Date(proposalTimelock).getTime();

      if (execTime <= timelockTime) {
        setProposalError("Execution deadline must be after timelock.");
        return;
      }
    }

    if (proposalAmountOctas > 0) {
      const limits = [
        { name: "Daily", data: daily },
        { name: "Weekly", data: weekly },
        { name: "Monthly", data: monthly },
      ];

      for (const limit of limits) {
        if (limit.data?.hasLimit) {
          if (
            limit.data.accumulated + proposalAmountOctas >
            limit.data.max
          ) {
            setProposalError(`${limit.name} limit exceeded.`);
            return;
          }
        }
      }
    }
  }, [
    proposalRecipient,
    proposalAmount,
    proposalTimelock,
    proposalExecWindow,
    walletData,
  ]);

  return (
    <div style={s.container}>
      {status && <p style={s.statusText}>{status}</p>}

      {walletData && (
        <div style={s.pageGrid}>
          {/* OWNER PANEL */}
          <div style={s.sideBox}>
            <div style={s.sideHeader}>Owner Functions</div>
            <div style={s.sideBody}>
              {isOwner ? (
                <>
                  <button
                    style={s.primaryButton}
                    onClick={() => setShowFundModal(true)}
                  >
                    Fund Wallet
                  </button>

                  <div style={{ height: 12 }} />

                  <button
                    style={s.primaryButton}
                    onClick={() => setShowLimitsModal(true)}
                  >
                    View Limits
                  </button>

                  <div style={{ height: 12 }} />

                  <button
                    style={{
                      ...s.secondaryButton,
                      backgroundColor: "#ed1b1b",
                      border: "1px solid #a33",
                    }}
                    disabled={isLastAdmin}
                    onClick={() => setShowLeaveModal(true)}
                  >
                    Leave Wallet
                  </button>

                  {isLastAdmin && (
                    <p style={s.errorText}>
                      You cannot leave — you are the last admin.
                    </p>
                  )}
                </>
              ) : (
                <p>Sorry, you're not this wallet's owner</p>
              )}
            </div>
          </div>

          {/* CENTER WALLET INFO */}
          <div style={s.walletBox}>
            <div
              style={{
                ...s.walletHeader,
                ...(walletData.is_charity
                  ? s.walletHeaderCharity
                  : s.walletHeaderNormal),
              }}
            >
              <div>
                <div style={s.walletName}>{walletData.name}</div>
                <div style={s.walletAddress}>{address}</div>
              </div>
            </div>

            <div style={s.walletBody}>
              <div>
                APT Balance: {balance ? `${formatApt(balance)} APT` : "N/A"}
              </div>

              <div
                style={s.ownersHeader}
                onClick={() => setShowOwners(!showOwners)}
              >
                {showOwners ? "▼" : "▶"} Owners (
                {walletData.owners.length}/{walletData.max_owners})
              </div>

              {showOwners && (
                <ul style={s.ownersList}>
                  {walletData.owners.map((owner: string) => {
                    const ownerIsAdmin = walletData.admins.includes(owner);

                    const canKick =
                      isAdmin &&                // current user is admin
                      !ownerIsAdmin &&          // target is not admin
                      owner.toLowerCase() !== currentUserHex?.toLowerCase(); // cannot kick self

                    return (
                      <li
                        key={owner}
                        style={{
                          ...s.ownerItem,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span>
                          {owner}
                          {ownerIsAdmin && <span style={s.adminStar}>★</span>}
                        </span>

                        {canKick && (
                          <button
                            style={{
                              ...s.secondaryButton,
                              backgroundColor: "#fee2e2",
                              border: "1px solid #ef4444",
                              color: "#b91c1c",
                              padding: "4px 10px",
                              fontSize: "12px",
                            }}
                            onClick={() => {
                              setOwnerToKick(owner);
                              setShowKickModal(true);
                            }}
                          >
                            Kick
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}

              <div style={{ marginTop: 16 }}>
                <button
                  style={{
                    ...s.primaryButton,
                    opacity:
                      walletData.only_admins_can_initiate && !isAdmin ? 0.5 : 1,
                    cursor:
                      walletData.only_admins_can_initiate && !isAdmin
                        ? "not-allowed"
                        : "pointer",
                  }}
                  disabled={
                    walletData.only_admins_can_initiate && !isAdmin
                  }
                  onClick={() => setShowProposeModal(true)}
                >
                  Initiate Proposal
                </button>

                <button
                  style={s.secondaryButton}
                  onClick={() => setShowProposalsModal(true)}
                >
                  View Proposals
                </button>

                {walletData.only_admins_can_initiate && !isAdmin && (
                  <p style={s.errorText}>
                    Only admins can initiate proposals.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ADMIN PANEL */}
          <div style={s.sideBox}>
            <div style={s.sideHeader}>Admin Functions</div>
            <div style={s.sideBody}>
              {isAdmin ? (
                <>
                  <button
                    style={s.primaryButton}
                    onClick={() => setShowInviteModal(true)}
                  >
                    Invite user
                  </button>

                  <div style={{ height: 12 }} />

                  <button
                    style={s.primaryButton}
                    onClick={openGovernanceModal}
                  >
                    Governance config
                  </button>

                  <div style={{ height: 12 }} />

                  <button
                    style={s.primaryButton}
                    onClick={openListsModal}
                  >
                    Manage Lists
                  </button>

                  <div style={{ height: 12 }} />

                  <button
                    style={s.primaryButton}
                    onClick={openUpdateLimitsModal}
                  >
                    Update Limits
                  </button>
                </>
              ) : (
                <p>Sorry, you're not this wallet's admin</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= INVITE MODAL ================= */}
      {showInviteModal && (
        <div style={s.modalOverlay}>
          <div style={s.modal}>
            {walletFull ? (
              <p>Wallet is full</p>
            ) : (
              <>
                <h3>Invite User</h3>
                <input
                  style={s.input}
                  placeholder="0x..."
                  value={inviteAddress}
                  onChange={(e) => setInviteAddress(e.target.value)}
                />
                <select
                  style={s.select}
                  value={inviteRole}
                  onChange={(e) =>
                    setInviteRole(e.target.value as "owner" | "admin")
                  }
                >
                  <option value="owner">Owner</option>
                  <option value="admin">Admin</option>
                </select>

                {isBlacklisted && (
                  <p style={s.errorText}>
                    Alert! This user is blacklisted from joining the wallet
                  </p>
                )}

                <div style={s.modalButtons}>
                  <button
                    style={s.primaryButton}
                    disabled={isBlacklisted}
                    onClick={handleInvite}
                  >
                    Invite
                  </button>
                  <button
                    style={s.secondaryButton}
                    onClick={() => setShowInviteModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ================= GOVERNANCE MODAL ================= */}
      {showGovernanceModal && (
        <div style={s.modalOverlay}>
          <div style={s.modal}>
            <h3>Governance Configuration</h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label>
                <input
                  type="checkbox"
                  checked={onlyAdminsInitiate}
                  onChange={(e) => setOnlyAdminsInitiate(e.target.checked)}
                />{" "}
                Only Admins Can Initiate
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={onlyAdminsVote}
                  onChange={(e) => setOnlyAdminsVote(e.target.checked)}
                />{" "}
                Only Admins Can Vote
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={adminsCanVeto}
                  onChange={(e) => setAdminsCanVeto(e.target.checked)}
                />{" "}
                Admins Can Veto
              </label>
            </div>

            <select
              style={s.select}
              value={votingMode}
              onChange={(e) => setVotingMode(Number(e.target.value))}
            >
              <option value={1}>Majority</option>
              <option value={2}>Two Thirds</option>
              <option value={3}>Unanimous</option>
              <option value={4}>Combined</option>
            </select>

            {votingMode === MODE_COMBINED && (
              <>
                <input
                  style={s.input}
                  type="number"
                  placeholder="Tier Two Threshold (APT)"
                  value={tierTwo}
                  onChange={(e) => setTierTwo(e.target.value)}
                />
                <input
                  style={s.input}
                  type="number"
                  placeholder="Tier Three Threshold (APT)"
                  value={tierThree}
                  onChange={(e) => setTierThree(e.target.value)}
                />
              </>
            )}

            <div style={s.modalButtons}>
              <button
                style={s.primaryButton}
                onClick={handleGovernanceUpdate}
              >
                Change
              </button>
              <button
                style={s.secondaryButton}
                onClick={() => setShowGovernanceModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= LISTS MODAL ================= */}
      {showListsModal && (
        <div style={s.modalOverlay}>
          <div style={s.listsModal}>
            <h3>Lists Management</h3>

            <div style={{ marginBottom: 12 }}>
              <label>
                <input
                  type="checkbox"
                  checked={useWhitelist}
                  onChange={handleToggleRecipientMode}
                />{" "}
                Recipient Whitelist Mode
              </label>
            </div>

            <h4>Membership Blacklist</h4>
            <ul style={s.ownersList}>
              {membershipBlacklist.map((addr) => (
                <li key={addr} style={s.ownerItem}>
                  {addr}
                  <button
                    style={s.secondaryButton}
                    onClick={() =>
                      handleRemoveFromList("membership", addr)
                    }
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>

            <input
              style={s.input}
              placeholder="0x..."
              value={newListAddress}
              onChange={(e) => setNewListAddress(e.target.value)}
            />

            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <button
                style={s.primaryButton}
                onClick={() => handleAddToList("membership")}
              >
                Add to Membership Blacklist
              </button>
              <button
                style={s.primaryButton}
                onClick={() => handleAddToList("recipient")}
              >
                Add to Recipient List
              </button>
            </div>

            <h4>
              Recipient List ({useWhitelist ? "Whitelist" : "Blacklist"})
            </h4>

            <ul style={s.ownersList}>
              {(useWhitelist
                ? recipientWhitelist
                : recipientBlacklist
              ).map((addr) => (
                <li key={addr} style={s.ownerItem}>
                  {addr}
                  <button
                    style={s.secondaryButton}
                    onClick={() =>
                      handleRemoveFromList("recipient", addr)
                    }
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>

            <div style={s.modalButtons}>
              <button
                style={s.secondaryButton}
                onClick={async () => {
                  setShowListsModal(false);
                  await fetchData();
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= FUND MODAL ================= */}
      {showFundModal && (
        <div style={s.modalOverlay}>
          <div style={s.modal}>
            <h3>Fund Wallet</h3>

            <input
              style={s.input}
              type="number"
              placeholder="Amount in APT"
              value={fundAmount}
              onChange={(e) => setFundAmount(e.target.value)}
            />

            <div style={s.modalButtons}>
              <button
                style={s.primaryButton}
                onClick={handleFundWallet}
              >
                Send
              </button>
              <button
                style={s.secondaryButton}
                onClick={() => setShowFundModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= LIMITS MODAL ================= */}
      {showLimitsModal && daily && weekly && monthly && (
        <div style={s.modalOverlay}>
          <div style={s.limitsModal}>
            <h2>Spending Limits</h2>

            <div style={s.limitsGrid}>
              {/* DAILY */}
              <div style={s.limitCard}>
                <h3>Daily limit</h3>

                {!daily?.hasLimit ? (
                  <p>No limit</p>
                ) : (
                  <>
                    <p>{daily.elapsed}/24 hours</p>
                    <p>
                      {formatApt(daily.accumulated)}/
                      {formatApt(daily.max)} APT
                    </p>
                  </>
                )}
              </div>

              {/* WEEKLY */}
              <div style={s.limitCard}>
                <h3>Weekly limit</h3>

                {!weekly?.hasLimit ? (
                  <p>No limit</p>
                ) : (
                  <>
                    <p>{weekly.elapsed}/7 days</p>
                    <p>
                      {formatApt(weekly.accumulated)}/
                      {formatApt(weekly.max)} APT
                    </p>
                  </>
                )}
              </div>

              {/* MONTHLY */}
              <div style={s.limitCard}>
                <h3>Monthly limit</h3>

                {!monthly?.hasLimit ? (
                  <p>No limit</p>
                ) : (
                  <>
                    <p>{monthly.elapsed}/30 days</p>
                    <p>
                      {formatApt(monthly.accumulated)}/
                      {formatApt(monthly.max)} APT
                    </p>
                  </>
                )}
              </div>
            </div>

            <div style={s.modalButtons}>
              <button
                style={s.secondaryButton}
                onClick={() => setShowLimitsModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= UPDATE LIMITS MODAL ================= */}
      {showUpdateLimitsModal && (
        <div style={s.modalOverlay}>
          <div style={s.modal}>
            <h3>Update Spending Limits</h3>

            <input
              style={s.input}
              type="number"
              placeholder="Daily Limit (APT)"
              value={dailyLimitInput}
              onChange={(e) => setDailyLimitInput(e.target.value)}
            />

            <input
              style={s.input}
              type="number"
              placeholder="Weekly Limit (APT)"
              value={weeklyLimitInput}
              onChange={(e) => setWeeklyLimitInput(e.target.value)}
            />

            <input
              style={s.input}
              type="number"
              placeholder="Monthly Limit (APT)"
              value={monthlyLimitInput}
              onChange={(e) => setMonthlyLimitInput(e.target.value)}
            />

            <div style={s.modalButtons}>
              <button
                style={s.primaryButton}
                onClick={handleUpdateLimits}
              >
                Update
              </button>
              <button
                style={s.secondaryButton}
                onClick={() => setShowUpdateLimitsModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= LEAVE WALLET MODAL ================= */}
      {showLeaveModal && (
        <div style={s.modalOverlay}>
          <div style={s.modal}>
            <h3>Leave Wallet</h3>

            <p>
              Are you sure you want to leave this wallet?
            </p>

            <div style={s.modalButtons}>
              <button
                style={{
                  ...s.primaryButton,
                  backgroundColor: "#ed1b1b",
                }}
                onClick={handleSelfRemove}
              >
                Yes, Leave
              </button>

              <button
                style={s.secondaryButton}
                onClick={() => setShowLeaveModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ================= KICK OWNER MODAL ================= */}
      {showKickModal && ownerToKick && (
        <div style={s.modalOverlay}>
          <div style={s.modal}>
            <h3>Remove Owner</h3>

            <p>
              Are you sure you want to remove:
            </p>

            <p style={{ fontFamily: "monospace", fontSize: "13px" }}>
              {ownerToKick}
            </p>

            <div style={s.modalButtons}>
              <button
                style={{
                  ...s.primaryButton,
                  backgroundColor: "#ef4444",
                }}
                onClick={handleKickOwner}
              >
                Yes, Remove
              </button>

              <button
                style={s.secondaryButton}
                onClick={() => {
                  setShowKickModal(false);
                  setOwnerToKick(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= PROPOSE TRANSFER MODAL ================= */}
      {showProposeModal && (
        <div style={s.modalOverlay}>
          <div style={s.modal}>
            <h3>Create Transfer Proposal</h3>

            <input
              style={s.input}
              placeholder="Recipient address (0x...)"
              value={proposalRecipient}
              onChange={(e) => setProposalRecipient(e.target.value)}
            />

            <input
              style={s.input}
              type="number"
              placeholder="Amount (APT)"
              value={proposalAmount}
              onChange={(e) => setProposalAmount(e.target.value)}
            />

            <label>Optional Timelock (Earliest execution time)</label>
            <input
              style={s.input}
              type="datetime-local"
              value={proposalTimelock}
              onChange={(e) => setProposalTimelock(e.target.value)}
            />

            <label>Optional Execution Deadline</label>
            <input
              style={s.input}
              type="datetime-local"
              value={proposalExecWindow}
              onChange={(e) => setProposalExecWindow(e.target.value)}
            />

            {proposalError && (
              <p style={s.errorText}>{proposalError}</p>
            )}

            <div style={s.modalButtons}>
              <button
                style={s.primaryButton}
                onClick={handleProposeTransfer}
              >
                Propose
              </button>

              <button
                style={s.secondaryButton}
                onClick={() => setShowProposeModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= PROPOSALS MODAL ================= */}
      {showProposalsModal && walletData && (
        <div style={s.modalOverlay}>
          <div style={s.proposalsModal}>
            <h2>All Proposals</h2>

            {walletData.proposals
              ?.slice()
              .reverse()
              .map((proposal: any) => {
                const totalVoters = walletData.only_admins_can_vote ? walletData.admins.length : walletData.owners.length;
                let activeMode = walletData.voting_mode;

                if (activeMode === MODE_COMBINED) {
                  if (proposal.amount < walletData.tier_two_threshold)
                    activeMode = MODE_MAJORITY;
                  else if (proposal.amount < walletData.tier_three_threshold)
                    activeMode = 2;
                  else activeMode = 3;
                }

                const approvalsCount = proposal.approvals.length;
                let requiredVotes = totalVoters;

                if (activeMode === MODE_MAJORITY)
                  requiredVotes = Math.floor(totalVoters / 2) + 1;
                else if (activeMode === 2)
                  requiredVotes = Math.ceil((2 * totalVoters) / 3);
                else if (activeMode === 3)
                  requiredVotes = totalVoters;

                const now = Math.floor(Date.now() / 1000);
                const timelockPassed = now >= proposal.earliest_execution_time;
                const notExpired = proposal.expiry_time === 0 || now <= proposal.expiry_time;

                const voteDisabled =
                  proposal.is_executed ||
                  (walletData.only_admins_can_vote && !isAdmin) ||
                  !timelockPassed ||
                  !notExpired;

                return (
                  <div key={proposal.id} style={s.proposalCard}>
                    <div style={{ flex: 1 }}>
                      <p><b>ID:</b> {proposal.id}</p>
                      <p><b>Creator:</b> {proposal.creator}</p>
                      <p><b>Recipient:</b> {proposal.recipient}</p>
                      <p><b>Amount:</b> {formatApt(proposal.amount)} APT</p>
                      <p>
                        <b>Earliest Execution:</b>{" "}
                        {new Date(proposal.earliest_execution_time * 1000).toLocaleString()}
                      </p>
                      <p>
                        <b>Expiry:</b>{" "}
                        {proposal.expiry_time === 0
                          ? "No expiry"
                          : new Date(proposal.expiry_time * 1000).toLocaleString()}
                      </p>
                    </div>

                    <div style={{ width: 260 }}>
                      {proposal.is_executed ? (
                        <p style={{ fontWeight: 600 }}>
                          Executed with {approvalsCount} votes
                        </p>
                      ) : (
                        <p style={{ fontWeight: 600 }}>
                          Votes: {approvalsCount}/{requiredVotes}
                        </p>
                      )}

                      <button
                        style={s.secondaryButton}
                        onClick={() =>
                          setExpandedApprovals(
                            expandedApprovals === proposal.id
                              ? null
                              : proposal.id
                          )
                        }
                      >
                        View Approvals
                      </button>

                      {expandedApprovals === proposal.id && (
                        <ul style={s.ownersList}>
                          {proposal.approvals.map((addr: string) => (
                            <li key={addr} style={s.ownerItem}>{addr}</li>
                          ))}
                        </ul>
                      )}

                      {!proposal.is_executed && (
                        <button
                          style={{
                            ...s.primaryButton,
                            marginTop: 8,
                            opacity: voteDisabled ? 0.5 : 1,
                            cursor: voteDisabled ? "not-allowed" : "pointer"
                          }}
                          disabled={voteDisabled}
                          onClick={() => handleVote(proposal.id)}
                        >
                          Vote
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

            <div style={s.modalButtons}>
              <button
                style={s.secondaryButton}
                onClick={() => setShowProposalsModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
     )}

    </div>

    
  );

}
