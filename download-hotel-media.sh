#!/usr/bin/env bash
# Localize the Case Study walkthrough videos + poster stills.
#
# The generated walkthrough videos (Seedance 2.0, 480p, H.264, silent, web-optimized)
# and their poster frames are currently referenced from a CDN in index.html. Run this
# from the repo root on a machine with normal outbound internet to download them into
# assets/ and rewrite index.html to self-hosted paths, matching how the blog creatives
# are localized (see download-creatives.sh).
#
#   bash download-hotel-media.sh
#
# After it finishes, review `git diff index.html`, then commit assets/hotel-*.{mp4,jpg}.
set -euo pipefail
mkdir -p assets
BASE="https://d2ol7oe51mr4n9.cloudfront.net/user_3CMjfKG71IgVjp8wTskoYovkUBX"

# CDN id -> local file
declare -A MAP=(
  ["088ab683-2ab9-4659-824f-d15811fcc0fd.mp4"]="assets/hotel-a-walkthrough.mp4"
  ["f76b0729-50ac-4b06-b5ad-ca8d1c831789.mp4"]="assets/hotel-b-walkthrough.mp4"
  ["0ba0f66f-1d89-447e-95b1-158cdd7a154b.mp4"]="assets/hotel-c-walkthrough.mp4"
  ["e9c8a713-df33-40e3-a0b4-3f4f419d6f7b.jpg"]="assets/hotel-a.jpg"
  ["5abf1432-d121-4b92-a0ad-8e64bdab33b9.jpg"]="assets/hotel-b.jpg"
  ["e9111853-e149-4448-833d-02ebd200b5f7.jpg"]="assets/hotel-c.jpg"
)

for id in "${!MAP[@]}"; do
  dest="${MAP[$id]}"
  echo "Downloading $dest"
  curl -fsSL -o "$dest" "$BASE/$id"
  # Rewrite the CDN URL to the local path in index.html
  sed -i.bak "s#$BASE/$id#$dest#g" index.html
done
rm -f index.html.bak

echo "Done. Media saved to assets/ and index.html now points to local files."
echo "Review 'git diff index.html' and commit the new assets/hotel-*.mp4 / .jpg files."
