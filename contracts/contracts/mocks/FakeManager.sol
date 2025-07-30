// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../interfaces/INonfungiblePositionManager.sol";
import "./ERC721.sol";

contract FakeManager is ERC721 {
    constructor() ERC721("NFTV3", "NFTV3") {}

    modifier isAuthorizedForToken(uint256 tokenId) {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Not approved");
        _;
    }

    function collect(
        INonfungiblePositionManager.CollectParams calldata params
    )
        external
        payable
        isAuthorizedForToken(params.tokenId)
        returns (uint256 amount0, uint256 amount1)
    {
        require(params.amount0Max > 0 || params.amount1Max > 0);
        // allow collecting to the nft position manager address with address 0
        address recipient = params.recipient == address(0)
            ? address(this)
            : params.recipient;

        return (30, 32);
    }

    function _isApprovedOrOwner(
        address spender,
        uint256 tokenId
    ) internal view returns (bool) {
        address owner = ownerOf(tokenId);
        // Disable solium check because of
        // https://github.com/duaraghav8/Solium/issues/175
        // solium-disable-next-line operator-whitespace
        return (spender == owner ||
            getApproved[tokenId] == spender ||
            isApprovedForAll[owner][spender]);
    }

    function tokenURI(uint256 id) public view override returns (string memory) {
        return "test";
    }
}
