'use client'
import { useDisconnect, useAppKit, useAppKitNetwork, Provider, useAppKitAccount, useAppKitNetworkCore, useAppKitProvider } from '@reown/appkit/react'
import { networks } from '@/config'
import { disconnect } from 'process';
import { LimitOrder, MakerTraits, Address, OrderInfoData, Extension, LimitOrderWithFee, Sdk } from "@1inch/limit-order-sdk"
import { inchAggregator, proxyAddress, weth, ZERO_ADDRESS } from '@/utils/addresses';
import { arbitrum } from '@reown/appkit/networks';
import { BrowserProvider, ethers, Interface } from 'ethers';
import PositionOrderAbi from "@/utils/PositionOrderAbi.json";
import { buildTakerTraits } from '@/utils/orderUtils';
import { CustomAxiosProviderConnector } from '@/utils/AxiosProviderConnector';
import AggregatorAbi from "@/utils/AggregatorAbi.json";

export const CreateOrder = ({ tokenId, manager }) => {
    // AppKit hook to get the address and check if the user is connected
    const { address, isConnected } = useAppKitAccount();
    // AppKit hook to get the wallet provider
    const { walletProvider } = useAppKitProvider<Provider>("eip155");

    const chainId = arbitrum.id;

    const create = async () => {
        try {

            if (address) {
                const provider = new BrowserProvider(walletProvider, arbitrum.id);

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
                    [ZERO_ADDRESS, address, 0, BigInt(10) ** BigInt(12), weth.address.arbitrum],
                    // leave only 2 extra arguments
                ).substring(202);

                console.log("takerassetsufix", takerAssetSuffix)

                const inchContract = new ethers.Contract(
                    inchAggregator,
                    AggregatorAbi,
                    provider
                )

                const orderInfo: OrderInfoData = {
                    makerAsset: new Address(proxyAddress),
                    takerAsset: new Address(proxyAddress),
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

                const order = new LimitOrder(orderInfo, undefined, extension);


                const typedData = order.getTypedData(chainId)

                const signer = await provider.getSigner();
                const signature = await signer.signTypedData(
                    typedData.domain,
                    { Order: typedData.types.Order },
                    typedData.message
                )

                // const { r, yParityAndS: vs } = ethers.Signature.from(signature);

                // const tx = inchContract.fillOrderArgs(order, r,vs.)

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
        <>
            <button onClick={() => create()}>Create</button>
        </>
    )
}
