const { network, ethers } = require("hardhat")
const { devChains, networkConfig } = require("../helper-hardhat-config")
const { verify } = require("../utils/verfiy")
const fs = require('fs')

module.exports = async ({getNamedAccounts,deployments}) => {
  const {deploy,log} = deployments
  const {deployer} = await getNamedAccounts()
  const chainId = network.config.chainId
  let ethUsdPriceFeedAddress
  if(devChains.includes(network.name)) {
    const ethUsdAggregatorMock = await ethers.getContract('MockV3Aggregator')
    ethUsdPriceFeedAddress = ethUsdAggregatorMock.address
  } else {
    ethUsdPriceFeedAddress = networkConfig[chainId].ethUsdPriceFeed
  }
  const lowSVG = await fs.readFileSync("./images/dynamicNFT/frown.svg",{encoding:'utf8'})
  const highSVG = await fs.readFileSync("./images/dynamicNFT/happy.svg",{encoding:'utf8'})
  args=[ethUsdPriceFeedAddress,lowSVG,highSVG]
  const dynamicSvgNft = await deploy('DynamicSvgNft', {
    from: deployer,
    args: args,
    log:true,
    waitConfirmations: network.config.blockConfirmations || 1
  })
  log("--------------------------------------------------------")
  if (!devChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
    log("verifying on Etherscan...")
    await verify(dynamicSvgNft.address, args)
  }
}

module.exports.tags = ['all','dynamicsvg','main']