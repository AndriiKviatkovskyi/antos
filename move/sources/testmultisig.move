module multisig_addr::simple_multisig {
    use std::signer;
    use std::vector;
    use aptos_framework::coin;
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::account::{Self, SignerCapability};

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

    /// Voting Modes
    const MODE_MAJORITY: u8 = 1; 
    const MODE_TWO_THIRDS: u8 = 2; 
    const MODE_UNANIMOUS: u8 = 3; 
    const MODE_COMBINED: u8 = 4;

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
    }

    struct Proposal has store, copy, drop {
        id: u64,
        creator: address,
        recipient: address,
        amount: u64, 
        approvals: vector<address>,
        is_executed: bool,
    }

    struct WalletInfo has drop, copy {
        owners: vector<address>,
        admins: vector<address>,
        balance: u64,
        voting_mode: u8,
        tier_two_threshold: u64,
        tier_three_threshold: u64,
        admins_can_veto: bool
    }

    public entry fun initialize(admin: &signer, max_owners: u64) {
        let admin_addr = signer::address_of(admin);
        let (_resource_signer, resource_cap) = account::create_resource_account(admin, b"TREASURY_V1");
        
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
        });
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

    public entry fun veto(admin: &signer, multisig_address: address, proposal_id: u64) acquires MultisigStore {
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
                return
            };
            i = i + 1;
        };
        abort EPROPOSAL_NOT_FOUND
    }

    public entry fun add_owner(admin: &signer, multisig_address: address, new_owner: address, make_admin: bool) acquires MultisigStore {
        let store = borrow_global_mut<MultisigStore>(multisig_address);
        assert!(vector::contains(&store.admins, &signer::address_of(admin)), ENOT_ADMIN);
        if (!vector::contains(&store.owners, &new_owner)) {
            assert!(vector::length(&store.owners) < store.max_owners, EMAX_OWNERS_REACHED);
            vector::push_back(&mut store.owners, new_owner);
        };
        if (make_admin && !vector::contains(&store.admins, &new_owner)) {
            vector::push_back(&mut store.admins, new_owner);
        };
    }

    public entry fun propose_transfer(creator: &signer, multisig_address: address, recipient: address, amount: u64) acquires MultisigStore {
        let creator_addr = signer::address_of(creator);
        let store = borrow_global_mut<MultisigStore>(multisig_address);
        if (store.only_admins_can_initiate) { assert!(vector::contains(&store.admins, &creator_addr), ENOT_AUTHORIZED); }
        else { assert!(vector::contains(&store.owners, &creator_addr), ENOT_OWNER); };

        let new_proposal = Proposal { id: store.next_proposal_id, creator: creator_addr, recipient, amount, approvals: vector::empty<address>(), is_executed: false };
        vector::push_back(&mut store.proposals, new_proposal);
        store.next_proposal_id = store.next_proposal_id + 1;
    }

    public entry fun approve(approver: &signer, multisig_address: address, proposal_id: u64) acquires MultisigStore {
        let approver_addr = signer::address_of(approver);
        let store = borrow_global_mut<MultisigStore>(multisig_address);
        
        if (store.only_admins_can_vote) { assert!(vector::contains(&store.admins, &approver_addr), ENOT_AUTHORIZED); }
        else { assert!(vector::contains(&store.owners, &approver_addr), ENOT_OWNER); };

        let i = 0;
        let len = vector::length(&store.proposals);
        while (i < len) {
            let proposal = vector::borrow_mut(&mut store.proposals, i);
            if (proposal.id == proposal_id) {
                assert!(!proposal.is_executed, EPROPOSAL_ALREADY_EXECUTED);
                assert!(!vector::contains(&proposal.approvals, &approver_addr), EALREADY_APPROVED);
                
                vector::push_back(&mut proposal.approvals, approver_addr);
                
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
            tier_two_threshold: store.tier_two_threshold,
            tier_three_threshold: store.tier_three_threshold,
            admins_can_veto: store.admins_can_veto
        }
    }

    // --- TEST SECTION ---

    #[test_only]
    use aptos_framework::aptos_coin;

    #[test(admin = @multisig_addr, o1 = @0x11, o2 = @0x22, o3 = @0x33, framework = @0x1)]
    fun test_combined_and_veto_governance(
        admin: signer, o1: signer, o2: signer, o3: signer, framework: signer
    ) acquires MultisigStore {
        let admin_addr = signer::address_of(&admin);
        let (burn, mint) = aptos_coin::initialize_for_test(&framework);
        account::create_account_for_test(admin_addr);
        account::create_account_for_test(@0x11);
        account::create_account_for_test(@0x22);
        account::create_account_for_test(@0x33);

        initialize(&admin, 10);
        let res_addr = account::create_resource_address(&admin_addr, b"TREASURY_V1");
        account::create_account_for_test(res_addr);

        add_owner(&admin, res_addr, @0x11, false); 
        add_owner(&admin, res_addr, @0x22, false);
        add_owner(&admin, res_addr, @0x33, false);

        // 1. Setup Combined Mode + Veto Enabled
        update_governance_configs(&admin, res_addr, false, false, true, MODE_COMBINED, 100, 500);
        
        let coins = coin::mint<AptosCoin>(2000, &mint);
        coin::deposit(res_addr, coins);

        // 2. Test Combined Tier 1 (Majority)
        propose_transfer(&o1, res_addr, @0x44, 50);
        approve(&admin, res_addr, 0);
        approve(&o1, res_addr, 0);
        assert!(coin::balance<AptosCoin>(@0x44) == 0, 1); 
        approve(&o2, res_addr, 0);
        assert!(coin::balance<AptosCoin>(@0x44) == 50, 2); 

        // 3. Test Combined Tier 3 (Unanimous)
        propose_transfer(&o1, res_addr, @0x55, 600);
        approve(&admin, res_addr, 1);
        approve(&o1, res_addr, 1);
        approve(&o2, res_addr, 1);
        assert!(coin::balance<AptosCoin>(@0x55) == 0, 3);
        approve(&o3, res_addr, 1);
        assert!(coin::balance<AptosCoin>(@0x55) == 600, 4); 

        // 4. Test Veto Functionality
        propose_transfer(&o1, res_addr, @0x66, 100);
        approve(&o1, res_addr, 2);
        // Admin decides to kill it
        veto(&admin, res_addr, 2);
        
        // Confirm it's marked executed (killed) without sending money
        let info = get_wallet_info(res_addr);
        assert!(info.balance == 1350, 5); // 2000 - 50 - 600 = 1350
        assert!(coin::balance<AptosCoin>(@0x66) == 0, 6);

        coin::destroy_burn_cap(burn);
        coin::destroy_mint_cap(mint);
    }
}