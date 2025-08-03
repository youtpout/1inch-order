'use client'

import { getLogo, getPositionUrl, inchAggregator, listTokens, oracles, proxyAddress, shortenAddress, weth, ZERO_ADDRESS } from "@/utils/addresses";
import { useDisconnect, useAppKit, useAppKitNetwork, Provider, useAppKitAccount, useAppKitNetworkCore, useAppKitProvider } from '@reown/appkit/react'
import FormatPrice from "./FormatPrice";
import { buildOrder, buildTakerTraits } from "@/utils/orderUtils";
import { OrderInfoData, Address, Extension, LimitOrder, MakerTraits, LimitOrderV4Struct } from "@1inch/limit-order-sdk";
import { arbitrum } from "@reown/appkit/networks";
import { BrowserProvider, ethers, Interface } from "ethers";
import AggregatorAbi from "@/utils/AggregatorAbi.json";
import IERC20 from '@uniswap/v3-periphery/artifacts/contracts/interfaces/IERC20Metadata.sol/IERC20Metadata.json';
import IWETH from '@uniswap/v3-periphery/artifacts/contracts/interfaces/external/IWETH9.sol/IWETH9.json';
import PositionOrderAbi from "@/utils/PositionOrderAbi.json";
import { Alert, AlertColor, Snackbar, SnackbarCloseReason } from "@mui/material";
import { useState } from "react";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";


export const OrderItem = ({ orderDto }) => {
    const { address, isConnected } = useAppKitAccount();
    const { walletProvider } = useAppKitProvider<Provider>("eip155");
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [severity, setSeverity] = useState<AlertColor>("success");
    const { confirm, ConfirmDialog } = useConfirmDialog();

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

                const balance = await tokenContract.balanceOf(address);

                if (balance < price) {
                    const token = listTokens.find(x => x.address.arbitrum?.toLowerCase() === orderDto.buyAsset.toLowerCase());

                    let deposit = false;
                    if (token?.normalizedName === "weth") {
                        deposit = await confirm({
                            message: "Would you transform your ETH into WETH?",
                        });
                        if (deposit) {
                            const wethContract = new ethers.Contract(
                                orderDto.buyAsset,
                                IWETH.abi,
                                signer
                            );
                            const tx = await wethContract.deposit({ value: price });
                            await tx.wait();
                        }
                    }

                    if (!deposit) {
                        setMessage(`Insufficient ${token?.symbol} balance`);
                        setSeverity("warning");
                        setOpen(true);
                        return;
                    }
                }

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
                    extension: orderDto.extension
                });

                const order = { ...orderDto.order, extension: orderDto.extension };

                console.log("order", order);

                setMessage("Approve order fill in your wallet");
                setSeverity("info");
                setOpen(true);

                const { r, yParityAndS: vs } = ethers.Signature.from(orderDto.signature);
                const fillTx = await inchContract.fillOrderArgs(order, r, vs, price, takerTraits.traits, takerTraits.args);
                await fillTx.wait();


                setMessage("Order filled");
                setSeverity("success");
                setOpen(true);

                // update order status
                fetch("/api/order", { method: "PUT" }).then().catch(err => {
                    console.error("Error PUT", err);
                });
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

    const cancel = async () => {
        try {
            if (address) {
                const provider = new BrowserProvider(walletProvider, arbitrum.id);
                const signer = await provider.getSigner();

                const inchContract = new ethers.Contract(
                    inchAggregator,
                    AggregatorAbi,
                    signer
                )

                setMessage("Approve cancel order in your wallet");
                setSeverity("info");
                setOpen(true);

                const cancelTx = await inchContract.cancelOrder(orderDto.order.makerTraits, orderDto.hash);
                await cancelTx.wait()

                setMessage("Order canceled");
                setSeverity("success");
                setOpen(true);

                // update order status
                fetch("/api/order", { method: "PUT" }).then().catch(err => {
                    console.error("Error PUT", err);
                });
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
                let decodePredicate: any[] = [];
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

    const getAction = (status: string) => {
        try {
            if (status === "fill") {
                return <span>Filled</span>;
            }

            if (status === "cancel") {
                return <span>Canceled</span>;
            }

            if (!address) {
                return <span>Connect to manage</span>;
            }

            const maker = orderDto.order.maker.toLowerCase();
            if (address.toLowerCase() === maker) {
                return <button onClick={cancel}>cancel</button>
            } else {
                return <button onClick={buy}>buy</button>
            }

        } catch (error) {
            console.error("decode predicate", error);
        }

        return "<span></span>";
    };

    return (
        <tr>
            <td>
                <a className="flex-center" target="blank" href={getPositionUrl(orderDto.positionManager, orderDto.tokenId)}>
                    <img height={30} src={getLogo(orderDto.positionManager)} />
                    <span style={{ "textDecoration": "underline", marginLeft: "10px" }} >{orderDto.tokenId}</span>
                </a>
            </td>
            <td><span style={{
                wordBreak: 'break-word', overflowWrap: 'break-word', display: 'inline-block', // utile parfois pour limiter les débordements
            }} title={orderDto.order.maker}>{shortenAddress(orderDto.order.maker)}</span></td>
            <td><FormatPrice tokenAddress={orderDto.buyAsset} amount={orderDto.price}></FormatPrice></td>
            <td><span>{getTriggerPrice(orderDto.extension)}</span></td>
            <td style={{ fontSize: "12px" }}><span>{formatDate(orderDto.createdAt)}</span></td>
            <td height="50px">{getAction(orderDto.status)}
                {ConfirmDialog}
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