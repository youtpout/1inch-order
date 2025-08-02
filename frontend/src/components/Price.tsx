'use client'
import { listTokens } from '@/utils/addresses';
import { arbitrum } from '@reown/appkit/networks';
import { useAppKitProvider, Provider } from '@reown/appkit/react';
import IERC20 from '@uniswap/v3-periphery/artifacts/contracts/interfaces/IERC20Metadata.sol/IERC20Metadata.json';
import { BrowserProvider, ethers } from "ethers";
import { useEffect, useState } from "react";


type Props = {
    tokenAddress: string,
    amount: string
}

export default function Price({ tokenAddress, amount }: Props) {
    const [price, setPrice] = useState<string>("");
    const [logo, setLogo] = useState<string>("/reown.svg");
    // AppKit hook to get the wallet provider
    const { walletProvider } = useAppKitProvider<Provider>("eip155");

    useEffect(() => {
        if (tokenAddress && amount) {
            getPrice().then();
        }
    }, [tokenAddress, amount]);

    if (!tokenAddress) {
        return (<></>);
    }


    const provider = new BrowserProvider(walletProvider, arbitrum.id);

    const tokenContract = new ethers.Contract(
        tokenAddress,
        IERC20.abi,
        provider
    );


    const getPrice = async () => {
        const decimals = await tokenContract.decimals();
        const symbol = await tokenContract.symbol();
        const result = ethers.formatUnits(amount, decimals);
        const token = listTokens.find(x => x.address.arbitrum?.toLowerCase() === tokenAddress.toLowerCase());
        setPrice(`${result}`);
        setLogo(token?.logo ?? "/reown.svg");
    };

    return (<div className='flex-row' style={{ alignItems: "center", justifyContent: "center" }}>
        <span style={{ marginRight: "5px" }} >{price}</span>
        <img height={30} width={30} src={logo}></img>
    </div>);
}