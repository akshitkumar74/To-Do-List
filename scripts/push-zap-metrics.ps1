$ErrorActionPreference = 'Stop'

$report = Get-Content -Path 'zap-report.json' -Raw | ConvertFrom-Json

$alerts = @()
if ($report.site) {
    foreach ($site in $report.site) {
        if ($site.alerts) {
            $alerts += $site.alerts
        }
    }
}

$buildNumber = $env:BUILD_NUMBER
$riskLevels = @('High', 'Medium', 'Low', 'Informational')

$lines = @('# TYPE zap_alerts_total gauge')
foreach ($risk in $riskLevels) {
    $count = @($alerts | Where-Object { $_.riskdesc -like "$risk (*" }).Count
    $lines += "zap_alerts_total{risk=`"$risk`",build_number=`"$buildNumber`"} $count"
}

$payload = ($lines -join "`n") + "`n"
$metricsFile = 'zap-metrics.prom'
[System.IO.File]::WriteAllText($metricsFile, $payload)

Write-Host "Pushing metrics to Pushgateway:"
Write-Host $payload

curl.exe -s --data-binary "@$metricsFile" "http://localhost:9091/metrics/job/zap/instance/jenkins-todo-list-zap"
