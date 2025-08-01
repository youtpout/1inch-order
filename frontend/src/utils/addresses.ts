// Configured for Arbitrum mainnet

export const proxyAddress = "0x99acae685b4d8d214a9a5db7775487e10167279a";
export const inchAggregator = "0x111111125421ca6dc452d289314280a0f8842a65";
export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export const chainIdArbitrum = 42161;
export const rpcArbitrum = "https://arb1.arbitrum.io/rpc";

export const managers = [
    { dex: "Uniswap", manager: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88", factory: "0x1F98431c8aD98523631AE4a59f267346ea31F984" },
    { dex: "PancakeSwap", manager: "0x46A15B0b27311cedF172AB29E4f4766fbE7F4364", factory: "0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865" }
];

export type tokenInfo = {
    decimals: number,
    normalizedName: string,
    symbol: string,
    logo: string,
    altLogo: string,
    stablecoin: boolean,
    address: {
        arbitrum?: string,
        base?: string,
        ethereum?: string,
        polygon?: string,
        optimism?: string
    }
}

export const usdc: tokenInfo = {
    decimals: 6,
    normalizedName: "usdc",
    symbol: "USDC",
    stablecoin: true,
    logo: "/usdc.png",
    altLogo: "/usdc.png",
    address: {
        arbitrum: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
        base: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        ethereum: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        polygon: "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359",
        optimism: "0x0b2c639c533813f4aa9d7837caf62653d097ff85"
    }
}

export const weth: tokenInfo = {
    decimals: 18,
    normalizedName: "weth",
    symbol: "WETH",
    stablecoin: false,
    logo: "/weth.png",
    altLogo: "/eth.png",
    address: {
        arbitrum: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
        base: "0x4200000000000000000000000000000000000006",
        ethereum: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
        polygon: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
        optimism: "0x4200000000000000000000000000000000000006"
    }
}

export const usdt: tokenInfo = {
    decimals: 6,
    normalizedName: "usdt",
    symbol: "USDT",
    stablecoin: true,
    logo: "/usdt.png",
    altLogo: "/usdt.png",
    address: {
        arbitrum: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
        base: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2",
        ethereum: "0xdac17f958d2ee523a2206206994597c13d831ec7",
        polygon: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
        optimism: "0x94b008aa00579c1307b0ef2c499ad98a8ce58e58"
    }
}

export const dai: tokenInfo = {
    decimals: 18,
    normalizedName: "dai",
    symbol: "DAI",
    stablecoin: true,
    logo: "/dai.png",
    altLogo: "/dai.png",
    address: {
        arbitrum: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
        base: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
        ethereum: "0x6b175474e89094c44da98b954eedeac495271d0f",
        polygon: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
        optimism: "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1"
    }
}

export const wbtc: tokenInfo = {
    decimals: 8,
    normalizedName: "wbtc",
    symbol: "WBTC",
    stablecoin: false,
    logo: "/wbtc.png",
    altLogo: "/btc.png",
    address: {
        arbitrum: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f",
        ethereum: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
        polygon: "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6",
        optimism: "0x68f180fcce6836688e9084f035309e29bf0a2095"
    }
}

export const listTokens = [usdc, usdt, dai, weth, wbtc];

export const oracles = [
    { token: usdc.normalizedName, address: "0x50834F3163758fcC1Df9973b6e91f0F0F0434aD3" },
    { token: usdt.normalizedName, address: "0x3f3f5dF88dC9F13eac63DF89EC16ef6e7E25DdE7" },
    { token: dai.normalizedName, address: "0xc5C8E77B397E531B8EC06BFb0048328B30E9eCfB" },
    { token: weth.normalizedName, address: "0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612" },
    { token: wbtc.normalizedName, address: "0x6ce185860a4963106506C203335A2910413708e9" }];


export function getPositionUrl(manager: string, nftId: string) {
    if (manager?.toLowerCase() === "0xC36442b4a4522E871399CD717aBDD847Ab11FE88".toLowerCase()) {
        return `https://app.uniswap.org/positions/v3/arbitrum/${nftId}`
    } else {
        return `https://pancakeswap.finance/liquidity/${nftId}?chain=arb`;
    }
}

export function getLogo(manager: string) {
    if (manager?.toLowerCase() === "0xC36442b4a4522E871399CD717aBDD847Ab11FE88".toLowerCase()) {
        return "/uniswap.png";
    } else {
        return "/cake.png";
    }
}