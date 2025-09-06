# puller.ps1 --- Git pull 成功時にWindows通知（WinPS5 / モジュール不要）

# スクリプトのあるディレクトリ＝リポジトリ直下に移動（任意。不要なら削除可）
Set-Location -LiteralPath (Split-Path -Parent $MyInvocation.MyCommand.Path)

# 必要アセンブリを読み込み
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

function Show-Toast {
    param(
        [Parameter(Mandatory)][string]$Title,
        [Parameter(Mandatory)][string]$Message
    )
    $ni = New-Object System.Windows.Forms.NotifyIcon
    $ni.Icon = [System.Drawing.SystemIcons]::Information
    $ni.Visible = $true
    $ni.BalloonTipTitle = $Title
    $ni.BalloonTipText  = $Message
    $ni.BalloonTipIcon  = [System.Windows.Forms.ToolTipIcon]::Info
    $ni.ShowBalloonTip(4000)
    Start-Sleep -Seconds 4
    $ni.Dispose()
}

# 設定
$IntervalSeconds      = 10
$NotifyWhenUpToDate   = $false

# 初期HEAD
$lastHead = (& git rev-parse HEAD 2>$null).Trim()

while ($true) {
    # pull前のHEAD
    $before = (& git rev-parse HEAD 2>$null).Trim()

    # pull実行
    $output = & git pull 2>&1
    $exit   = $LASTEXITCODE

    # pull後のHEAD
    $after  = (& git rev-parse HEAD 2>$null).Trim()

    if ($exit -eq 0) {
        if ($before -and $after -and ($before -ne $after)) {
            # 新規コミット数算出（失敗しても続行）
            $count = 0
            try {
                $c = (& git rev-list --count "$before..$after" 2>$null).Trim()
                if ($c) { $count = [int]$c }
            } catch {}

            # 直近コミットの要約（1行）
            $subject = (& git log --oneline -1 $after 2>$null)
            if (-not $subject) { $subject = "HEAD: $after" }

            Show-Toast -Title "git pull:($count )" -Message $subject
            $lastHead = $after
        }
        elseif ($NotifyWhenUpToDate) {
            Show-Toast -Title "git pull" -Message "Up to date"
        }
    }
    else {
        # 失敗時は上位数行だけ通知
        $err = ($output | Select-Object -First 3) -join "`n"
        if (-not $err) { $err = "error" }
        Show-Toast -Title "git pull: failed" -Message $err
    }

    Start-Sleep -Seconds $IntervalSeconds
}
