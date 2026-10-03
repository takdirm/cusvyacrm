$root = 'e:\bikerental\scootrApp\scootradmin'
$routesRoot = Join-Path $root 'src\routes'
$outFile = Join-Path $root 'src\testcases.csv'

function Get-BaseRoute([string]$filePath) {
  $norm = $filePath.Replace('/', '\\')

  if ($norm -match '\\src\\routes\\auth\.js$') { return '' }
  if ($norm -match '\\src\\routes\\admin\\dashboard\.js$') { return '/admin' }
  if ($norm -match '\\src\\routes\\admin\\index\.js$') { return '/admin' }

  if ($norm -match '\\src\\routes\\admin\\([^\\]+)\.js$') {
    return "/admin/$($matches[1])"
  }

  if ($norm -match '\\src\\routes\\([^\\]+)\.js$') {
    return "/$($matches[1])"
  }

  return ''
}

function Join-Route([string]$base, [string]$path) {
  if ([string]::IsNullOrWhiteSpace($path)) { return $base }
  if ($path.StartsWith('/')) { return $path }
  if ([string]::IsNullOrWhiteSpace($base)) { return "/$path" }
  return ($base.TrimEnd('/') + '/' + $path.TrimStart('/'))
}

$screenMap = @{}
$routeFiles = Get-ChildItem -Path $routesRoot -Recurse -File -Filter '*.js'

foreach ($file in $routeFiles) {
  $content = Get-Content -Path $file.FullName -Raw
  $baseRoute = Get-BaseRoute $file.FullName

  $routeMatches = [regex]::Matches($content, '<Route\s+path="([^"]+)"\s+element=\{<([^\s/>]+)(?:[^>]*)/?>\}\s*/?>')
  foreach ($m in $routeMatches) {
    $path = $m.Groups[1].Value.Trim()
    $comp = $m.Groups[2].Value.Trim()
    if ($path -eq '*') { continue }
    if ($path.Contains('*')) { continue }
    if ($comp -eq 'Navigate') { continue }

    $route = Join-Route $baseRoute $path
    $module = if ($route.StartsWith('/admin/')) { ($route.Split('/')[2]) } elseif ($route -eq '/admin') { 'dashboard' } else { 'auth' }
    if ([string]::IsNullOrWhiteSpace($module)) { $module = 'general' }

    $key = "$module|$comp|$route"
    if (-not $screenMap.ContainsKey($key)) {
      $screenMap[$key] = [pscustomobject]@{ Module = $module; ScreenName = $comp; Route = $route }
    }
  }

  $indexMatches = [regex]::Matches($content, '<Route\s+index\s+element=\{<([^\s/>]+)(?:[^>]*)/?>\}\s*/?>')
  foreach ($m in $indexMatches) {
    $comp = $m.Groups[1].Value.Trim()
    if ($comp -eq 'Navigate') { continue }

    $route = if ([string]::IsNullOrWhiteSpace($baseRoute)) { '/' } else { $baseRoute }
    $module = if ($route -eq '/admin') { 'dashboard' } elseif ($route.StartsWith('/admin/')) { ($route.Split('/')[2]) } else { 'auth' }

    $key = "$module|$comp|$route"
    if (-not $screenMap.ContainsKey($key)) {
      $screenMap[$key] = [pscustomobject]@{ Module = $module; ScreenName = $comp; Route = $route }
    }
  }
}

$screens = $screenMap.Values | Sort-Object Module, ScreenName, Route
$rows = New-Object System.Collections.Generic.List[object]
$screenIndex = 0
$tcIndex = 0

