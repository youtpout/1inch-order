import { db } from "@/lib/db";
import { orders } from "@/lib/schema";
import { CustomAxiosProviderConnector } from "@/utils/AxiosProviderConnector";
import { Address, Api, AuthError, Extension, LimitOrder, LimitOrderWithFee, Pager, Sdk } from "@1inch/limit-order-sdk"
import { arbitrum } from "@reown/appkit/networks";
import { ethers } from "ethers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address");

    console.log("address", address);

    const orderList = await db.select().from(orders);
    console.log("orders", orderList);


    if (orderList.length) {
        const oder0 = orderList[0];

        const completeOrders = orderList.map(o => {
            const decode = Extension.decode(o.extension);

            const makerAsset = ethers.AbiCoder.defaultAbiCoder().decode(
                ['uint256', 'address'],
                decode.makerAssetSuffix
            );
            const takerAsset = ethers.AbiCoder.defaultAbiCoder().decode(
                ['uint256', 'address'],
                decode.takerAssetSuffix
            );

            let result = {
                ...o,
                positionManager: makerAsset[1].toString(),
                tokenId: makerAsset[0].toString(),
                buyAsset: takerAsset[1].toString(),
                price: takerAsset[0].toString()
            };
            return result;
        })

        if (address) {
            const orderFilter = completeOrders.find(x => x.order?.maker?.toLowerCase() === address.toLowerCase())
            // todo filter by address
            return NextResponse.json({ orders: orderFilter ?? [] });
        }

        return NextResponse.json({ orders: completeOrders });
    }

    return NextResponse.json({ orders: orderList ?? [] });
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const order: string = body.order;
        const extension: string = body.extension;
        const signature: string = body.signature;



        if (!order || typeof order !== 'string') {
            return NextResponse.json(
                { error: 'Invalid or missing "order" parameter' },
                { status: 400 }
            );
        }
        console.log("order", order);
        console.log("signature", signature);
        console.log("extension", extension);


        const des = JSON.parse(order);
        const ext = Extension.decode(extension);

        const newLimitOrder = LimitOrder.fromDataAndExtension(des, ext);
        const hash = newLimitOrder.getOrderHash(arbitrum.id);
        const status = "created";

        await db.insert(orders).values({
            hash,
            order,
            extension,
            signature,
            status,
        });

        return new Response(JSON.stringify({ success: true }), { status: 201 });
    } catch (err) {
        console.error("POST /api/order error:", err);
        return NextResponse.json(
            { error: 'Invalid JSON body' },
            { status: 400 }
        );
    }
}
