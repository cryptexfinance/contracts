// SPDX-License-Identifier: MIT
pragma solidity 0.7.5;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract RewardHandler is Ownable, AccessControl, ReentrancyGuard, Pausable {
  /// @notice Open Zeppelin libraries
  using SafeMath for uint256;
  using SafeERC20 for IERC20;

  /// @notice Address of the reward
  IERC20 public rewardsToken;

  /// @notice Address of the vault
  address public vault;

  /// @notice Tracks the period where users stop earning rewards
  uint256 public periodFinish = 0;

  uint256 public rewardRate = 0;

  /// @notice How long the rewards lasts, it updates when more rewards are added
  uint256 public rewardsDuration = 7 days;

  /// @notice Last time rewards were updated
  uint256 public lastUpdateTime;

  uint256 public rewardPerTokenStored;

  /// @notice Track the rewards paid to users
  mapping(address => uint256) public userRewardPerTokenPaid;

  /// @notice Tracks the user rewards
  mapping(address => uint256) public rewards;

  /// @dev Tracks the total supply of the minted TCAPs
  uint256 private _totalSupply;

  /// @dev Tracks the amount of TCAP minted per user
  mapping(address => uint256) private _balances;

  /// @notice An event emitted when a reward is added
  event RewardAdded(uint256 reward);

  /// @notice An event emitted when TCAP is minted and staked to earn rewards
  event Staked(address indexed user, uint256 amount);

  /// @notice An event emitted when TCAP is burned and removed of stake
  event Withdrawn(address indexed user, uint256 amount);

  /// @notice An event emitted when reward is paid to a user
  event RewardPaid(address indexed user, uint256 reward);

  /// @notice An event emitted when the rewards duration is updated
  event RewardsDurationUpdated(uint256 newDuration);

  /// @notice An event emitted when a erc20 token is recovered
  event Recovered(address token, uint256 amount);

  /**
   * @notice Constructor
   * @param _owner address
   * @param _rewardsToken address
   * @param _vault uint256
   */
  constructor(
    address _owner,
    address _rewardsToken,
    address _vault
  ) {
    rewardsToken = IERC20(_rewardsToken);
    vault = _vault;
    _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    transferOwnership(_owner);
  }

  /// @notice Updates the reward and time on call.
  modifier updateReward(address account) {
    rewardPerTokenStored = rewardPerToken();
    lastUpdateTime = lastTimeRewardApplicable();

    if (account != address(0)) {
      rewards[account] = earned(account);
      userRewardPerTokenPaid[account] = rewardPerTokenStored;
    }
    _;
  }

  /// @notice Reverts if the caller is not a vault.
  modifier onlyVault() {
    require(
      msg.sender == vault,
      "RewardHandler::OnlyVault: not calling from vault"
    );
    _;
  }

  /// @notice Returns the total amount of TCAP tokens minted and getting reward on this vault
  function totalSupply() external view returns (uint256) {
    return _totalSupply;
  }

  /// @notice Returns the amount of TCAP tokens minted and getting reward from specific user
  function balanceOf(address account) external view returns (uint256) {
    return _balances[account];
  }

  function lastTimeRewardApplicable() public view returns (uint256) {
    return min(block.timestamp, periodFinish);
  }

  function rewardPerToken() public view returns (uint256) {
    if (_totalSupply == 0) {
      return rewardPerTokenStored;
    }

    return
      rewardPerTokenStored.add(
        lastTimeRewardApplicable()
          .sub(lastUpdateTime)
          .mul(rewardRate)
          .mul(1e18)
          .div(_totalSupply)
      );
  }

  function earned(address account) public view returns (uint256) {
    return
      _balances[account]
        .mul(rewardPerToken().sub(userRewardPerTokenPaid[account]))
        .div(1e18)
        .add(rewards[account]);
  }

  function getRewardForDuration() external view returns (uint256) {
    return rewardRate.mul(rewardsDuration);
  }

  function min(uint256 a, uint256 b) public pure returns (uint256) {
    return a < b ? a : b;
  }

  /* ========== MUTATIVE FUNCTIONS ========== */

  function stake(address _staker, uint256 amount)
    external
    onlyVault
    nonReentrant
    whenNotPaused
    updateReward(_staker)
  {
    require(amount > 0, "Cannot stake 0");
    _totalSupply = _totalSupply.add(amount);
    _balances[_staker] = _balances[_staker].add(amount);
    emit Staked(_staker, amount);
  }

  function withdraw(address _staker, uint256 amount)
    public
    onlyVault
    nonReentrant
    updateReward(_staker)
  {
    require(amount > 0, "Cannot withdraw 0");
    _totalSupply = _totalSupply.sub(amount);
    _balances[_staker] = _balances[_staker].sub(amount);
    emit Withdrawn(_staker, amount);
  }

  function getRewardFromVault(address _staker)
    public
    onlyVault
    nonReentrant
    updateReward(_staker)
  {
    uint256 reward = rewards[_staker];
    if (reward > 0) {
      rewards[_staker] = 0;
      rewardsToken.safeTransfer(_staker, reward);
      emit RewardPaid(_staker, reward);
    }
  }

  function getReward() public nonReentrant updateReward(msg.sender) {
    uint256 reward = rewards[msg.sender];
    if (reward > 0) {
      rewards[msg.sender] = 0;
      rewardsToken.safeTransfer(msg.sender, reward);
      emit RewardPaid(msg.sender, reward);
    }
  }

  function exit(address _staker) external onlyVault {
    withdraw(_staker, _balances[_staker]);
    getRewardFromVault(_staker);
  }

  /* ========== RESTRICTED FUNCTIONS ========== */

  function notifyRewardAmount(uint256 reward)
    external
    onlyOwner
    updateReward(address(0))
  {
    if (block.timestamp >= periodFinish) {
      rewardRate = reward.div(rewardsDuration);
    } else {
      uint256 remaining = periodFinish.sub(block.timestamp);
      uint256 leftover = remaining.mul(rewardRate);
      rewardRate = reward.add(leftover).div(rewardsDuration);
    }

    // Ensure the provided reward amount is not more than the balance in the contract.
    // This keeps the reward rate in the right range, preventing overflows due to
    // very high values of rewardRate in the earned and rewardsPerToken functions;
    // Reward + leftover must be less than 2^256 / 10^18 to avoid overflow.
    uint256 balance = rewardsToken.balanceOf(address(this));
    require(
      rewardRate <= balance.div(rewardsDuration),
      "Provided reward too high"
    );

    lastUpdateTime = block.timestamp;
    periodFinish = block.timestamp.add(rewardsDuration);
    emit RewardAdded(reward);
  }

  // Added to support recovering LP Rewards from other systems such as BAL to be distributed to holders
  function recoverERC20(address tokenAddress, uint256 tokenAmount)
    external
    onlyOwner
  {
    // Cannot recover the staking token or the rewards token
    require(
      tokenAddress != address(rewardsToken),
      "Cannot withdraw the staking or rewards tokens"
    );
    IERC20(tokenAddress).safeTransfer(owner(), tokenAmount);
    emit Recovered(tokenAddress, tokenAmount);
  }

  function setRewardsDuration(uint256 _rewardsDuration) external onlyOwner {
    require(
      block.timestamp > periodFinish,
      "Previous rewards period must be complete before changing the duration for the new period"
    );
    rewardsDuration = _rewardsDuration;
    emit RewardsDurationUpdated(rewardsDuration);
  }

  /* ========== EVENTS ========== */
}
