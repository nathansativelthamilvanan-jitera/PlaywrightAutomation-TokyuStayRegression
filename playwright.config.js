import { defineConfig, devices, expect } from '@playwright/test';


const config = ({
  testDir: './tests', /* Run tests in files in parallel */
  timeout: 100 * 1000,
  expect: 50 * 1000,
  reporter: [
    ['html'],
    ['list'],
    ['json', { outputFile: 'test-results/test-results.json' }]
  ],
  use:
  {
    browser: 'chromium',
    headless: false,
    screenshot: 'only-on-failure', // built-in for failures

  },

});

module.exports = config