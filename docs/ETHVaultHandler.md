## `ETHVaultHandler`

Contract in charge of handling the TCAP vault and staking of ETH and WETH.

### `constructor(contract Orchestrator _orchestrator, uint256 _divisor, uint256 _ratio, uint256 _burnFee, uint256 _liquidationPenalty, address _tcapOracle, contract TCAP _tcapAddress, address _collateralAddress, address _collateralOracle, address _ethOracle, address _rewardHandler, address _treasury)` (public)

Constructor

### `receive()` (external)

Only accepts ETH via fallback from the WETH contract.

### `addCollateralETH()` (external)

Adds collateral to the vault using ETH.

The value should be higher than 0. ETH will be turned into WETH.

### `removeCollateralETH(uint256 _amount)` (external)

Removes unused collateral from the vault.

`_amount` value should be higher than 0. WETH will be turned into ETH.


