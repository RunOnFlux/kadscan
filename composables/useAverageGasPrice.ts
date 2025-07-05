import { useState } from '#app';

const useGasPriceStats = () => useState<{ totalGasPrice: number; txCount: number }>('gas-price-stats', () => ({
  totalGasPrice: 0.000001,
  txCount: 1,
}));

const useGasProcessedHeights = () => useState<Set<string>>('gas-processed-heights', () => new Set());

const updateGasPriceStats = (blocks: any[]) => {
  const stats = useGasPriceStats();
  const processedHeights = useGasProcessedHeights();

  blocks.forEach(block => {
    const key = `${block.height}-${block.chainId}`;
    if (processedHeights.value.has(key)) {
      return;
    }

    if (block.transactions?.edges) {
      block.transactions.edges.forEach((edge: any) => {
        const gasPrice = edge.node?.cmd?.meta?.gasPrice;
        if (gasPrice !== undefined) {
          const price = typeof gasPrice === 'string' ? parseFloat(gasPrice) : gasPrice;

          if (!isNaN(price)) {
            stats.value.totalGasPrice += price;
            stats.value.txCount += 1;
          }
        }
      });
    }
    processedHeights.value.add(key);
  });


  while (processedHeights.value.size > 6) {
    const oldestKey = processedHeights.value.values().next().value;
    if (oldestKey) {
      processedHeights.value.delete(oldestKey);
    } else {
      break;
    }
  }
  console.log("stats.value.txCount", stats.value.txCount)
//   console.log('Gas Processed Heights Set:', processedHeights.value.size);
};

export { useGasPriceStats, updateGasPriceStats }; 