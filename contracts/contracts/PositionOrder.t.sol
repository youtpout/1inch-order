// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {PositionOrder} from "./PositionOrder.sol";
import {FakeOracle} from "./mocks/FakeOracle.sol";
import {Test} from "forge-std/Test.sol";

// Solidity tests are compatible with foundry, so they
// use the same syntax and offer the same functionality.

contract PositionOrderTest is Test {
    PositionOrder positionOrder;
    FakeOracle oracle;

    function setUp() public {
        positionOrder = new PositionOrder(address(0));
        oracle = new FakeOracle();
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
}
