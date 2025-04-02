import {
  getCoinsTopGainers,
  getCoinsTopVolume24h,
  getCoinsMostValuable,
  getCoinsNew,
  getCoinsLastTraded,
  getCoinsLastTradedUnique,
} from "@zoralabs/coins-sdk";

export interface ZoraQueryOptions {
  count?: number;
  after?: string;
}

export interface ZoraToken {
  name: string;
  symbol: string;
  marketCapDelta24h: string;
  marketCap: string;
  volume24h: string;
  createdAt: string;
  address: string;
}

export async function fetchZoraData(queryType: string, options: ZoraQueryOptions = {}) {
  const { count = 10, after = undefined } = options;
  
  try {
    let response;
    const queryOptions = { count, after };

    switch (queryType) {
      case 'topGainers':
        response = await getCoinsTopGainers(queryOptions);
        break;
      case 'topVolume':
        response = await getCoinsTopVolume24h(queryOptions);
        break;
      case 'mostValuable':
        response = await getCoinsMostValuable(queryOptions);
        break;
      case 'new':
        response = await getCoinsNew(queryOptions);
        break;
      case 'lastTraded':
        response = await getCoinsLastTraded(queryOptions);
        break;
      case 'lastTradedUnique':
        response = await getCoinsLastTradedUnique(queryOptions);
        break;
      default:
        throw new Error('Invalid query type');
    }

    const tokens = response.data?.exploreList?.edges?.map((edge: any) => ({
      name: edge.node.name,
      symbol: edge.node.symbol,
      marketCapDelta24h: edge.node.marketCapDelta24h,
      marketCap: edge.node.marketCap,
      volume24h: edge.node.volume24h,
      createdAt: edge.node.createdAt,
      address: edge.node.address,
    }));

    return {
      tokens,
      pageInfo: response.data?.exploreList?.pageInfo,
    };
  } catch (error) {
    console.error('Error fetching Zora data:', error);
    throw error;
  }
} 