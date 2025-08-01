'use client'

import { useEffect, useState } from "react";

import { Alert, Box, Button, FormControl, IconButton, InputLabel, Modal, NativeSelect, Snackbar, TextField } from "@mui/material";
import { BrowserProvider, ethers } from "ethers";
import POOL_V3 from '@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json'
import {
    useAppKitAccount,
    useAppKitProvider,
    useAppKitNetworkCore,
    type Provider,
} from "@reown/appkit/react";
import { CreateOrder } from "./CreateOrder";
import { getPositionUrl } from "@/utils/addresses";

export default function Position({ manager, nft, chain }: any) {

    // AppKit hook to get the address and check if the user is connected
    const { address, isConnected } = useAppKitAccount();
    // AppKit hook to get the chain id
    const { chainId } = useAppKitNetworkCore();
    // AppKit hook to get the wallet provider
    const { walletProvider } = useAppKitProvider<Provider>("eip155");

    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    return (
        <>
            <div className='nft-image'>
                <img src={nft.metadata.image} alt='Position loading ...'></img>
                <div className="nft-info">
                    <h4>
                        <a style={{ "textDecoration": "underline" }} target="blank" href={getPositionUrl(manager, nft.tokenId)}>Position Id : {nft.tokenId}</a>
                        {nft.inRange ? <div style={{ color: "green" }}>In range</div> : <div style={{ color: "red" }}>Out of Range</div>}
                    </h4>
                    <h3>
                        {nft.metadata.name}
                    </h3>
                    <div>
                        <CreateOrder tokenId={nft.tokenId} manager={manager}></CreateOrder>
                    </div>
                </div>
            </div>
        </>
    );
}
