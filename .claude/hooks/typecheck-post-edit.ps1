# Post-edit type check hook
# Only runs tsc when a .ts or .tsx file was edited
# Reads tool input from stdin to check the file path

$input = $env:CLAUDE_TOOL_INPUT
if (-not $input) {
    $input = [Console]::In.ReadToEnd()
}

# Check if the edited file is a TypeScript file
if ($input -match '\.(ts|tsx)"' -or $input -match '\.(ts|tsx)$') {
    Set-Location 'C:\Users\natha\.cursor\Photo Vault\photovault-hub'
    $output = npx tsc --noEmit --pretty 2>&1
    if ($LASTEXITCODE -ne 0) {
        $output | Select-Object -First 25
        Write-Output ''
        Write-Output 'TYPE CHECK FAILED - Fix type errors before continuing'
    } else {
        Write-Output 'Type check passed'
    }
}
# Silently skip for non-TypeScript files
