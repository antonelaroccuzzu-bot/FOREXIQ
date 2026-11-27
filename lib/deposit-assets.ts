/**
 * 0KX public deposit destinations.
 *
 * These are receiving addresses only. Never place private keys or seed phrases
 * in this repository or in browser code.
 *
 * Before accepting customer deposits, independently verify control of each
 * address and perform a small test deposit on the exact network shown.
 */

export type DepositAsset = {
  id: string;
  symbol: string;
  name: string;
  network: string;
  networkCode: string;
  address: string;
  warning: string;
};

export const DEPOSIT_ASSETS: DepositAsset[] = [
  {
    id: "btc-bitcoin",
    symbol: "BTC",
    name: "Bitcoin",
    network: "Bitcoin",
    networkCode: "BTC",
    address: "1HxpFiB5fpL2oPoxFcPiGB7JcHFauqzs2o",
    warning: "Send BTC only over the Bitcoin network.",
  },
  {
    id: "usdt-bep20",
    symbol: "USDT",
    name: "Tether USD",
    network: "BNB Smart Chain (BEP20)",
    networkCode: "BEP20",
    address: "0x6588cd478cf2b229e72fa9c81f983d7922d8a840",
    warning: "Send USDT on BNB Smart Chain (BEP20) only.",
  },
  {
    id: "usdt-ton",
    symbol: "USDT",
    name: "Tether USD",
    network: "TON",
    networkCode: "TON",
    address: "UQAJrLzmLTrjgfwVLyoWUB3k085Bq_pqaOFKCspSp6nF4XR0",
    warning: "Send USDT on TON only. Do not send TON coin or use another network.",
  },
  {
    id: "eth-bep20",
    symbol: "ETH",
    name: "Ethereum (BEP20)",
    network: "BNB Smart Chain (BEP20)",
    networkCode: "BEP20",
    address: "0x6588cd478cf2b229e72fa9c81f983d7922d8a840",
    warning: "This is the BNB Smart Chain route, not native Ethereum (ERC20).",
  },
];

export const DEPOSIT_ASSET_BY_ID = Object.fromEntries(
  DEPOSIT_ASSETS.map((asset) => [asset.id, asset]),
) as Record<string, DepositAsset>;
