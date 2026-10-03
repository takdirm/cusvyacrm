const fs = require('fs');
const path = require('path');

const root = 'e:/bikerental/scootrApp/scootradmin';
const routesRoot = path.join(root, 'src', 'routes');
const outFile = path.join(root, 'src', 'testcases.csv');

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.isFile() && entry.name.endsWith('.js')) out.push(full);
  }
  return out;
}

function getBaseRoute(filePath) {
  const rel = path.relative(routesRoot, filePath).replace(/\\/g, '/');
  if (rel === 'auth.js') return '';
  if (rel === 'admin/dashboard.js') return '/admin';
  if (rel === 'admin/index.js') return '/admin';
  if (rel.startsWith('admin/')) {
    const name = path.basename(rel, '.js');
    return `/admin/${name}`;
  }
  const name = path.basename(rel, '.js');
  return `/${name}`;
}

function joinRoute(base, subPath) {
  if (!subPath) return base;
  if (subPath.startsWith('/')) return subPath;
  if (!base) return `/${subPath}`;
  return `${base.replace(/\/$/, '')}/${subPath.replace(/^\//, '')}`;
}

function csvEscape(v) {
  const s = String(v ?? '');
  const escaped = s.replace(/"/g, '""');
  return `"${escaped}"`;
}

const routeRegex = /<Route\s+path="([^"]+)"\s+element=\{<([^\s/>]+)(?:[^>]*)\/?>\}\s*\/?>/g;
const indexRegex = /<Route\s+index\s+element=\{<([^\s/>]+)(?:[^>]*)\/?>\}\s*\/?>/g;

const screenMap = new Map();

for (const file of walk(routesRoot)) {
  const content = fs.readFileSync(file, 'utf8');
  const baseRoute = getBaseRoute(file);

  let m;
  while ((m = routeRegex.exec(content)) !== null) {
    const subPath = m[1].trim();
    const component = m[2].trim();
    if (subPath === '*' || subPath.includes('*')) continue;
    if (component === 'Navigate') continue;

    const route = joinRoute(baseRoute, subPath);
    const moduleName = route.startsWith('/admin/') ? route.split('/')[2] : route === '/admin' ? 'dashboard' : 'auth';
    const key = `${moduleName}|${component}|${route}`;
    if (!screenMap.has(key)) {
      screenMap.set(key, { moduleName, screenName: component, route });
    }
  }

  while ((m = indexRegex.exec(content)) !== null) {
    const component = m[1].trim();
    if (component === 'Navigate') continue;

    const route = baseRoute || '/';
    const moduleName = route.startsWith('/admin/') ? route.split('/')[2] : route === '/admin' ? 'dashboard' : 'auth';
    const key = `${moduleName}|${component}|${route}`;
    if (!screenMap.has(key)) {
      screenMap.set(key, { moduleName, screenName: component, route });
    }
  }
}

const screens = [...screenMap.values()].sort(
  (a, b) =>
    a.moduleName.localeCompare(b.moduleName) ||
    a.screenName.localeCompare(b.screenName) ||
    a.route.localeCompare(b.route),
);

const header = [
  'TC_ID',
  'Screen_ID',
  'Module',
  'Screen_Name',
  'Route',
  'Test_Title',
  'Test_Type',
  'Preconditions',
  'Test_Steps',
  'Test_Data',
  'Expected_Result',
  'Priority',
  'Automation_Candidate',
  'Status',
];

const rows = [header];
let screenIndex = 0;
let tcIndex = 0;

for (const s of screens) {
  screenIndex += 1;
  const screenId = `SCR-${String(screenIndex).padStart(4, '0')}`;
  const lower = s.route.toLowerCase();
  const isListLike =
    /(list|types|templates|logs|catalogues|models|devices|tracker|plans|rental|ownership|notifications|settings|customer|vehicle|scooter|station|booking)/.test(
      lower,
    );

  tcIndex += 1;
  rows.push([
    `TC-${String(tcIndex).padStart(6, '0')}`,
    screenId,
    s.moduleName,
    s.screenName,
    s.route,
    `Load ${s.screenName} screen`,
    'Smoke',
    'User logged in and authorized',
    `1) Navigate to ${s.route}`,
    'NA',
    'Screen loads without UI/API crash and core components are visible',
    'High',
    'Yes',
    'Not Run',
  ]);

  tcIndex += 1;
  rows.push([
    `TC-${String(tcIndex).padStart(6, '0')}`,
    screenId,
    s.moduleName,
    s.screenName,
    s.route,
    `${s.screenName} functional interaction`,
    'Functional',
    'Valid user session with required permissions',
    isListLike
      ? '1) Open screen 2) Use search/filter if present 3) Change page/page size'
      : '1) Open screen 2) Validate key fields/sections 3) Verify primary action is enabled',
    'Module-specific valid data',
    isListLike
      ? 'Data refreshes correctly for filter/search/pagination interactions'
      : 'Key data renders correctly and primary action works as expected',
    'Medium',
    'Yes',
    'Not Run',
  ]);

  if (/(terminal-logs|location-logs|heartbeat-logs)/.test(lower)) {
    tcIndex += 1;
    rows.push([
      `TC-${String(tcIndex).padStart(6, '0')}`,
      screenId,
      s.moduleName,
      s.screenName,
      s.route,
      'Search terminal by searchTerm',
      'Functional',
      'Tracker logs screen opened',
      '1) Enter searchTerm 506932 2) Click Search',
      'searchTerm=506932',
      'IMEI terminal IDs are returned and selectable',
      'High',
      'Yes',
      'Not Run',
    ]);

    tcIndex += 1;
    rows.push([
      `TC-${String(tcIndex).padStart(6, '0')}`,
      screenId,
      s.moduleName,
      s.screenName,
      s.route,
      'Validate current and history table mapping',
      'Functional',
      'Terminal ID selected',
      '1) Select terminal ID 2) Validate Current grid columns 3) Validate History grid columns and rows',
      'terminalId sample from search response',
      'Grid columns and values map correctly to API response for current/history',
      'High',
      'Yes',
      'Not Run',
    ]);

    tcIndex += 1;
    rows.push([
      `TC-${String(tcIndex).padStart(6, '0')}`,
      screenId,
      s.moduleName,
      s.screenName,
      s.route,
      'Clear logs action',
      'Functional',
      'Terminal ID selected and user has delete access',
      '1) Click Clear logs 2) Confirm action 3) Reload data',
      'terminalId selected on screen',
      'Delete API succeeds and logs are cleared/refreshed',
      'High',
      'Yes',
      'Not Run',
    ]);

    if (/(location-logs|heartbeat-logs)/.test(lower)) {
      tcIndex += 1;
      rows.push([
        `TC-${String(tcIndex).padStart(6, '0')}`,
        screenId,
        s.moduleName,
        s.screenName,
        s.route,
        'Auto-refresh interval control',
        'Functional',
        'Terminal selected and auto-refresh control visible',
        '1) Verify default 30 seconds 2) Change to 15/60 seconds 3) Verify refresh cadence',
        'default=30; updated=15 or 60',
        'Auto-refresh runs at configured interval and can be changed by user',
        'Medium',
        'Yes',
        'Not Run',
      ]);
    }
  }
}

const csv = rows.map((row) => row.map(csvEscape).join(',')).join('\n') + '\n';
fs.writeFileSync(outFile, csv, 'utf8');

console.log(`Created: ${outFile}`);
console.log(`Screens: ${screenIndex}`);
console.log(`TestCases: ${tcIndex}`);
