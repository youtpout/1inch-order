import { db } from "@/lib/db";
import { orders } from "@/lib/schema";
import { CustomAxiosProviderConnector } from "@/utils/AxiosProviderConnector";
import { Address, Api, AuthError, Extension, LimitOrder, LimitOrderWithFee, Pager, Sdk } from "@1inch/limit-order-sdk"
import { arbitrum } from "@reown/appkit/networks";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address");

    console.log("address", address);

    if (!address) {
        return NextResponse.json(
            { error: "Missing address parameter" },
            { status: 400 }
        );
    } else {
        const api = new Api({
            authKey: process.env.INCH_KEY!,
            networkId: 42161,
            httpConnector: new CustomAxiosProviderConnector(),
        });

        const orders = await api.getOrdersByMaker(new Address(address), { pager: new Pager({ limit: 100, page: 1 }), statuses: [1, 2, 3] });

        console.log("orders", orders);

        return NextResponse.json({ orders });
    }
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
