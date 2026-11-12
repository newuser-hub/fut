import {defineConfig} from '@playwright/test';

const widths=[320,390,768];
const engines=['chromium','webkit'];
export default defineConfig({
  testDir:'./scripts',
  testMatch:/test-portal-(baseline|browser)\.spec\.mjs/,
  timeout:30000,
  expect:{timeout:7000},
  retries:0,
  workers:2,
  reporter:[['line'],['json',{outputFile:'artifacts/step8-playwright-results.json'}]],
  outputDir:'artifacts/step8-traces',
  use:{baseURL:'http://127.0.0.1:4173',trace:'retain-on-failure',screenshot:'only-on-failure',ignoreHTTPSErrors:false},
  projects:engines.flatMap(engine=>widths.map(width=>({
    name:engine+'-'+width,
    use:{browserName:engine,viewport:{width,height:844},
      isMobile:engine==='webkit'&&width<768,hasTouch:true,
      deviceScaleFactor:1}
  }))),
  webServer:{command:'python3 -m http.server 4173 --bind 127.0.0.1 --directory public',
    port:4173,reuseExistingServer:false,timeout:20000},
});
