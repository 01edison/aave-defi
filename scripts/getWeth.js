const { ethers, getNamedAccounts } = require("hardhat");

const AMOUNT = ethers.utils.parseEther("0.02");

async function getWeth() {
  // WETH token address: 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2 from mainnet etherscan
  // abi for WETH token contract in artifacts
  const { deployer } = await getNamedAccounts();

  const wethTokenContract = await ethers.getContractAt(
    "IWeth",
    "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    deployer
  ); // we get a hold of the WETH token contract on mainnet

  const txResponse = await wethTokenContract.deposit({ value: AMOUNT }); // we deposit ETH to it

  await txResponse.wait(1);

  const wethBalance = await wethTokenContract.balanceOf(deployer); // we check our WETH token balance

  console.log(`Got ${wethBalance.toString()} WETH.`);
}

module.exports = { getWeth, AMOUNT };
