'use client'

import Price from "./price";

export const OrderItem = ({ orderDto }) => {
    const chain = "arbitrum";
    return (
        <div className="flex-row" style={{ alignItems: "center", justifyContent: "space-between" }}>
            <a style={{ "textDecoration": "underline", marginRight: "10px" }} target="blank" href={`https://app.uniswap.org/positions/v3/${chain}/${orderDto.tokenId}`}>Position Id : {orderDto.tokenId}</a>
            <div>Price :<Price tokenAddress={orderDto.buyAsset} amount={orderDto.price}></Price></div>
            <button>buy</button>
        </div>
    )
}
