Add-Type -AssemblyName System.IO.Compression.FileSystem
$path = $args[0]
$zip = [System.IO.Compression.ZipFile]::OpenRead($path)
$entry = $zip.Entries | Where-Object { $_.FullName -eq 'word/document.xml' }
$stream = $entry.Open()
$reader = New-Object System.IO.StreamReader($stream)
$xml = $reader.ReadToEnd()
$reader.Close()
$stream.Close()
$zip.Dispose()
$text = $xml -replace '</w:p>', "`n" -replace '<w:tab[^>]*/>', "`t" -replace '<[^>]+>', ''
$text = $text -replace '&amp;', '&' -replace '&lt;', '<' -replace '&gt;', '>' -replace '&quot;', '"'
$text -split "`n" | ForEach-Object { $_.TrimEnd() } | Where-Object { $_.Trim() -ne '' }
