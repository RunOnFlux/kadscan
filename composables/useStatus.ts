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
        icon: IconCancel,
        classes: 'bg-[#7f1d1d66] border-[#f8717180] text-[#f87171]',
        description: 'Transaction failed to execute',
      }
    }

    if (safeBlock && !canonical) {
      return {
        text: 'Failed',
        icon: IconCancel,
        classes: 'bg-[#7f1d1d66] border-[#f8717180] text-[#f87171]',
        description: 'Transaction failed to execute',
      }
    }

    if (safeBlock && !!canonical) {
      return {
        text: 'Success',
        icon: IconCheckmarkFill,
        classes: 'bg-[#0f1f1d] border-[#00a18680] text-[#00a186]',
        description: 'Transaction executed successfully',
      }
    }

    return {
      text: 'Pending',
      icon: IconHourglass,
      classes: 'bg-[#17150d] border-[#44464980] text-[#989898]',
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
        icon: IconCancel,
        classes: 'bg-[#7f1d1d66] border-[#f8717180] text-[#f87171]',
        description: 'Block is not part of the canonical chain and is orphaned',
      }
    }

    if (safeBlock && !!canonical) {
      return {
        text: 'Finalized',
        icon: IconCheckmarkFill,
        classes: 'bg-[#0f1f1d] border-[#00a18680] text-[#00a186]',
        description: 'Block is part of the canonical chain and safe to use',
      }
    }

    return {
      text: 'Pending',
      icon: IconHourglass,
      classes: 'bg-[#17150d] border-[#44464980] text-[#989898]',
      description: 'Block is not part of the canonical chain and is pending to be finalized or orphaned',
    }
  }

  return { transactionStatus, blockStatus }
}


