## `ETHVaultHandler`

Contract in charge of handling the TCAP Vault and stake using a ETH and WETH




### `constructor(contract Orchestrator _orchestrator, uint256 _divisor, uint256 _ratio, uint256 _burnFee, uint256 _liquidationPenalty, address _tcapOracle, contract TCAP _tcapAddress, address _collateralAddress, address _collateralOracle, address _ethOracle, address _rewardHandler, address _treasury)` (public)

Constructor




### `receive()` (external)

only accept ETH via fallback from the WETH contract



### `addCollateralETH()` (external)

Adds collateral to vault using ETH


value should be higher than 0
ETH is turned into WETH

### `removeCollateralETH(uint256 _amount)` (external)

Removes not used collateral from vault


_amount should be higher than 0
WETH is turned into ETH


