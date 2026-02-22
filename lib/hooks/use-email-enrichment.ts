/**
 * Email Enrichment Hook
 * Triggers AI analysis for pending emails
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/lib/providers/auth-provider'

interface AnalysisResult {
  success: boolean
  analyzed: number
  failed: number
  total: number
  error?: string
}

export function useEmailEnrichment() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Trigger AI analysis for pending emails
  const analyzeMutation = useMutation({
    mutationFn: async (options?: {
      batchSize?: number
      specificEmailIds?: string[]
    }): Promise<AnalysisResult> => {
      if (!user) {
        throw new Error('User not authenticated')
      }

      console.log('🤖 Triggering AI analysis...')

      const response = await fetch('/api/emails/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          batchSize: options?.batchSize || 50,
          specificEmailIds: options?.specificEmailIds || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to analyze emails')
      }

      const data = await response.json()
      return data
    },
    onSuccess: (data) => {
      console.log(`✅ Analysis complete: ${data.analyzed} analyzed, ${data.failed} failed`)

      // Only invalidate enrichments query (metadata already updated by sync)
      queryClient.invalidateQueries({ queryKey: ['email-enrichments', user?.id] })
    },
    onError: (error: Error) => {
      console.error('❌ Analysis failed:', error.message)
    },
  })

  return {
    analyze: analyzeMutation.mutate,
    analyzeAsync: analyzeMutation.mutateAsync,
    isAnalyzing: analyzeMutation.isPending,
    analysisError: analyzeMutation.error,
    lastAnalysisResult: analyzeMutation.data,
  }
}
