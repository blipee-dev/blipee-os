#!/bin/bash

# Fix unescaped entities in all files

# Fix apostrophes
find src/app -name "*.tsx" -exec sed -i "" "s/don't/don\&apos;t/g" {} \;
find src/app -name "*.tsx" -exec sed -i "" "s/it's/it\&apos;s/g" {} \;
find src/app -name "*.tsx" -exec sed -i "" "s/we're/we\&apos;re/g" {} \;
find src/app -name "*.tsx" -exec sed -i "" "s/you're/you\&apos;re/g" {} \;
find src/app -name "*.tsx" -exec sed -i "" "s/they're/they\&apos;re/g" {} \;
find src/app -name "*.tsx" -exec sed -i "" "s/we've/we\&apos;ve/g" {} \;
find src/app -name "*.tsx" -exec sed -i "" "s/you've/you\&apos;ve/g" {} \;
find src/app -name "*.tsx" -exec sed -i "" "s/they've/they\&apos;ve/g" {} \;
find src/app -name "*.tsx" -exec sed -i "" "s/I'm/I\&apos;m/g" {} \;
find src/app -name "*.tsx" -exec sed -i "" "s/can't/can\&apos;t/g" {} \;
find src/app -name "*.tsx" -exec sed -i "" "s/won't/won\&apos;t/g" {} \;
find src/app -name "*.tsx" -exec sed -i "" "s/isn't/isn\&apos;t/g" {} \;
find src/app -name "*.tsx" -exec sed -i "" "s/aren't/aren\&apos;t/g" {} \;
find src/app -name "*.tsx" -exec sed -i "" "s/wasn't/wasn\&apos;t/g" {} \;
find src/app -name "*.tsx" -exec sed -i "" "s/weren't/weren\&apos;t/g" {} \;
find src/app -name "*.tsx" -exec sed -i "" "s/hasn't/hasn\&apos;t/g" {} \;
find src/app -name "*.tsx" -exec sed -i "" "s/haven't/haven\&apos;t/g" {} \;
find src/app -name "*.tsx" -exec sed -i "" "s/hadn't/hadn\&apos;t/g" {} \;
find src/app -name "*.tsx" -exec sed -i "" "s/doesn't/doesn\&apos;t/g" {} \;
find src/app -name "*.tsx" -exec sed -i "" "s/didn't/didn\&apos;t/g" {} \;
find src/app -name "*.tsx" -exec sed -i "" "s/shouldn't/shouldn\&apos;t/g" {} \;
find src/app -name "*.tsx" -exec sed -i "" "s/wouldn't/wouldn\&apos;t/g" {} \;
find src/app -name "*.tsx" -exec sed -i "" "s/couldn't/couldn\&apos;t/g" {} \;
find src/app -name "*.tsx" -exec sed -i "" "s/mightn't/mightn\&apos;t/g" {} \;
find src/app -name "*.tsx" -exec sed -i "" "s/mustn't/mustn\&apos;t/g" {} \;
find src/app -name "*.tsx" -exec sed -i "" "s/let's/let\&apos;s/g" {} \;
find src/app -name "*.tsx" -exec sed -i "" "s/that's/that\&apos;s/g" {} \;
find src/app -name "*.tsx" -exec sed -i "" "s/what's/what\&apos;s/g" {} \;
find src/app -name "*.tsx" -exec sed -i "" "s/here's/here\&apos;s/g" {} \;
find src/app -name "*.tsx" -exec sed -i "" "s/there's/there\&apos;s/g" {} \;
find src/app -name "*.tsx" -exec sed -i "" "s/where's/where\&apos;s/g" {} \;
find src/app -name "*.tsx" -exec sed -i "" "s/who's/who\&apos;s/g" {} \;
find src/app -name "*.tsx" -exec sed -i "" "s/how's/how\&apos;s/g" {} \;
find src/app -name "*.tsx" -exec sed -i "" "s/she's/she\&apos;s/g" {} \;
find src/app -name "*.tsx" -exec sed -i "" "s/he's/he\&apos;s/g" {} \;
find src/app -name "*.tsx" -exec sed -i "" "s/world's/world\&apos;s/g" {} \;
find src/app -name "*.tsx" -exec sed -i "" "s/company's/company\&apos;s/g" {} \;
find src/app -name "*.tsx" -exec sed -i "" "s/organization's/organization\&apos;s/g" {} \;

# Fix greater than symbols in cookie-policy
sed -i "" "s/Settings > Privacy/Settings \&gt; Privacy/g" src/app/cookie-policy/page.tsx
sed -i "" "s/Preferences > Privacy/Preferences \&gt; Privacy/g" src/app/cookie-policy/page.tsx
sed -i "" "s/Settings > Cookies/Settings \&gt; Cookies/g" src/app/cookie-policy/page.tsx

# Fix quotes  
find src/app -name "*.tsx" -exec sed -i "" 's/"\([^"]*\)"/\&ldquo;\1\&rdquo;/g' {} \;

echo "Lint fixes applied"