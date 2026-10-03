$ErrorActionPreference = 'Stop'

$root = 'e:\bikerental\scootrApp\scootradmin'
$target = Join-Path $root 'src\components\labels\plain-label.js'
$antdPattern = "import\s*\{[^}]*\bTag\b[^}]*\}\s*from\s*'antd';"

$files = Get-ChildItem -Path (Join-Path $root 'src\container') -Recurse -File -Filter *.js | Where-Object {
  Select-String -Path $_.FullName -Pattern $antdPattern -Quiet
}

foreach ($file in $files) {
  $content = Get-Content -Raw -Path $file.FullName
  $updated = $content

  $updated = [regex]::Replace(
    $updated,
    "import\s*\{(?<imports>[^}]*)\}\s*from\s*'antd';",
    {
      param($m)
      $imports = $m.Groups['imports'].Value.Split(',') | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' }
      if (-not ($imports -contains 'Tag')) { return $m.Value }
      $imports = $imports | Where-Object { $_ -ne 'Tag' }
      return "import { $($imports -join ', ') } from 'antd';"
    },
    1
  )

  $updated = $updated -replace '<Tag(\s|>)', '<PlainLabel$1'
  $updated = $updated -replace '</Tag>', '</PlainLabel>'

  if ($updated -notmatch "import\s+PlainLabel\s+from\s+'[^']+';") {
    $fromUri = New-Object System.Uri((Split-Path $file.FullName -Parent) + [System.IO.Path]::DirectorySeparatorChar)
    $toUri = New-Object System.Uri($target)
    $rel = $fromUri.MakeRelativeUri($toUri).ToString()
    if (-not $rel.StartsWith('.')) { $rel = "./$rel" }
    if ($rel.EndsWith('.js')) { $rel = $rel.Substring(0, $rel.Length - 3) }

    $importLine = "import PlainLabel from '$rel';"
    $antdImport = [regex]::Match($updated, "import\s*\{[^}]*\}\s*from\s*'antd';")

    if ($antdImport.Success) {
      $idx = $antdImport.Index + $antdImport.Length
      $updated = $updated.Insert($idx, "`r`n$importLine")
    } else {
      $updated = "$importLine`r`n$updated"
    }
  }

  if ($updated -ne $content) {
    Set-Content -Path $file.FullName -Value $updated -NoNewline
  }
}

Write-Output "Updated files: $($files.Count)"
