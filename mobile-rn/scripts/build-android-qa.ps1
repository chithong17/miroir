param(
    [Parameter(Mandatory=$true)][string]$SdkPath,
    [Parameter(Mandatory=$true)][string]$JdkPath,
    [Parameter(Mandatory=$true)][string]$GradleCachePath,
    [Parameter(Mandatory=$true)][string]$NinjaPath,
    [Parameter(Mandatory=$true)][string]$ApiUrl,
    [string]$Architectures='arm64-v8a,x86_64'
)
$ErrorActionPreference='Stop'
$qaProject=Split-Path -Parent $PSScriptRoot
if ($ApiUrl -notmatch '^https://[^/]+/api/?$') { throw 'QA build requires an explicit HTTPS API URL ending in /api.' }
if ($Architectures -notmatch '^(arm64-v8a|x86_64)(,(arm64-v8a|x86_64))*$') { throw 'Unsupported QA architecture.' }
$env:ANDROID_HOME=(Resolve-Path -LiteralPath $SdkPath).Path
$env:ANDROID_SDK_ROOT=$env:ANDROID_HOME
$env:JAVA_HOME=(Resolve-Path -LiteralPath $JdkPath).Path
$env:MIROIR_NINJA_EXECUTABLE=(Resolve-Path -LiteralPath $NinjaPath).Path
if (-not (Test-Path -LiteralPath $GradleCachePath -PathType Container)) { throw 'Create a dedicated short Gradle cache directory first.' }
$env:GRADLE_USER_HOME=(Resolve-Path -LiteralPath $GradleCachePath).Path
$env:NODE_ENV='production'
$env:EXPO_PUBLIC_API_BASE_URL=$ApiUrl.TrimEnd('/')
$env:EXPO_PUBLIC_SOCKET_URL=$env:EXPO_PUBLIC_API_BASE_URL -replace '/api$',''
Push-Location $qaProject
try {
    & npx.cmd expo prebuild --platform android --no-install
    if ($LASTEXITCODE -ne 0) { throw 'Expo prebuild failed.' }
    & .\android\gradlew.bat -p android assembleRelease --console=plain --max-workers=1 "-PreactNativeArchitectures=$Architectures"
    if ($LASTEXITCODE -ne 0) { throw 'Android QA build failed.' }
    Write-Output 'QA artifact: android/app/build/outputs/apk/release/app-release.apk'
    Write-Warning 'Locally debug-signed QA artifact, NOT a store-signed production release.'
} finally { Pop-Location }
