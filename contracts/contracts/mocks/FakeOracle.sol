// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract FakeOracle {
    uint public decimals = 8;
    int256 public latestAnswer = 380579662914;

    function setDecimals(uint8 _decimals) external {
        decimals = _decimals;
    }

    function setPrice(int256 _price) external {
        latestAnswer = _price;
    }
}
