
export const logDuplicates = (items: any[], idKey: string, componentName: string) => {
  const seen = new Set();
  const duplicates = items.filter(item => {
    const id = item[idKey];
    if (seen.has(id)) return true;
    seen.add(id);
    return false;
  });
  
  if (duplicates.length > 0) {
    console.warn(`[${componentName}] Found ${duplicates.length} duplicate items with key: ${idKey}`, duplicates);
  }
};
