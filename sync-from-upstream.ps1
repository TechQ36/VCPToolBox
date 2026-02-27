# 从 upstream/main 同步「建议用他的」文件，覆盖本地
# 使用前请先执行: git fetch upstream
# 用法: 在项目根目录执行 .\sync-from-upstream.ps1

$ErrorActionPreference = "Stop"
$listPath = Join-Path $PSScriptRoot "sync-from-upstream-list.txt"
if (-not (Test-Path $listPath)) {
    Write-Error "找不到 sync-from-upstream-list.txt"
}
$lines = Get-Content $listPath -Encoding UTF8
$count = 0
foreach ($rel in $lines) {
    $rel = $rel.Trim()
    if ([string]::IsNullOrWhiteSpace($rel)) { continue }
    $full = Join-Path $PSScriptRoot $rel
    if (Test-Path $full -PathType Leaf) {
        git checkout upstream/main -- $rel
        $count++
        Write-Host "  ok: $rel"
    } else {
        # 可能 upstream 有而本地没有，也尝试 checkout（会创建/更新）
        git checkout upstream/main -- $rel 2>$null
        if ($LASTEXITCODE -eq 0) { $count++; Write-Host "  ok: $rel" } else { Write-Host "  skip: $rel" }
    }
}
Write-Host "`n已从 upstream/main 同步 $count 个文件。请检查后 git add & commit。"
