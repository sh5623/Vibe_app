'use client';

import { Global, css } from '@emotion/react';

const globalStyles = css`
  :root {
    --bg-color: #fdfaf6;
    --text-color: #333333;
    --accent-color: #8c7b75;
  }

  html {
    scroll-behavior: smooth;
  }

  body {
    margin: 0;
    padding: 0;
    background-color: var(--bg-color);
    color: var(--text-color);
    font-family: var(--font-syne), -apple-system, BlinkMacSystemFont, 'Segoe UI',
      'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans',
      'Helvetica Neue', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    overflow-x: hidden;
  }

  code {
    font-family: var(--font-mono), source-code-pro, Menlo, Monaco, Consolas,
      'Courier New', monospace;
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  /* Custom Scrollbar */
  ::-webkit-scrollbar {
    width: 4px;
  }
  ::-webkit-scrollbar-track {
    background: var(--bg-color);
  }
  ::-webkit-scrollbar-thumb {
    background: rgba(173, 255, 47, 0.4);
    border-radius: 2px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: rgba(173, 255, 47, 0.6);
  }

  a {
    color: inherit;
    text-decoration: none;
  }
`;

export const GlobalStyles = () => <Global styles={globalStyles} />;

