# State Persistence Guide

## Overview
This application now includes comprehensive state persistence to ensure a smooth user experience when switching browser tabs, minimizing windows, or switching applications.

## Features

### 1. **Persisted State (sessionStorage)**
All critical application data is automatically saved to `sessionStorage`:
- Expense data, filters, settings
- Dashboard data (attendance, CGPA, expenses, notes)
- User preferences

**Benefits:**
- State survives browser tab switches
- Data persists when switching to other applications
- No data loss on soft refreshes
- Instant page loads with cached data

### 2. **Scroll Position Restoration**
- Automatically saves scroll position as you navigate
- Restores exact scroll position when returning to a page
- Works across tab switches and app switches

### 3. **Smart Data Fetching**
- Cached data is shown immediately (no loading spinner)
- Fresh data is fetched in the background
- Only refreshes if data is stale (older than 5 minutes)
- Prevents unnecessary API calls when switching tabs

### 4. **Tab Visibility Awareness**
- Detects when you switch browser tabs or apps
- Only fetches fresh data if cached data is old
- Reduces server load and improves performance

## How It Works

### Custom Hooks

#### `usePersistedState(key, initialValue, useLocalStorage?)`
A drop-in replacement for `useState` that automatically persists to storage.

```javascript
const [expenses, setExpenses] = usePersistedState('expenses_data', []);
```

#### `useScrollRestoration(key)`
Automatically saves and restores scroll position.

```javascript
useScrollRestoration('expense_tracker');
```

## User Experience

### Before (without persistence):
1. User opens expense page → sees loading spinner
2. User applies filters → data loads
3. User switches to another tab
4. User returns → **page refreshes, filters reset, scroll position lost** ❌

### After (with persistence):
1. User opens expense page → sees loading spinner
2. User applies filters → data loads
3. User switches to another tab
4. User returns → **instant load, filters preserved, scroll position maintained** ✅

## Implementation Details

### Session Storage Keys
- `expenses_data` - Expense list
- `expenses_categories` - Category data
- `expenses_settings` - User settings
- `expenses_filters` - Active filters
- `dashboard_attendance` - Attendance data
- `dashboard_cgpa` - CGPA data
- `dashboard_expenses` - Dashboard expense summary
- `scroll_expense_tracker` - Scroll position for expense page
- `scroll_dashboard` - Scroll position for dashboard

### Stale Time
Data is considered "stale" after 5 minutes. When you return to a tab with stale data, it will:
1. Show cached data immediately
2. Fetch fresh data in the background
3. Update the UI when new data arrives

## Browser Compatibility
- ✅ Chrome/Edge
- ✅ Firefox
- ✅ Safari
- ✅ All modern browsers with sessionStorage support

## Privacy & Storage
- Uses `sessionStorage` (cleared when browser closes)
- No sensitive data stored
- Data is scoped to current browser tab session
- Automatic cleanup on browser close
