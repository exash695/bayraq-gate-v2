import os

filepath = 'server.ts'
with open(filepath, 'r') as f:
    content = f.read()

old_code = """      if (idsToMatch.length > 0) {
        idsToMatch.push('all');
        filters.push(inArray(notifications.recipientId, idsToMatch));
      }"""

new_code = """      if (idsToMatch.length > 0) {
        const expandedIds = [...idsToMatch];
        for (const id of idsToMatch) {
           expandedIds.push(`scode_${id}`);
           expandedIds.push(`pcode_${id}`);
           expandedIds.push(`tcode_${id}`);
        }
        expandedIds.push('all');
        filters.push(inArray(notifications.recipientId, expandedIds));
      }"""

content = content.replace(old_code, new_code)
with open(filepath, 'w') as f:
    f.write(content)
