/**
 * Response Suggestion Panel
 * Main UI for AI-generated email responses
 */

'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/lib/providers/theme-provider';
import type { ResponseSuggestion, ResponseTone, ResponseLength, ResponseStyle } from '@/lib/types/response';

interface ResponseSuggestionPanelProps {
  suggestion: ResponseSuggestion | null;
  generating: boolean;
  onRegenerate: (context: {
    tone?: ResponseTone;
    length?: ResponseLength;
    style?: ResponseStyle;
  }) => Promise<ResponseSuggestion | null>;
  onClose: () => void;
}

export function ResponseSuggestionPanel({
  suggestion,
  generating,
  onRegenerate,
  onClose,
}: ResponseSuggestionPanelProps) {
  const { theme } = useTheme();
  const [editedResponse, setEditedResponse] = useState('');
  const [selectedTone, setSelectedTone] = useState<ResponseTone>('professional');
  const [selectedLength, setSelectedLength] = useState<ResponseLength>('standard');
  const [selectedStyle, setSelectedStyle] = useState<ResponseStyle>('thoughtful');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (suggestion) {
      setEditedResponse(suggestion.suggestedResponse);
      setSelectedTone(suggestion.tone);
    }
  }, [suggestion]);

  const handleCopy = () => {
    navigator.clipboard.writeText(editedResponse);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = async () => {
    await onRegenerate({
      tone: selectedTone,
      length: selectedLength,
      style: selectedStyle,
    });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return '#10b981';
    if (confidence >= 60) return '#f59e0b';
    return '#ef4444';
  };

  if (generating) {
    return (
      <div
        style={{
          background: theme.bgCard,
          border: `1px solid ${theme.borderMuted}`,
          borderRadius: 12,
          padding: 20,
          // marginTop: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 20,
              height: 20,
              border: `2px solid ${theme.accent}`,
              borderTop: '2px solid transparent',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <span style={{ fontSize: 14, color: theme.textPrimary }}>
            Generating AI response...
          </span>
        </div>
      </div>
    );
  }

  if (!suggestion) return null;

  return (
    <div
      style={{
        background: theme.bgCard,
        border: `1px solid ${theme.borderMuted}`,
        borderRadius: 12,
        // marginTop: 16,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: `1px solid ${theme.borderMuted}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: theme.textPrimary }}>
            🤖 AI Suggested Response
          </span>
          <div
            style={{
              fontSize: 11,
              padding: '2px 6px',
              borderRadius: 4,
              background: `${getConfidenceColor(suggestion.confidence)}15`,
              color: getConfidenceColor(suggestion.confidence),
              fontWeight: 600,
            }}
          >
            {suggestion.confidence}% confidence
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: theme.textDim,
            fontSize: 18,
            cursor: 'pointer',
            padding: 4,
          }}
        >
          ✕
        </button>
      </div>

      {/* Controls */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: `1px solid ${theme.borderMuted}`,
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        {/* Tone */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label style={{ fontSize: 12, color: theme.textDim }}>Tone:</label>
          <select
            value={selectedTone}
            onChange={(e) => setSelectedTone(e.target.value as ResponseTone)}
            style={{
              background: theme.bg,
              border: `1px solid ${theme.borderMuted}`,
              borderRadius: 6,
              padding: '4px 8px',
              fontSize: 12,
              color: theme.textPrimary,
            }}
          >
            <option value="professional">Professional</option>
            <option value="casual">Casual</option>
            <option value="friendly">Friendly</option>
            <option value="formal">Formal</option>
          </select>
        </div>

        {/* Length */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label style={{ fontSize: 12, color: theme.textDim }}>Length:</label>
          <select
            value={selectedLength}
            onChange={(e) => setSelectedLength(e.target.value as ResponseLength)}
            style={{
              background: theme.bg,
              border: `1px solid ${theme.borderMuted}`,
              borderRadius: 6,
              padding: '4px 8px',
              fontSize: 12,
              color: theme.textPrimary,
            }}
          >
            <option value="brief">Brief</option>
            <option value="standard">Standard</option>
            <option value="detailed">Detailed</option>
          </select>
        </div>

        {/* Style */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label style={{ fontSize: 12, color: theme.textDim }}>Style:</label>
          <select
            value={selectedStyle}
            onChange={(e) => setSelectedStyle(e.target.value as ResponseStyle)}
            style={{
              background: theme.bg,
              border: `1px solid ${theme.borderMuted}`,
              borderRadius: 6,
              padding: '4px 8px',
              fontSize: 12,
              color: theme.textPrimary,
            }}
          >
            <option value="direct">Direct</option>
            <option value="thoughtful">Thoughtful</option>
            <option value="diplomatic">Diplomatic</option>
          </select>
        </div>
      </div>

      {/* Response */}
      <div style={{ padding: 16 }}>
        <textarea
          value={editedResponse}
          onChange={(e) => setEditedResponse(e.target.value)}
          style={{
            width: '100%',
            minHeight: 120,
            background: theme.bg,
            border: `1px solid ${theme.borderMuted}`,
            borderRadius: 8,
            padding: 12,
            fontSize: 13,
            color: theme.textPrimary,
            fontFamily: 'inherit',
            resize: 'vertical',
          }}
        />
      </div>

      {/* Reasoning */}
      {suggestion.reasoning && (
        <div
          style={{
            padding: '12px 16px',
            background: `${theme.accent}10`,
            borderTop: `1px solid ${theme.borderMuted}`,
            fontSize: 12,
            color: theme.textDim,
          }}
        >
          <span style={{ fontWeight: 600 }}>💡 Why this response:</span> {suggestion.reasoning}
        </div>
      )}

      {/* Warnings */}
      {suggestion.warnings.length > 0 && (
        <div
          style={{
            padding: '12px 16px',
            background: '#fef3c7',
            borderTop: `1px solid ${theme.borderMuted}`,
            fontSize: 12,
            color: '#92400e',
          }}
        >
          {suggestion.warnings.map((warning, idx) => (
            <div key={idx}>⚠️ {warning}</div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div
        style={{
          padding: 16,
          borderTop: `1px solid ${theme.borderMuted}`,
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={handleRegenerate}
          style={{
            background: theme.bg,
            border: `1px solid ${theme.borderMuted}`,
            borderRadius: 8,
            padding: '8px 16px',
            fontSize: 13,
            color: theme.textPrimary,
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          🔄 Regenerate
        </button>
        <button
          onClick={handleCopy}
          style={{
            background: copied ? '#10b981' : theme.bg,
            border: `1px solid ${copied ? '#10b981' : theme.borderMuted}`,
            borderRadius: 8,
            padding: '8px 16px',
            fontSize: 13,
            color: copied ? '#fff' : theme.textPrimary,
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          {copied ? '✓ Copied!' : '📋 Copy'}
        </button>
      </div>
    </div>
  );
}
