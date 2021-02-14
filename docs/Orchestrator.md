## `Orchestrator`

Orchestrator contract in charge of managing the settings of the vaults and TCAP token



### `onlyGuardian()`

Throws if called by any account other than the guardian.



### `validVault(contract IVaultHandler _vault)`

Throws if vault is not valid.




### `validTCAP(contract TCAP _tcap)`

Throws if TCAP Token is not valid.




### `validChainlinkOracle(address _oracle)`

Throws if Chainlink Oracle is not valid.





### `constructor(address _guardian)` (public)

Construct a new Orchestrator




### `setGuardian(address _guardian)` (external)

Sets the guardian of the orchestrator


Only owner can call it

### `setRatio(contract IVaultHandler _vault, uint256 _ratio)` (external)

Sets the ratio of a vault


Only owner can call it

### `setBurnFee(contract IVaultHandler _vault, uint256 _burnFee)` (external)

Sets the burn fee of a vault


Only owner can call it

### `setEmergencyBurnFee(contract IVaultHandler _vault)` (external)

Sets the burn fee to 0, only used on a black swan event


Only owner can call it
Validates if _vault is valid

### `setLiquidationPenalty(contract IVaultHandler _vault, uint256 _liquidationPenalty)` (external)

Sets the liquidation penalty of a vault


Only owner can call it

### `setEmergencyLiquidationPenalty(contract IVaultHandler _vault)` (external)

Sets the liquidation penalty of a vault to 0, only used on a black swan event


Only owner can call it
Validates if _vault is valid

### `setRewardHandler(contract IVaultHandler _vault, address _rewardHandler)` (external)

Sets the reward handler address of a vault


Only owner can call it

### `pauseVault(contract IVaultHandler _vault)` (external)

/**
Pauses the Vault


Only guardian can call it
Validates if _vault is valid

### `unpauseVault(contract IVaultHandler _vault)` (external)

Unpauses the Vault


Only guardian can call it
Validates if _vault is valid

### `retrieveETH(address _to)` (external)

Retrieves the eth stuck on the orchestrator


Only owner can call it

### `enableTCAPCap(contract TCAP _tcap, bool _enable)` (external)

Enables or disables the TCAP Cap


Only owner can call it
Validates if _tcap is valid

### `setTCAPCap(contract TCAP _tcap, uint256 _cap)` (external)

Sets the TCAP maximum minting value


Only owner can call it
Validates if _tcap is valid

### `addTCAPVault(contract TCAP _tcap, contract IVaultHandler _vault)` (external)

Adds Vault to TCAP ERC20


Only owner can call it
Validates if _tcap is valid
Validates if _vault is valid

### `removeTCAPVault(contract TCAP _tcap, contract IVaultHandler _vault)` (external)

Removes Vault to TCAP ERC20


Only owner can call it
Validates if _tcap is valid
Validates if _vault is valid

### `executeTransaction(address target, uint256 value, string signature, bytes data) → bytes` (external)





### `receive()` (external)

Allows the contract to receive ETH




### `LogSetGuardian(address _owner, address guardian)`



Logs all the calls of the functions.

### `LogExecuteTransaction(address target, uint256 value, string signature, bytes data)`