foreach ($s in $screens) {
  $screenIndex++
  $screenId = ('SCR-{0:D4}' -f $screenIndex)
  $lowerRoute = $s.Route.ToLowerInvariant()
  $isListLike = ($lowerRoute -match 'list|types|templates|logs|catalogues|models|devices|tracker|plans|rental|ownership|notifications|settings|customer|vehicle|scooter|station|booking')

  $tcIndex++
  $rows.Add([pscustomobject]@{
    TC_ID = ('TC-{0:D6}' -f $tcIndex)
    Screen_ID = $screenId
    Module = $s.Module
    Screen_Name = $s.ScreenName
    Route = $s.Route
    Test_Title = "Load $($s.ScreenName) screen"
    Test_Type = 'Smoke'
    Preconditions = 'User logged in and authorized'
    Test_Steps = "1) Navigate to $($s.Route)"
    Test_Data = 'NA'
    Expected_Result = 'Screen loads without UI/API crash and core components are visible'
    Priority = 'High'
    Automation_Candidate = 'Yes'
    Status = 'Not Run'
  }) | Out-Null

  $tcIndex++
  $rows.Add([pscustomobject]@{
    TC_ID = ('TC-{0:D6}' -f $tcIndex)
    Screen_ID = $screenId
    Module = $s.Module
    Screen_Name = $s.ScreenName
    Route = $s.Route
    Test_Title = "$($s.ScreenName) functional interaction"
    Test_Type = 'Functional'
    Preconditions = 'Valid user session with required permissions'
    Test_Steps = $(if ($isListLike) { '1) Open screen 2) Use search/filter if present 3) Change page/page size' } else { '1) Open screen 2) Validate key fields/sections 3) Verify primary action is enabled' })
    Test_Data = 'Module-specific valid data'
    Expected_Result = $(if ($isListLike) { 'Data refreshes correctly for filter/search/pagination interactions' } else { 'Key data renders correctly and primary action works as expected' })
    Priority = 'Medium'
    Automation_Candidate = 'Yes'
    Status = 'Not Run'
  }) | Out-Null

  if ($lowerRoute -match 'terminal-logs|location-logs|heartbeat-logs') {
    $tcIndex++
    $rows.Add([pscustomobject]@{
      TC_ID = ('TC-{0:D6}' -f $tcIndex)
      Screen_ID = $screenId
      Module = $s.Module
      Screen_Name = $s.ScreenName
      Route = $s.Route
      Test_Title = 'Search terminal by searchTerm'
      Test_Type = 'Functional'
      Preconditions = 'Tracker logs screen opened'
      Test_Steps = '1) Enter searchTerm 506932 2) Click Search'
      Test_Data = 'searchTerm=506932'
      Expected_Result = 'IMEI terminal IDs are returned and selectable'
      Priority = 'High'
      Automation_Candidate = 'Yes'
      Status = 'Not Run'
    }) | Out-Null

    $tcIndex++
    $rows.Add([pscustomobject]@{
      TC_ID = ('TC-{0:D6}' -f $tcIndex)
      Screen_ID = $screenId
      Module = $s.Module
      Screen_Name = $s.ScreenName
      Route = $s.Route
      Test_Title = 'Validate current and history table mapping'
      Test_Type = 'Functional'
      Preconditions = 'Terminal ID selected'
      Test_Steps = '1) Select terminal ID 2) Validate Current grid columns 3) Validate History grid columns and rows'
      Test_Data = 'terminalId sample from search response'
      Expected_Result = 'Grid columns and values map correctly to API response for current/history'
      Priority = 'High'
      Automation_Candidate = 'Yes'
      Status = 'Not Run'
    }) | Out-Null

    $tcIndex++
    $rows.Add([pscustomobject]@{
      TC_ID = ('TC-{0:D6}' -f $tcIndex)
      Screen_ID = $screenId
      Module = $s.Module
      Screen_Name = $s.ScreenName
      Route = $s.Route
      Test_Title = 'Clear logs action'
      Test_Type = 'Functional'
      Preconditions = 'Terminal ID selected and user has delete access'
      Test_Steps = '1) Click Clear logs 2) Confirm action 3) Reload data'
      Test_Data = 'terminalId selected on screen'
      Expected_Result = 'Delete API succeeds and logs are cleared/refreshed'
      Priority = 'High'
      Automation_Candidate = 'Yes'
      Status = 'Not Run'
    }) | Out-Null

    if ($lowerRoute -match 'location-logs|heartbeat-logs') {
      $tcIndex++
      $rows.Add([pscustomobject]@{
        TC_ID = ('TC-{0:D6}' -f $tcIndex)
        Screen_ID = $screenId
        Module = $s.Module
        Screen_Name = $s.ScreenName
        Route = $s.Route
        Test_Title = 'Auto-refresh interval control'
        Test_Type = 'Functional'
        Preconditions = 'Terminal selected and auto-refresh control visible'
        Test_Steps = '1) Verify default 30 seconds 2) Change to 15/60 seconds 3) Verify refresh cadence'
        Test_Data = 'default=30; updated=15 or 60'
        Expected_Result = 'Auto-refresh runs at configured interval and can be changed by user'
        Priority = 'Medium'
        Automation_Candidate = 'Yes'
        Status = 'Not Run'
      }) | Out-Null
    }
  }
}

$rows | Export-Csv -Path $outFile -NoTypeInformation -Encoding UTF8
Write-Output "Created: $outFile"
Write-Output "Screens: $screenIndex"
Write-Output "TestCases: $tcIndex"
