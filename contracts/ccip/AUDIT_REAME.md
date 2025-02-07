# Audit of Bridge contracts using CCIP

These contracts are designed to relay governance proposals from the [Governance contract](../governance/GovernorBeta.sol)
to other networks for execution. The bridge does not transfer funds but solely relays and executes governance messages on the destination chain.

### Use Cases:
- Modify parameters of contract owned by Governance on the destination chain
- Move funds from the [Treasury](../base/CryptexBaseTreasury.sol).

### contracts that need to be audited
- [GovernanceCCIPRelay.sol](./GovernanceCCIPRelay.sol)
- [GovernanceCCIPReceiver.sol](./GovernanceCCIPReceiver.sol)
- [CryptexBaseTreasury](../base/CryptexBaseTreasury.sol)

Note: For [CryptexBaseTreasury](../base/CryptexBaseTreasury.sol) assume that the 
[BaseTreasury](../BaseTreasury.sol) is already audited. Only review the onlyOwner modifier.

### Test
- Tests for these contracts can be found in the [test directory](../../test/ccip/)
- [GovernanceCCIPIntegrationTest.t.sol](../../test/ccip/GovernanceCCIPIntegrationTest.t.sol) is the integration test for these contracts.

### Architecture
                 ┌──────────────────────────┐
                 │   Governance Contract    │
                 │  (GovernorBeta.sol)      │
                 └──────────┬───────────────┘
                            │
                            ▼
                 ┌──────────────────────────┐
                 │        Timelock          │
                 │   (Timelock.sol)         │
                 └──────────┬───────────────┘
                            │
                            ▼
                 ┌──────────────────────────┐
                 │ GovernanceCCIPRelay.sol  │
                 │   (Ethereum Mainnet)     │
                 └──────────┬───────────────┘
                            │
                            ▼
                 ┌──────────────────────────┐
                 │     CCIP Router (Mainnet)│
                 └──────────┬───────────────┘
                            │
                            ▼
                 ┌──────────────────────────┐
                 │     CCIP Router (Dest)   │
                 └──────────┬───────────────┘
                            │
                            ▼
                 ┌──────────────────────────┐
                 │ GovernanceCCIPReceiver   │
                 │  (Destination Chain)     │
                 └──────────┬───────────────┘
                            │
                            ▼
                 ┌──────────────────────────┐
                 │  Contract on Dest Chain  │
                 │    (Executes Proposal)   │
                 └──────────────────────────┘
### Workflow
1. Governance Contract creates a proposal that requires execution on another chain.
2. The Timelock executes the proposal and sends it to GovernanceCCIPRelay.sol on Ethereum.
3. GovernanceCCIPRelay.sol sends the message to the CCIP Router on Ethereum Mainnet.
4. The CCIP Router relays the message to the CCIP Router on the destination chain.
5. GovernanceCCIPReceiver.sol receives the message and validates the sender.
6. If valid, GovernanceCCIPReceiver.sol executes the proposal on the destination chain.

