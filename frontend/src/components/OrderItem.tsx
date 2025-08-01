'use client'

import { getPositionUrl } from "@/utils/addresses";
import Price from "./price";

export const OrderItem = ({ orderDto }) => {
    return (
        <tr>
            <td>
                {orderDto.positionManager.toLowerCase() === "0xC36442b4a4522E871399CD717aBDD847Ab11FE88".toLowerCase() ?
                <img height={30} src="/cake.png"></img>:
                <img height={30} src="/uniswap.png"></img>}
            </td>
            <td> <a style={{ "textDecoration": "underline", marginRight: "10px" }} target="blank" href={getPositionUrl(orderDto.manager,orderDto.tokenId)}>{orderDto.tokenId}</a></td>
            <td><Price tokenAddress={orderDto.buyAsset} amount={orderDto.price}></Price></td>
            <td><button>buy</button></td>
        </tr >
    )
}
