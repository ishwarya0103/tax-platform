import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/lib/scoring.ts', 'src/lib/traceability.ts'],
      // skipFull: false so both files always print in the terminal summary —
      // otherwise a 100%-covered file (traceability.ts) silently disappears
      // from the text report even though it's still counted correctly.
      reporter: [['text', { skipFull: false }], 'html'],
    },
  },
})
