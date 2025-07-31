import { Address, Api, LimitOrder, Pager } from "@1inch/limit-order-sdk"
import { AxiosProviderConnector } from '@1inch/limit-order-sdk/axios'
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
            httpConnector: new AxiosProviderConnector(),
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

        console.log("order", order);

        if (!order || typeof order !== 'string') {
            return NextResponse.json(
                { error: 'Invalid or missing "order" parameter' },
                { status: 400 }
            );
        }

        console.log("Received order:", order);

        // Tu peux ici traiter ou décoder l'ordre (par exemple, JSON.parse(order) si c'est un JSON encodé)
        // const parsedOrder = JSON.parse(order);

        return NextResponse.json({ message: 'Order received successfully', order });
    } catch (err) {
        console.error("POST /api/order error:", err);
        return NextResponse.json(
            { error: 'Invalid JSON body' },
            { status: 400 }
        );
    }
}
