import { ref, readonly } from 'vue';
import { useFormat } from './useFormat';

const nftTransfers = ref<any[]>([]);
const loading = ref(false);
const { formatRelativeTime, formatGasPrice } = useFormat();
const pageInfo = ref<any>(null);
const totalCount = ref(0);
const rowsToShow = ref(25);
const error = ref<any>(null);

export const useAccountNFTTransfers = () => {
  const clearState = () => {
    nftTransfers.value = [];
    loading.value = false;
    pageInfo.value = null;
    error.value = null;
  };

  const updateRowsToShow = (rows: any) => {
    rowsToShow.value = rows.value;
  };

  const fetchAccountNFTTransfers = async ({
    networkId,
    address,
    after,
    before,
    toLastPage = false,
    chainId,
  }: {
    networkId: string,
    address: string,
    after?: string,
    before?: string,
    toLastPage?: boolean,
    chainId?: string,
  }) => {
    // TODO: Implement real GraphQL query for account NFT transfers
    // For now, return empty data to show empty states
    loading.value = false;
    nftTransfers.value = [];
    totalCount.value = 0;
    pageInfo.value = {
      hasNextPage: false,
      hasPreviousPage: false,
      startCursor: null,
      endCursor: null
    };
  };

  const fetchTotalCount = async (networkId: string, address: string) => {
    // TODO: Implement real query for total NFT transfer count
    totalCount.value = 0;
  };

  return {
    nftTransfers: readonly(nftTransfers),
    loading: readonly(loading),
    pageInfo: readonly(pageInfo),
    totalCount: readonly(totalCount),
    rowsToShow: readonly(rowsToShow),
    error: readonly(error),
    fetchAccountNFTTransfers,
    fetchTotalCount,
    updateRowsToShow,
    clearState,
  };
}; 