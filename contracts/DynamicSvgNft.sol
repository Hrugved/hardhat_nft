// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "base64-sol/base64.sol";

error DynamicSvgNft__invalidTokenId();

contract DynamicSvgNft is ERC721 {
  uint256 private s_tokenCounter;
  string private i_lowImageURI;
  string private i_highImageURI;
  string private constant base64EncodedSvgPrefix = "data:image/svg+xml;base64,";
  AggregatorV3Interface internal immutable i_priceFeed;
  mapping(uint256 => int256) public s_tokenIdToHighValue;

  event NFTCreated(uint256 indexed tokenId, int256 highValue);

  constructor(
    address priceFeedAddress,
    string memory lowSvg,
    string memory highSvg
  ) ERC721("Dynamic SVG NFT", "DSN") {
    s_tokenCounter = 0;
    i_lowImageURI = svgToImageURI(lowSvg);
    i_highImageURI = svgToImageURI(highSvg);
    i_priceFeed = AggregatorV3Interface(priceFeedAddress);
  }

  function svgToImageURI(string memory svg) public pure returns (string memory) {
    string memory svgBase64Encoded = Base64.encode(bytes(string(abi.encodePacked(svg))));
    return string(abi.encodePacked(base64EncodedSvgPrefix, svgBase64Encoded));
  }

  function mintNft(int256 highValue) public {
    s_tokenIdToHighValue[s_tokenCounter] = highValue;
    uint256 tokenCounter = s_tokenCounter;
    s_tokenCounter++;
    _safeMint(msg.sender, tokenCounter);
    emit NFTCreated(s_tokenCounter, highValue);
  }

  function _baseURI() internal pure override returns (string memory) {
    return "data://application/json;base64,";
  }

  function tokenURI(uint256 tokenId) public view override returns (string memory) {
    if (!_exists(tokenId)) revert DynamicSvgNft__invalidTokenId();
    (, int256 price, , , ) = i_priceFeed.latestRoundData();
    string memory imageURI = i_lowImageURI;
    if (price >= s_tokenIdToHighValue[tokenId]) {
      imageURI = i_highImageURI;
    }
    return
      string(
        abi.encodePacked(
          _baseURI(),
          Base64.encode(
            bytes(
              abi.encodePacked(
                '{"name":',
                name(),
                '",description":NFT changing based on chainlink feed",',
                '"attributes":[{"trait_type":"coolness","value":100}],"image":"',
                imageURI,
                '"}'
              )
            )
          )
        )
      );
  }

  function getTokenCounter() public view returns (uint256) {
    return s_tokenCounter;
  }

  function getLowSvg() public view returns (string memory) {
    return i_lowImageURI;
  }

  function getHighSvg() public view returns (string memory) {
    return i_highImageURI;
  }
}
