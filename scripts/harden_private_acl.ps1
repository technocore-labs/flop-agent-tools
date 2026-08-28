$ErrorActionPreference = 'Stop'
$privateDir = Join-Path $PSScriptRoot '..\state\private'
$privateFile = Join-Path $privateDir 'identity.seed'
if (-not (Test-Path -LiteralPath $privateFile -PathType Leaf)) { throw 'Private identity file is missing.' }
$currentSid = [System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value

# Preserve only the current user and LocalSystem; do not print identities or ACL entries.
& icacls $privateDir /inheritance:r /grant:r "*${currentSid}:(OI)(CI)F" /grant:r '*S-1-5-18:(OI)(CI)F' /remove:g 'Users' 'Authenticated Users' 'Everyone' | Out-Null
& icacls $privateFile /inheritance:r /grant:r "*${currentSid}:F" /grant:r '*S-1-5-18:F' /remove:g 'Users' 'Authenticated Users' 'Everyone' | Out-Null

$allowed = @($currentSid, 'S-1-5-18')
foreach ($target in @($privateDir, $privateFile)) {
  $acl = Get-Acl -LiteralPath $target
  foreach ($rule in $acl.Access) {
    $sid = $rule.IdentityReference.Translate([System.Security.Principal.SecurityIdentifier]).Value
    if ($rule.AccessControlType -eq 'Allow' -and $allowed -notcontains $sid) { throw 'Private ACL verification failed.' }
  }
}
Write-Output 'Private ACL hardening: PASS'
