'use client'

import { getLogo, getPositionUrl, inchAggregator, proxyAddress, weth, ZERO_ADDRESS } from "@/utils/addresses";
import { useDisconnect, useAppKit, useAppKitNetwork, Provider, useAppKitAccount, useAppKitNetworkCore, useAppKitProvider } from '@reown/appkit/react'
import FormatPrice from "./FormatPrice";
import { buildOrder, buildTakerTraits } from "@/utils/orderUtils";
import { OrderInfoData, Address, Extension, LimitOrder, MakerTraits } from "@1inch/limit-order-sdk";
import { arbitrum } from "@reown/appkit/networks";
import { BrowserProvider, ethers } from "ethers";
import { Interface } from "readline";
import AggregatorAbi from "@/utils/AggregatorAbi.json";
import IERC20 from '@uniswap/v3-periphery/artifacts/contracts/interfaces/IERC20Metadata.sol/IERC20Metadata.json';
import build from "next/dist/build";

export const OrderItem = ({ orderDto }) => {
    const { address, isConnected } = useAppKitAccount();
    const { walletProvider } = useAppKitProvider<Provider>("eip155");

    const chainId = arbitrum.id;

    console.log("extension", Extension.decode(orderDto.extension))

    const buy = async () => {
        try {
            if (address) {
                const provider = new BrowserProvider(walletProvider, arbitrum.id);
                const signer = await provider.getSigner();

                const inchContract = new ethers.Contract(
                    inchAggregator,
                    AggregatorAbi,
                    signer
                )

                const price = BigInt(orderDto.price);

                const tokenContract = new ethers.Contract(
                    orderDto.buyAsset,
                    IERC20.abi,
                    signer
                );

                const allowance = await tokenContract.allowance(address, proxyAddress);

                if (allowance < price) {
                    const allowTx = await tokenContract.approve(proxyAddress, price);
                    await allowTx.wait();
                }

                const extension = Extension.decode(orderDto.extension);

                const takerTraits = buildTakerTraits({
                    threshold: price,
                    makingAmount: true,
                    extension: orderDto.extension,
                });

                const order = { ...orderDto.order, extension: orderDto.extension };

                console.log("order", order);

                const { r, yParityAndS: vs } = ethers.Signature.from(orderDto.signature);
                const fillTx = await inchContract.fillOrderArgs(order, r, vs, price, takerTraits.traits, takerTraits.args);
                await fillTx.wait()
                console.log("filltx", fillTx);
            }
        } catch (error) {
            console.error("Failed to buy order:", error);
            if (error?.data) {
                try {
                    const provider = new BrowserProvider(walletProvider, arbitrum.id);
                    const signer = await provider.getSigner();

                    const inchContract = new ethers.Contract(
                        inchAggregator,
                        AggregatorAbi,
                        signer
                    )
                    const decoded = inchContract.interface.parseError(error.data);
                    console.log("Erreur personnalisée : ", decoded.name);
                    console.log("Arguments :", decoded.args);
                } catch (decodeError) {
                    console.log("Erreur non reconnue (pas dans l'ABI)", decodeError);
                }
            } else {
                console.log("Erreur sans données de revert", error);
            }
        }
    }

    const formatDate = (isoString) => {
        const date = new Date(isoString);
        return new Intl.DateTimeFormat('en-CA', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
            timeZone: 'UTC',
        }).format(date).replace(',', '');
    };
    return (
        <tr>
            <td>
                <a className="flex-center" target="blank" href={getPositionUrl(orderDto.positionManager, orderDto.tokenId)}>
                    <img height={30} src={getLogo(orderDto.positionManager)} />
                    <span style={{ "textDecoration": "underline", marginLeft: "10px" }} >{orderDto.tokenId}</span>
                </a>
            </td>
            <td><FormatPrice tokenAddress={orderDto.buyAsset} amount={orderDto.price}></FormatPrice></td>
            <td style={{ fontSize: "12px" }}><span>{formatDate(orderDto.createdAt)}</span></td>
            <td height="50px">{address ? <button onClick={buy}>buy</button> : <span>Connect to manage</span>}</td>
        </tr >
    )
}