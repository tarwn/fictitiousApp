
param (
    [parameter(Mandatory=$true)]
    [string]
    $SubscriptionId,
    [parameter(Mandatory=$true)]
    [string]
    $Name,
    [parameter(Mandatory=$true)]
    [string]
    $PackageName
)

$ErrorActionPreference = "Stop"

Write-Host "Setting Subscription"
Select-AzureSubscription -SubscriptionId $SubscriptionId

# Write-Host "##teamcity[progressMessage 'Stopping Azure Website']"
# Stop-AzureWebsite -Name $Name

Write-Host "##teamcity[progressMessage 'Publishing changes']"
Write-Host "Publish Attempt #1 - Starting"
Publish-AzureWebsiteProject -Package $PackageName -Name $Name

# Write-Host "Publish Attempt #1 - Success"
# Write-Host "##teamcity[progressMessage 'Starting website']"
# Start-AzureWebsite -Name $Name
