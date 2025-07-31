// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {PositionOrder} from "./PositionOrder.sol";
import {ImmutableOwner} from "./ImmutableOwner.sol";
import {IPreInteraction, Address, MakerTraits} from "./interfaces/IPreInteraction.sol";
import {INonfungiblePositionManager} from "./interfaces/INonfungiblePositionManager.sol";
import {FakeOracle} from "./mocks/FakeOracle.sol";
import {FakeManager} from "./mocks/FakeManager.sol";
import {Test} from "forge-std/Test.sol";

// Solidity tests are compatible with foundry, so they
// use the same syntax and offer the same functionality.

contract PositionOrderTest is Test {
    PositionOrder positionOrder;
    FakeOracle oracle;
    FakeManager manager;

    address fakeInch = address(0x1);
    address alice = address(0x4);
    address bob = address(0x5);

    function setUp() public {
        positionOrder = new PositionOrder(fakeInch);
        oracle = new FakeOracle();
        manager = new FakeManager();

        manager.mint(bob, 1);
        manager.mint(alice, 2);
    }

    function test_Collect() public {
        vm.prank(bob);
        manager.approve(address(positionOrder), 1);

        vm.prank(fakeInch);
        IPreInteraction.Order memory order = IPreInteraction.Order(
            1,
            toAddress(bob),
            toAddress(alice),
            toAddress(address(manager)),
            toAddress(address(manager)),
            1,
            1,
            MakerTraits.wrap(1)
        );
        bytes memory extraData = abi.encode(address(manager), 1);
        positionOrder.preInteraction(
            order,
            extraData,
            bytes32(0x0),
            alice,
            1,
            1,
            0,
            extraData
        );
    }

    function test_Collect_Failed() public {
        vm.prank(bob);
        manager.approve(address(positionOrder), 1);

        vm.prank(fakeInch);
        IPreInteraction.Order memory order = IPreInteraction.Order(
            1,
            toAddress(bob),
            toAddress(alice),
            toAddress(address(manager)),
            toAddress(address(manager)),
            1,
            1,
            MakerTraits.wrap(1)
        );
        // alice was not approved
        bytes memory extraData = abi.encode(address(manager), 2);
        vm.expectRevert("Not approved");
        positionOrder.preInteraction(
            order,
            extraData,
            bytes32(0x0),
            alice,
            1,
            1,
            0,
            extraData
        );

        // incorrect data
        vm.prank(fakeInch);
        extraData = abi.encode(1, 2);
        vm.expectRevert();
        positionOrder.preInteraction(
            order,
            extraData,
            bytes32(0x0),
            alice,
            1,
            1,
            0,
            extraData
        );

        // incorrect caller
        vm.prank(alice);
        extraData = abi.encode(address(manager), 1);
        vm.expectRevert(ImmutableOwner.IOAccessDenied.selector);
        positionOrder.preInteraction(
            order,
            extraData,
            bytes32(0x0),
            alice,
            1,
            1,
            0,
            extraData
        );
    }

    function test_Oracle() public {
        // 18 decimals
        uint256 ethPrice = 3805_796629140000000000;
        uint8 tokenDecimals = 18;

        uint256 price = positionOrder.getPrice(address(oracle), tokenDecimals);

        assertEq(ethPrice, price);
    }

    function test_Oracle_Invert_Decimals() public {
        // 6 decimals
        uint256 usdcPrice = 999879;
        uint8 tokenDecimals = 6;

        oracle.setPrice(99987953);

        uint256 price = positionOrder.getPrice(address(oracle), tokenDecimals);

        assertEq(usdcPrice, price);
    }

    function test_Oracle_Invalid_Price() public {
        oracle.setPrice(-50);

        vm.expectRevert("Negative price");
        uint256 price = positionOrder.getPrice(address(oracle), 6);
    }

    function test_Oracle_Price_Not_Match() public {
        uint256 ethPrice = 3805_796629140000000000;
        uint8 tokenDecimals = 12;

        uint256 price = positionOrder.getPrice(address(oracle), tokenDecimals);

        assertNotEq(ethPrice, price);
    }

    function toAddress(address a) public pure returns (Address) {
        return Address.wrap(uint256(uint160(a)));
    }

    function fromAddress(Address a) public pure returns (address) {
        return address(uint160(Address.unwrap(a)));
    }
}
