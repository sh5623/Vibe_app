/// <reference types="vitest/config" />
import { reactRouter } from '@react-router/dev/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { configDefaults } from 'vitest/config'

export default defineConfig({
  plugins: [reactRouter(), tailwindcss()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    // Claude Code 워크트리(.claude/worktrees/…)가 레포 안에 생기면 그 테스트까지 두 번 센다
    exclude: [...configDefaults.exclude, '.claude/**'],
  },
})
