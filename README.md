# 1inch-order

Use yarn as package manager, reown/ethers for the frontend, hardhat3/solidity for the contracts, 1inch order sdk to create order

## Installation 

Install dependencies 

```
yarn install
```

Compile contracts

```
yarn run compile
```

Test the contracts

```
yarn run test
```

Setup Database, use a postgreSQL database, set your connection string to the POSTGRE_DB_URL in the env file, setup the schema

```
yarn run migrate
```

Launch the website

```
yarn run dev
```

## Address

Deployed on arbitrum mainnet

(0x99acae685b4d8d214a9a5db7775487e10167279a)[https://arbiscan.io/address/0x99acae685b4d8d214a9a5db7775487e10167279a#code]

