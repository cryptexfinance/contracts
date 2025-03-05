// forge test --match-path test/arbitrum/ArbitrumBridgeTest.t.sol -vvv
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Test, console, console2} from "forge-std/Test.sol";
import {IGovernorBeta} from "../interfaces/IGovernorBeta.sol";
import {ITimelock} from "../interfaces/ITimelock.sol";
import {ICtx} from "../interfaces/ICtx.sol";
import {IArbitrumInboxErrors} from "../interfaces/IArbitrumInboxErrors.sol";

interface IPerennialCollateral {
	function claimFee() external;
}

interface IL1MessageRelayer {
	function relayMessage(
    address target,
    bytes memory payLoad,
    uint256 maxSubmissionCost,
    uint256 maxGas,
    uint256 gasPriceBid
  ) external returns (uint256);
}

interface IL2MessageExecutor {
	function executeMessage(bytes calldata payLoad) external;
}

interface IArbitrumTreasury{
	function executeTransaction(
    address target,
    uint256 value,
    string memory signature,
    bytes memory data
  ) external payable returns (bytes memory);
}

library AddressAliasHelper {
  uint160 constant OFFSET = uint160(0x1111000000000000000000000000000000001111);

  /// @notice Utility function that converts the address in the L1 that submitted a tx to
  /// the inbox to the msg.sender viewed in the L2
  /// @param l1Address the address in the L1 that triggered the tx to L2
  /// @return l2Address L2 address as viewed in msg.sender
  function applyL1ToL2Alias(address l1Address)
    internal
    pure
    returns (address l2Address)
  {
    l2Address = address(uint160(l1Address) + OFFSET);
  }

  /// @notice Utility function that converts the msg.sender viewed in the L2 to the
  /// address in the L1 that submitted a tx to the inbox
  /// @param l2Address L2 address as viewed in msg.sender
  /// @return l1Address the address in the L1 that triggered the tx to L2
  function undoL1ToL2Alias(address l2Address)
    internal
    pure
    returns (address l1Address)
  {
    l1Address = address(uint160(l2Address) - OFFSET);
  }
}


contract AbritrumBridgeTest is Test {
	ICtx ctx = ICtx(0x321C2fE4446C7c963dc41Dd58879AF648838f98D);
  IGovernorBeta public governorBeta = IGovernorBeta(0x874C5D592AfC6803c3DD60d6442357879F196d5b);
  ITimelock public timelock = ITimelock(0xa54074b2cc0e96a43048d4a68472F7F046aC0DA8);
	IL1MessageRelayer l1MessageRelayer = IL1MessageRelayer(0x209c23DB16298504354112fa4210d368e1d564dA);
	// 0x3769b6aA269995297a539BEd7a463105466733A5 --> L2MessageExecutorProxy.so
	IL2MessageExecutor l2MessageExecutor = IL2MessageExecutor(0x3769b6aA269995297a539BEd7a463105466733A5);
	IArbitrumTreasury arbitrumTreasury = IArbitrumTreasury(0x9474B771Fb46E538cfED114Ca816A3e25Bb346CF);
	IPerennialCollateral perennialCollateral = IPerennialCollateral(0xAF8CeD28FcE00ABD30463D55dA81156AA5aEEEc2);

	uint256 public ethereumMainnetForkId;
  uint256 public arbitrumMainnetForkId;
	address user = address(0x51);

	function setUp() public {
		string memory ETHEREUM_MAINNET_RPC_URL = vm.envString(
      "ETHEREUM_MAINNET_RPC_URL"
    );
    string memory ARBITRUM_MAINNET_RPC_URL = vm.envString(
      "ARBITRUM_API_URL"
    );
		ethereumMainnetForkId = vm.createFork(ETHEREUM_MAINNET_RPC_URL);
    arbitrumMainnetForkId = vm.createFork(ARBITRUM_MAINNET_RPC_URL);

		vm.selectFork(ethereumMainnetForkId);
		deal(address(ctx), user, 900_000 ether);
		vm.prank(user);
		ctx.delegate(user);
	}

	function createAndExecuteGovernanceProposal(
    address[] memory targets,
    uint256[] memory values,
    string[] memory signatures,
    bytes[] memory calldatas,
		string memory description
  ) internal {
    vm.startPrank(user);
    vm.roll(block.number + 100);
    governorBeta.propose(targets, values, signatures, calldatas, description);
    uint256 proposalID = governorBeta.latestProposalIds(user);
    vm.roll(block.number + governorBeta.votingDelay() + 1);
    governorBeta.castVote(proposalID, true);
    vm.roll(block.number + governorBeta.votingPeriod() + 1);
    governorBeta.queue(proposalID);
    vm.warp(block.timestamp + timelock.delay() + 1 days);
    governorBeta.execute(proposalID);
    assertEq(
      uint256(governorBeta.state(proposalID)),
      uint256(IGovernorBeta.ProposalState.Executed)
    );
    vm.stopPrank();
  }

	function test() external {
		vm.selectFork(ethereumMainnetForkId);
		address target = address(l2MessageExecutor);
    bytes memory payload = abi.encode(
				address(arbitrumTreasury),
				abi.encodeWithSelector(
					IArbitrumTreasury.executeTransaction.selector,
					address(perennialCollateral), // target
					0, // value
					"claimFee()", // signature
					bytes("") // data
			)
		);

    address[] memory targets = new address[](1);
    uint256[] memory values = new uint256[](1);
    string[] memory signatures = new string[](1);
    bytes[] memory calldatas = new bytes[](1);

    targets[0] = address(l1MessageRelayer);
    values[0] = 0.03 ether;
    signatures[0] = "relayMessage(address,bytes,uint256,uint256,uint256)";
    calldatas[0] = abi.encode(
      target,
      payload,
			3815530707376,
			82096,
			100000000
    );
		string memory description = "Claim TCAP Perp Fees";
		console.log("targets[0]", targets[0]);
		console.log("==================================================================================");
		console2.log("values[0]", values[0]);
		console.log("==================================================================================");
		console.log("signatures[0]", signatures[0]);
		console.log("==================================================================================");
		console.log("calldatas[0]");
		console.logBytes(calldatas[0]);
		console.log("==================================================================================");
		console.log("description", description);
		console.log("==================================================================================");
		createAndExecuteGovernanceProposal(targets, values, signatures, calldatas, description);
		vm.selectFork(arbitrumMainnetForkId);
		vm.startPrank(AddressAliasHelper.applyL1ToL2Alias(address(l1MessageRelayer)));
		l2MessageExecutor.executeMessage(payload);
	}
}
