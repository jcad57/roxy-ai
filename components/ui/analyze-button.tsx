/**
 * Analyze Button Component
 * Manual AI analysis trigger button for navbar
 */

'use client'

import { useEmailEnrichment } from '@/lib/hooks/use-email-enrichment'
import { useTheme } from '@/lib/providers/theme-provider'

export function AnalyzeButton() {
  const { theme } = useTheme()
  const { analyze, isAnalyzing, analysisError, lastAnalysisResult } = useEmailEnrichment()

  const handleAnalyze = () => {
    if (!isAnalyzing) {
      analyze({})
    }
  }

  return (
    <button
      onClick={handleAnalyze}
      disabled={isAnalyzing}
      style={{
        background: isAnalyzing ? theme.bgCard : 'transparent',
        border: `1px solid ${theme.borderMuted}`,
        borderRadius: 6,
        padding: '6px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        cursor: isAnalyzing ? 'not-allowed' : 'pointer',
        color: theme.textPrimary,
        fontSize: 14,
        fontWeight: 500,
        opacity: isAnalyzing ? 0.6 : 1,
        transition: 'all 0.2s',
      }}
      title={isAnalyzing ? 'Analyzing...' : 'Analyze pending emails with AI'}
    >
      {/* AI Icon */}
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>

      {isAnalyzing ? 'Analyzing...' : 'Analyze'}

      {/* Success indicator */}
      {lastAnalysisResult && !isAnalyzing && lastAnalysisResult.analyzed > 0 && (
        <span
          style={{
            background: theme.success,
            color: '#fff',
            borderRadius: 10,
            padding: '2px 6px',
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          +{lastAnalysisResult.analyzed}
        </span>
      )}

      {/* Error indicator */}
      {analysisError && !isAnalyzing && (
        <span
          style={{
            color: theme.error,
            fontSize: 12,
          }}
        >
          ⚠
        </span>
      )}
    </button>
  )
}
