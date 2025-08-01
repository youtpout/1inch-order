"use client";

import "./page.scss";
import Image from 'next/image';
import { Button, Card, CardActions, CardContent, FormControl, FormHelperText, Grid, InputBase, InputLabel, MenuItem, Select, SelectChangeEvent, Stack, styled, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
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
import { OrderItem } from "@/components/OrderItem";

export default function Home() {
  const [platform, setPlatform] = useState(managers[0].dex);
  const [orderList, setOrderList] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [nftSelected, setNftSelected] = useState('0');
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


  useEffect(() => {
    getOrders().then();
  }, [filter])

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

  async function getOrders() {
    try {
      const filterAddress = filter === "all" ? "" : `address=${address}`;
      const fetchResponse = await fetch("/api/order?" + filterAddress);
      const serviceResponse = await fetchResponse.json();
      console.log(serviceResponse);
      setOrderList(serviceResponse ?? []);
    } catch (error) {
      console.error("getOrders", error)
    }

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

  const handleOrderChange = (
    event: React.MouseEvent<HTMLElement>,
    newAlignment: string,
  ) => {
    setFilter(newAlignment);
  };


  return (
    <Grid container spacing={2} style={{ flex: 1 }}>
      <Grid size={8}>
        <Stack spacing={2}>
          <Card variant="elevation" style={{ maxHeight: "800px", minHeight: "400px" }}   >
            <CardContent>
              <div className="flex-row" style={{ alignItems: "center", marginBottom: "10px" }}>
                <img width={32} height={32} style={{ marginRight: "5px" }} src={platform === "Uniswap" ? "/uniswap.png" : "/cake.png"}></img>
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
              </div>
              <div className="position" style={{ height: "100%", overflow: "auto" }}>
                {!list?.length && <div>No position found</div>}
                {list.map(x => <div title="Click to select" key={x.index} onClick={() => setNftSelected(x.tokenId.toString())} className={nftSelected === x.tokenId.toString() ? "position-selected list-element metadata" : " list-element metadata"}>
                  <Position nft={x} manager={manager} ></Position>
                </div>)}
              </div>
            </CardContent>
          </Card>
          <Card variant="elevation" style={{ maxHeight: "800px", minHeight: "400px" }} >

            <CardContent>
              <div className="flex-row" style={{ alignItems: "center", justifyContent: "space-between" }}>
                <h3>Orders</h3>
                <ToggleButtonGroup
                  value={filter}
                  color="secondary"
                  exclusive
                  onChange={handleOrderChange}
                  aria-label="Orders"
                >
                  <ToggleButton value="all">All orders</ToggleButton>
                  <ToggleButton value="mine">My orders</ToggleButton>
                </ToggleButtonGroup>
              </div>
              <hr style={{ margin: "10px" }}></hr>
              <div style={{ height: "100%", overflow: "auto" }}>
                <table className="table-orders" width="100%">
                  <tr>
                    <th>Dex</th>
                    <th>Position Id</th>
                    <th>Price</th>
                    <th>Action</th>
                  </tr>
                  {orderList?.map(x =>
                    <tbody key={x.hash}>
                      <OrderItem orderDto={x}></OrderItem>
                    </tbody>)}
                </table>

              </div>
            </CardContent>
          </Card>
        </Stack>
      </Grid>
      <Grid size={4}>

        <Card variant="outlined">
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
      </Grid>
    </Grid>
  );
}