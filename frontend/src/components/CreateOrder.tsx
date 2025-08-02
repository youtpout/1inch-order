'use client'
import { useDisconnect, useAppKit, useAppKitNetwork, Provider, useAppKitAccount, useAppKitNetworkCore, useAppKitProvider } from '@reown/appkit/react'
import { networks } from '@/config'
import { disconnect, platform } from 'process';
import { LimitOrder, MakerTraits, Address, OrderInfoData, Extension, LimitOrderWithFee, Sdk } from "@1inch/limit-order-sdk"
import { inchAggregator, listTokens, managers, oracles, proxyAddress, usdc, weth, ZERO_ADDRESS } from '@/utils/addresses';
import { arbitrum } from '@reown/appkit/networks';
import { BrowserProvider, ethers, Interface, AbiCoder } from 'ethers';
import PositionOrderAbi from "@/utils/PositionOrderAbi.json";
import { buildTakerTraits } from '@/utils/orderUtils';
import { CustomAxiosProviderConnector } from '@/utils/AxiosProviderConnector';
import AggregatorAbi from "@/utils/AggregatorAbi.json";
import { FormControl, Select, MenuItem, SelectChangeEvent, InputLabel, TextField } from '@mui/material';
import { ChangeEvent, useState } from 'react';
import { NoUnderlineInput } from '@/utils/NoUnderlineInput';
import INONFUNGIBLE_POSITION_MANAGER from '@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json'


