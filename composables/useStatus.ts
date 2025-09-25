import type { Ref } from 'vue'
import IconHourglass from '~/components/icon/Hourglass.vue'
import IconCancel from '~/components/icon/Cancel.vue'
import IconCheckmarkFill from '~/components/icon/CheckmarkFill.vue'
import { useBlocks } from '~/composables/useBlocks'

export interface StatusDescriptor {
  text: string
  icon: any
  classes: string
  description: string
  placement: 'top' | 'right' | 'bottom' | 'left'
}

export const SAFE_CONFIRMATIONS = 6

export function useStatus(providedLastBlockHeight?: Ref<number | null>) {
  const { lastBlockHeight: blocksLastBlockHeight } = useBlocks()
  const lastBlockHeight = providedLastBlockHeight ?? blocksLastBlockHeight

  const isSafe = (blockHeight?: number | null) => {
    if (lastBlockHeight.value == null || blockHeight == null) return false
    return (lastBlockHeight.value - blockHeight) > SAFE_CONFIRMATIONS
  }

  const transactionStatus = (
    blockHeight: number | null | undefined,
    canonical: boolean | null | undefined,
    badResult: any,
  ): StatusDescriptor => {
    const safeBlock = isSafe(blockHeight)

    if (badResult !== null) {
      return {
        text: 'Failed',
        placement: 'top',
        icon: IconCancel,
        classes: 'bg-[#7f1d1d66] border-[#f8717180] text-[#f87171]',
        description: 'Transaction failed to execute',
      }
    }

    if (safeBlock && !canonical) {
      return {
        text: 'Failed',
        placement: 'top',
        icon: IconCancel,
        classes: 'bg-[#7f1d1d66] border-[#f8717180] text-[#f87171]',
        description: 'Transaction failed to execute',
      }
    }

    if (safeBlock && !!canonical) {
      return {
        text: 'Success',
        placement: 'top',
        icon: IconCheckmarkFill,
        classes: 'bg-[#0f1f1d] border-[#00a18680] text-[#00a186]',
        description: 'Transaction executed successfully',
      }
    }

    return {
      text: 'Pending',
      placement: 'top',
      icon: IconHourglass,
      classes: 'bg-[#17150d] border-[#444648] text-[#bbbbbb]',
      description: 'Transaction is pending to be finalized',
    }
  }

  const blockStatus = (
    blockHeight: number | null | undefined,
    canonical: boolean | null | undefined,
  ): StatusDescriptor => {
    const safeBlock = isSafe(blockHeight)

    if (safeBlock && !canonical) {
      return {
        text: 'Orphaned',
        placement: 'top',
        icon: IconCancel,
        classes: 'bg-[#7f1d1d66] border-[#f8717180] text-[#f87171]',
        description: 'Block is not part of the canonical chain and is orphaned',
      }
    }

    if (safeBlock && !!canonical) {
      return {
        text: 'Finalized',
        placement: 'top',
        icon: IconCheckmarkFill,
        classes: 'bg-[#0f1f1d] border-[#00a18680] text-[#00a186]',
        description: 'Block is part of the canonical chain and safe to use',
      }
    }

    return {
      text: 'Pending',
      placement: 'top',
      icon: IconHourglass,
      classes: 'bg-[#17150d] border-[#444648] text-[#bbbbbb]',
      description: 'Block is not part of the canonical chain and is pending to be finalized or orphaned',
    }
  }

  const transactionStatusCrossChain = (
    status: 'failed' | 'success' | 'pending' | null | undefined,
  ): StatusDescriptor | null => {
    if (status == null) return null
    if (status === 'failed') {
      return {
        text: 'Cross Chain Transfer',
        placement: 'top',
        icon: IconCancel,
        classes: 'bg-[#7f1d1d66] border-[#f8717180] text-[#f87171]',
        description: 'Cross-chain transaction failed to execute',
      }
    }
    if (status === 'success') {
      return {
        text: 'Cross Chain Transfer',
        placement: 'top',
        icon: IconCheckmarkFill,
        classes: 'bg-[#0f1f1d] border-[#00a18680] text-[#00a186]',
        description: 'Cross-chain transaction executed successfully',
      }
    }
    return {
      text: 'Cross Chain Transfer',
      placement: 'top',
      icon: IconHourglass,
      classes: 'bg-[#17150d] border-[#444648] text-[#bbbbbb]',
      description: 'Cross-chain transaction is pending to be finalized or failed',
    }
  }

  const transactionResultStatus = (
    badResult: unknown | null | undefined,
    goodResult: unknown | null | undefined,
  ): StatusDescriptor | null => {
    if (badResult !== null && badResult !== undefined) {
      return {
        text: 'Bad',
        placement: 'top',
        icon: IconCancel,
        classes: 'bg-[#7f1d1d66] border-[#f8717180] text-[#f87171]',
        description: 'Transaction returned a bad result',
      }
    }
    if (goodResult !== null && goodResult !== undefined) {
      return {
        text: 'Good',
        placement: 'top',
        icon: IconCheckmarkFill,
        classes: 'bg-[#0f1f1d] border-[#00a18680] text-[#00a186]',
        description: 'Transaction returned a good result',
      }
    }
    return null
  }

  return { transactionStatus, blockStatus, transactionStatusCrossChain, transactionResultStatus }
}


