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

import OwnerPanel from "../components/OwnerPanel";
import { WalletInfo } from "../components/WalletInfo";
import { AdminPanel } from "../components/AdminPanel";
import InviteModal from "../components/modals/InviteModal";
import GovernanceModal from "../components/modals/GovernanceModal";
import ListsModal from "../components/modals/ListsModal";
import FundModal from "../components/modals/FundModal";
import LimitsModal from "../components/modals/LimitsModal";
import UpdateLimitsModal from "../components/modals/UpdateLimitsModal";
import LeaveWalletModal from "../components/modals/LeaveWalletModal";
import KickOwnerModal from "../components/modals/KickOwnersModal";
import ProposeTransferModal from "../components/modals/ProposeTransferModal";
import ProposalsModal from "../components/modals/ProposalsModal";
import MonthlyPaymentsModal from "../components/modals/MonthlyPaymentsModal";
import MemberPaymentsAdminModal from "../components/modals/MemberPaymentsAdminModal";
import PromoteAdminModal from "../components/modals/PromoteAdminModal";
import { KickProposalsModal } from "../components/modals/KickProposalsModal";


const aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));

const MODE_MAJORITY = 1;
const MODE_COMBINED = 4;

export function WalletDetailsPage() {
  const { address } = useParams<{ address: string }>();
  const { account, signAndSubmitTransaction } = useWallet();
  const currentUserHex = account?.address?.data ? bytesToHex(account.address.data) : null;

  const [walletData, setWalletData] = useState<any | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [status, setStatus] = useState("Loading...");

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteAddress, setInviteAddress] = useState("");
  const [inviteRole, setInviteRole] = useState<"owner" | "admin">("owner");

  const [showGovernanceModal, setShowGovernanceModal] = useState(false);
  const [onlyAdminsInitiate, setOnlyAdminsInitiate] = useState(false);

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
  const [showKickProposals, setShowKickProposals] = useState(false);

  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [ownerToPromote, setOwnerToPromote] = useState<string | null>(null);

  const [showProposeModal, setShowProposeModal] = useState(false);  
  const [proposalRecipient, setProposalRecipient] = useState("");
  const [proposalAmount, setProposalAmount] = useState("");
  const [proposalTimelock, setProposalTimelock] = useState("");
  const [proposalExecWindow, setProposalExecWindow] = useState("");
  const [proposalError, setProposalError] = useState<string | null>(null);

  const [showProposalsModal, setShowProposalsModal] = useState(false);
  const [expandedApprovals, setExpandedApprovals] = useState<string | number | null>(null);

  const [showMonthlyModal, setShowMonthlyModal] = useState(false);
  const [showMemberPaymentsModal, setShowMemberPaymentsModal] = useState(false);

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
      console.log(walletData)
      
      const balance = await aptos.view({
        payload:{
          function: `${MULTISIG_MODULE}::get_balance`,
          typeArguments: [],
          functionArguments: [address]
        }
      });

      setBalance(balance as any);
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

  async function handleSetMembershipBlacklist(newList: string[]) {
    if (!account || !address) return;

    try {
      setStatus("Updating membership blacklist...");

      const payload: InputEntryFunctionData = {
        function: `${MULTISIG_MODULE}::set_membership_blacklist`,
        typeArguments: [],
        functionArguments: [address, newList],
      };

      const response = await signAndSubmitTransaction({ data: payload });
      await aptos.waitForTransaction({ transactionHash: response.hash });

      await fetchData();
      setStatus("Membership blacklist updated.");
    } catch (e) {
      console.error(e);
      setStatus("Failed to update membership blacklist.");
    }
  }

  async function handleSetRecipientList(newList: string[], useWhitelistMode: boolean) {
    if (!account || !address) return;

    try {
      setStatus("Updating recipient list...");

      const payload: InputEntryFunctionData = {
        function: `${MULTISIG_MODULE}::set_recipient_list`,
        typeArguments: [],
        functionArguments: [address, newList, useWhitelistMode],
      };

      const response = await signAndSubmitTransaction({ data: payload });
      await aptos.waitForTransaction({ transactionHash: response.hash });

      await fetchData();
      setStatus("Recipient list updated.");
    } catch (e) {
      console.error(e);
      setStatus("Failed to update recipient list.");
    }
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

  async function handleProposeKickOwner() {
    if (!account || !address || !ownerToKick) return;

    try {
      setStatus("Creating kick proposal...");

      const payload: InputEntryFunctionData = {
        function: `${MULTISIG_MODULE}::propose_kick`,
        typeArguments: [],
        functionArguments: [address, ownerToKick],
      };

      const response = await signAndSubmitTransaction({ data: payload });
      await aptos.waitForTransaction({ transactionHash: response.hash });

      setShowKickModal(false);
      setOwnerToKick(null);
      await fetchData();
      setStatus("Kick proposal created.");
    } catch (e) {
      console.error(e);
      setStatus("Failed to create kick proposal.");
    }
  }

  async function handleVoteKick(proposalId: number) {
    if (!account || !address) return;

    try {
      setStatus("Voting...");

      const payload: InputEntryFunctionData = {
        function: `${MULTISIG_MODULE}::vote_kick`,
        typeArguments: [],
        functionArguments: [address, proposalId],
      };

      const response = await signAndSubmitTransaction({ data: payload });
      await aptos.waitForTransaction({ transactionHash: response.hash });

      await fetchData();
      setStatus("Vote submitted.");
    } catch (e) {
      console.error(e);
      setStatus("Failed to vote.");
    }
  }

  async function handlePromoteToAdmin(target: string) {
    if (!account || !address) return;

    try {
      setStatus("Promoting to admin...");

      const payload: InputEntryFunctionData = {
        function: `${MULTISIG_MODULE}::promote_to_admin`,
        typeArguments: [],
        functionArguments: [address, target],
      };

      const response = await signAndSubmitTransaction({ data: payload });
      await aptos.waitForTransaction({ transactionHash: response.hash });

      await fetchData();
      setStatus("User promoted to admin.");
    } catch (e) {
      console.error(e);
      setStatus("Failed to promote user.");
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

  async function handleCancel(proposalId: string | number) {
    if (!account || !address) return;

    try {
      setStatus("Cancelling proposal...");

      const payload: InputEntryFunctionData = {
        function: `${MULTISIG_MODULE}::cancel_proposal`,
        typeArguments: [],
        functionArguments: [
          address,
          Number(proposalId),
        ],
      };

      const response = await signAndSubmitTransaction({ data: payload });
      await aptos.waitForTransaction({ transactionHash: response.hash });

      await fetchData();

      setStatus("Proposal cancelled successfully.");
    } catch (e) {
      console.error(e);
      setStatus("Failed to cancel proposal.");
    }
  }

  

  async function handleVote(proposalId: number | string) {
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

  async function handleExecute(proposalId: number | string) {
    if (!account || !address) return;

    try {
      setStatus("Executing proposal...");

      const payload: InputEntryFunctionData = {
        function: `${MULTISIG_MODULE}::execute`,
        typeArguments: [],
        functionArguments: [address, proposalId],
      };

      const response = await signAndSubmitTransaction({ data: payload });
      await aptos.waitForTransaction({ transactionHash: response.hash });

      await fetchData();
      setStatus("Proposal executed.");
    } catch (e) {
      console.error(e);
      setStatus("Execution failed.");
    }
  }


  async function handleVeto(proposalId: number | string) {
    if (!account || !address) return;

    try {
      setStatus("Vetoing proposal...");

      const payload: InputEntryFunctionData = {
        function: `${MULTISIG_MODULE}::veto`,
        typeArguments: [],
        functionArguments: [address, proposalId],
      };

      const response = await signAndSubmitTransaction({ data: payload });
      await aptos.waitForTransaction({ transactionHash: response.hash });

      await fetchData();
      setStatus("Proposal vetoed.");
    } catch (e) {
      console.error(e);
      setStatus("Failed to veto proposal.");
    }
  }

  async function joinCharityWallet() {
    if (!account || !address) return;

    const payload: InputEntryFunctionData = {
      function: `${MULTISIG_MODULE}::join_charity_wallet`,
      typeArguments: [],
      functionArguments: [address],
    };

    try {
      setStatus("Joining charity wallet...");
      const response = await signAndSubmitTransaction({ data: payload });
      await aptos.waitForTransaction({ transactionHash: response.hash });
      await fetchData();
      setStatus("Successfully joined charity wallet!");
    } catch (e) {
      console.error(e);
      setStatus("Failed to join charity wallet.");
    }
  }

  async function handlePayMonthlyFee() {
    if (!account || !address) return;

    try {
      setStatus("Paying monthly fee...");

      const payload: InputEntryFunctionData = {
        function: `${MULTISIG_MODULE}::pay_monthly_fee`,
        typeArguments: [],
        functionArguments: [address],
      };

      const response = await signAndSubmitTransaction({ data: payload });
      await aptos.waitForTransaction({ transactionHash: response.hash });

      await fetchData();
      setStatus("Monthly fee paid successfully.");
    } catch (e) {
      console.error(e);
      setStatus("Payment failed.");
    }
  }

  async function handleWipeDelinquentMembers() {
    if (!account || !address) return;

    try {
      setStatus("Wiping delinquent members...");

      const payload: InputEntryFunctionData = {
        function: `${MULTISIG_MODULE}::wipe_delinquent_members`,
        typeArguments: [],
        functionArguments: [address],
      };

      const response = await signAndSubmitTransaction({ data: payload });
      await aptos.waitForTransaction({ transactionHash: response.hash });

      await fetchData();
      setStatus("Delinquent members removed.");
    } catch (e) {
      console.error(e);
      setStatus("Wipe failed.");
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
          <OwnerPanel
            isOwner={isOwner}
            isLastAdmin={isLastAdmin}
            walletMode={walletData?.wallet_mode}
            onShowFundModal={() => setShowFundModal(true)}
            onShowLimitsModal={() => setShowLimitsModal(true)}
            onShowLeaveModal={() => setShowLeaveModal(true)}
            onShowMonthlyModal={() => setShowMonthlyModal(true)}
            styles={s}
          />

          {/* CENTER WALLET INFO */}
          <WalletInfo
            walletData={walletData}
            address={address || ""}
            balance={balance}
            currentUserHex={currentUserHex || ""}
            isOwner={isOwner}
            isAdmin={isAdmin}
            formatApt={formatApt}
            styles={s}
            onShowProposeModal={() => setShowProposeModal(true)}
            onShowProposalsModal={() => setShowProposalsModal(true)}
            onShowKickProposalsModal={() => setShowKickProposals(true)}
            setOwnerToKick={setOwnerToKick}
            setShowKickModal={setShowKickModal}
            joinCharityWallet={joinCharityWallet}
            setOwnerToPromote={setOwnerToPromote}
            setShowPromoteModal={setShowPromoteModal}
          />

          {/* ADMIN PANEL */}
          <AdminPanel
            isAdmin={isAdmin}
            walletMode={walletData?.wallet_mode}
            styles={s}
            setShowInviteModal={setShowInviteModal}
            openGovernanceModal={openGovernanceModal}
            openListsModal={openListsModal}
            openUpdateLimitsModal={openUpdateLimitsModal}
            onShowMemberPaymentsModal={() => setShowMemberPaymentsModal(true)}
          />
        </div>
      )}

      {/* ================= INVITE MODAL ================= */}
      <InviteModal
        show={showInviteModal}
        walletFull={walletFull}
        inviteAddress={inviteAddress}
        inviteRole={inviteRole}
        isBlacklisted={isBlacklisted}
        setInviteAddress={setInviteAddress}
        setInviteRole={setInviteRole}
        setShow={setShowInviteModal}
        handleInvite={handleInvite}
        styles={s}
      />

      {/* ================= GOVERNANCE MODAL ================= */}
      <GovernanceModal
        show={showGovernanceModal}
        onlyAdminsInitiate={onlyAdminsInitiate}
        adminsCanVeto={adminsCanVeto}
        votingMode={votingMode}
        MODE_COMBINED={MODE_COMBINED}
        tierTwo={tierTwo}
        tierThree={tierThree}
        setOnlyAdminsInitiate={setOnlyAdminsInitiate}
        setAdminsCanVeto={setAdminsCanVeto}
        setVotingMode={setVotingMode}
        setTierTwo={setTierTwo}
        setTierThree={setTierThree}
        setShow={setShowGovernanceModal}
        handleGovernanceUpdate={handleGovernanceUpdate}
        styles={s}
      />

      {/* ================= LISTS MODAL ================= */}
      <ListsModal
        show={showListsModal}
        useWhitelist={useWhitelist}
        membershipBlacklist={membershipBlacklist}
        handleSetMembershipBlacklist={handleSetMembershipBlacklist}
        handleSetRecipientList={handleSetRecipientList}
        recipientWhitelist={recipientWhitelist}
        recipientBlacklist={recipientBlacklist}
        newListAddress={newListAddress}
        setShow={setShowListsModal}
        setNewListAddress={setNewListAddress}
        handleToggleRecipientMode={handleToggleRecipientMode}
        handleAddToList={handleAddToList}
        handleRemoveFromList={handleRemoveFromList}
        fetchData={fetchData}
        styles={s}
      />

      {/* ================= FUND MODAL ================= */}
      <FundModal
        show={showFundModal}
        fundAmount={fundAmount}
        setFundAmount={setFundAmount}
        setShow={setShowFundModal}
        handleFundWallet={handleFundWallet}
        styles={s}
      />

      {/* ================= LIMITS MODAL ================= */}
      <LimitsModal
        show={showLimitsModal}
        daily={daily}
        weekly={weekly}
        monthly={monthly}
        formatApt={formatApt}
        setShow={setShowLimitsModal}
        styles={s}
      />

      {/* ================= UPDATE LIMITS MODAL ================= */}
      <UpdateLimitsModal
        show={showUpdateLimitsModal}
        dailyLimitInput={dailyLimitInput}
        weeklyLimitInput={weeklyLimitInput}
        monthlyLimitInput={monthlyLimitInput}
        setDailyLimitInput={setDailyLimitInput}
        setWeeklyLimitInput={setWeeklyLimitInput}
        setMonthlyLimitInput={setMonthlyLimitInput}
        handleUpdateLimits={handleUpdateLimits}
        setShow={setShowUpdateLimitsModal}
        styles={s}
      />

      {/* ================= LEAVE WALLET MODAL ================= */}
      <LeaveWalletModal
        show={showLeaveModal}
        setShow={setShowLeaveModal}
        handleSelfRemove={handleSelfRemove}
        styles={s}
      />

      {/* ================= KICK OWNER MODAL ================= */}
      <KickOwnerModal
        show={showKickModal}
        ownerToKick={ownerToKick}
        walletMode={walletData?.wallet_mode}
        setShow={setShowKickModal}
        setOwnerToKick={setOwnerToKick}
        handleKickOwner={handleKickOwner}
        handleProposeKickOwner={handleProposeKickOwner}
        styles={s}
      />

      {/* ================= KICK PROPOSAL MODAL ================= */}
      <KickProposalsModal
        show={showKickProposals}
        walletData={walletData}
        currentUserHex={currentUserHex}
        handleVoteKick={handleVoteKick}
        setShow={setShowKickProposals}
        styles={s}
      />

      {/* ================= PROMOTE TO ADMIN MODAL ================= */}
      <PromoteAdminModal
        show={showPromoteModal}
        ownerToPromote={ownerToPromote}
        setShow={setShowPromoteModal}
        setOwnerToPromote={setOwnerToPromote}
        handlePromote={() => {
          if (ownerToPromote) handlePromoteToAdmin(ownerToPromote);
          setShowPromoteModal(false);
          setOwnerToPromote(null);
        }}
        styles={s}
      />

      {/* ================= PROPOSE TRANSFER MODAL ================= */}
      <ProposeTransferModal
        show={showProposeModal}
        proposalRecipient={proposalRecipient}
        proposalAmount={proposalAmount}
        proposalTimelock={proposalTimelock}
        proposalExecWindow={proposalExecWindow}
        proposalError={proposalError}
        setProposalRecipient={setProposalRecipient}
        setProposalAmount={setProposalAmount}
        setProposalTimelock={setProposalTimelock}
        setProposalExecWindow={setProposalExecWindow}
        handleProposeTransfer={handleProposeTransfer}
        setShow={setShowProposeModal}
        styles={s}
      />

      {/* ================= PROPOSALS MODAL ================= */}
      <ProposalsModal
        show={showProposalsModal}
        walletData={walletData}
        isAdmin={isAdmin}
        expandedApprovals={expandedApprovals}
        setExpandedApprovals={setExpandedApprovals}
        handleVote={handleVote}
        handleVeto={handleVeto}
        handleCancel={handleCancel}
        handleExecute={handleExecute}
        walletMode={walletData?.wallet_mode}
        adminsCanVeto={walletData?.admins_can_veto}
        formatApt={formatApt}
        setShow={setShowProposalsModal}
        MODE_COMBINED={MODE_COMBINED}
        MODE_MAJORITY={MODE_MAJORITY}
        currentUser={address}
        styles={s}
      />

      {/* ================= MONTLY PAYMETNS MODAL ================= */}
      <MonthlyPaymentsModal
        show={showMonthlyModal}
        walletData={walletData}
        currentUserHex={currentUserHex}
        handlePayMonthlyFee={handlePayMonthlyFee}
        setShow={setShowMonthlyModal}
        styles={s}
      />

      <MemberPaymentsAdminModal
        show={showMemberPaymentsModal}
        walletData={walletData}
        handleWipe={handleWipeDelinquentMembers}
        setShow={setShowMemberPaymentsModal}
        styles={s}
      />
    </div>
  );
}
