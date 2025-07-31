"use client";

import "./page.scss";
import Image from 'next/image';
import { Button, Card, CardActions, CardContent, FormControl, FormHelperText, InputBase, InputLabel, MenuItem, Select, SelectChangeEvent, styled, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { managers } from "@/utils/addresses";
import {
  useAppKitAccount,
  useAppKitProvider,
  useAppKitNetworkCore,
  type Provider,
} from "@reown/appkit/react";
import {
  BrowserProvider,
  JsonRpcSigner,
  ethers,
  formatEther,
  parseUnits,
} from "ethers";
import INONFUNGIBLE_POSITION_MANAGER from '@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json'
import FACTORY_V3 from '@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json'
import POOL_V3 from '@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json'
import Position from "@/components/Position";
import { arbitrum } from '@reown/appkit/networks'

export default function Home() {
  const [platform, setPlatform] = useState(managers[0].dex);
  const [manager, setManager] = useState(managers[0].manager);
  const [list, setList] = useState<any[]>([]);
  // AppKit hook to get the address and check if the user is connected
  const { address, isConnected } = useAppKitAccount();
  // AppKit hook to get the wallet provider
  const { walletProvider } = useAppKitProvider<Provider>("eip155");

  const handleChange = (event: SelectChangeEvent) => {
    setPlatform(event.target.value);
  };

  useEffect(() => {
    if (address) {
      getPositions().then();
    }

  }, [platform, address])

  const handleGetBalance = async () => {
    const provider = new BrowserProvider(walletProvider, arbitrum.id);
    const balance = await provider.getBalance(address!);
    const eth = formatEther(balance);
    console.log(`${eth} ETH`);
  };

  function b64DecodeUnicode(str: string) {
    // Going backwards: from bytestream, to percent-encoding, to original string.
    return decodeURIComponent(atob(str).split('').map(function (c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  }


  async function getPositions() {
    try {
      let selectedDex = managers.find(x => x.dex === platform);
      if (selectedDex) {
        const provider = new BrowserProvider(walletProvider, arbitrum.id);


        let managerAddress = selectedDex.manager;
        let factoryAddress = selectedDex.factory;
        setManager(managerAddress);

        const nfpmContract = new ethers.Contract(
          managerAddress,
          INONFUNGIBLE_POSITION_MANAGER.abi,
          provider
        )

        const factoryContract = new ethers.Contract(
          factoryAddress,
          FACTORY_V3.abi,
          provider
        )

        const numPositions = await nfpmContract.balanceOf(address);
        const result = [];
        for (let index = 0; index < numPositions; index++) {
          const tokenId = await nfpmContract.tokenOfOwnerByIndex(address, index);
          const position = await nfpmContract.positions(tokenId);
          if (position.liquidity > 0) {
            console.log("position", position);
            const tokenUri = await nfpmContract.tokenURI(tokenId);
            const metadata = JSON.parse(b64DecodeUnicode(tokenUri.replace("data:application/json;base64,", "")))

            const poolAddress = await factoryContract.getPool(position.token0, position.token1, position.fee);

            const poolContract = new ethers.Contract(
              poolAddress,
              POOL_V3.abi,
              provider
            )
            const slot0 = await poolContract.slot0();

            const inRange = position.tickLower < position.tickUpper ?
              position.tickLower <= slot0.tick && slot0.tick <= position.tickUpper :
              position.tickLower >= slot0.tick && slot0.tick >= position.tickUpper;
            console.log("slot0", slot0);
            console.log("inRange", inRange);
            console.log("price", ((1.0001 ** Number(slot0.tick)) * (10 ** 18 / 10 ** 6)));
            result.push({ metadata, tokenId: tokenId, index, inRange, position });
          }
        }
        setList(result);
      }

    } catch (error) {
      console.error("resolve metadata failed", error);
    }
  }


  const NoUnderlineInput = styled(InputBase)({
    '&:before': {
      borderBottom: 'none',
    },
    '&:after': {
      borderBottom: 'none',
    },
    '&:hover:not(.Mui-disabled):before': {
      borderBottom: 'none',
    },
  });


  return (
    <div className="flex-row" style={{ justifyContent: "space-between", marginTop: "20px" }}>
      <Card variant="outlined" style={{ flex: 2 }}>
        <CardContent>
          <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
            <Select
              labelId="demo-simple-select-helper-label"
              id="demo-simple-select-helper"
              value={platform}
              onChange={handleChange}
              input={<NoUnderlineInput />}
            >
              {managers.map(p =>
                <MenuItem key={p.dex} value={p.dex}>{p.dex}</MenuItem>
              )}
            </Select>
          </FormControl>

          <div className="position">
            {list?.length ? <h3>Active positions : </h3> : <div></div>}
            {list.map(x => <div key={x.index} className='list-element metadata'>
              <Position nft={x} manager={manager} ></Position>
            </div>)}
          </div>
        </CardContent>
        <CardActions>
          <Button size="small">Learn More</Button>
        </CardActions>
      </Card>
      <div style={{ width: "20px" }}></div>
      <Card variant="outlined" style={{ flex: 1 }}>
        <CardContent>
          <Typography gutterBottom sx={{ color: 'text.secondary', fontSize: 14 }}>
            Word of the Day
          </Typography>
          <Typography variant="h5" component="div">

          </Typography>
          <Typography sx={{ color: 'text.secondary', mb: 1.5 }}>adjective</Typography>
          <Typography variant="body2">
            well meaning and kindly.
            <br />
            {'"a benevolent smile"'}
          </Typography>
        </CardContent>
        <CardActions style={{ flex: 1 }}>
          <Button size="small">Learn More</Button>
        </CardActions>
      </Card>
    </div>
  );
}