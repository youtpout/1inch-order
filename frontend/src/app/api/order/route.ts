import { orders } from "@/lib/schema";
import { Address, Api, AuthError, Extension, LimitOrder, LimitOrderWithFee, MakerTraits, Pager, Sdk } from "@1inch/limit-order-sdk"
import { arbitrum } from "@reown/appkit/networks";
import { drizzle } from "drizzle-orm/postgres-js";
import { ethers, JsonRpcProvider } from "ethers";
import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";
import { eq, desc } from "drizzle-orm";
import { chainIdArbitrum, inchAggregator, rpcArbitrum } from "@/utils/addresses";
import AggregatorAbi from "@/utils/AggregatorAbi.json";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address");
    const client = postgres(process.env.POSTGRE_DB_URL!)
    const db = drizzle({ client });

    console.log("address", address);

    const orderList = await db.select().from(orders).orderBy(desc(orders.createdAt));
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


export async function PUT(req: NextRequest) {
    const client = postgres(process.env.POSTGRE_DB_URL!)
    const db = drizzle({ client });

    // update order status 
    const orderList = await db.select().from(orders).where(eq(orders.status, 'created'));

    if (orderList.length) {
        const provider = new JsonRpcProvider(rpcArbitrum);
        const inchContract = new ethers.Contract(
            inchAggregator,
            AggregatorAbi,
            provider
        )
        const blockNumber = await provider.getBlockNumber();

        const fromBlock = blockNumber - 20_000; // ou ton bloc de départ
        const toBlock = "latest";

        // OrderFilled
        const orderFilledEvents = await inchContract.queryFilter(
            inchContract.filters.OrderFilled(),
            fromBlock,
            toBlock
        );

        // BitInvalidatorUpdated
        const bitInvalidatorEvents = await inchContract.queryFilter(
            inchContract.filters.BitInvalidatorUpdated(),
            fromBlock,
            toBlock
        );

        orderList.forEach(async (o) => {
            try {
                const filled = orderFilledEvents.find(x => x.args.orderHash.toLowerCase() === o.hash.toLowerCase())
                if (filled) {
                    await db.update(orders).set({ status: "fill" }).where(eq(orders.hash, o.hash));
                }
                else {
                    // bit invalidator use nonce
                    const trait = new MakerTraits(BigInt(o.order.makerTraits));
                    const nonce = trait.nonceOrEpoch() >> BigInt(8);
                    const cancel = bitInvalidatorEvents.find(x => x.args.maker.toLowerCase() === o.order.maker.toLowerCase() && x.args.slotIndex === nonce)
                    if (cancel) {
                        await db.update(orders).set({ status: "cancel" }).where(eq(orders.hash, o.hash));
                    }
                }
            } catch (error) {
                console.error(error);
            }

        });
    }

    return NextResponse.json({ message: 'PUT' });
}