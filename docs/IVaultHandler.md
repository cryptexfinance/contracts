## `IVaultHandler`

Contract in charge of handling the TCAP Token and staking.

### `vaultExists()`

Reverts if the user hasn't created a vault.

### `notZero(uint256 _value)`

Reverts if value is 0.

### `constructor(contract Orchestrator _orchestrator, uint256 _divisor, uint256 _ratio, uint256 _burnFee, uint256 _liquidationPenalty, address _tcapOracle, contract TCAP _tcapAddress, address _collateralAddress, address _collateralOracle, address _ethOracle, address _rewardHandler, address _treasury)` (internal)

Constructor

### `setRatio(uint256 _ratio)` (external)

Sets the collateral ratio needed to mint tokens. 

Only the owner can call this function.

### `setBurnFee(uint256 _burnFee)` (external)

Sets the burn fee percentage a user pays when burning TCAP tokens. 

Only the owner can call this function.

### `setLiquidationPenalty(uint256 _liquidationPenalty)` (external)

Sets the penalty percentage charged on liquidation.

The recommended value is between 1-15% and cannot be set above 100%.

Only the owner can call this function.

### `setRewardHandler(address _rewardHandler)` (external)

Sets the reward handler address. 

Rewards will not be given if `rewardHandler` is not set.

Only the owner can call this function.

### `setTreasury(address _treasury)` (external)

Sets the treasury contract address. 

Only the owner can call this function.

### `createVault()` (external)

Allows a user to create a unique vault. Only one vault per address can be created.

### `addCollateral(uint256 _amount)` (external)

Allows users to add collateral to their vaults. 

`_amount` should be a value higher than 0, and the ERC20 token must be approved first.

### `removeCollateral(uint256 _amount)` (external)

Allows users to remove collateral currently not being used to generate TCAP tokens from their vaults. 
This will revert if the resulting ratio is less than the minimum ratio. Removed collateral will be transferred
back to the user.

`_amount` should be a value higher than 0.

### `mint(uint256 _amount)` (external)

Uses collateral to generate debt on TCAP Tokens which are minted and assigned to caller.
This function requires the caller to have a vault ratio above the minimum ratio.
If a reward handler has been set, stake to earn rewards. <!-- TODO: This sentence reads difficult. -->

`_amount` should be a value higher than 0.

### `burn(uint256 _amount)` (external)

Pays the debt of TCAP tokens by burning them and releasing collateral up to the minimum vault ratio.
A fee of exactly `burnFee` must be sent as a value in ETH which will be transferred to the treasury contract.
If a reward handler has been set, exit rewards. <!-- TODO: This sentence reads difficult. -->

`_amount` should be a value higher than 0.

### `liquidateVault(uint256 _vaultId, uint256 _requiredTCAP)` (external)

Allow users to burn TCAP tokens to liquidate vaults. With a vault collateral ratio under the minimum ratio, 
the liquidator will receive the staked collateral of the liquidated vault at a premium. 
The resulting ratio must be equal to or above the minimum ratio. 

A fee of exactly `burnFee` must be sent as a value in ETH which will be transferred to the treasury contract.

### `pause()` (external)

Allows the owner to pause the contract.

### `unpause()` (external)

Allows the owner to unpause the contract.

### `supportsInterface(bytes4 _interfaceId) → bool` (external)

ERC165 Standard for support of interfaces.

### `recoverERC20(address _tokenAddress, uint256 _tokenAmount)` (external)

Added to support recovering LP rewards from other systems such as BAL to be distributed to holders. 

Only the owner can call this function.

### `safeTransferETH(address _to, uint256 _value)` (internal)

Allows the safe transfer of ETH.

### `getVault(uint256 _id) → uint256, uint256, address, uint256` (external)

Returns vault information for the specified identifier.

### `getOraclePrice(contract ChainlinkOracle _oracle) → uint256 price` (public)

Returns the price of the Chainlink oracle multiplied by the digits to get 18 decimals format.

