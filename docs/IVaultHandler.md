## `IVaultHandler`

Contract in charge of handling the TCAP Token and stake



### `vaultExists()`

Reverts if the user hasn't created a vault.



### `notZero(uint256 _value)`

Reverts if value is 0.




### `constructor(contract Orchestrator _orchestrator, uint256 _divisor, uint256 _ratio, uint256 _burnFee, uint256 _liquidationPenalty, address _tcapOracle, contract TCAP _tcapAddress, address _collateralAddress, address _collateralOracle, address _ethOracle, address _rewardHandler, address _treasury)` (internal)

Constructor




### `setRatio(uint256 _ratio)` (external)

Sets the collateral ratio needed to mint tokens


Only owner can call it

### `setBurnFee(uint256 _burnFee)` (external)

Sets the burn fee percentage an user pays when burning tcap tokens


Only owner can call it

### `setLiquidationPenalty(uint256 _liquidationPenalty)` (external)

Sets the liquidation penalty % charged on liquidation


Only owner can call it
recommended value is between 1-15% and can't be above 100%

### `setRewardHandler(address _rewardHandler)` (external)

Sets the reward handler address


Only owner can call it
if not set rewards are not given

### `setTreasury(address _treasury)` (external)

Sets the treasury contract address


Only owner can call it

### `createVault()` (external)

Allows an user to create an unique Vault


Only one vault per address can be created

### `addCollateral(uint256 _amount)` (external)

Allows users to add collateral to their vaults


_amount should be higher than 0
ERC20 token must be approved first

### `removeCollateral(uint256 _amount)` (external)

Allows users to remove collateral currently not being used to generate TCAP tokens from their vaults


reverts if the resulting ratio is less than the minimum ratio
_amount should be higher than 0
transfers the collateral back to the user

### `mint(uint256 _amount)` (external)

Uses collateral to generate debt on TCAP Tokens which are minted and assigned to caller


_amount should be higher than 0
requires to have a vault ratio above the minimum ratio
if reward handler is set stake to earn rewards

### `burn(uint256 _amount)` (external)

Pays the debt of TCAP tokens resulting them on burn, this releases collateral up to minimum vault ratio


_amount should be higher than 0
A fee of exactly burnFee must be sent as value on ETH
The fee goes to the treasury contract
if reward handler is set exit rewards

### `liquidateVault(uint256 _vaultId, uint256 _requiredTCAP)` (external)

Allow users to burn TCAP tokens to liquidate vaults with vault collateral ratio under the minium ratio, the liquidator receives the staked collateral of the liquidated vault at a premium


Resulting ratio must be above or equal minimum ratio
A fee of exactly burnFee must be sent as value on ETH
The fee goes to the treasury contract //TODO

### `pause()` (external)

Allows owner to Pause the Contract



### `unpause()` (external)

Allows owner to Unpause the Contract



### `supportsInterface(bytes4 _interfaceId) → bool` (external)

ERC165 Standard for support of interfaces




### `recoverERC20(address _tokenAddress, uint256 _tokenAmount)` (external)

 Added to support recovering LP Rewards from other systems such as BAL to be distributed to holders


Only owner  can call it

### `safeTransferETH(address _to, uint256 _value)` (internal)

Allows the safe transfer of ETH




### `getVault(uint256 _id) → uint256, uint256, address, uint256` (external)

Returns the Vault information of specified identifier




### `getOraclePrice(contract ChainlinkOracle _oracle) → uint256 price` (public)

Returns the price of the chainlink oracle multiplied by the digits to get 18 decimals format




### `TCAPPrice() → uint256 price` (public)

Returns the price of the TCAP token


TCAP token is 18 decimals
oracle totalMarketPrice must be in wei format
P = T / d
P = TCAP Token Price
T = Total Crypto Market Cap
d = Divisor

### `requiredCollateral(uint256 _amount) → uint256 collateral` (public)

Returns the minimal required collateral to mint TCAP token


TCAP token is 18 decimals
C = ((P * A * r) / 100) / cp
C = Required Collateral
P = TCAP Token Price
A = Amount to Mint
cp = Collateral Price
r = Minimum Ratio for Liquidation
Is only divided by 100 as eth price comes in wei to cancel the additional 0s

### `requiredLiquidationTCAP(uint256 _vaultId) → uint256 amount` (public)

Returns the minimal required TCAP to liquidate a Vault


LT = ((((D * r) / 100) - cTcap) * 100) / (r - (p + 100))
cTcap = ((C * cp) / P)
LT = Required TCAP
D = Vault Debt
C = Required Collateral
P = TCAP Token Price
cp = Collateral Price
r = Min Vault Ratio
p = Liquidation Penalty

### `liquidationReward(uint256 _vaultId) → uint256 rewardCollateral` (public)

Returns the Reward for liquidating a vault


the returned value is returned as collateral currency
R = (LT * (p  + 100)) / 100
R = Liquidation Reward
LT = Required Liquidation TCAP
p = liquidation penalty

### `getVaultRatio(uint256 _vaultId) → uint256 currentRatio` (public)

Returns the Collateral Ratio of the Vault


vr = (cp * (C * 100)) / D * P
vr = Vault Ratio
C = Vault Collateral
cp = Collateral Price
D = Vault Debt
P = TCAP Token Price

### `getFee(uint256 _amount) → uint256 fee` (public)

Returns the required fee to burn the TCAP tokens


The returned value is returned in wei
f = ((P * A * b)/ 100)
f = Burn Fee Value
P = TCAP Token Price
A = Amount to Burn
b = Burn Fee %

### `_checkBurnFee(uint256 _amount)` (internal)

reverts if burn is different than required




### `_burn(uint256 _vaultId, uint256 _amount)` (internal)

Burns an amount of TCAP Tokens





### `NewRatio(address _owner, uint256 _ratio)`

An event emitted when the ratio is updated



### `NewBurnFee(address _owner, uint256 _burnFee)`

An event emitted when the burn fee is updated



### `NewLiquidationPenalty(address _owner, uint256 _liquidationPenalty)`

An event emitted when the liquidation penalty is updated



### `NewRewardHandler(address _owner, address _rewardHandler)`

An event emitted when the reward handler contract is updated



### `NewTreasury(address _owner, address _tresury)`

An event emitted when the treasury contract is updated



### `VaultCreated(address _owner, uint256 _id)`

An event emitted when a vault is created



### `CollateralAdded(address _owner, uint256 _id, uint256 _amount)`

An event emitted when collateral is added to a vault



### `CollateralRemoved(address _owner, uint256 _id, uint256 _amount)`

An event emitted when collateral is removed from a vault



### `TokensMinted(address _owner, uint256 _id, uint256 _amount)`

An event emitted when tokens are minted



### `TokensBurned(address _owner, uint256 _id, uint256 _amount)`

An event emitted when tokens are burned



### `VaultLiquidated(uint256 _vaultId, address _liquidator, uint256 _liquidationCollateral, uint256 _reward)`

An event emitted when a vault is liquidated



### `Recovered(address _token, uint256 _amount)`

An event emitted when a erc20 token is recovered



