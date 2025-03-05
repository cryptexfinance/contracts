// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IGovernorBeta {
  enum ProposalState {
    Pending,
    Active,
    Canceled,
    Defeated,
    Succeeded,
    Queued,
    Expired,
    Executed
  }

  function votingDelay() external pure returns (uint256);

  function votingPeriod() external pure returns (uint256);

  function state(uint256 proposalId) external view returns (ProposalState);

  function propose(
    address[] memory targets,
    uint256[] memory values,
    string[] memory signatures,
    bytes[] memory calldatas,
    string memory description
  ) external returns (uint256);

  function queue(uint256 proposalId) external;

  function execute(uint256 proposalId) external payable;

  function castVote(uint256 proposalId, bool support) external;

  function latestProposalIds(address) external returns (uint256);
}
