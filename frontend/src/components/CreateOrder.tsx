'use client'
import { useDisconnect, useAppKit, useAppKitNetwork, Provider, useAppKitAccount, useAppKitNetworkCore, useAppKitProvider } from '@reown/appkit/react'
import { networks } from '@/config'
import { disconnect } from 'process';
import { LimitOrder, MakerTraits, Address, OrderInfoData, Extension, LimitOrderWithFee, Sdk } from "@1inch/limit-order-sdk"
import { proxy, weth, ZERO_ADDRESS } from '@/utils/addresses';
import { arbitrum } from '@reown/appkit/networks';
import { BrowserProvider, Interface } from 'ethers';
import PositionOrderAbi from "@/utils/PositionOrderAbi.json";
import { buildTakerTraits } from '@/utils/orderUtils';
import { CustomAxiosProviderConnector } from '@/utils/AxiosProviderConnector';

export const CreateOrder = ({ tokenId, manager }) => {
    // AppKit hook to get the address and check if the user is connected
    const { address, isConnected } = useAppKitAccount();
    // AppKit hook to get the wallet provider
    const { walletProvider } = useAppKitProvider<Provider>("eip155");

    const chainId = arbitrum.id;

    const create = async () => {
        try {

            if (address) {
                const proxyAbi = new Interface(PositionOrderAbi);
                const makerAssetSuffix = '0x' + proxyAbi.encodeFunctionData(
                    'func_60iHVgK',
                    // ERC721Proxy arguments (2 last passed as extra)
                    // address from, address to, uint256 amount, uint256 tokenId, IERC721 token
                    [address, ZERO_ADDRESS, 0, tokenId, manager],
                    // leave only 2 extra arguments
                ).substring(202);

                console.log("makerAssetSuffix", makerAssetSuffix)
                const takerAssetSuffix = '0x' + proxyAbi.encodeFunctionData(
                    'func_60iHVgK',
                    // ERC721Proxy arguments (2 last passed as extra)
                    // address from, address to, uint256 amount, uint256 tokenId, IERC721 token
                    [ZERO_ADDRESS, address, 0, BigInt("1000000000000000000"), weth.address.arbitrum],
                    // leave only 2 extra arguments
                ).substring(202);

                console.log("takerassetsufix", takerAssetSuffix)

                const testSuffix = '0x' + proxyAbi.encodeFunctionData('func_60iHVgK', [ZERO_ADDRESS, address, 0, 10, manager]).substring(202);
                console.log("testSuffix", testSuffix)

                const orderInfo: OrderInfoData = {
                    makerAsset: new Address(proxy),
                    takerAsset: new Address(proxy),
                    makingAmount: BigInt(1),
                    takingAmount: BigInt(1),
                    maker: new Address(address)
                };
                const extension: Extension = new Extension({
                    makerAssetSuffix,
                    takerAssetSuffix,
                    makingAmountData: '0x',
                    takingAmountData: '0x',
                    predicate: '0x',
                    makerPermit: '0x',
                    preInteraction: '0x',
                    postInteraction: '0x',
                    customData: '0x',
                });
                const takerTraits = buildTakerTraits({
                    threshold: BigInt("1000000000000000000"),
                    makingAmount: true,
                    extension: extension.encode(),
                });


                const order = new LimitOrder(orderInfo, new MakerTraits(takerTraits.traits), extension);

                const typedData = order.getTypedData(chainId)

                const provider = new BrowserProvider(walletProvider, arbitrum.id);
                const signer = await provider.getSigner();
                const signature = await signer.signTypedData(
                    typedData.domain,
                    { Order: typedData.types.Order },
                    typedData.message
                )

                const res = await fetch('/api/order', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ order: JSON.stringify(order.build()), signature: signature, extension: extension.encode() }),
                });

                const data = await res.json();
                console.log("response", data);
            }
        } catch (error) {
            console.error("Failed to create order:", error);
        }
    }
    return (
        <div>
            <button onClick={() => create()}>Create</button>
        </div>
    )
}
