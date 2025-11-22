import React from "react";

// Theme System for IDE
export interface Theme {
  id: string;
  name: string;
  type: 'light' | 'dark';
  colors: ThemeColors;
}

export interface ThemeColors {
  // Background colors
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  
  // Text colors
  text: string;
  textSecondary: string;
  textMuted: string;
  
  // Border colors
  border: string;
  borderLight: string;
  
  // Primary colors
  primary: string;
  primaryHover: string;
  primaryActive: string;
  
  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Editor colors
  editorBackground: string;
  editorForeground: string;
  editorLineNumber: string;
  editorSelection: string;
  editorCursor: string;
  
  // Syntax highlighting
  syntaxKeyword: string;
  syntaxString: string;
  syntaxComment: string;
  syntaxFunction: string;
  syntaxVariable: string;
  syntaxNumber: string;
}

// Built-in themes
export const themes: Theme[] = [
  {
    id: 'light',
    name: 'Light',
    type: 'light',
    colors: {
      background: '#ffffff',
      backgroundSecondary: '#f9fafb',
      backgroundTertiary: '#f3f4f6',
      text: '#111827',
      textSecondary: '#4b5563',
      textMuted: '#9ca3af',
      border: '#e5e7eb',
      borderLight: '#f3f4f6',
      primary: '#3b82f6',
      primaryHover: '#2563eb',
      primaryActive: '#1d4ed8',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#06b6d4',
      editorBackground: '#ffffff',
      editorForeground: '#111827',
      editorLineNumber: '#9ca3af',
      editorSelection: '#dbeafe',
      editorCursor: '#3b82f6',
      syntaxKeyword: '#d73a49',
      syntaxString: '#032f62',
      syntaxComment: '#6a737d',
      syntaxFunction: '#6f42c1',
      syntaxVariable: '#e36209',
      syntaxNumber: '#005cc5',
    }
  },
  {
    id: 'dark',
    name: 'Dark',
    type: 'dark',
    colors: {
      background: '#1e1e1e',
      backgroundSecondary: '#252526',
      backgroundTertiary: '#2d2d30',
      text: '#d4d4d4',
      textSecondary: '#cccccc',
      textMuted: '#858585',
      border: '#3e3e42',
      borderLight: '#2d2d30',
      primary: '#3b82f6',
      primaryHover: '#2563eb',
      primaryActive: '#1d4ed8',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#06b6d4',
      editorBackground: '#1e1e1e',
      editorForeground: '#d4d4d4',
      editorLineNumber: '#858585',
      editorSelection: '#264f78',
      editorCursor: '#3b82f6',
      syntaxKeyword: '#569cd6',
      syntaxString: '#ce9178',
      syntaxComment: '#6a9955',
      syntaxFunction: '#dcdcaa',
      syntaxVariable: '#9cdcfe',
      syntaxNumber: '#b5cea8',
    }
  },
  {
    id: 'dracula',
    name: 'Dracula',
    type: 'dark',
    colors: {
      background: '#282a36',
      backgroundSecondary: '#21222c',
      backgroundTertiary: '#191a21',
      text: '#f8f8f2',
      textSecondary: '#e6e6e6',
      textMuted: '#6272a4',
      border: '#44475a',
      borderLight: '#383a59',
      primary: '#bd93f9',
      primaryHover: '#a077e8',
      primaryActive: '#8a62d6',
      success: '#50fa7b',
      warning: '#f1fa8c',
      error: '#ff5555',
      info: '#8be9fd',
      editorBackground: '#282a36',
      editorForeground: '#f8f8f2',
      editorLineNumber: '#6272a4',
      editorSelection: '#44475a',
      editorCursor: '#f8f8f0',
      syntaxKeyword: '#ff79c6',
      syntaxString: '#f1fa8c',
      syntaxComment: '#6272a4',
      syntaxFunction: '#50fa7b',
      syntaxVariable: '#8be9fd',
      syntaxNumber: '#bd93f9',
    }
  },
  {
    id: 'monokai',
    name: 'Monokai',
    type: 'dark',
    colors: {
      background: '#272822',
      backgroundSecondary: '#1e1f1c',
      backgroundTertiary: '#1a1b17',
      text: '#f8f8f2',
      textSecondary: '#e6e6e6',
      textMuted: '#75715e',
      border: '#49483e',
      borderLight: '#3e3d32',
      primary: '#ae81ff',
      primaryHover: '#9a6eee',
      primaryActive: '#875bdd',
      success: '#a6e22e',
      warning: '#e6db74',
      error: '#f92672',
      info: '#66d9ef',
      editorBackground: '#272822',
      editorForeground: '#f8f8f2',
      editorLineNumber: '#75715e',
      editorSelection: '#49483e',
      editorCursor: '#f8f8f0',
      syntaxKeyword: '#f92672',
      syntaxString: '#e6db74',
      syntaxComment: '#75715e',
      syntaxFunction: '#a6e22e',
      syntaxVariable: '#66d9ef',
      syntaxNumber: '#ae81ff',
    }
  },
  {
    id: 'github-light',
    name: 'GitHub Light',
    type: 'light',
    colors: {
      background: '#ffffff',
      backgroundSecondary: '#f6f8fa',
      backgroundTertiary: '#eef2f6',
      text: '#24292f',
      textSecondary: '#57606a',
      textMuted: '#8c959f',
      border: '#d0d7de',
      borderLight: '#eaeef2',
      primary: '#0969da',
      primaryHover: '#0550ae',
      primaryActive: '#033d8b',
      success: '#1a7f37',
      warning: '#9a6700',
      error: '#cf222e',
      info: '#0969da',
      editorBackground: '#ffffff',
      editorForeground: '#24292f',
      editorLineNumber: '#8c959f',
      editorSelection: '#ddf4ff',
      editorCursor: '#0969da',
      syntaxKeyword: '#cf222e',
      syntaxString: '#0a3069',
      syntaxComment: '#6e7781',
      syntaxFunction: '#8250df',
      syntaxVariable: '#953800',
      syntaxNumber: '#0550ae',
    }
  },
  {
    id: 'nord',
    name: 'Nord',
    type: 'dark',
    colors: {
      background: '#2e3440',
      backgroundSecondary: '#3b4252',
      backgroundTertiary: '#434c5e',
      text: '#eceff4',
      textSecondary: '#e5e9f0',
      textMuted: '#d8dee9',
      border: '#4c566a',
      borderLight: '#434c5e',
      primary: '#88c0d0',
      primaryHover: '#76b4c4',
      primaryActive: '#64a8b8',
      success: '#a3be8c',
      warning: '#ebcb8b',
      error: '#bf616a',
      info: '#81a1c1',
      editorBackground: '#2e3440',
      editorForeground: '#d8dee9',
      editorLineNumber: '#4c566a',
      editorSelection: '#434c5e',
      editorCursor: '#eceff4',
      syntaxKeyword: '#81a1c1',
      syntaxString: '#a3be8c',
      syntaxComment: '#616e88',
      syntaxFunction: '#88c0d0',
      syntaxVariable: '#d8dee9',
      syntaxNumber: '#b48ead',
    }
  },
  {
    id: 'solarized-light',
    name: 'Solarized Light',
    type: 'light',
    colors: {
      background: '#fdf6e3',
      backgroundSecondary: '#eee8d5',
      backgroundTertiary: '#e8e2cf',
      text: '#657b83',
      textSecondary: '#586e75',
      textMuted: '#93a1a1',
      border: '#d9d2c3',
      borderLight: '#e8e2cf',
      primary: '#268bd2',
      primaryHover: '#2075b8',
      primaryActive: '#1a609e',
      success: '#859900',
      warning: '#b58900',
      error: '#dc322f',
      info: '#268bd2',
      editorBackground: '#fdf6e3',
      editorForeground: '#657b83',
      editorLineNumber: '#93a1a1',
      editorSelection: '#eee8d5',
      editorCursor: '#657b83',
      syntaxKeyword: '#859900',
      syntaxString: '#2aa198',
      syntaxComment: '#93a1a1',
      syntaxFunction: '#268bd2',
      syntaxVariable: '#cb4b16',
      syntaxNumber: '#d33682',
    }
  },
  {
    id: 'tomorrow-night',
    name: 'Tomorrow Night',
    type: 'dark',
    colors: {
      background: '#1d1f21',
      backgroundSecondary: '#282a2e',
      backgroundTertiary: '#373b41',
      text: '#c5c8c6',
      textSecondary: '#b4b7b4',
      textMuted: '#969896',
      border: '#373b41',
      borderLight: '#282a2e',
      primary: '#81a2be',
      primaryHover: '#6f90ac',
      primaryActive: '#5d7e9a',
      success: '#b5bd68',
      warning: '#f0c674',
      error: '#cc6666',
      info: '#8abeb7',
      editorBackground: '#1d1f21',
      editorForeground: '#c5c8c6',
      editorLineNumber: '#969896',
      editorSelection: '#373b41',
      editorCursor: '#c5c8c6',
      syntaxKeyword: '#b294bb',
      syntaxString: '#b5bd68',
      syntaxComment: '#969896',
      syntaxFunction: '#81a2be',
      syntaxVariable: '#de935f',
      syntaxNumber: '#de935f',
    }
  }
];

