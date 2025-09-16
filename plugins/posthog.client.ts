import { defineNuxtPlugin, useRuntimeConfig } from '#imports'
import posthog from 'posthog-js'

let posthogClient: typeof posthog | null = null
let initialized = false

function hasGrantedConsent(): boolean {
  try {
    return typeof window !== 'undefined' && window.localStorage.getItem('analytics_consent') === 'granted'
  } catch {
    return false
  }
}

export default defineNuxtPlugin(() => {
  const runtimeConfig = useRuntimeConfig()

  const mode = String(runtimeConfig.public.posthogEnabled ?? '').toLowerCase()
  const enabled = mode === 'true' || mode === 'debug'

  const initIfNeeded = () => {
    if (initialized || !enabled || !hasGrantedConsent() || !runtimeConfig.public.posthogPublicKey || !runtimeConfig.public.posthogPublicKey) {
      return
    }

    posthogClient = posthog.init(runtimeConfig.public.posthogPublicKey as string, {
      api_host: '/aquaticpanda',
      // Advanced autocapture configuration
      autocapture: false,
      capture_pageview: true,
      capture_pageleave: true,
      defaults: runtimeConfig.public.posthogDefaults as any,
      // Session replay with v2 recorder and input masking
      session_recording: ({
        maskAllInputs: false,
        recorderVersion: 'v2',
      } as any),
      loaded: (ph) => {
        // Keep debug off in prod
        if (mode === 'debug') {
          ph.debug()
          console.info('[PostHog] SDK loaded')
        }
      },
    })
    initialized = true
  }

  // Initialize immediately if consent already granted
  if (typeof window !== 'undefined') {
    initIfNeeded()

    // React to consent changes across tabs
    window.addEventListener('storage', (e: StorageEvent) => {
      if (e.key === 'analytics_consent') {
        if (e.newValue === 'granted') {
          initIfNeeded()
        } else if (e.newValue === 'denied' && posthogClient) {
          try { posthogClient.opt_out_capturing() } catch {}
        }
      }
    })
  }

  return {
    provide: {
      posthog: () => posthogClient,
    },
  }
})