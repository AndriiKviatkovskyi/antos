module multisig_addr::multisig {
    use std::signer;
    use std::vector;
    use std::option::{Self, Option};
    use std::string::{Self, String};
    use aptos_framework::coin;
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::account::{Self, SignerCapability};
    use aptos_framework::timestamp;
    use aptos_framework::event::{Self, EventHandle};

    /// --- Error codes ---
    const ENOT_OWNER: u64 = 1;
    const EALREADY_APPROVED: u64 = 2;
    const EPROPOSAL_ALREADY_EXECUTED: u64 = 4;
    const EMAX_OWNERS_REACHED: u64 = 5;
    const ENOT_ADMIN: u64 = 6;
    const EPROPOSAL_NOT_FOUND: u64 = 7;
    const EINSUFFICIENT_FUNDS: u64 = 8;
    const ENOT_AUTHORIZED: u64 = 10;
    const EINVALID_THRESHOLDS: u64 = 11;
    const EVETO_DISABLED: u64 = 12;
    const ECANNOT_REMOVE_LAST_ADMIN: u64 = 13;
    const EADDRESS_BLACKLISTED: u64 = 14;
    const ERECIPIENT_NOT_ALLOWED: u64 = 15;
    const ELIMIT_EXCEEDED: u64 = 16;
    const ETIMELOCK_ACTIVE: u64 = 17;
    const EPROPOSAL_EXPIRED: u64 = 18;
    const ENOT_INVITED: u64 = 19;
    const ENOT_CHARITY: u64 = 21;
    const EINVITE_DISABLED_FOR_CHARITY: u64 = 22;

    /// --- Voting Modes ---
    const MODE_MAJORITY: u8 = 1; 
    const MODE_TWO_THIRDS: u8 = 2; 
    const MODE_UNANIMOUS: u8 = 3; 
    const MODE_COMBINED: u8 = 4;

    /// --- Time Constants ---
    const DAY_SECONDS: u64 = 86400;
    const WEEK_SECONDS: u64 = 604800;
    const MONTH_SECONDS: u64 = 2592000;

    /// --- Event Structs ---
    struct MembershipEvent has drop, store {
        wallet_address: address,
        action: String, // "JOINED" or "REMOVED"
        member: address,
        actor: address,
    }

    struct InviteEvent has drop, store {
        wallet_address: address,
        action: String, // "SENT", "ACCEPTED", "REJECTED"
        invitee: address,
        actor: address,
    }

    struct InitializeEvent has drop, store {
        wallet_address: address,
        action: String, // "INITIALIZED" or "INITIALIZED_CHARITY"
        admin: address,
    }

    struct ProposalEvent has drop, store {
        wallet_address: address,
        proposal_id: u64,
        action: String, 
        actor: address,
    }

    struct GovernanceEvent has drop, store {
        wallet_address: address,
        action: String, 
        actor: address,
    }

    /// --- Global Event Store ---
    struct ModuleEvents has key {
        membership_events: EventHandle<MembershipEvent>,
        invite_events: EventHandle<InviteEvent>,
        initialize_events: EventHandle<InitializeEvent>,
        proposal_events: EventHandle<ProposalEvent>,
        governance_events: EventHandle<GovernanceEvent>,
    }

    /// --- Data Structures ---
    struct LimitTracker has store, copy, drop {
        accumulated_amount: u64,
        last_reset_timestamp: u64,
        max_amount: Option<u64>,
    }

    struct Invitation has store, copy, drop {
        invitee: address,
        make_admin: bool,
    }

    struct MemberData has store, copy, drop {
        addr: address,
        last_payment_timestamp: u64,
    }

    struct MultisigStore has key {
        name: vector<u8>,
        owners: vector<address>,
        admins: vector<address>,
        pending_invitations: vector<Invitation>,
        max_owners: u64,
        proposals: vector<Proposal>,
        next_proposal_id: u64,
        signer_cap: SignerCapability,
        only_admins_can_initiate: bool,
        only_admins_can_vote: bool,
        admins_can_veto: bool,
        voting_mode: u8,
        tier_two_threshold: u64,
        tier_three_threshold: u64,
        membership_blacklist: vector<address>,
        recipient_whitelist: vector<address>,
        recipient_blacklist: vector<address>,
        recipient_filter_is_whitelist: bool,
        daily_limit: LimitTracker,
        weekly_limit: LimitTracker,
        monthly_limit: LimitTracker,
        is_charity: bool,
        entry_fee: u64,
        monthly_fee: u64,
        member_payment_history: vector<MemberData>,
    }

    struct Proposal has store, copy, drop {
        id: u64,
        creator: address,
        recipient: address,
        amount: u64, 
        approvals: vector<address>,
        is_executed: bool,
        earliest_execution_time: u64,
        expiry_time: u64,
    }

    struct WalletInfo has copy, drop{
        name: vector<u8>,
        owners: vector<address>,
        admins: vector<address>,
        balance: u64,
        is_charity: bool,
        entry_fee: u64,
        monthly_fee: u64,
        voting_mode: u8,
        recipient_filter_is_whitelist: bool
    }

    fun init_module(admin: &signer) {
        move_to(admin, ModuleEvents {
            membership_events: account::new_event_handle<MembershipEvent>(admin),
            invite_events: account::new_event_handle<InviteEvent>(admin),
            initialize_events: account::new_event_handle<InitializeEvent>(admin),
            proposal_events: account::new_event_handle<ProposalEvent>(admin),
            governance_events: account::new_event_handle<GovernanceEvent>(admin),
        });
    }

    /// --- Initialization ---

    public entry fun initialize(admin: &signer, seed: vector<u8>, max_owners: u64, is_charity: bool, entry_fee: u64, monthly_fee: u64) acquires ModuleEvents {
        let admin_addr = signer::address_of(admin);
        let (resource_signer, resource_cap) = account::create_resource_account(admin, copy seed);
        let wallet_addr = signer::address_of(&resource_signer);
        
        let empty_limit = LimitTracker { accumulated_amount: 0, last_reset_timestamp: 0, max_amount: option::none() };

        move_to(&resource_signer, MultisigStore {
            name: seed,
            owners: vector[admin_addr],
            admins: vector[admin_addr],
            pending_invitations: vector::empty<Invitation>(),
            max_owners,
            proposals: vector::empty<Proposal>(),
            next_proposal_id: 0,
            signer_cap: resource_cap,
            only_admins_can_initiate: false,
            only_admins_can_vote: false,
            admins_can_veto: false,
            voting_mode: MODE_MAJORITY,
            tier_two_threshold: 0,
            tier_three_threshold: 0,
            membership_blacklist: vector::empty<address>(),
            recipient_whitelist: vector::empty<address>(),
            recipient_blacklist: vector::empty<address>(),
            recipient_filter_is_whitelist: false,
            daily_limit: empty_limit,
            weekly_limit: empty_limit,
            monthly_limit: empty_limit,
            is_charity,
            entry_fee,
            monthly_fee,
            member_payment_history: vector[MemberData { addr: admin_addr, last_payment_timestamp: timestamp::now_seconds() }],
        });

        let events = borrow_global_mut<ModuleEvents>(@multisig_addr);
        
        // Emit Initialize Event
        event::emit_event(&mut events.initialize_events, InitializeEvent {
            wallet_address: wallet_addr,
            action: if (is_charity) { string::utf8(b"INITIALIZED_CHARITY") } else { string::utf8(b"INITIALIZED") },
            admin: admin_addr,
        });

        // Emit Joined Event for the Admin
        event::emit_event(&mut events.membership_events, MembershipEvent {
            wallet_address: wallet_addr,
            action: string::utf8(b"JOINED"),
            member: admin_addr,
            actor: admin_addr,
        });
    }

    public entry fun initialize_custom(
        admin: &signer, 
        seed: vector<u8>, 
        max_owners: u64, 
        is_charity: bool, 
        entry_fee: u64, 
        monthly_fee: u64,
        only_admins_can_initiate: bool,
        only_admins_can_vote: bool,
        admins_can_veto: bool,
        voting_mode: u8,
        tier_two_threshold: u64,
        tier_three_threshold: u64,
        daily_max: u64,
        weekly_max: u64,
        monthly_max: u64,
        filter_is_whitelist: bool
    ) acquires ModuleEvents {
        let admin_addr = signer::address_of(admin);
        let (resource_signer, resource_cap) = account::create_resource_account(admin, copy seed);
        let wallet_addr = signer::address_of(&resource_signer);
        let now = timestamp::now_seconds();

        let daily_limit = LimitTracker { 
            accumulated_amount: 0, 
            last_reset_timestamp: now, 
            max_amount: if (daily_max > 0) option::some(daily_max) else option::none() 
        };
        let weekly_limit = LimitTracker { 
            accumulated_amount: 0, 
            last_reset_timestamp: now, 
            max_amount: if (weekly_max > 0) option::some(weekly_max) else option::none() 
        };
        let monthly_limit = LimitTracker { 
            accumulated_amount: 0, 
            last_reset_timestamp: now, 
            max_amount: if (monthly_max > 0) option::some(monthly_max) else option::none() 
        };

        move_to(&resource_signer, MultisigStore {
            name: seed,
            owners: vector[admin_addr],
            admins: vector[admin_addr],
            pending_invitations: vector::empty<Invitation>(),
            max_owners,
            proposals: vector::empty<Proposal>(),
            next_proposal_id: 0,
            signer_cap: resource_cap,
            only_admins_can_initiate,
            only_admins_can_vote,
            admins_can_veto,
            voting_mode,
            tier_two_threshold,
            tier_three_threshold,
            membership_blacklist: vector::empty<address>(),
            recipient_whitelist: vector::empty<address>(),
            recipient_blacklist: vector::empty<address>(),
            recipient_filter_is_whitelist: filter_is_whitelist,
            daily_limit,
            weekly_limit,
            monthly_limit,
            is_charity,
            entry_fee,
            monthly_fee,
            member_payment_history: vector[MemberData { addr: admin_addr, last_payment_timestamp: now }],
        });

        let events = borrow_global_mut<ModuleEvents>(@multisig_addr);

        // Emit Initialize Event
        event::emit_event(&mut events.initialize_events, InitializeEvent {
            wallet_address: wallet_addr,
            action: if (is_charity) { string::utf8(b"INITIALIZED_CHARITY") } else { string::utf8(b"INITIALIZED") },
            admin: admin_addr,
        });

        // Emit Joined Event for the Admin
        event::emit_event(&mut events.membership_events, MembershipEvent {
            wallet_address: wallet_addr,
            action: string::utf8(b"JOINED"),
            member: admin_addr,
            actor: admin_addr,
        });
    }

    /// --- INTERNAL HELPERS ---
    fun find_and_remove(v: &mut vector<address>, addr: address) {
        let (found, index) = vector::index_of(v, &addr);
        if (found) { vector::remove(v, index); };
    }

    fun check_and_update_limit(tracker: &mut LimitTracker, amount: u64, period: u64, now: u64) {
        if (option::is_none(&tracker.max_amount)) return;
        if (now >= tracker.last_reset_timestamp + period) {
            tracker.accumulated_amount = 0;
            tracker.last_reset_timestamp = now;
        };
        let max = *option::borrow(&tracker.max_amount);
        assert!(tracker.accumulated_amount + amount <= max, ELIMIT_EXCEEDED);
        tracker.accumulated_amount = tracker.accumulated_amount + amount;
    }

    /// --- CHARITY & FUNDING ---
    public entry fun join_charity_wallet(caller: &signer, multisig_address: address) acquires MultisigStore, ModuleEvents {
        let store = borrow_global_mut<MultisigStore>(multisig_address);
        let caller_addr = signer::address_of(caller);
        assert!(store.is_charity, ENOT_CHARITY);
        assert!(!vector::contains(&store.owners, &caller_addr), EALREADY_APPROVED);
        assert!(!vector::contains(&store.membership_blacklist, &caller_addr), EADDRESS_BLACKLISTED);
        assert!(vector::length(&store.owners) < store.max_owners, EMAX_OWNERS_REACHED);

        if (store.entry_fee > 0) {
            coin::transfer<AptosCoin>(caller, multisig_address, store.entry_fee);
        };

        let now = timestamp::now_seconds();
        vector::push_back(&mut store.owners, caller_addr);
        vector::push_back(&mut store.member_payment_history, MemberData { addr: caller_addr, last_payment_timestamp: now });

        let events = borrow_global_mut<ModuleEvents>(@multisig_addr);
        event::emit_event(&mut events.membership_events, MembershipEvent {
            wallet_address: multisig_address,
            action: string::utf8(b"JOINED"),
            member: caller_addr,
            actor: caller_addr
        });
    }

    public entry fun pay_monthly_fee(caller: &signer, multisig_address: address) acquires MultisigStore {
        let store = borrow_global_mut<MultisigStore>(multisig_address);
        let caller_addr = signer::address_of(caller);
        assert!(store.is_charity, ENOT_CHARITY);
        assert!(vector::contains(&store.owners, &caller_addr), ENOT_OWNER);

        coin::transfer<AptosCoin>(caller, multisig_address, store.monthly_fee);

        let i = 0;
        while (i < vector::length(&store.member_payment_history)) {
            let member = vector::borrow_mut(&mut store.member_payment_history, i);
            if (member.addr == caller_addr) {
                member.last_payment_timestamp = timestamp::now_seconds();
                break
            };
            i = i + 1;
        };
    }

    public entry fun wipe_delinquent_members(admin: &signer, multisig_address: address) acquires MultisigStore, ModuleEvents {
        let store = borrow_global_mut<MultisigStore>(multisig_address);
        let admin_addr = signer::address_of(admin);
        assert!(vector::contains(&store.admins, &admin_addr), ENOT_ADMIN);
        assert!(store.is_charity, ENOT_CHARITY);

        let now = timestamp::now_seconds();
        let i = 0;
        while (i < vector::length(&store.member_payment_history)) {
            let member_addr = vector::borrow(&store.member_payment_history, i).addr;
            let last_pay = vector::borrow(&store.member_payment_history, i).last_payment_timestamp;

            if (now > last_pay + MONTH_SECONDS && (vector::length(&store.admins) > 1 || !vector::contains(&store.admins, &member_addr))) {
                find_and_remove(&mut store.owners, member_addr);
                find_and_remove(&mut store.admins, member_addr);
                vector::remove(&mut store.member_payment_history, i);
                
                let events = borrow_global_mut<ModuleEvents>(@multisig_addr);
                event::emit_event(&mut events.membership_events, MembershipEvent {
                    wallet_address: multisig_address,
                    action: string::utf8(b"REMOVED"),
                    member: member_addr,
                    actor: admin_addr
                });
            } else {
                i = i + 1;
            };
        };
    }

    public entry fun fund_voluntarily(caller: &signer, multisig_address: address, amount: u64) {
        coin::transfer<AptosCoin>(caller, multisig_address, amount);
    }

    /// --- OWNER MANAGEMENT ---
    public entry fun invite_owner(admin: &signer, multisig_address: address, new_owner: address, make_admin: bool) acquires MultisigStore, ModuleEvents {
        let store = borrow_global_mut<MultisigStore>(multisig_address);
        let admin_addr = signer::address_of(admin);
        assert!(!store.is_charity, EINVITE_DISABLED_FOR_CHARITY);
        assert!(vector::contains(&store.admins, &admin_addr), ENOT_ADMIN);
        assert!(!vector::contains(&store.membership_blacklist, &new_owner), EADDRESS_BLACKLISTED);
        assert!(vector::length(&store.owners) < store.max_owners, EMAX_OWNERS_REACHED);

        let i = 0;
        while (i < vector::length(&store.pending_invitations)) {
            if (vector::borrow(&store.pending_invitations, i).invitee == new_owner) { vector::remove(&mut store.pending_invitations, i); }
            else { i = i + 1; };
        };
        vector::push_back(&mut store.pending_invitations, Invitation { invitee: new_owner, make_admin });

        let events = borrow_global_mut<ModuleEvents>(@multisig_addr);
        event::emit_event(&mut events.invite_events, InviteEvent {
            wallet_address: multisig_address,
            action: string::utf8(b"SENT"),
            invitee: new_owner,
            actor: admin_addr
        });
    }

    public entry fun respond_to_invitation(caller: &signer, multisig_address: address, accept: bool) acquires MultisigStore, ModuleEvents {
        let caller_addr = signer::address_of(caller);
        let store = borrow_global_mut<MultisigStore>(multisig_address);
        let invite_index = option::none<u64>();
        let i = 0;
        while (i < vector::length(&store.pending_invitations)) {
            if (vector::borrow(&store.pending_invitations, i).invitee == caller_addr) { invite_index = option::some(i); break };
            i = i + 1;
        };
        assert!(option::is_some(&invite_index), ENOT_INVITED);
        let Invitation { invitee: _, make_admin } = vector::remove(&mut store.pending_invitations, option::destroy_some(invite_index));
        
        let events = borrow_global_mut<ModuleEvents>(@multisig_addr);
        
        if (accept) {
            assert!(vector::length(&store.owners) < store.max_owners, EMAX_OWNERS_REACHED);
            if (!vector::contains(&store.owners, &caller_addr)) vector::push_back(&mut store.owners, caller_addr);
            if (make_admin && !vector::contains(&store.admins, &caller_addr)) vector::push_back(&mut store.admins, caller_addr);
            
            // Emit Invite Accepted
            event::emit_event(&mut events.invite_events, InviteEvent {
                wallet_address: multisig_address,
                action: string::utf8(b"ACCEPTED"),
                invitee: caller_addr,
                actor: caller_addr
            });

            // Emit Joined Membership
            event::emit_event(&mut events.membership_events, MembershipEvent {
                wallet_address: multisig_address,
                action: string::utf8(b"JOINED"),
                member: caller_addr,
                actor: caller_addr
            });
        } else {
            // Emit Invite Rejected
            event::emit_event(&mut events.invite_events, InviteEvent {
                wallet_address: multisig_address,
                action: string::utf8(b"REJECTED"),
                invitee: caller_addr,
                actor: caller_addr
            });
        }
    }

    public entry fun remove_owner(admin: &signer, multisig_address: address, owner_to_remove: address) acquires MultisigStore, ModuleEvents {
        let store = borrow_global_mut<MultisigStore>(multisig_address);
        let admin_addr = signer::address_of(admin);
        assert!(vector::contains(&store.admins, &admin_addr), ENOT_ADMIN);
        assert!(!vector::contains(&store.admins, &owner_to_remove), ENOT_AUTHORIZED);
        find_and_remove(&mut store.owners, owner_to_remove);
        let i = 0;
        while (i < vector::length(&store.member_payment_history)) {
            if (vector::borrow(&store.member_payment_history, i).addr == owner_to_remove) { vector::remove(&mut store.member_payment_history, i); break };
            i = i + 1;
        };

        let events = borrow_global_mut<ModuleEvents>(@multisig_addr);
        event::emit_event(&mut events.membership_events, MembershipEvent {
            wallet_address: multisig_address,
            action: string::utf8(b"REMOVED"),
            member: owner_to_remove,
            actor: admin_addr
        });
    }

    public entry fun self_remove(caller: &signer, multisig_address: address) acquires MultisigStore, ModuleEvents {
        let store = borrow_global_mut<MultisigStore>(multisig_address);
        let caller_addr = signer::address_of(caller);
        let is_admin = vector::contains(&store.admins, &caller_addr);
        let is_owner = vector::contains(&store.owners, &caller_addr);
        assert!(is_admin || is_owner, ENOT_OWNER);
        if (is_admin) { assert!(vector::length(&store.admins) > 1, ECANNOT_REMOVE_LAST_ADMIN); find_and_remove(&mut store.admins, caller_addr); };
        find_and_remove(&mut store.owners, caller_addr);

        let events = borrow_global_mut<ModuleEvents>(@multisig_addr);
        event::emit_event(&mut events.membership_events, MembershipEvent {
            wallet_address: multisig_address,
            action: string::utf8(b"REMOVED"),
            member: caller_addr,
            actor: caller_addr
        });
    }

    /// --- CONFIGURATION ---

    public entry fun set_transaction_limits(admin: &signer, multisig_address: address, daily: u64, weekly: u64, monthly: u64) acquires MultisigStore, ModuleEvents {
        let store = borrow_global_mut<MultisigStore>(multisig_address);
        let admin_addr = signer::address_of(admin);
        assert!(vector::contains(&store.admins, &admin_addr), ENOT_ADMIN);
        store.daily_limit.max_amount = if (daily > 0) option::some(daily) else option::none();
        store.weekly_limit.max_amount = if (weekly > 0) option::some(weekly) else option::none();
        store.monthly_limit.max_amount = if (monthly > 0) option::some(monthly) else option::none();

        let events = borrow_global_mut<ModuleEvents>(@multisig_addr);
        event::emit_event(&mut events.governance_events, GovernanceEvent {
            wallet_address: multisig_address,
            action: string::utf8(b"LIMIT_UPDATE"),
            actor: admin_addr
        });
    }

    public entry fun update_governance_configs(admin: &signer, multisig_address: address, only_admins_can_initiate: bool, only_admins_can_vote: bool, admins_can_veto: bool, voting_mode: u8, tier_two: u64, tier_three: u64) acquires MultisigStore, ModuleEvents {
        let store = borrow_global_mut<MultisigStore>(multisig_address);
        let admin_addr = signer::address_of(admin);
        assert!(vector::contains(&store.admins, &admin_addr), ENOT_ADMIN);
        if (voting_mode == MODE_COMBINED) { assert!(tier_three > tier_two, EINVALID_THRESHOLDS); };
        store.only_admins_can_initiate = only_admins_can_initiate;
        store.only_admins_can_vote = only_admins_can_vote;
        store.admins_can_veto = admins_can_veto;
        store.voting_mode = voting_mode;
        store.tier_two_threshold = tier_two;
        store.tier_three_threshold = tier_three;

        let events = borrow_global_mut<ModuleEvents>(@multisig_addr);
        event::emit_event(&mut events.governance_events, GovernanceEvent {
            wallet_address: multisig_address,
            action: string::utf8(b"CONFIG_UPDATE"),
            actor: admin_addr
        });
    }

    public entry fun edit_membership_blacklist(admin: &signer, multisig_address: address, addr: address, add: bool) acquires MultisigStore {
        let store = borrow_global_mut<MultisigStore>(multisig_address);
        let admin_addr = signer::address_of(admin);
        assert!(vector::contains(&store.admins, &admin_addr), ENOT_ADMIN);
        if (add) { if (!vector::contains(&store.membership_blacklist, &addr)) vector::push_back(&mut store.membership_blacklist, addr); }
        else { find_and_remove(&mut store.membership_blacklist, addr); };
    }

    public entry fun toggle_recipient_filter_mode(admin: &signer, multisig_address: address, is_whitelist: bool) acquires MultisigStore, ModuleEvents {
        let store = borrow_global_mut<MultisigStore>(multisig_address);
        let admin_addr = signer::address_of(admin);
        assert!(vector::contains(&store.admins, &admin_addr), ENOT_ADMIN);
        store.recipient_filter_is_whitelist = is_whitelist;

        let events = borrow_global_mut<ModuleEvents>(@multisig_addr);
        event::emit_event(&mut events.governance_events, GovernanceEvent {
            wallet_address: multisig_address,
            action: string::utf8(b"FILTER_MODE_TOGGLE"),
            actor: admin_addr
        });
    }

    public entry fun edit_recipient_list(admin: &signer, multisig_address: address, addr: address, add: bool, use_whitelist: bool) acquires MultisigStore {
        let store = borrow_global_mut<MultisigStore>(multisig_address);
        let admin_addr = signer::address_of(admin);
        assert!(vector::contains(&store.admins, &admin_addr), ENOT_ADMIN);
        let list = if (use_whitelist) { &mut store.recipient_whitelist } else { &mut store.recipient_blacklist };
        if (add) { if (!vector::contains(list, &addr)) vector::push_back(list, addr); }
        else { find_and_remove(list, addr); };
    }

    /// --- TRANSACTION LOGIC ---

    public entry fun propose_transfer(creator: &signer, multisig_address: address, recipient: address, amount: u64, timelock_seconds: u64, execution_window: u64) acquires MultisigStore, ModuleEvents {
        let creator_addr = signer::address_of(creator);
        let store = borrow_global_mut<MultisigStore>(multisig_address);
        if (store.only_admins_can_initiate) { assert!(vector::contains(&store.admins, &creator_addr), ENOT_AUTHORIZED); }
        else { assert!(vector::contains(&store.owners, &creator_addr), ENOT_OWNER); };
        if (store.recipient_filter_is_whitelist) { assert!(vector::contains(&store.recipient_whitelist, &recipient), ERECIPIENT_NOT_ALLOWED); }
        else { assert!(!vector::contains(&store.recipient_blacklist, &recipient), ERECIPIENT_NOT_ALLOWED); };
        let now = timestamp::now_seconds();
        let proposal_id = store.next_proposal_id;
        let new_proposal = Proposal { 
            id: proposal_id, 
            creator: creator_addr, 
            recipient, 
            amount, 
            approvals: vector::empty<address>(), 
            is_executed: false, 
            earliest_execution_time: now + timelock_seconds, 
            expiry_time: if (execution_window > 0) { now + timelock_seconds + execution_window } else { 0 }, 
        };
        vector::push_back(&mut store.proposals, new_proposal);
        store.next_proposal_id = proposal_id + 1;

        let events = borrow_global_mut<ModuleEvents>(@multisig_addr);
        event::emit_event(&mut events.proposal_events, ProposalEvent {
            wallet_address: multisig_address,
            proposal_id,
            action: string::utf8(b"CREATED"),
            actor: creator_addr
        });
    }

    public entry fun approve(approver: &signer, multisig_address: address, proposal_id: u64) acquires MultisigStore, ModuleEvents {
        let approver_addr = signer::address_of(approver);
        let store = borrow_global_mut<MultisigStore>(multisig_address);
        if (store.only_admins_can_vote) { assert!(vector::contains(&store.admins, &approver_addr), ENOT_AUTHORIZED); }
        else { assert!(vector::contains(&store.owners, &approver_addr), ENOT_OWNER); };
        let i = 0;
        let len = vector::length(&store.proposals);
        while (i < len) {
            let proposal = vector::borrow_mut(&mut store.proposals, i);
            if (proposal.id == proposal_id) {
                let now = timestamp::now_seconds();
                assert!(!proposal.is_executed, EPROPOSAL_ALREADY_EXECUTED);
                assert!(!vector::contains(&proposal.approvals, &approver_addr), EALREADY_APPROVED);
                if (proposal.expiry_time > 0) { assert!(now <= proposal.expiry_time, EPROPOSAL_EXPIRED); };
                vector::push_back(&mut proposal.approvals, approver_addr);
                
                let events = borrow_global_mut<ModuleEvents>(@multisig_addr);
                event::emit_event(&mut events.proposal_events, ProposalEvent {
                    wallet_address: multisig_address,
                    proposal_id,
                    action: string::utf8(b"APPROVED"),
                    actor: approver_addr
                });

                let total_voters = if (store.only_admins_can_vote) { vector::length(&store.admins) } else { vector::length(&store.owners) };
                let active_mode = store.voting_mode;
                if (active_mode == MODE_COMBINED) {
                    if (proposal.amount < store.tier_two_threshold) { active_mode = MODE_MAJORITY; }
                    else if (proposal.amount < store.tier_three_threshold) { active_mode = MODE_TWO_THIRDS; }
                    else { active_mode = MODE_UNANIMOUS; };
                };
                let num_approvals = vector::length(&proposal.approvals);
                let threshold_met = false;
                if (active_mode == MODE_MAJORITY) { threshold_met = num_approvals >= (total_voters / 2 + 1); }
                else if (active_mode == MODE_TWO_THIRDS) { threshold_met = (3 * num_approvals) >= (2 * total_voters); }
                else if (active_mode == MODE_UNANIMOUS) { threshold_met = num_approvals == total_voters; };
                if (threshold_met) {
                    assert!(now >= proposal.earliest_execution_time, ETIMELOCK_ACTIVE);
                    check_and_update_limit(&mut store.daily_limit, proposal.amount, DAY_SECONDS, now);
                    check_and_update_limit(&mut store.weekly_limit, proposal.amount, WEEK_SECONDS, now);
                    check_and_update_limit(&mut store.monthly_limit, proposal.amount, MONTH_SECONDS, now);
                    let treasury_signer = account::create_signer_with_capability(&store.signer_cap);
                    coin::transfer<AptosCoin>(&treasury_signer, proposal.recipient, proposal.amount);
                    proposal.is_executed = true;

                    event::emit_event(&mut events.proposal_events, ProposalEvent {
                        wallet_address: multisig_address,
                        proposal_id,
                        action: string::utf8(b"EXECUTED"),
                        actor: approver_addr
                    });
                };
                return
            };
            i = i + 1;
        };
        abort EPROPOSAL_NOT_FOUND
    }

    public entry fun veto(admin: &signer, multisig_address: address, proposal_id: u64) acquires MultisigStore, ModuleEvents {
        let store = borrow_global_mut<MultisigStore>(multisig_address);
        let admin_addr = signer::address_of(admin);
        assert!(store.admins_can_veto, EVETO_DISABLED);
        assert!(vector::contains(&store.admins, &admin_addr), ENOT_ADMIN);
        let i = 0;
        let len = vector::length(&store.proposals);
        while (i < len) {
            let proposal = vector::borrow_mut(&mut store.proposals, i);
            if (proposal.id == proposal_id) {
                assert!(!proposal.is_executed, EPROPOSAL_ALREADY_EXECUTED);
                proposal.is_executed = true; 

                let events = borrow_global_mut<ModuleEvents>(@multisig_addr);
                event::emit_event(&mut events.proposal_events, ProposalEvent {
                    wallet_address: multisig_address,
                    proposal_id,
                    action: string::utf8(b"VETOED"),
                    actor: admin_addr
                });
                return
            };
            i = i + 1;
        };
        abort EPROPOSAL_NOT_FOUND
    }

    #[view]
    public fun get_wallet_info(multisig_address: address): WalletInfo acquires MultisigStore {
        let store = borrow_global<MultisigStore>(multisig_address);
        WalletInfo { name: store.name, owners: store.owners, admins: store.admins, balance: coin::balance<AptosCoin>(multisig_address), is_charity: store.is_charity, entry_fee: store.entry_fee, monthly_fee: store.monthly_fee, voting_mode: store.voting_mode, recipient_filter_is_whitelist: store.recipient_filter_is_whitelist }
    }

    #[test_only]
    use aptos_framework::account::create_account_for_test;

    #[test(admin = @multisig_addr, user = @0x456, invitee = @0x789)]
    public entry fun test_multisig_flow(
        admin: &signer, 
        user: &signer, 
        invitee: &signer
    ) acquires MultisigStore, ModuleEvents {
        let admin_addr = signer::address_of(admin);
        let user_addr = signer::address_of(user);
        let invitee_addr = signer::address_of(invitee);
        
        // 1. Setup environment
        create_account_for_test(admin_addr);
        create_account_for_test(user_addr);
        create_account_for_test(invitee_addr);
        aptos_framework::timestamp::set_time_has_started_for_testing(&create_account_for_test(@0x1));
        
        // Initialize the global event store
        init_module(admin);

        // 2. Test Initialization (Charity)
        let seed = b"charity_multisig";
        initialize(admin, copy seed, 5, true, 100, 50);
        
        let resource_addr = account::create_resource_address(&admin_addr, seed);
        
        let events_store = borrow_global<ModuleEvents>(@multisig_addr);
        assert!(event::counter(&events_store.initialize_events) == 1, 101);
        assert!(event::counter(&events_store.membership_events) == 1, 102);

        // 3. Test Joining (Charity Logic)
        let (burn_cap, mint_cap) = aptos_framework::aptos_coin::initialize_for_test(&create_account_for_test(@0x1));
        coin::register<AptosCoin>(user);
        let coins = coin::mint<AptosCoin>(1000, &mint_cap);
        coin::deposit(user_addr, coins);

        join_charity_wallet(user, resource_addr);

        let count_after_charity = event::counter(&borrow_global<ModuleEvents>(@multisig_addr).membership_events);
        assert!(count_after_charity == 2, 103);

        // 4. Test Invitation Logic (Non-Charity)
        let seed2 = b"standard_multisig";
        initialize(admin, copy seed2, 5, false, 0, 0);
        let resource_addr2 = account::create_resource_address(&admin_addr, seed2);

        // After 2nd init, counter should be 3 (2 from before + 1 for new admin join)
        assert!(event::counter(&borrow_global<ModuleEvents>(@multisig_addr).membership_events) == 3, 104);

        invite_owner(admin, resource_addr2, invitee_addr, false);
        assert!(event::counter(&borrow_global<ModuleEvents>(@multisig_addr).invite_events) == 1, 105);

        respond_to_invitation(invitee, resource_addr2, true);

        // After invite accept: 
        // invite_events: SENT (1) + ACCEPTED (1) = 2
        // membership_events: Previous (3) + New Join (1) = 4
        let final_events = borrow_global<ModuleEvents>(@multisig_addr);
        assert!(event::counter(&final_events.invite_events) == 2, 106);
        assert!(event::counter(&final_events.membership_events) == 4, 107);

        // 5. Test Removal
        self_remove(invitee, resource_addr2);
        // Total membership events: 4 + 1 = 5
        assert!(event::counter(&borrow_global<ModuleEvents>(@multisig_addr).membership_events) == 5, 108);

        // Clean up caps
        aptos_framework::coin::destroy_burn_cap(burn_cap);
        aptos_framework::coin::destroy_mint_cap(mint_cap);
    }
}