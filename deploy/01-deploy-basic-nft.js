const { network } = require("hardhat")
const { devChains } = require("../helper-hardhat-config")
const {verify} = require('../utils/verfiy')

module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy,log } = deployments
  const {deployer} = await getNamedAccounts()
  const args = []
  const basicNFT = await deploy('BasicNFT',{
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1
  })
  if(!devChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
    log('verifying on etherscan...')
    await verify(basicNFT.address,args)
  }
  log('--------------------------------------------')
}

module.exports.tags = ['all','basicnft','main']