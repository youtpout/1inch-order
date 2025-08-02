'use client'

import { getLogo, getPositionUrl, inchAggregator, listTokens, oracles, proxyAddress, weth, ZERO_ADDRESS } from "@/utils/addresses";
import { useDisconnect, useAppKit, useAppKitNetwork, Provider, useAppKitAccount, useAppKitNetworkCore, useAppKitProvider } from '@reown/appkit/react'
import FormatPrice from "./FormatPrice";
import { buildOrder, buildTakerTraits } from "@/utils/orderUtils";
import { OrderInfoData, Address, Extension, LimitOrder, MakerTraits } from "@1inch/limit-order-sdk";
import { arbitrum } from "@reown/appkit/networks";
import { BrowserProvider, ethers, Interface } from "ethers";
import AggregatorAbi from "@/utils/AggregatorAbi.json";
import IERC20 from '@uniswap/v3-periphery/artifacts/contracts/interfaces/IERC20Metadata.sol/IERC20Metadata.json';
import PositionOrderAbi from "@/utils/PositionOrderAbi.json";
import { Alert, AlertColor, Snackbar, SnackbarCloseReason } from "@mui/material";
import { useState } from "react";

export const OrderItem = ({ orderDto }) => {
    const { address, isConnected } = useAppKitAccount();
    const { walletProvider } = useAppKitProvider<Provider>("eip155");
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [severity, setSeverity] = useState<AlertColor>("success");

    const handleClose = (
        event?: React.SyntheticEvent | Event,
        reason?: SnackbarCloseReason,
    ) => {
        if (reason === 'clickaway') {
            return;
        }

        setOpen(false);
    };


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
                    setMessage("Approve spend in your wallet");
                    setSeverity("info");
                    setOpen(true);

                    const allowTx = await tokenContract.approve(proxyAddress, price);
                    await allowTx.wait();
                }

                const takerTraits = buildTakerTraits({
                    threshold: price,
                    makingAmount: true,
                    extension: orderDto.extension,
                });

                const order = { ...orderDto.order, extension: orderDto.extension };

                console.log("order", order);

                setMessage("Approve order fill in your wallet");
                setSeverity("info");
                setOpen(true);

                const { r, yParityAndS: vs } = ethers.Signature.from(orderDto.signature);
                const fillTx = await inchContract.fillOrderArgs(order, r, vs, price, takerTraits.traits, takerTraits.args);
                await fillTx.wait()

                setMessage("Order filled");
                setSeverity("success");
                setOpen(true);
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

                    setMessage(decoded.name);
                    setSeverity("error");
                    setOpen(true);
                } catch (decodeError) {
                    console.log("Erreur non reconnue (pas dans l'ABI)", decodeError);

                    setMessage("Failed");
                    setSeverity("error");
                    setOpen(true);
                }
            } else {
                console.log("Erreur sans données de revert", error);

                setMessage("Failed");
                setSeverity("error");
                setOpen(true);
            }
        }
    }

    const formatDate = (isoString: string) => {
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

    const getTriggerPrice = (extension: string) => {
        try {
            const decodedExtension = Extension.decode(extension);
            const aggregatorAbi = new Interface(AggregatorAbi);
            const proxyAbi = new Interface(PositionOrderAbi);         

            if (decodedExtension.predicate.length > 2) {
                // decode the trigger price from the predicate
                let decodePredicate = "";
                let compare = "<";
                try {
                    decodePredicate = aggregatorAbi.decodeFunctionData("lt", decodedExtension.predicate);
                } catch (error) {
                    compare = ">";
                    decodePredicate = aggregatorAbi.decodeFunctionData("gt", decodedExtension.predicate);
                }

                const arbitraryCall = aggregatorAbi.decodeFunctionData('arbitraryStaticCall', decodePredicate[1]);
                const oracleCall = proxyAbi.decodeFunctionData('getPrice', arbitraryCall[1]);

                const price = decodePredicate[0];
                const oracleAddress = oracleCall[0];
                const findOracle = oracles.find(x => x.address.toLowerCase() === oracleAddress.toLowerCase());
                if (findOracle) {
                    const token = listTokens.find(x => x.normalizedName === findOracle.token);
                    if (token) {
                        const result = ethers.formatUnits(price, token.decimals);
                        return `${token.normalizedName} ${compare} ${result} $`;
                    }
                }
            }
        } catch (error) {
            console.error("decode predicate", error);
        }

        return "";
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
            <td><span>{getTriggerPrice(orderDto.extension)}</span></td>
            <td style={{ fontSize: "12px" }}><span>{formatDate(orderDto.createdAt)}</span></td>
            <td height="50px">{address ? <button onClick={buy}>buy</button> : <span>Connect to manage</span>}
                <Snackbar
                    open={open}
                    color="primary"
                    autoHideDuration={5000}
                    onClose={handleClose}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                >
                    <Alert
                        severity={severity}
                        variant="filled"
                        sx={{ width: '100%' }}
                    >
                        {message}
                    </Alert>

                </Snackbar>
            </td>
        </tr >
    )
}