export const CreateOrder = ({ tokenId, manager }) => {
    // AppKit hook to get the address and check if the user is connected
    const { address, isConnected } = useAppKitAccount();
    // AppKit hook to get the wallet provider
    const { walletProvider } = useAppKitProvider<Provider>("eip155");
    const [tokenName, setTokenName] = useState("usdc");
    const [token, setToken] = useState(usdc);
    const [sellPrice, setSellPrice] = useState("0");

    const [triggerAssetName, setTriggerAssetName] = useState("weth");
    const [triggerAsset, setTriggerAsset] = useState(weth);
    const [compare, setCompare] = useState("lt");
    const [triggerPrice, setTriggerPrice] = useState("0");

    const chainId = arbitrum.id;

    const handleChange = (event: SelectChangeEvent) => {
        const val = event.target.value;
        setTokenName(val);
        const token = listTokens.find(x => x.normalizedName == val);
        setToken(token ?? usdc)
    };

    const handlePrice = (event: ChangeEvent<HTMLInputElement>) => {
        const val = event.target.value;
        setSellPrice(val);
    };

    const handleTriggerPrice = (event: ChangeEvent<HTMLInputElement>) => {
        const val = event.target.value;
        setTriggerPrice(val);
    };


    const handleTriggerChange = (event: SelectChangeEvent) => {
        const val = event.target.value;
        setTriggerAssetName(val);
        const token = listTokens.find(x => x.normalizedName == val);
        setTriggerAsset(token ?? weth)
    };


    const create = async () => {
        try {

            if (address) {
                const provider = new BrowserProvider(walletProvider, arbitrum.id);

                const proxyAbi = new Interface(PositionOrderAbi);
                const aggregatorAbi = new Interface(AggregatorAbi);

                const makerAssetSuffix = '0x' + proxyAbi.encodeFunctionData(
                    'func_60iHVgK',
                    // ERC721Proxy arguments (2 last passed as extra)
                    // address from, address to, uint256 amount, uint256 tokenId, IERC721 token
                    [address, ZERO_ADDRESS, 0, tokenId, manager],
                    // leave only 2 extra arguments
                ).substring(202);
                console.log("makerAssetSuffix", makerAssetSuffix)

                const amount = ethers.parseUnits(sellPrice.toString(), token.decimals);
                const takerAssetSuffix = '0x' + proxyAbi.encodeFunctionData(
                    'func_60iHVgK',
                    // ERC721Proxy arguments (2 last passed as extra)
                    // address from, address to, uint256 amount, uint256 tokenId, IERC721 token
                    [ZERO_ADDRESS, address, 0, amount, token.address.arbitrum],
                    // leave only 2 extra arguments
                ).substring(202);

                console.log("takerassetsufix", takerAssetSuffix)

                const oracle = oracles.find(x => x.token === triggerAssetName);
                console.log("triggerPrice", triggerPrice)
                const predicatePrice = ethers.parseUnits(triggerPrice, triggerAsset.decimals);
                console.log("predicatePrice", predicatePrice)
                const oracleCall = aggregatorAbi.encodeFunctionData('arbitraryStaticCall', [
                    proxyAddress,
                    proxyAbi.encodeFunctionData('getPrice', [oracle?.address, triggerAsset.decimals])
                ]);

                const predicate = aggregatorAbi.encodeFunctionData('lt', [predicatePrice, oracleCall]);

                console.log("predicate", predicate);

                const coder = new AbiCoder();
                // send position fee to the current position owner
                const preInteraction = proxyAddress + coder.encode(['address', 'uint256'], [manager, tokenId]).substring(2);

                console.log("preinteraction", preInteraction);

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
                    predicate,
                    makerPermit: '0x',
                    preInteraction,
                    postInteraction: '0x',
                    customData: '0x',
                });

                const order = new LimitOrder(orderInfo, undefined, extension);

                const signer = await provider.getSigner();
                const managerContract = new ethers.Contract(
                    manager,
                    INONFUNGIBLE_POSITION_MANAGER.abi,
                    signer
                );

                // check nft allowance
                const isApprovedForAll = await managerContract.isApprovedForAll(address, proxyAddress);
                const approvedAddress = await managerContract.getApproved(tokenId);
                const isAllowed = isApprovedForAll || approvedAddress.toLowerCase() === proxyAddress.toLowerCase();
                if (!isAllowed) {
                    const allowTx = await managerContract.approve(proxyAddress, tokenId);
                    await allowTx.wait();
                }

                const typedData = order.getTypedData(chainId)

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
            <div className="flex-row" style={{ alignItems: "center", marginBottom: "10px" }}>
                <img width={32} height={32} style={{ marginRight: "5px" }} src={token.logo}></img>
                <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
                    <InputLabel variant="standard" htmlFor="uncontrolled-native">
                        You receive
                    </InputLabel>
                    <Select
                        labelId="create-asset"
                        id="create-asset"
                        style={{ height: "60px" }}
                        value={tokenName}
                        onChange={handleChange}
                        input={<NoUnderlineInput />}
                    >
                        {listTokens.map(p =>
                            <MenuItem key={p.normalizedName} value={p.normalizedName}>{p.normalizedName}</MenuItem>
                        )}
                    </Select>
                </FormControl>
                <TextField label="Sell price" id="outlined-basic" slotProps={{
                    inputLabel: {
                        shrink: true,
                    },
                }} style={{ width: "150px" }} defaultValue={sellPrice} onChange={handlePrice} variant="outlined" />
            </div>
            <div>
                <div className="flex-row" style={{ alignItems: "center", marginBottom: "10px" }}>
                    <img width={32} height={32} style={{ marginRight: "5px" }} src={triggerAsset.logo}></img>
                    <FormControl variant="standard" sx={{ m: 1, minWidth: 100 }}>
                        <InputLabel variant="standard" htmlFor="uncontrolled-native">
                            Trigger asset
                        </InputLabel>
                        <Select
                            labelId="create-asset"
                            id="create-asset"
                            style={{ height: "60px" }}
                            value={triggerAssetName}
                            onChange={handleTriggerChange}
                            input={<NoUnderlineInput />}
                        >
                            {listTokens.map(p =>
                                <MenuItem key={p.normalizedName} value={p.normalizedName}>{p.normalizedName}</MenuItem>
                            )}
                        </Select>
                    </FormControl>
                    <FormControl variant="standard" sx={{ m: 1 }}>
                        <InputLabel variant="standard" htmlFor="uncontrolled-native">
                            Sign
                        </InputLabel>
                        <Select
                            style={{ height: "60px", width: "50px", fontSize: "24px", fontWeight: "bold" }}
                            value={compare}
                            onChange={(e) => setCompare(e.target.value)}
                            input={<NoUnderlineInput />}
                        >
                            <MenuItem value="lt">{'<'}</MenuItem>
                            <MenuItem value="gt">{'>'}</MenuItem>
                        </Select>
                    </FormControl>
                    <TextField label="Trigger price" id="outlined-basic" slotProps={{
                        inputLabel: {
                            shrink: true,
                        },
                    }} style={{ width: "103px" }} defaultValue={triggerPrice} onChange={handleTriggerPrice} variant="outlined" />
                </div>
            </div>
            <div style={{ height: "50px" }}>
                {`You request to receive ${sellPrice} ${tokenName} if the price of ${triggerAssetName} is ${compare === "lt" ? "less than" : "greater than"} ${triggerPrice} $ for you position ${tokenId}`}
            </div>
            <div className='flex-row' style={{ justifyContent: "center" }}>
                {!tokenId || tokenId === "0" ? <div>Select a position</div> : <button onClick={() => create()}>Create</button>}
            </div>

        </div>
    )
}
