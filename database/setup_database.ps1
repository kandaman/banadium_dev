# Run all DDL, DML, and CSV imports for the project database
param(
    [string]$PsqlPath = "psql"
)

$env:PGPASSWORD = "imart"
$connectionArgs = @('-h','localhost','-p','5432','-U','imart','-d','iap_db')

# Execute DDL scripts
Get-ChildItem -Path "$(Join-Path $PSScriptRoot 'ddl')" -Filter *.txt | Sort-Object Name | ForEach-Object {
    & $PsqlPath @connectionArgs -f $_.FullName
}

# Execute DML scripts
Get-ChildItem -Path "$(Join-Path $PSScriptRoot 'dml')" -Filter *.sql | Sort-Object Name | ForEach-Object {
    & $PsqlPath @connectionArgs -f $_.FullName
}

# Import CSV files
Get-ChildItem -Path "$(Join-Path $PSScriptRoot 'csv')" -Filter *.csv | Sort-Object Name | ForEach-Object {
    $tableName = $_.BaseName
    $filePath = $_.FullName.Replace('\','/')
    & $PsqlPath @connectionArgs -c "\COPY $tableName FROM '$filePath' WITH (FORMAT csv, HEADER true)"
}
