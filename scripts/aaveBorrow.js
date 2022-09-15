const { getWeth, AMOUNT } = require("./getWeth");
const { getNamedAccounts, ethers } = require("hardhat");

async function main() {
  await getWeth();
  const { deployer } = await getNamedAccounts();

  const lendingPool = await getLendingPool(deployer);

  console.log(`Lending pool address: ${lendingPool.address}`); // actual lending pool address on mainnet

  // 1. Depositing Colateral
  const wethTokenContractAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

  // approve the lending pool to take "AMOUNT" ERC20 tokens from us
  await approveERC20(
    wethTokenContractAddress,
    lendingPool.address,
    AMOUNT,
    deployer
  );

  console.log("Depositing.....");

  await lendingPool.deposit(wethTokenContractAddress, AMOUNT, deployer, 0); // this 0 is for the referral code which isnt really important

  console.log("Deposited");

  //2. Borrowing

  let { availableBorrowsETH, totalDebtETH } = await getBorrowUserData(
    lendingPool,
    deployer
  );

  const daiPrice = await getDAIPrice();

  const amountDaiToBorrow = availableBorrowsETH * 0.95 * (1 / daiPrice); //0.95 for safety

  const amountDaiToBorrowWEI = ethers.utils.parseEther(
    amountDaiToBorrow.toString()
  ); //this converts it to its WEI equivalent
  console.log(`You can borrow ${amountDaiToBorrow} DAI`);

  const daiTokenAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F"; // smart contract address of the DAI token

  await borrowDai(daiTokenAddress, lendingPool, amountDaiToBorrowWEI, deployer);

  await getBorrowUserData(lendingPool, deployer);

  //3 Repaying
  await repay(amountDaiToBorrowWEI, daiTokenAddress, lendingPool, deployer);

  await getBorrowUserData(lendingPool, deployer);
}

async function repay(amount, daiAddress, lendingPool, account) {
  await approveERC20(daiAddress, lendingPool.address, amount, account); // give approval to the lending pool to move DAI tokens from our account

  const repayTx = await lendingPool.repay(daiAddress, amount, 1, account);
  await repayTx.wait();

  console.log("Repaid!");
}

async function borrowDai(
  daiAddress,
  lendingPool,
  amountDaiToBorrowWEI,
  account
) {
  const borrowTx = await lendingPool.borrow(
    daiAddress,
    amountDaiToBorrowWEI,
    1,
    0,
    account
  );
  //check https://docs.aave.com/developers/v/2.0/the-core-protocol/lendingpool to understand the parameters for the borrow function

  await borrowTx.wait();

  console.log("You've borrowed DAI");
}
async function getDAIPrice() {
  const daiPriceFeedContract = await ethers.getContractAt(
    "AggregatorV3Interface",
    "0x773616E4d11A78F511299002da57A0a94577F1f4" //gotten from the chainlink docs DAI/ETH price feeds address
  );

  const price = (await daiPriceFeedContract.latestRoundData())[1];
  const decimals = await daiPriceFeedContract.decimals();

  console.log(`The DAI/ETH price is ${price}`);

  return price; // ETH/DAI price in 18 decimals
}

async function getBorrowUserData(lendingPool, account) {
  const { totalCollateralETH, totalDebtETH, availableBorrowsETH } =
    await lendingPool.getUserAccountData(account);

  console.log(`You have ${totalCollateralETH} ETH deposited`);
  console.log(`You have borrowed ${totalDebtETH} ETH`);
  console.log(`You can borrow ${availableBorrowsETH} ETH`);

  return { availableBorrowsETH, totalDebtETH };
}

async function getLendingPool(account) {
  //Lending Pool Address Provider: 0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5
  // we get the Lending Pool Address from the provider above
  const lendingPoolAddressProvider = await ethers.getContractAt(
    "ILendingPoolAddressesProvider", // compiled interface of Lending pool address provider
    "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5", //address of lending pool address provider
    account
  );

  const lendingPoolAddress = await lendingPoolAddressProvider.getLendingPool(); // this returns the address of the lending pool

  const lendingPool = await ethers.getContractAt(
    "ILendingPool",
    lendingPoolAddress,
    account
  );
  return lendingPool;
}

async function approveERC20(
  erc20contractAddress,
  spenderAddress,
  amountToSpend,
  account
) {
  const erc20Token = await ethers.getContractAt(
    "IERC20",
    erc20contractAddress,
    account
  );

  const tx = await erc20Token.approve(spenderAddress, amountToSpend); // we approve the lending pool to move"amountToSpend" erc20 tokens from my wallet
  await tx.wait();
  console.log("Approved!");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.log(e);
    process.exit(1);
  });
