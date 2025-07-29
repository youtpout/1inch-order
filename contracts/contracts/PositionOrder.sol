pragma solidity ^0.8.28;

import {IERC20} from "./interfaces/IERC20.sol";
import {IERC721} from "./interfaces/IERC721.sol";
import {INonfungiblePositionManager} from "./interfaces/INonfungiblePositionManager.sol";
import {AggregatorV3Interface} from "./interfaces/AggregatorV3Interface.sol";
import {ERC721Proxy} from "./ERC721Proxy.sol";

/// @notice Contract designed to sell Uniswap v3 compatible ERC721 Position
/// Based on 1inch proxy ERC721 proxy
contract PositionOrder is ERC721Proxy {
    constructor(
        address _immutableOwner
    ) ERC721Proxy(_immutableOwner) {
    }

    /// @notice Post interaction to collect maker fees on position
    function collectFees(
        address _positionManager,
        uint256 _tokenId
    ) external onlyImmutableOwner {
        INonfungiblePositionManager positionManager = INonfungiblePositionManager(
                _positionManager
            );
        address currentOwner = positionManager.ownerOf(_tokenId);

        // 1. Collect fees to maker
        INonfungiblePositionManager.CollectParams
            memory collectParams = INonfungiblePositionManager.CollectParams(
                _tokenId,
                currentOwner,
                type(uint128).max,
                type(uint128).max
            );
        positionManager.collect(collectParams);
    }

    /// @notice Predicate function to get asset price to easily create stop loss order
    /// @dev Can be used via predicate builder as a call to this contract
    function getPrice(address chainlinkOracle) external view returns (int256) {
        (, int256 answer, , , ) = AggregatorV3Interface(chainlinkOracle)
            .latestRoundData();
        return answer;
    }
}
