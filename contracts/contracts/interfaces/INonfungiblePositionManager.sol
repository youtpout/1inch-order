// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity >=0.7.5;

import "./IERC721.sol";

interface INonfungiblePositionManager is IERC721 {
    struct CollectParams {
        uint256 tokenId;
        address recipient;
        uint128 amount0Max;
        uint128 amount1Max;
    }
    function collect(
        CollectParams calldata params
    ) external payable returns (uint256 amount0, uint256 amount1);
}