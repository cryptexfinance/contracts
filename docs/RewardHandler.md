## `RewardHandler`





### `updateReward(address _account)`

Updates the reward and time on call.




### `onlyVault()`

Reverts if the caller is not a vault.




### `constructor(address _owner, address _rewardsToken, address _vault)` (public)

Constructor




### `totalSupply() → uint256` (external)

Returns the total amount of TCAP tokens minted and getting reward on this vault.



### `balanceOf(address _account) → uint256` (external)

Returns the amount of TCAP tokens minted and getting reward from specific user.




### `getRewardForDuration() → uint256` (external)





### `stake(address _staker, uint256 _amount)` (external)

Called when TCAP is minted, adds the minted value as stake


Only vault can call it
updates rewards on call

### `exit(address _staker)` (external)

Removes all stake and transfers all rewards to the staker.


Only vault can call it

### `notifyRewardAmount(uint256 _reward)` (external)

Notifies the contract that reward has been added to be given.


Only owner  can call it
Increases duration of rewards

### `recoverERC20(address _tokenAddress, uint256 _tokenAmount)` (external)

 Added to support recovering LP Rewards from other systems such as BAL to be distributed to holders


Only owner  can call it

### `setRewardsDuration(uint256 _rewardsDuration)` (external)

 Updates the reward duration


Only owner  can call it
Previous rewards must be complete

### `lastTimeRewardApplicable() → uint256` (public)

Returns the minimun between current block timestamp or the finish period of rewards.



### `rewardPerToken() → uint256` (public)

Returns the calculated reward per token deposited.



### `earned(address _account) → uint256` (public)

Returns the amount of reward tokens a user has earned.




### `min(uint256 _a, uint256 _b) → uint256` (public)

Returns the minimun between two variables




### `withdraw(address _staker, uint256 _amount)` (public)

Called when TCAP is burned or liquidated, removes the burned value as stake


Only vault can call it
updates rewards on call

### `getRewardFromVault(address _staker)` (public)

Called when TCAP is burned or liquidated, transfers to the staker the current amount of rewards tokens earned.


Only vault can call it
updates rewards on call

### `getReward()` (public)

Transfers to the caller the current amount of rewards tokens earned.


updates rewards on call


### `RewardAdded(uint256 reward)`

An event emitted when a reward is added



### `Staked(address user, uint256 amount)`

An event emitted when TCAP is minted and staked to earn rewards



### `Withdrawn(address user, uint256 amount)`

An event emitted when TCAP is burned and removed of stake



### `RewardPaid(address user, uint256 reward)`

An event emitted when reward is paid to a user



### `RewardsDurationUpdated(uint256 newDuration)`

An event emitted when the rewards duration is updated



### `Recovered(address token, uint256 amount)`

An event emitted when a erc20 token is recovered



