// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {GovernanceCCIPReceiver, IGovernanceCCIPReceiver} from "contracts/ccip/GovernanceCCIPReceiver.sol";
import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {NumberUpdater} from "contracts/mocks/NumberUpdater.sol";

contract GovernanceCCIPReceiverTest is Test {
  GovernanceCCIPReceiver public receiver;
  NumberUpdater public numberUpdater; // External contract for execution testing
  address public ccipRouter = address(0x1); // Mocked Chainlink CCIP Router
  address public mainnetSender = address(0x2); // Mainnet Governance Relay
  uint64 public mainnetChainSelector = 5009297550715157269; // Ethereum Mainnet Chain Selector
  address public attacker = address(0x3); // Unauthorized address
  address public target = address(0x4); // Target contract
  address public feeToken = address(0); // Fee token (native asset)

  function setUp() public {
    // Deploy the GovernanceCCIPReceiver contract
    receiver = new GovernanceCCIPReceiver(ccipRouter, mainnetSender);

    // Deploy an external contract (NumberUpdater) to test execution
    numberUpdater = new NumberUpdater(0);
  }

  /// @notice Helper function to construct a valid `Client.Any2EVMMessage`
  function constructMessage(
    address _target,
    bytes memory _payload,
    uint64 _chainSelector,
    address _sender
  ) internal pure returns (Client.Any2EVMMessage memory) {
    Client.EVMTokenAmount[] memory tokenAmounts = new Client.EVMTokenAmount[](
      0
    );
    return
      Client.Any2EVMMessage({
        messageId: bytes32(""),
        sourceChainSelector: _chainSelector, // ABI-encoded receiver address
        sender: abi.encode(_sender),
        data: abi.encode(_target, _payload), // ABI-encoded string message
        destTokenAmounts: tokenAmounts // Tokens amounts
      });
  }

  /// @notice Test constructor arguments are set correctly
  function testConstructorSetsArgumentsCorrectly() public {
    assertEq(receiver.getRouter(), ccipRouter, "Router address mismatch");
    assertEq(
      receiver.MAINNET_CHAIN_SELECTOR(),
      mainnetChainSelector,
      "Chain selector mismatch"
    );
    assertEq(
      receiver.MAINNET_SENDER(),
      mainnetSender,
      "Mainnet sender mismatch"
    );
  }

  function testConstructor_RevertsIfTimelockIsZero() public {
    vm.expectRevert(IGovernanceCCIPReceiver.AddressCannotBeZero.selector);
    new GovernanceCCIPReceiver(ccipRouter, address(0));
  }

  /// @notice Test ccipReceive reverts when called by an address other than the router
  function testCcipReceiveUnauthorizedCaller() public {
    Client.Any2EVMMessage memory message = constructMessage(
      target,
      "test",
      mainnetChainSelector,
      attacker
    );

    vm.prank(ccipRouter);
    vm.expectRevert(
      abi.encodeWithSelector(
        IGovernanceCCIPReceiver.Unauthorized.selector,
        attacker
      )
    );
    receiver.ccipReceive(message);
  }

  /// @notice Test ccipReceive reverts when sourceChainSelector is incorrect
  function testCcipReceiveInvalidChainSelector() public {
    Client.Any2EVMMessage memory message = constructMessage(
      target,
      "test",
      123456,
      mainnetSender
    );

    vm.prank(ccipRouter);
    vm.expectRevert(IGovernanceCCIPReceiver.InvalidChainSelector.selector);
    receiver.ccipReceive(message);
  }

  /// @notice Test ccipReceive reverts when message sender is not mainnetSender
  function testCcipReceiveInvalidSender() public {
    Client.Any2EVMMessage memory message = constructMessage(
      target,
      "test",
      mainnetChainSelector,
      attacker
    );

    vm.prank(ccipRouter);
    vm.expectRevert(
      abi.encodeWithSelector(
        IGovernanceCCIPReceiver.Unauthorized.selector,
        attacker
      )
    );
    receiver.ccipReceive(message);
  }

  /// @notice Test ccipReceive raises TargetAddressCannotBeZero when target address is 0
  function testCcipReceiveTargetAddressCannotBeZero() public {
    Client.Any2EVMMessage memory message = constructMessage(
      address(0),
      "test",
      mainnetChainSelector,
      mainnetSender
    );

    vm.prank(ccipRouter);
    vm.expectRevert(IGovernanceCCIPReceiver.TargetAddressCannotBeZero.selector);
    receiver.ccipReceive(message);
  }

  /// @notice Test ccipReceive raises MessageCallFailed when execution fails
  function testCcipReceiveMessageCallFailed() public {
    address nonContract = address(0x9); // Not a contract, will fail execution
    bytes memory payload = abi.encodeWithSignature("nonexistentFunction()");
    Client.Any2EVMMessage memory message = constructMessage(
      nonContract,
      payload,
      mainnetChainSelector,
      mainnetSender
    );

    vm.prank(ccipRouter);
    vm.expectEmit(true, true, true, true);
    emit IGovernanceCCIPReceiver.MessageExecutionFailed(
      bytes32(""),
      nonContract,
      payload,
      bytes("")
    );
    receiver.ccipReceive(message);
  }

  /// @notice Test ccipReceive emits MessageExecuted event
  function testCcipReceiveEmitsMessageExecuted() public {
    bytes memory payload = abi.encodeWithSignature("updateNumber(uint256)", 42);

    Client.Any2EVMMessage memory message = constructMessage(
      address(numberUpdater),
      payload,
      mainnetChainSelector,
      mainnetSender
    );

    vm.prank(ccipRouter);
    vm.expectEmit(true, true, true, true);
    emit IGovernanceCCIPReceiver.MessageExecutedSuccessfully(
      bytes32(""),
      address(numberUpdater),
      payload
    );
    receiver.ccipReceive(message);
  }

  /// @notice Test ccipReceive successfully executes payload by updating external contract state
  function testCcipReceiveExecutesPayload() public {
    assertEq(numberUpdater.number(), 0, "Initial number should be 0");

    bytes memory payload = abi.encodeWithSignature("updateNumber(uint256)", 42);

    Client.Any2EVMMessage memory message = constructMessage(
      address(numberUpdater),
      payload,
      mainnetChainSelector,
      mainnetSender
    );

    vm.prank(ccipRouter);
    receiver.ccipReceive(message);

    assertEq(
      numberUpdater.number(),
      42,
      "NumberUpdater contract was not updated correctly"
    );
  }
}
