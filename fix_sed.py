import re
with open("src/components/SchoolPlatform.tsx", "r") as f:
    content = f.read()

# Fix 'return () => \n  },'
content = re.sub(r'return \(\) =>\s*\},', r'return () => {};\n  },', content)
content = re.sub(r'return \(\) =>\s*\}', r'return () => {};\n  }', content)

with open("src/components/SchoolPlatform.tsx", "w") as f:
    f.write(content)
