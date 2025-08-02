'use client'
import { arbitrum } from '@reown/appkit/networks';
import { useAppKitProvider, Provider } from '@reown/appkit/react';
import { BrowserProvider, ethers } from "ethers";
import { useEffect, useState } from "react";
import PositionOrderAbi from "@/utils/PositionOrderAbi.json";
import { chainIdArbitrum, listTokens, oracles, proxyAddress } from '@/utils/addresses';

type Props = {
    tokenName: string
}

export default function OraclePrice({ tokenName }: Props) {
    const [price, setPrice] = useState<string>("0");
    const [logo, setLogo] = useState<string>("reown.svg");
    // AppKit hook to get the wallet provider
    const { walletProvider } = useAppKitProvider<Provider>("eip155");

    useEffect(() => {
        const interval = setInterval(getPrice, 15000);

        return () => clearInterval(interval);
    }, [tokenName]);


    if (!tokenName) {
        return (<>Loading ...</>);
    }

    const getPrice = async () => {
        if (tokenName) {
            const token = listTokens.find(x => x.normalizedName === tokenName);
            const oracle = oracles.find(x => x.token === tokenName);
            const browserProvider = new BrowserProvider(walletProvider, chainIdArbitrum);


            const proxyContract = new ethers.Contract(
                proxyAddress,
                PositionOrderAbi,
                browserProvider
            );

            const decimals = token?.decimals ?? 18;

            const price = await proxyContract.getPrice(oracle?.address, decimals);
            const result = ethers.formatUnits(price, decimals);
            setPrice(result);
            setLogo(token?.altLogo ?? "reown.svg");
        }

    };

    return (<div className='oracle-price'><img height={30} width={30} style={{ marginRight: "5px" }} src={logo}></img> {price} $</div>);
}