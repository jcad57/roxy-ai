# MAILmind - AI-Powered Email Client

A beautiful, modern email client powered by AI that organizes your inbox with intelligent clustering, priority sorting, and multiple innovative view paradigms.

## 🎨 Features

- **6 Unique Layout Views**: Switch between different email organization paradigms
  - **Timeline**: AI-prioritized vertical feed
  - **Command**: Mission-control dashboard with metrics and clusters
  - **Spatial**: Visual 2D canvas with cluster grouping
  - **Threads**: AI-grouped conversations with summaries
  - **Calendar**: Auto-extracted deadlines and meetings
  - **Kanban**: Task board with draggable cards

- **AI Intelligence**:
  - Automatic priority scoring
  - Email clustering by topic
  - Smart action suggestions
  - Calendar event extraction
  - Task generation from emails

- **Fully Responsive**: Beautiful experience across all screen sizes
  - 📱 **Mobile**: Touch-optimized with smart layout stacking
  - 📲 **Tablet**: Balanced layouts with optimal spacing
  - 💻 **Desktop**: Full-featured multi-column views
  - Adaptive grids, typography, and spacing
  - Back navigation on mobile detail views

- **Fully Customizable**:
  - Toggle views on/off
  - Customize Kanban columns
  - **Theme System**: Choose light/dark mode and 5 color schemes
  - Personalize your entire workflow

## 🏗️ Project Structure

```
roxy-ai/
├── app/
│   ├── layout.tsx          # Root layout with metadata
│   ├── page.tsx            # Main email client orchestrator
│   └── globals.css         # Global styles and animations
├── components/
│   ├── layouts/            # Layout view components
│   │   ├── timeline-layout.tsx
│   │   ├── command-layout.tsx
│   │   ├── spatial-layout.tsx
│   │   ├── conversation-layout.tsx
│   │   ├── calendar-layout.tsx
│   │   └── kanban-layout.tsx
│   └── ui/                 # Reusable UI components
│       ├── nav-bar.tsx
│       ├── layout-switcher.tsx
│       ├── customize-views-panel.tsx
│       └── settings-panel.tsx
├── lib/
│   ├── constants/          # Configuration and theme
│   │   ├── theme.ts
│   │   ├── theme-palettes.ts
│   │   └── layouts.ts
│   ├── providers/          # App-wide providers
│   │   └── theme-provider.tsx
│   ├── types/              # TypeScript interfaces
│   │   ├── email.ts
│   │   ├── layout.ts
│   │   └── theme.ts
│   ├── hooks/              # Custom React hooks
│   │   └── use-responsive.ts
│   ├── data/               # Mock data (temporary)
│   │   ├── mock-emails.ts
│   │   ├── mock-ai-suggestions.ts
│   │   ├── mock-calendar.ts
│   │   └── mock-kanban.ts
│   └── utils/              # Helper functions
│       └── colors.ts
└── README.md
```

## 🎯 Design Principles

This project follows senior-level software engineering best practices:

### 1. **Single Responsibility Principle**
- Each component has one clear purpose
- Layout components handle only their view logic
- UI components are reusable and focused
- Utility functions are pure and isolated

### 2. **Separation of Concerns**
- **Data layer**: Isolated in `lib/data/`
- **Business logic**: Utility functions in `lib/utils/`
- **UI layer**: Components in `components/`
- **Configuration**: Constants in `lib/constants/`
- **Types**: Centralized TypeScript definitions in `lib/types/`

### 3. **Type Safety**
- Full TypeScript coverage
- Explicit interfaces for all data structures
- Proper typing for component props
- No `any` types (except for temporary selected state)

### 4. **Component Architecture**
- Client components marked with `"use client"`
- Props interfaces defined for all components
- Logical component composition
- Minimal prop drilling

### 5. **Code Organization**
- Related files grouped by feature
- Clear naming conventions
- Consistent file structure
- Self-documenting code with comments

## 🚀 Getting Started

### Prerequisites
- Node.js 20+ 
- npm or pnpm

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 📝 Next Steps

Currently, the app uses mock data for demonstration. To integrate with real email providers:

1. **Authentication Layer**
   - Add OAuth flows for Gmail, Outlook, etc.
   - Implement secure token storage
   - Add account management UI

2. **Email Integration**
   - Replace mock data with API calls
   - Implement real-time sync
   - Add email sending capabilities

3. **AI Backend**
   - Connect to AI service for priority scoring
   - Implement clustering algorithms
   - Add natural language processing for extraction

4. **Database Layer**
   - Set up database schema for user preferences
   - Cache email data locally
   - Store custom Kanban configurations

5. **Additional Features**
   - Email composition
   - Search functionality
   - Filters and labels
   - Keyboard shortcuts
   - ✅ **Mobile responsiveness** - Already implemented!

## 🎨 Design System & Theming

MAILmind features a comprehensive theme system with multiple modes and color schemes:

### Theme Modes
- **Dark Mode**: Eye-friendly interface for low-light environments (default)
- **Light Mode**: Clean, bright interface for daytime use

### Color Themes
Choose from 5 carefully coordinated color schemes:
- **Pink** (default): Vibrant and energetic (`#ec4899`)
- **Blue**: Professional and calm (`#3b82f6`)
- **Green**: Fresh and focused (`#10b981`)
- **Purple**: Creative and sophisticated (`#a855f7`)
- **Orange**: Warm and inviting (`#f97316`)

### Theme Features
- **React Query State Management**: Efficient, cached theme state
- **Persistent Preferences**: Saved to localStorage
- **Settings Panel**: Easy-to-use UI with live preview
- **Smooth Transitions**: Polished theme switching experience
- **Responsive Palettes**: Colors adapt to light/dark modes
- **Semantic Colors**: Consistent success, warning, error, and info colors

For detailed theme documentation, see [THEMING.md](./THEMING.md)

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Inline styles with dynamic theming
- **State Management**: React Query + React hooks
- **Responsive Design**: Custom hooks and utility functions
- **Icons**: Unicode characters for lightweight design

## 📄 License

Private project - All rights reserved

---

Built with ❤️ for the future of email organization
