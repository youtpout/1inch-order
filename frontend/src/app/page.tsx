"use client";

import "./page.scss";
import Image from 'next/image';
import { Button, Card, CardActions, CardContent, Checkbox, FormControl, FormHelperText, Grid, InputBase, InputLabel, MenuItem, Select, SelectChangeEvent, Stack, styled, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
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
import OraclePrice from "@/components/OraclePrice";
import { CreateOrder } from "@/components/CreateOrder";
import { NoUnderlineInput } from "@/utils/NoUnderlineInput";

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

  const selectNft = (tokenId: string) => {
    setNftSelected(tokenId);
    const target = document.getElementById('card-create-order');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (address) {
      getPositions().then();
    }

  }, [platform, address])


  useEffect(() => {
    getOrders().then();
  }, [filter])

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
            const tokenUri = await nfpmContract.tokenURI(tokenId);
            const metadata = tokenUri.indexOf("data:application/json;base64,") !== -1 ?
              JSON.parse(b64DecodeUnicode(tokenUri.replace("data:application/json;base64,", ""))) :
              {
                image: "/cake.png",
                name: "pancake nft"
              };

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

  const handleOrderChange = (
    event: React.MouseEvent<HTMLElement>,
    newAlignment: string,
  ) => {
    setFilter(newAlignment);
  };


  return (
    <Grid container spacing={4} style={{ flex: 1 }}>
      <Grid size={{ xs: 12, lg: 8 }}>
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
                {list.map(x => <div title="Click to select" key={x.index} onClick={() => selectNft(x.tokenId.toString())} className={nftSelected === x.tokenId.toString() ? "position-selected list-element metadata" : " list-element metadata"}>
                  <div className="flex-row">
                    <Checkbox checked={nftSelected === x.tokenId.toString()} />
                    <Position nft={x} manager={manager} ></Position></div>
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
                  <thead>
                    <tr>
                      <th>Position Id</th>
                      <th>Price</th>
                      <th>Trigger</th>
                      <th>Created</th>
                      <th>Action</th>
                    </tr>
                  </thead>
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
      <Grid size={{ xs: 12, lg: 4 }}>
        <Stack spacing={2}>
          <Card variant="outlined" style={{ height: "160px" }}>
            <CardContent>
              <h3>Crypto price</h3>
              <hr style={{ margin: "10px" }}></hr>
              <div>
                <OraclePrice tokenName="weth"></OraclePrice>
                <br></br>
                <OraclePrice tokenName="wbtc"></OraclePrice>
              </div>
            </CardContent>
          </Card>
          <Card variant="outlined" style={{ backgroundColor: "rgba(47, 138, 245, 0.16)" }} >
            <CardContent>
              <div>
                Leave a margin between the trigger price and the sale price of at least 1% to give the buyer time to purchase your position...</div>
            </CardContent>
          </Card>
          <Card id="card-create-order" variant="outlined" style={{ height: "400px" }}>
            <CardContent>
              <h3>Create Order</h3>
              <hr style={{ margin: "10px" }}></hr>
              <div>
                <CreateOrder tokenId={nftSelected} manager={manager}></CreateOrder>
              </div>
            </CardContent>
          </Card>

        </Stack>
      </Grid>
    </Grid>
  );
}