// Theme management
class ThemeManager {
  private currentTheme: Theme;
  
  constructor() {
    this.currentTheme = themes[0]; // Default to light
    this.loadSavedTheme();
  }
  
  private loadSavedTheme() {
    const saved = localStorage.getItem('ide-theme');
    if (saved) {
      const theme = themes.find(t => t.id === saved);
      if (theme) {
        this.currentTheme = theme;
      }
    }
  }
  
  getCurrentTheme(): Theme {
    return this.currentTheme;
  }
  
  setTheme(themeId: string) {
    const theme = themes.find(t => t.id === themeId);
    if (theme) {
      this.currentTheme = theme;
      this.applyTheme(theme);
      localStorage.setItem('ide-theme', themeId);
    }
  }
  
  private applyTheme(theme: Theme) {
    const root = document.documentElement;
    
    // Apply CSS variables
    Object.entries(theme.colors).forEach(([key, value]) => {
      const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      root.style.setProperty(cssVar, value);
    });
    
    // Apply theme type class
    root.classList.remove('light-theme', 'dark-theme');
    root.classList.add(`${theme.type}-theme`);
  }
  
  getAllThemes(): Theme[] {
    return themes;
  }
}

export const themeManager = new ThemeManager();

// React hook for theme
export function useTheme() {
  const [currentTheme, setCurrentTheme] = React.useState(themeManager.getCurrentTheme());
  
  const changeTheme = (themeId: string) => {
    themeManager.setTheme(themeId);
    setCurrentTheme(themeManager.getCurrentTheme());
  };
  
  return {
    theme: currentTheme,
    themes: themes,
    changeTheme,
  };
}