### `TCAPPrice() → uint256 price` (public)

Returns the price of the TCAP token.

TCAP token is 18 decimals.

Oracle `totalMarketPrice` must be in wei format.

Formula: `P = T / d`
* P = TCAP Token Price
* T = Total Crypto Market Cap
* d = Divisor

### `requiredCollateral(uint256 _amount) → uint256 collateral` (public)

Returns the minimum collateral required to mint a TCAP token.

TCAP token is 18 decimals.

Formula: `C = ((P * A * r) / 100) / cp`
* C = Required Collateral
* P = TCAP Token Price
* A = Amount to Mint
* cp = Collateral Price
* r = Minimum Ratio for Liquidation

Division by 100 is used to remove the additional 0s as the ETH price denomination is in wei.

### `requiredLiquidationTCAP(uint256 _vaultId) → uint256 amount` (public)

Returns the minimum TCAP required to liquidate a vault.

Formula: `LT = ((((D * r) / 100) - cTcap) * 100) / (r - (p + 100))`
* LT = Required TCAP
* D = Vault Debt
* C = Required Collateral
* P = TCAP Token Price
* cp = Collateral Price
* r = Min Vault Ratio
* p = Liquidation Penalty
* cTcap = ((C * cp) / P)

### `liquidationReward(uint256 _vaultId) → uint256 rewardCollateral` (public)

Returns the reward for liquidating a vault. The returned value is returned as collateral currency.

Formula: `R = (LT * (p  + 100)) / 100`
* R = Liquidation Reward
* LT = Required Liquidation TCAP
* p = Liquidation Penalty

### `getVaultRatio(uint256 _vaultId) → uint256 currentRatio` (public)

Returns the collateral ratio of the vault.

Formula: `vr = (cp * (C * 100)) / D * P`
* vr = Vault Ratio
* C = Vault Collateral
* cp = Collateral Price
* D = Vault Debt
* P = TCAP Token Price

### `getFee(uint256 _amount) → uint256 fee` (public)

Returns the fee, in wei, required to burn TCAP tokens.

Formula: `f = ((P * A * b)/ 100)`
* f = Burn Fee Value
* P = TCAP Token Price
* A = Amount to Burn
* b = Burn Fee Percentage

### `_checkBurnFee(uint256 _amount)` (internal)

Reverts if the burn fee is different from what is required.

### `_burn(uint256 _vaultId, uint256 _amount)` (internal)

Burns an amount of TCAP tokens.

### `NewRatio(address _owner, uint256 _ratio)`

An event emitted when the ratio has been updated.

### `NewBurnFee(address _owner, uint256 _burnFee)`

An event emitted when the burn fee has been updated.

### `NewLiquidationPenalty(address _owner, uint256 _liquidationPenalty)`

An event emitted when the liquidation penalty has been updated.

### `NewRewardHandler(address _owner, address _rewardHandler)`

An event emitted when the reward handler contract has been updated.

### `NewTreasury(address _owner, address _tresury)`

An event emitted when the treasury contract has been updated.

### `VaultCreated(address _owner, uint256 _id)`

An event emitted when a new vault has been created.

### `CollateralAdded(address _owner, uint256 _id, uint256 _amount)`

An event emitted when collateral has been added to a vault.

### `CollateralRemoved(address _owner, uint256 _id, uint256 _amount)`

An event emitted when collateral has been removed from a vault.

### `TokensMinted(address _owner, uint256 _id, uint256 _amount)`

An event emitted when tokens have been minted.

### `TokensBurned(address _owner, uint256 _id, uint256 _amount)`

An event emitted when tokens have been burned.

### `VaultLiquidated(uint256 _vaultId, address _liquidator, uint256 _liquidationCollateral, uint256 _reward)`

An event emitted when a vault has been liquidated.

### `Recovered(address _token, uint256 _amount)`

An event emitted when an ERC20 token has been recovered.
