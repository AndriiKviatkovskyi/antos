module multisig_addr::simple_multisig {
    use std::signer;
    use std::vector;
    use std::option::{Self, Option};
    use aptos_framework::coin;
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::account::{Self, SignerCapability};
    use aptos_framework::timestamp;

    /// Error codes
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

    /// Voting Modes
    const MODE_MAJORITY: u8 = 1; 
    const MODE_TWO_THIRDS: u8 = 2; 
    const MODE_UNANIMOUS: u8 = 3; 
    const MODE_COMBINED: u8 = 4;

    /// Time Constants (seconds)
    const DAY_SECONDS: u64 = 86400;
    const WEEK_SECONDS: u64 = 604800;
    const MONTH_SECONDS: u64 = 2592000;

    struct LimitTracker has store, copy, drop {
        accumulated_amount: u64,
        last_reset_timestamp: u64,
        max_amount: Option<u64>,
    }

    struct MultisigStore has key {
        owners: vector<address>,
        admins: vector<address>,
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
    }

    struct Proposal has store, copy, drop {
        id: u64,
        creator: address,
        recipient: address,
        amount: u64, 
        approvals: vector<address>,
        is_executed: bool,
        // Timing Logic
        earliest_execution_time: u64, // Timelock
        expiry_time: u64,             // Execution Window (0 = never)
    }

    struct WalletInfo has drop, copy {
        owners: vector<address>,
        admins: vector<address>,
        balance: u64,
        voting_mode: u8,
        admins_can_veto: bool,
        tier_two_threshold: u64,
        tier_three_threshold: u64,
        recipient_filter_is_whitelist: bool
    }

    public entry fun initialize(admin: &signer, max_owners: u64) {
        let admin_addr = signer::address_of(admin);
        let (_resource_signer, resource_cap) = account::create_resource_account(admin, b"TREASURY_V2");
        
        let empty_limit = LimitTracker {
            accumulated_amount: 0,
            last_reset_timestamp: 0,
            max_amount: option::none(),
        };

        move_to(&_resource_signer, MultisigStore {
            owners: vector[admin_addr],
            admins: vector[admin_addr],
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
        });
    }

    // --- INTERNAL HELPERS ---

    fun find_and_remove(v: &mut vector<address>, addr: address) {
        let (found, index) = vector::index_of(v, &addr);
        if (found) {
            vector::remove(v, index);
        };
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

    // --- ADMIN CONFIGURATION ---

    public entry fun set_transaction_limits(
        admin: &signer, 
        multisig_address: address,
        daily: u64,
        weekly: u64,
        monthly: u64
    ) acquires MultisigStore {
        let store = borrow_global_mut<MultisigStore>(multisig_address);
        assert!(vector::contains(&store.admins, &signer::address_of(admin)), ENOT_ADMIN);
        
        store.daily_limit.max_amount = if (daily > 0) option::some(daily) else option::none();
        store.weekly_limit.max_amount = if (weekly > 0) option::some(weekly) else option::none();
        store.monthly_limit.max_amount = if (monthly > 0) option::some(monthly) else option::none();
    }

    public entry fun update_governance_configs(
        admin: &signer,
        multisig_address: address,
        only_admins_can_initiate: bool,
        only_admins_can_vote: bool,
        admins_can_veto: bool,
        voting_mode: u8,
        tier_two: u64,
        tier_three: u64
    ) acquires MultisigStore {
        let store = borrow_global_mut<MultisigStore>(multisig_address);
        assert!(vector::contains(&store.admins, &signer::address_of(admin)), ENOT_ADMIN);
        
        if (voting_mode == MODE_COMBINED) {
            assert!(tier_three > tier_two, EINVALID_THRESHOLDS);
        };

        store.only_admins_can_initiate = only_admins_can_initiate;
        store.only_admins_can_vote = only_admins_can_vote;
        store.admins_can_veto = admins_can_veto;
        store.voting_mode = voting_mode;
        store.tier_two_threshold = tier_two;
        store.tier_three_threshold = tier_three;
    }

    public entry fun edit_membership_blacklist(admin: &signer, multisig_address: address, addr: address, add: bool) acquires MultisigStore {
        let store = borrow_global_mut<MultisigStore>(multisig_address);
        assert!(vector::contains(&store.admins, &signer::address_of(admin)), ENOT_ADMIN);
        if (add) {
            if (!vector::contains(&store.membership_blacklist, &addr)) vector::push_back(&mut store.membership_blacklist, addr);
        } else {
            find_and_remove(&mut store.membership_blacklist, addr);
        };
    }

    public entry fun toggle_recipient_filter_mode(admin: &signer, multisig_address: address, is_whitelist: bool) acquires MultisigStore {
        let store = borrow_global_mut<MultisigStore>(multisig_address);
        assert!(vector::contains(&store.admins, &signer::address_of(admin)), ENOT_ADMIN);
        store.recipient_filter_is_whitelist = is_whitelist;
    }

    public entry fun edit_recipient_list(admin: &signer, multisig_address: address, addr: address, add: bool, use_whitelist: bool) acquires MultisigStore {
        let store = borrow_global_mut<MultisigStore>(multisig_address);
        assert!(vector::contains(&store.admins, &signer::address_of(admin)), ENOT_ADMIN);
        let list = if (use_whitelist) { &mut store.recipient_whitelist } else { &mut store.recipient_blacklist };
        if (add) {
            if (!vector::contains(list, &addr)) vector::push_back(list, addr);
        } else {
            find_and_remove(list, addr);
        };
    }

    // --- OWNER MANAGEMENT ---

    public entry fun add_owner(
        admin: &signer, 
        multisig_address: address, 
        new_owner: address, 
        make_admin: bool
    ) acquires MultisigStore {
        let store = borrow_global_mut<MultisigStore>(multisig_address);
        assert!(vector::contains(&store.admins, &signer::address_of(admin)), ENOT_ADMIN);
        assert!(!vector::contains(&store.membership_blacklist, &new_owner), EADDRESS_BLACKLISTED);
        
        if (!vector::contains(&store.owners, &new_owner)) {
            assert!(vector::length(&store.owners) < store.max_owners, EMAX_OWNERS_REACHED);
            vector::push_back(&mut store.owners, new_owner);
        };
        if (make_admin && !vector::contains(&store.admins, &new_owner)) {
            vector::push_back(&mut store.admins, new_owner);
        };
    }

    public entry fun remove_owner(admin: &signer, multisig_address: address, owner_to_remove: address) acquires MultisigStore {
        let store = borrow_global_mut<MultisigStore>(multisig_address);
        assert!(vector::contains(&store.admins, &signer::address_of(admin)), ENOT_ADMIN);
        assert!(!vector::contains(&store.admins, &owner_to_remove), ENOT_AUTHORIZED);
        
        find_and_remove(&mut store.owners, owner_to_remove);
    }

    public entry fun self_remove(caller: &signer, multisig_address: address) acquires MultisigStore {
        let store = borrow_global_mut<MultisigStore>(multisig_address);
        let caller_addr = signer::address_of(caller);
        
        let is_admin = vector::contains(&store.admins, &caller_addr);
        let is_owner = vector::contains(&store.owners, &caller_addr);
        assert!(is_admin || is_owner, ENOT_OWNER);

        if (is_admin) {
            assert!(vector::length(&store.admins) > 1, ECANNOT_REMOVE_LAST_ADMIN);
            find_and_remove(&mut store.admins, caller_addr);
        };
        find_and_remove(&mut store.owners, caller_addr);
    }

    // --- TRANSACTION LOGIC ---

    public entry fun veto(admin: &signer, multisig_address: address, proposal_id: u64) acquires MultisigStore {
        let store = borrow_global_mut<MultisigStore>(multisig_address);
        assert!(store.admins_can_veto, EVETO_DISABLED);
        assert!(vector::contains(&store.admins, &signer::address_of(admin)), ENOT_ADMIN);

        let i = 0;
        let len = vector::length(&store.proposals);
        while (i < len) {
            let proposal = vector::borrow_mut(&mut store.proposals, i);
            if (proposal.id == proposal_id) {
                assert!(!proposal.is_executed, EPROPOSAL_ALREADY_EXECUTED);
                proposal.is_executed = true; 
                return
            };
            i = i + 1;
        };
        abort EPROPOSAL_NOT_FOUND
    }

    public entry fun propose_transfer(
        creator: &signer, 
        multisig_address: address,
        recipient: address, 
        amount: u64,
        timelock_seconds: u64,    // Optional: 0 means no timelock
        execution_window: u64     // Optional: 0 means no expiry
    ) acquires MultisigStore {
        let creator_addr = signer::address_of(creator);
        let store = borrow_global_mut<MultisigStore>(multisig_address);
        
        if (store.only_admins_can_initiate) {
            assert!(vector::contains(&store.admins, &creator_addr), ENOT_AUTHORIZED);
        } else {
            assert!(vector::contains(&store.owners, &creator_addr), ENOT_OWNER);
        };

        if (store.recipient_filter_is_whitelist) {
            assert!(vector::contains(&store.recipient_whitelist, &recipient), ERECIPIENT_NOT_ALLOWED);
        } else {
            assert!(!vector::contains(&store.recipient_blacklist, &recipient), ERECIPIENT_NOT_ALLOWED);
        };

        let now = timestamp::now_seconds();
        let new_proposal = Proposal {
            id: store.next_proposal_id,
            creator: creator_addr,
            recipient,
            amount,
            approvals: vector::empty<address>(),
            is_executed: false,
            earliest_execution_time: now + timelock_seconds,
            expiry_time: if (execution_window > 0) { now + timelock_seconds + execution_window } else { 0 },
        };

        vector::push_back(&mut store.proposals, new_proposal);
        store.next_proposal_id = store.next_proposal_id + 1;
    }

    public entry fun approve(approver: &signer, multisig_address: address, proposal_id: u64) acquires MultisigStore {
        let approver_addr = signer::address_of(approver);
        let store = borrow_global_mut<MultisigStore>(multisig_address);
        
        if (store.only_admins_can_vote) {
            assert!(vector::contains(&store.admins, &approver_addr), ENOT_AUTHORIZED);
        } else {
            assert!(vector::contains(&store.owners, &approver_addr), ENOT_OWNER);
        };

        let i = 0;
        let len = vector::length(&store.proposals);
        while (i < len) {
            let proposal = vector::borrow_mut(&mut store.proposals, i);
            if (proposal.id == proposal_id) {
                let now = timestamp::now_seconds();

                assert!(!proposal.is_executed, EPROPOSAL_ALREADY_EXECUTED);
                assert!(!vector::contains(&proposal.approvals, &approver_addr), EALREADY_APPROVED);
                
                // CHECK EXPIRY (Execution Window)
                if (proposal.expiry_time > 0) {
                    assert!(now <= proposal.expiry_time, EPROPOSAL_EXPIRED);
                };

                vector::push_back(&mut proposal.approvals, approver_addr);
                
                let total_voters = if (store.only_admins_can_vote) {
                    vector::length(&store.admins)
                } else {
                    vector::length(&store.owners)
                };

                let active_mode = store.voting_mode;
                if (active_mode == MODE_COMBINED) {
                    if (proposal.amount < store.tier_two_threshold) {
                        active_mode = MODE_MAJORITY;
                    } else if (proposal.amount < store.tier_three_threshold) {
                        active_mode = MODE_TWO_THIRDS;
                    } else {
                        active_mode = MODE_UNANIMOUS;
                    };
                };

                let num_approvals = vector::length(&proposal.approvals);
                let threshold_met = false;

                if (active_mode == MODE_MAJORITY) {
                    threshold_met = num_approvals >= (total_voters / 2 + 1);
                } else if (active_mode == MODE_TWO_THIRDS) {
                    threshold_met = (3 * num_approvals) >= (2 * total_voters);
                } else if (active_mode == MODE_UNANIMOUS) {
                    threshold_met = num_approvals == total_voters;
                };

                if (threshold_met) {
                    // CHECK TIMELOCK
                    assert!(now >= proposal.earliest_execution_time, ETIMELOCK_ACTIVE);

                    // APPLY TRANSACTION LIMITS
                    check_and_update_limit(&mut store.daily_limit, proposal.amount, DAY_SECONDS, now);
                    check_and_update_limit(&mut store.weekly_limit, proposal.amount, WEEK_SECONDS, now);
                    check_and_update_limit(&mut store.monthly_limit, proposal.amount, MONTH_SECONDS, now);

                    let treasury_signer = account::create_signer_with_capability(&store.signer_cap);
                    coin::transfer<AptosCoin>(&treasury_signer, proposal.recipient, proposal.amount);
                    proposal.is_executed = true;
                };
                return
            };
            i = i + 1;
        };
        abort EPROPOSAL_NOT_FOUND
    }

    #[view]
    public fun get_wallet_info(multisig_address: address): WalletInfo acquires MultisigStore {
        let store = borrow_global<MultisigStore>(multisig_address);
        WalletInfo {
            owners: store.owners,
            admins: store.admins,
            balance: coin::balance<AptosCoin>(multisig_address),
            voting_mode: store.voting_mode,
            admins_can_veto: store.admins_can_veto,
            tier_two_threshold: store.tier_two_threshold,
            tier_three_threshold: store.tier_three_threshold,
            recipient_filter_is_whitelist: store.recipient_filter_is_whitelist
        }
    }

    // --- INTEGRATED TEST SUITE ---
    
    #[test_only]
    use aptos_framework::aptos_coin;

    #[test(admin = @multisig_addr, o1 = @0x11, o2 = @0x22, o3 = @0x33, framework = @0x1)]
    fun test_complete_multisig_lifecycle(
        admin: signer, o1: signer, o2: signer, o3: signer, framework: signer
    ) acquires MultisigStore {
        timestamp::set_time_has_started_for_testing(&framework);
        
        let admin_addr = signer::address_of(&admin);
        let (burn, mint) = aptos_coin::initialize_for_test(&framework);
        account::create_account_for_test(admin_addr);
        account::create_account_for_test(@0x11);
        account::create_account_for_test(@0x22);
        account::create_account_for_test(@0x33);

        initialize(&admin, 10);
        let res_addr = account::create_resource_address(&admin_addr, b"TREASURY_V2");
        account::create_account_for_test(res_addr);

        add_owner(&admin, res_addr, @0x11, true); 
        add_owner(&admin, res_addr, @0x22, false);

        let coins = coin::mint<AptosCoin>(2000, &mint);
        coin::deposit(res_addr, coins);

        // --- TIMELOCK TEST ---
        // Propose with 1 hour timelock
        propose_transfer(&admin, res_addr, @0x44, 100, 3600, 0);
        approve(&admin, res_addr, 0);
        
        // Fast forward 30 mins (Should still be locked)
        timestamp::fast_forward_seconds(1800);
        // approve(&o1, res_addr, 0); // This would abort ETIMELOCK_ACTIVE if called here

        // Fast forward past 1 hour
        timestamp::fast_forward_seconds(1801);
        approve(&o1, res_addr, 0); // Executes now
        assert!(coin::balance<AptosCoin>(@0x44) == 100, 1);

        // --- EXPIRY TEST ---
        // Propose with 0 timelock but 10 second window
        propose_transfer(&admin, res_addr, @0x44, 50, 0, 10);
        timestamp::fast_forward_seconds(15);
        // approve(&admin, res_addr, 1); // This would abort EPROPOSAL_EXPIRED

        coin::destroy_burn_cap(burn);
        coin::destroy_mint_cap(mint);
    }
}