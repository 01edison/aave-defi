/** @type import('hardhat/config').HardhatUserConfig */
require("hardhat-deploy");
require("@nomiclabs/hardhat-ethers");
require("dotenv").config();
module.exports = {
  solidity: {
    compilers: [
      { version: "0.8.7" },
      { version: "0.4.19" },
      { version: "0.6.12" },
    ],
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 31337,
      forking: {
        url: process.env.MAINNET_RPC_URL,
      },
    },
    goerli: {
      chainId: 5,
      accounts: [],
      url: "",
    },
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
  },
};
