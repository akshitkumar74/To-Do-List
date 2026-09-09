param(
    [string]$SonarToken,
    [string]$ProjectKey = "akshitkumar74_To-Do-List"
)

$headers = @{
    Authorization = "Basic " + [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("$SonarToken`:"))
}

$url = "https://sonarcloud.io/api/issues/search?componentKeys=$ProjectKey&resolved=false&ps=500"

Write-Host "Fetching issues from SonarCloud..."
$response = Invoke-RestMethod -Uri $url -Headers $headers -Method Get

$severityMap = @{
    "BLOCKER"  = "Critical"
    "CRITICAL" = "High"
    "MAJOR"    = "Medium"
    "MINOR"    = "Low"
    "INFO"     = "Info"
}

$findings = @()
foreach ($issue in $response.issues) {
    $severity = $severityMap[$issue.severity]
    if (-not $severity) { $severity = "Info" }

    $filePath = $issue.component -replace "^$ProjectKey`:", ""

    $findings += @{
        title       = $issue.message
        description = "Rule: $($issue.rule)`nType: $($issue.type)`nSeverity: $($issue.severity)"
        severity    = $severity
        file_path   = $filePath
        line        = $issue.line
    }
}

$output = @{
    findings = $findings
}

$outputFile = "sonar-findings.json"
$output | ConvertTo-Json -Depth 10 | Set-Content -Path $outputFile -Encoding utf8

Write-Host "Wrote $($findings.Count) finding(s) to $outputFile"
