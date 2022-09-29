#!/bin/bash

cd diffs
# https://stackoverflow.com/a/18127758
head -n -2 < template.html > index.html
echo '<script id="diffs" type="application/json">' >> index.html
cat diffs.json >> index.html
echo '</script>' >> index.html
echo '<script type="module">' >> index.html
deno bundle index.tsx >> index.html
echo '</script></body></html>' >> index.html
