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
    const EALREADY_ADMIN: u64 = 9;
    const ENOT_AUTHORIZED: u64 = 10;

    /// Voting Modes
    const MODE_MAJORITY: u8 = 1; 
    const MODE_TWO_THIRDS: u8 = 2; 
    const MODE_UNANIMOUS: u8 = 3; 

    struct MultisigStore has key {
        owners: vector<address>,
        admins: vector<address>,
        max_owners: u64,
        proposals: vector<Proposal>,
        next_proposal_id: u64,
        signer_cap: SignerCapability,
        only_admins_can_initiate: bool,
        only_admins_can_vote: bool,
        voting_mode: u8,
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
        only_admins_can_initiate: bool,
        only_admins_can_vote: bool,
        voting_mode: u8
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
            voting_mode: MODE_MAJORITY,
        });
    }

    public entry fun update_governance_configs(
        admin: &signer,
        multisig_address: address,
        only_admins_can_initiate: bool,
        only_admins_can_vote: bool,
        voting_mode: u8
    ) acquires MultisigStore {
        let store = borrow_global_mut<MultisigStore>(multisig_address);
        assert!(vector::contains(&store.admins, &signer::address_of(admin)), ENOT_ADMIN);
        store.only_admins_can_initiate = only_admins_can_initiate;
        store.only_admins_can_vote = only_admins_can_vote;
        store.voting_mode = voting_mode;
    }

    public entry fun add_owner(
        admin: &signer, 
        multisig_address: address, 
        new_owner: address, 
        make_admin: bool
    ) acquires MultisigStore {
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

    public entry fun propose_transfer(
        creator: &signer, 
        multisig_address: address,
        recipient: address, 
        amount: u64
    ) acquires MultisigStore {
        let creator_addr = signer::address_of(creator);
        let store = borrow_global_mut<MultisigStore>(multisig_address);
        
        if (store.only_admins_can_initiate) {
            assert!(vector::contains(&store.admins, &creator_addr), ENOT_AUTHORIZED);
        } else {
            assert!(vector::contains(&store.owners, &creator_addr), ENOT_OWNER);
        };

        let new_proposal = Proposal {
            id: store.next_proposal_id,
            creator: creator_addr,
            recipient,
            amount,
            approvals: vector::empty<address>(), // Start empty to avoid creator double-approving
            is_executed: false,
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
                assert!(!proposal.is_executed, EPROPOSAL_ALREADY_EXECUTED);
                assert!(!vector::contains(&proposal.approvals, &approver_addr), EALREADY_APPROVED);
                
                vector::push_back(&mut proposal.approvals, approver_addr);
                
                let total_voters = if (store.only_admins_can_vote) {
                    vector::length(&store.admins)
                } else {
                    vector::length(&store.owners)
                };

                let num_approvals = vector::length(&proposal.approvals);
                let threshold_met = false;

                if (store.voting_mode == MODE_MAJORITY) {
                    threshold_met = num_approvals >= (total_voters / 2 + 1);
                } else if (store.voting_mode == MODE_TWO_THIRDS) {
                    threshold_met = (3 * num_approvals) >= (2 * total_voters);
                } else if (store.voting_mode == MODE_UNANIMOUS) {
                    threshold_met = num_approvals == total_voters;
                };

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
            only_admins_can_initiate: store.only_admins_can_initiate,
            only_admins_can_vote: store.only_admins_can_vote,
            voting_mode: store.voting_mode
        }
    }

    #[test_only]
    use aptos_framework::aptos_coin;

    #[test(admin = @multisig_addr, o1 = @0x11, o2 = @0x22, o3 = @0x33, framework = @0x1)]
    fun test_complex_governance(
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

        add_owner(&admin, res_addr, @0x11, true); 
        add_owner(&admin, res_addr, @0x22, false);
        add_owner(&admin, res_addr, @0x33, false);

        // --- TEST 1: Unanimous Admins Only ---
        // Voters: Admin, O1 (Total 2). Mode: Unanimous.
        update_governance_configs(&admin, res_addr, false, true, MODE_UNANIMOUS);
        
        let coins = coin::mint<AptosCoin>(1000, &mint);
        coin::deposit(res_addr, coins);

        propose_transfer(&o2, res_addr, @0x44, 100); 
        approve(&admin, res_addr, 0);
        assert!(coin::balance<AptosCoin>(@0x44) == 0, 1); // Not executed yet
        approve(&o1, res_addr, 0);
        assert!(coin::balance<AptosCoin>(@0x44) == 100, 2); // Executed

        // --- TEST 2: 2/3 Owners ---
        // Voters: Admin, O1, O2, O3 (Total 4). 3*num >= 2*4(8) -> Needs 3 votes.
        update_governance_configs(&admin, res_addr, false, false, MODE_TWO_THIRDS);
        
        propose_transfer(&o3, res_addr, @0x55, 100);
        approve(&admin, res_addr, 1);
        approve(&o1, res_addr, 1);
        assert!(coin::balance<AptosCoin>(@0x55) == 0, 3); // 2/4 is not 2/3
        approve(&o2, res_addr, 1);
        assert!(coin::balance<AptosCoin>(@0x55) == 100, 4); // 3/4 is 2/3

        coin::destroy_burn_cap(burn);
        coin::destroy_mint_cap(mint);
    }
}