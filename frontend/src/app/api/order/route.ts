import { orders } from "@/lib/schema";
import { CustomAxiosProviderConnector } from "@/utils/AxiosProviderConnector";
import { Address, Api, AuthError, Extension, LimitOrder, LimitOrderWithFee, Pager, Sdk } from "@1inch/limit-order-sdk"
import { arbitrum } from "@reown/appkit/networks";
import { drizzle } from "drizzle-orm/postgres-js";
import { ethers } from "ethers";
import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address");
    const client = postgres(process.env.POSTGRE_DB_URL!)
    const db = drizzle({ client });

    console.log("address", address);

    const orderList = await db.select().from(orders);
    console.log("orders", orderList);


    if (orderList.length) {
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
            const orderFilter = completeOrders.filter(x => x.order?.maker?.toLowerCase() === address.toLowerCase())
            // todo filter by address
            return NextResponse.json(orderFilter ?? []);
        }

        return NextResponse.json(completeOrders);
    }

    return NextResponse.json(orderList ?? []);
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

        const client = postgres(process.env.POSTGRE_DB_URL!)
        const db = drizzle({ client });
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
