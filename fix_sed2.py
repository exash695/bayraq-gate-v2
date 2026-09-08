import re
with open("src/components/SchoolPlatform.tsx", "r") as f:
    content = f.read()

# Fix `return () => \n\n  },` which might have spaces in between.
content = re.sub(r'return \(\) =>\s+', r'return () => {};\n', content)

with open("src/components/SchoolPlatform.tsx", "w") as f:
    f.write(content)
