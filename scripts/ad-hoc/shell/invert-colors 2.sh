#!/bin/bash

# Function to invert colors in a file
invert_colors() {
    local file=$1
    
    # Main background and text
    sed -i '' 's/bg-black/bg-white/g' "$file"
    sed -i '' 's/text-white/text-black/g' "$file"
    
    # Transparency backgrounds - black to white
    sed -i '' 's/bg-black\/95/bg-white\/95/g' "$file"
    sed -i '' 's/bg-black\/90/bg-white\/90/g' "$file"
    sed -i '' 's/bg-black\/80/bg-white\/80/g' "$file"
    sed -i '' 's/bg-black\/60/bg-white\/60/g' "$file"
    
    # Transparency backgrounds - white to black
    sed -i '' 's/bg-white\/\[0\.02\]/bg-black\/\[0.02\]/g' "$file"
    sed -i '' 's/bg-white\/\[0\.03\]/bg-black\/\[0.03\]/g' "$file"
    sed -i '' 's/bg-white\/\[0\.05\]/bg-black\/\[0.05\]/g' "$file"
    sed -i '' 's/bg-white\/5/bg-black\/5/g' "$file"
    sed -i '' 's/bg-white\/10/bg-black\/10/g' "$file"
    
    # Borders
    sed -i '' 's/border-white\/10/border-black\/10/g' "$file"
    sed -i '' 's/border-white\/\[0\.05\]/border-black\/\[0.05\]/g' "$file"
    sed -i '' 's/border-white\/\[0\.1\]/border-black\/\[0.1\]/g' "$file"
    sed -i '' 's/border-black\/10/border-white\/10/g' "$file"
    
    # Gray colors
    sed -i '' 's/text-gray-300/text-gray-700/g' "$file"
    sed -i '' 's/text-gray-400/text-gray-600/g' "$file"
    sed -i '' 's/text-gray-500/text-gray-400/g' "$file"
    sed -i '' 's/placeholder-gray-500/placeholder-gray-400/g' "$file"
    sed -i '' 's/border-gray-700/border-gray-300/g' "$file"
    
    # Hover states
    sed -i '' 's/hover:text-white/hover:text-black/g' "$file"
    sed -i '' 's/hover:bg-white\/\[0\.05\]/hover:bg-black\/\[0.05\]/g' "$file"
    sed -i '' 's/hover:bg-white\/10/hover:bg-black\/10/g' "$file"
    sed -i '' 's/group-hover:text-white/group-hover:text-black/g' "$file"
    
    # CTA button in gradient section
    sed -i '' 's/bg-white text-gray-900/bg-black text-white/g' "$file"
    sed -i '' 's/hover:bg-gray-50/hover:bg-gray-900/g' "$file"
    sed -i '' 's/border-white text-white/border-black text-black/g' "$file"
    
    # Modal backgrounds
    sed -i '' 's/"bg-black"/"bg-white"/g' "$file"
    
    # Footer specific
    sed -i '' 's/footer className="bg-black text-white/footer className="bg-white text-black/g' "$file"
    
    # Sign In button (keep gradient but adjust text if needed)
    # Keep gradient buttons as is since they work on both backgrounds
    
    echo "Colors inverted for $file"
}

# Process the files
invert_colors "/Users/pedro/Documents/blipee/blipee-os/src/app/industries-light/page.tsx"
invert_colors "/Users/pedro/Documents/blipee/blipee-os/src/app/ai-technology-light/page.tsx"