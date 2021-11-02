## `Orchestrator`

Orchestrator contract in charge of managing the settings of the vaults and TCAP token.

### `onlyGuardian()`

Throws if called by any account other than the guardian.

### `validVault(contract IVaultHandler _vault)`

Throws if vault is not valid.

### `validTCAP(contract TCAP _tcap)`

Throws if TCAP Token is not valid.

### `validChainlinkOracle(address _oracle)`

Throws if Chainlink oracle is not valid.

### `constructor(address _guardian)` (public)

Construct a new Orchestrator.

### `setGuardian(address _guardian)` (external)

Sets the guardian of the orchestrator. 

Only the owner can call this function.

### `setRatio(contract IVaultHandler _vault, uint256 _ratio)` (external)

Sets the ratio of a vault. 

Only the owner can call this function.

### `setBurnFee(contract IVaultHandler _vault, uint256 _burnFee)` (external)

Sets the burn fee of a vault. 

Only the owner can call this function.

### `setEmergencyBurnFee(contract IVaultHandler _vault)` (external)

Sets the burn fee to 0, only used on a black swan event. 

Only the owner can call this function.

Validates if `_vault` is valid.

### `setLiquidationPenalty(contract IVaultHandler _vault, uint256 _liquidationPenalty)` (external)

Sets the liquidation penalty of a vault. 

Only the owner can call this function.

### `setEmergencyLiquidationPenalty(contract IVaultHandler _vault)` (external)

Sets the liquidation penalty of a vault to 0, only used on a black swan event.

Only the owner can call this function.

Validates if `_vault` is valid.

### `setRewardHandler(contract IVaultHandler _vault, address _rewardHandler)` (external)

Sets the reward handler address of a vault. 

Only the owner can call this function.

### `pauseVault(contract IVaultHandler _vault)` (external)

Pauses the vault. 

Only the guardian can call this function.

Validates if `_vault` is valid.

### `unpauseVault(contract IVaultHandler _vault)` (external)

Unpauses the vault. 

Only the guardian can call this function.

Validates if `_vault` is valid.

### `retrieveETH(address _to)` (external)

Retrieves the ETH stuck on the orchestrator. 

Only the owner can call this function.

### `enableTCAPCap(contract TCAP _tcap, bool _enable)` (external)

Enables or disables the TCAP maximum minting cap. 

Only the owner can call this function. 

Validates if `_tcap` is valid.

### `setTCAPCap(contract TCAP _tcap, uint256 _cap)` (external)

Sets the TCAP maximum minting cap value. 

Only the owner can call this function.

Validates if `_tcap` is valid.

### `addTCAPVault(contract TCAP _tcap, contract IVaultHandler _vault)` (external)

Adds a vault to TCAP ERC20. 

Only the owner can call this function. 

Validates if `_tcap` and `_vault` are valid.

### `removeTCAPVault(contract TCAP _tcap, contract IVaultHandler _vault)` (external)

Removes a vault from TCAP ERC20. 

Only the owner can call this function.

Validates if `_tcap` and `_vault` are valid.

### `executeTransaction(address target, uint256 value, string signature, bytes data) → bytes` (external)

### `receive()` (external)

Allows the contract to receive ETH.

### `LogSetGuardian(address _owner, address guardian)`

Logs all the calls of the functions.

### `LogExecuteTransaction(address target, uint256 value, string signature, bytes data)`
