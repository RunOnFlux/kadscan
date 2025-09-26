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
        classes: 'bg-badge-bg-error border-badge-bg-error-strong text-badge-text-error',
        description: 'Transaction failed to execute',
      }
    }

    if (safeBlock && !canonical) {
      return {
        text: 'Failed',
        placement: 'top',
        icon: IconCancel,
        classes: 'bg-badge-bg-error border-badge-bg-error-strong text-badge-text-error',
        description: 'Transaction failed to execute',
      }
    }

    if (safeBlock && !!canonical) {
      return {
        text: 'Success',
        placement: 'top',
        icon: IconCheckmarkFill,
        classes: 'bg-badge-bg-success border-badge-bg-success-soft text-badge-text-success',
        description: 'Transaction executed successfully',
      }
    }

    return {
      text: 'Pending',
      placement: 'top',
      icon: IconHourglass,
      classes: 'bg-badge-bg-warning border-line-muted text-font-secondary',
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
        classes: 'bg-badge-bg-error border-badge-bg-error-strong text-badge-text-error',
        description: 'Block is not part of the canonical chain and is orphaned',
      }
    }

    if (safeBlock && !!canonical) {
      return {
        text: 'Finalized',
        placement: 'top',
        icon: IconCheckmarkFill,
        classes: 'bg-badge-bg-success border-badge-bg-success-soft text-badge-text-success',
        description: 'Block is part of the canonical chain and safe to use',
      }
    }

    return {
      text: 'Pending',
      placement: 'top',
      icon: IconHourglass,
      classes: 'bg-badge-bg-warning border-line-muted text-font-secondary',
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
        classes: 'bg-badge-bg-error border-badge-bg-error-strong text-badge-text-error',
        description: 'Cross-chain transaction failed to execute',
      }
    }
    if (status === 'success') {
      return {
        text: 'Cross Chain Transfer',
        placement: 'top',
        icon: IconCheckmarkFill,
        classes: 'bg-badge-bg-success border-badge-bg-success-soft text-badge-text-success',
        description: 'Cross-chain transaction executed successfully',
      }
    }
    return {
      text: 'Cross Chain Transfer',
      placement: 'top',
      icon: IconHourglass,
      classes: 'bg-badge-bg-warning border-line-muted text-font-secondary',
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
        classes: 'bg-badge-bg-error border-badge-bg-error-strong text-badge-text-error',
        description: 'Transaction returned a bad result',
      }
    }
    if (goodResult !== null && goodResult !== undefined) {
      return {
        text: 'Good',
        placement: 'top',
        icon: IconCheckmarkFill,
        classes: 'bg-badge-bg-success border-badge-bg-success-soft text-badge-text-success',
        description: 'Transaction returned a good result',
      }
    }
    return null
  }

  return { transactionStatus, blockStatus, transactionStatusCrossChain, transactionResultStatus }
}


