#![cfg(test)]
use soroban_sdk::{testutils::Ledger as _, Address, BytesN, Env, String};
use tax_attribute::{AttributeDefinition, TaxAttributeContract, TaxAttributeContractClient};

fn setup_test_env() -> (Env, TaxAttributeContractClient<'static>, Address, Address) {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, TaxAttributeContract);
    let client = TaxAttributeContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let issuer = Address::generate(&env);

    client.init(&admin);
    client.add_issuer(&issuer);

    (env, client, admin, issuer)
}

fn create_definition(
    env: &Env,
    tag_id: &str,
    valid_from: u64,
    valid_until: u64,
) -> AttributeDefinition {
    AttributeDefinition {
        tag_id: String::from_str(env, tag_id),
        jurisdiction: String::from_str(env, "US"),
        regulation_code: String::from_str(env, "SEC-REG-D"),
        eligibility_criteria_hash: BytesN::from_array(env, &[0u8; 32]),
        valid_from,
        valid_until,
    }
}

#[test]
fn test_attach_valid_current_attribute_succeeds() {
    let (env, client, _admin, issuer) = setup_test_env();
    env.ledger().set(soroban_sdk::testutils::LedgerInfo {
        timestamp: 1000,
        protocol_version: 20,
        sequence_number: 1,
        network_id: [0u8; 32],
        base_reserve: 0,
    });

    let definition = create_definition(&env, "tag-1", 500, 2000);
    client.attach_tax_attribute(&issuer, &1, &definition);

    let attached = client.get_attributes_for_token(&1);
    assert_eq!(attached.len(), 1);
    assert_eq!(attached.get(0).unwrap().tag_id, String::from_str(&env, "tag-1"));
}

#[test]
fn test_attach_future_attribute_succeeds() {
    let (env, client, _admin, issuer) = setup_test_env();
    env.ledger().set(soroban_sdk::testutils::LedgerInfo {
        timestamp: 1000,
        protocol_version: 20,
        sequence_number: 1,
        network_id: [0u8; 32],
        base_reserve: 0,
    });

    let definition = create_definition(&env, "tag-future", 1500, 3000);
    client.attach_tax_attribute(&issuer, &1, &definition);

    let active_attributes = client.get_attributes_for_token(&1);
    assert_eq!(active_attributes.len(), 0);
}

#[test]
#[should_panic(expected = "Cannot attach an expired attribute")]
fn test_attach_expired_attribute_fails() {
    let (env, client, _admin, issuer) = setup_test_env();
    env.ledger().set(soroban_sdk::testutils::LedgerInfo {
        timestamp: 1000,
        protocol_version: 20,
        sequence_number: 1,
        network_id: [0u8; 32],
        base_reserve: 0,
    });

    let definition = create_definition(&env, "tag-expired", 100, 900);
    client.attach_tax_attribute(&issuer, &1, &definition);
}

#[test]
fn test_attach_exactly_at_expiration_boundary_succeeds() {
    let (env, client, _admin, issuer) = setup_test_env();
    env.ledger().set(soroban_sdk::testutils::LedgerInfo {
        timestamp: 1000,
        protocol_version: 20,
        sequence_number: 1,
        network_id: [0u8; 32],
        base_reserve: 0,
    });

    let definition = create_definition(&env, "tag-edge", 500, 1000);
    client.attach_tax_attribute(&issuer, &1, &definition);

    let attached = client.get_attributes_for_token(&1);
    assert_eq!(attached.len(), 1);
}