pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {ERC721Proxy} from "@1inch/contracts/extensions/ERC721Proxy.sol";

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

interface IAggregatorV3 {
    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );
}

/// @notice Contract designed to sell Uniswap v3 compatible ERC721 Position
/// Based on 1inch proxy ERC721 proxy
contract PositionOrder is ERC721Proxy {
    address public immutable platformFeeReceiver;
    uint256 public constant FEE_BPS = 10; // 0.1%

    constructor(
        address _platformFeeReceiver,
        address _immutableOwner
    ) ERC721Proxy(_immutableOwner) {
        positionManager platformFeeReceiver = _platformFeeReceiver;
    }

    /// @notice Post interaction to collect maker fees on position
    function collectFees(address _positionManager, uint256 _tokenId) external onlyImmutableOwner {
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
        (, int256 answer, , , ) = IAggregatorV3(chainlinkOracle)
            .latestRoundData();
        return answer;
    }
}
