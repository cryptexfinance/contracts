## `RewardHandler`

### `updateReward(address _account)`

Updates the reward and time when called. <!-- TODO: Does this update the reward and time _for an account_ when called? -->

### `onlyVault()`

Reverts if the caller is not a vault.

### `constructor(address _owner, address _rewardsToken, address _vault)` (public)

Constructs a new RewardHandler.

### `totalSupply() → uint256` (external)

Returns the total amount of TCAP tokens minted and getting rewards on this vault.

### `balanceOf(address _account) → uint256` (external)

Returns the amount of TCAP tokens minted and getting rewards from a specific user `_account`.

### `getRewardForDuration() → uint256` (external)

### `stake(address _staker, uint256 _amount)` (external)

Called when TCAP is minted, adding the minted value as stake. 

Rewards will be updated when called. 

Only the vault can call this function.

### `exit(address _staker)` (external)

Removes all stake and transfers all rewards to the staker. 

Only the vault can call this function.

### `notifyRewardAmount(uint256 _reward)` (external)

Notifies the contract that a reward has been added to be given and increases the duration of rewards. 

Only the owner can call this function.

### `recoverERC20(address _tokenAddress, uint256 _tokenAmount)` (external)

Added to support recovering LP rewards from other systems such as BAL to be distributed to holders.

Only the owner can call this function.

### `setRewardsDuration(uint256 _rewardsDuration)` (external)

Updates the reward duration. Previous rewards must be complete. 
Only the owner can call this function.

### `lastTimeRewardApplicable() → uint256` (public)

Returns the minimum between current block timestamp or the finish period of rewards.

### `rewardPerToken() → uint256` (public)

Returns the calculated reward per token deposited.

### `earned(address _account) → uint256` (public)

Returns the amount of reward tokens a user has earned.

### `min(uint256 _a, uint256 _b) → uint256` (public)

Returns the minimum between two variables.

### `withdraw(address _staker, uint256 _amount)` (public)

Called when TCAP is burned or liquidated, removing the burned value as stake. 

Rewards will be updated when called.

Only the vault can call this function.

### `getRewardFromVault(address _staker)` (public)

Called when TCAP is burned or liquidated, transferring the current amount of rewards tokens earned to the staker.

Rewards will be updated when called.

Only the vault can call this function.

### `getReward()` (public)

Transfers the current amount of rewards tokens earned to the caller. 

Rewards will be updated when called.

### `RewardAdded(uint256 reward)`

An event emitted when a reward has been added.

### `Staked(address user, uint256 amount)`

An event emitted when TCAP is minted and staked to earn rewards.

### `Withdrawn(address user, uint256 amount)`

An event emitted when TCAP is burned and removed from stake.

### `RewardPaid(address user, uint256 reward)`

An event emitted when reward has been paid to a user.

### `RewardsDurationUpdated(uint256 newDuration)`

An event emitted when the rewards duration has been updated.

### `Recovered(address token, uint256 amount)`

An event emitted when an ERC20 token has been recovered.



