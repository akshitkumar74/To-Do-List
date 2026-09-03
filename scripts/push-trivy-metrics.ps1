$ErrorActionPreference = 'Stop'

$report = Get-Content -Path 'trivy-report.json' -Raw | ConvertFrom-Json

$vulnerabilities = @()
if ($report.Results) {
    foreach ($result in $report.Results) {
        if ($result.Vulnerabilities) {
            $vulnerabilities += $result.Vulnerabilities
        }
    }
}

$buildNumber = $env:BUILD_NUMBER
$severities = @('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')

$lines = @('# TYPE trivy_vulnerabilities_total gauge')
foreach ($severity in $severities) {
    $count = @($vulnerabilities | Where-Object { $_.Severity -eq $severity }).Count
    $lines += "trivy_vulnerabilities_total{severity=`"$severity`",build_number=`"$buildNumber`"} $count"
}

$payload = ($lines -join "`n") + "`n"
$metricsFile = 'trivy-metrics.prom'
[System.IO.File]::WriteAllText($metricsFile, $payload)

Write-Host "Pushing metrics to Pushgateway:"
Write-Host $payload

curl.exe -s --data-binary "@$metricsFile" "http://localhost:9091/metrics/job/trivy/instance/jenkins-todo-list-$buildNumber"
