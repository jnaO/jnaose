#!/bin/sh
# Writes images.js (the site photos as data URIs, so WebGL can read
# them from file://) next to this script, from src/assets/images.
set -e
dir=$(cd "$(dirname "$0")" && pwd)
assets="$dir/../../src/assets/images"
{
  printf 'window.IMAGES={'
  for name in forest fireweed bg; do
    printf '%s:"data:image/jpeg;base64,%s",' "$name" \
      "$(base64 -i "$assets/$name.jpg" | tr -d '\n')"
  done
  printf '};\n'
} > "$dir/images.js"
