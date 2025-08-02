'use client'
import { listTokens, rpcArbitrum } from '@/utils/addresses';
import { JsonRpcProvider, ethers } from "ethers";
import { useEffect, useState } from "react";


type Props = {
    tokenAddress: string,
    amount: string
}

export default function FormatPrice({ tokenAddress, amount }: Props) {
    const [price, setPrice] = useState<string>("");
    const [logo, setLogo] = useState<string>("/reown.svg");

    useEffect(() => {
        if (tokenAddress && amount) {
            getPrice().then();
        }
    }, [tokenAddress, amount]);

    if (!tokenAddress) {
        return (<></>);
    }

    const getPrice = async () => {
        const token = listTokens.find(x => x.address.arbitrum?.toLowerCase() === tokenAddress.toLowerCase());
        const result = ethers.formatUnits(amount, token?.decimals ?? 18);
        setPrice(`${result}`);
        setLogo(token?.logo ?? "/reown.svg");
    };

    return (<div className='flex-row' style={{ alignItems: "center", justifyContent: "center" }}>
        <span style={{ marginRight: "5px" }} >{price}</span>
        <img height={30} width={30} src={logo}></img>
    </div>);
}