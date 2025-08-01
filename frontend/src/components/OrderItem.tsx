'use client'

import { getPositionUrl } from "@/utils/addresses";
import Price from "./price";

export const OrderItem = ({ orderDto }) => {
    return (
        <tr>
            <td> <a style={{ "textDecoration": "underline", marginRight: "10px" }} target="blank" href={getPositionUrl(orderDto.manager,orderDto.tokenId)}>{orderDto.tokenId}</a></td>
            <td><Price tokenAddress={orderDto.buyAsset} amount={orderDto.price}></Price></td>
            <td><button>buy</button></td>
        </tr>
    )
}
