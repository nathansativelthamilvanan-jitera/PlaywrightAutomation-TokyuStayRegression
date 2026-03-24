const fs = require('fs');
const path = require('path');

// Paths
const resultsPath = path.join(__dirname, '../test-results/test-results.json');
const buildInfoPath = path.join(__dirname, '../build-info.json');

// Load test results
const data = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));

// Load or initialize build info
let buildInfo = { buildNumber: 0 };

if (fs.existsSync(buildInfoPath)) {
  buildInfo = JSON.parse(fs.readFileSync(buildInfoPath, 'utf-8'));
}

// Increment build number
buildInfo.buildNumber += 1;

// Save updated build number
fs.writeFileSync(buildInfoPath, JSON.stringify(buildInfo, null, 2));

// Timestamp
const now = new Date();
const timestamp = now.toLocaleString(); // readable format

let total = 0;
let passed = 0;
let failed = 0;

const passedTests = [];
const failedTests = [];

function walkSuites(suite) {
  if (suite.specs) {
    suite.specs.forEach(spec => {
      spec.tests.forEach(test => {
        total++;
        const result = test.results[0];
        if (!result) return;

        // 📸 Extract screenshot
        let screenshotPath = null;

        if (result.attachments) {
          const screenshot = result.attachments.find(a =>
            a.contentType === 'image/png'
          );

          if (screenshot) {
            screenshotPath = screenshot.path;
          }
        }

        if (result.status === 'passed') {
          passed++;

          passedTests.push({
          title: spec.title,
          screenshot: screenshotPath
          });

        } else {
          failed++;

          // ✅ Store both title + screenshot
          failedTests.push({
            title: spec.title,
            screenshot: screenshotPath
          });
        }
      });
    });
  }

  if (suite.suites) {
    suite.suites.forEach(walkSuites);
  }
}

walkSuites(data);

const passRate = ((passed / total) * 100).toFixed(1);

// Detect "critical" failures (simple keyword logic)
const criticalFailures = failedTests.filter(t =>
  t.toLowerCase().includes('checkout') ||
  t.toLowerCase().includes('login')
);


// Release criteria
const PASS_RATE_THRESHOLD = 95;


const hasCriticalFailures = criticalFailures.length > 0;

let releaseStatus = '✅ GO';
const statusColor = releaseStatus.includes('GO') ? 'green' : 'red';

if (hasCriticalFailures || passRate < PASS_RATE_THRESHOLD) {
  releaseStatus = '❌ NO-GO';
}



// Output
console.log(`✅ ${passed} tests passed`);
console.log(`❌ ${failed} failed`);

if (criticalFailures.length) {
  console.log(`⚠️ Critical flows failing`);
}

console.log(`\nRelease Status: ${releaseStatus}`);
console.log(`\nTest Summary (Build #${buildInfo.buildNumber})`);
console.log(`Date: ${timestamp}`);
console.log('------------------------');
console.log(`Total: ${total}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Pass Rate: ${passRate}%`);

if (criticalFailures.length) {
  console.log(`\nCritical Failures:`);
  criticalFailures.forEach(t => console.log(`- ${t}`));
}



//GENERATE DASHBOARD STYLE REPORT
const htmlReport = `
<!DOCTYPE html>
<html>
<head>
  <title>Test Report - Build #${buildInfo.buildNumber}</title>
  <style>
    body { font-family: Arial; padding: 20px; }
    .card { border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 8px; }
    .pass { color: green; }
    .fail { color: red; }
    .warn { color: orange; }
    .big { font-size: 1.5em; font-weight: bold; }
  </style>
</head>
<body>

<h1>Test Report - Build #${buildInfo.buildNumber}</h1>
<p><strong>Date:</strong> ${timestamp}</p>

<div class="card">
  <h3>Full Playwright Report</h3>
  <p>
    <a href="../playwright-report/index.html" target="_blank" style="
  display:inline-block;
  padding:10px 15px;
  background-color:#4CAF50;
  color:white;
  border-radius:5px;
  text-decoration:none;
  font-weight:bold;
">
  View Full Playwright Report
</a>
  </p>
</div>

<div class="card">
  <div class="big">Release Status: ${releaseStatus}</div>
</div>

<div class="card">
  <p>Total: ${total}</p>
  <p class="pass">Passed: ${passed}</p>
  <p class="fail">Failed: ${failed}</p>
  <p>Pass Rate: ${passRate}%</p>
</div>

<div class="card">
  <h3>Critical Failures</h3>
  ${
    criticalFailures.length
      ? `<ul>${criticalFailures.map(t => `<li>${t}</li>`).join('')}</ul>`
      : '<p class="pass">None 🎉</p>'
  }
</div>

</body>
</html>
`;

//SAVE THE DASHBOARD
const reportPath = path.join(__dirname, `../reports/report-${buildInfo.buildNumber}.html`);

// Ensure folder exists
fs.mkdirSync(path.join(__dirname, '../reports'), { recursive: true });

fs.writeFileSync(reportPath, htmlReport);

console.log(`\n📊 Dashboard report generated: ${reportPath}`);