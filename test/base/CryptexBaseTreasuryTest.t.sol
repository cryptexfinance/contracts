// SPDX-License-Identifier: MIT
pragma solidity 0.7.5;
pragma abicoder v2;

import "forge-std/Test.sol";
import "contracts/base/CryptexBaseTreasury.sol";

contract CryptexBaseTreasuryTest is Test {
    CryptexBaseTreasury treasury;
    address owner = address(0x1234);

    function setUp() public {
        treasury = new CryptexBaseTreasury(owner);
    }

    function testRenounceOwnershipReverts() public {
        vm.prank(owner);
        vm.expectRevert("CryptexBaseTreasury::renounceOwnership: function disabled");
        treasury.renounceOwnership();
    }
}
