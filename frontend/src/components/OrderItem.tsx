'use client'

import Price from "./price";

export const OrderItem = ({ orderDto }) => {
    const chain = "arbitrum";
    return (
        <tr>
            <td> <a style={{ "textDecoration": "underline", marginRight: "10px" }} target="blank" href={`https://app.uniswap.org/positions/v3/${chain}/${orderDto.tokenId}`}>{orderDto.tokenId}</a></td>
            <td><Price tokenAddress={orderDto.buyAsset} amount={orderDto.price}></Price></td>
            <td><button>buy</button></td>
        </tr>
    )
}
