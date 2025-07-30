pragma solidity ^0.8.28;

import {IERC20} from "./interfaces/IERC20.sol";
import {IERC721} from "./interfaces/IERC721.sol";
import {INonfungiblePositionManager} from "./interfaces/INonfungiblePositionManager.sol";
import {AggregatorInterface} from "./interfaces/AggregatorInterface.sol";
import {ERC721Proxy} from "./ERC721Proxy.sol";
import {IPreInteraction} from "./interfaces/IPreInteraction.sol";

/// @notice Contract designed to sell Uniswap v3 compatible ERC721 Position
/// Based on 1inch proxy ERC721 proxy
contract PositionOrder is ERC721Proxy, IPreInteraction {
    constructor(address _immutableOwner) ERC721Proxy(_immutableOwner) {}

    /// @notice Pre interaction to collect maker fees on position
    function preInteraction(
        Order calldata order,
        bytes calldata extension,
        bytes32 orderHash,
        address taker,
        uint256 makingAmount,
        uint256 takingAmount,
        uint256 remainingMakingAmount,
        bytes calldata extraData
    ) external onlyImmutableOwner {
        (address _positionManager, uint256 _tokenId) = abi.decode(
            extraData,
            (address, uint256)
        );

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
    function getPrice(address oracle) external view returns (uint256) {
        int256 answer = AggregatorInterface(oracle).latestAnswer();
        require(answer > 0, "Negative number");
        return uint256(answer);
    }
}
