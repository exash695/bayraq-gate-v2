import os
import re

filepath = 'src/components/PortalPulseDashboard.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# Replace activeRole === 'cadre'
content = content.replace("""        if (activeRole === 'cadre') {
          const tCode = (selectedUser.code || selectedUser.studentCode || '').trim().toUpperCase();
          const targetUserId = tCode ? `tcode_${tCode}` : realAuthUserId;
          const response = await fetch('/api/support-tickets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
            userId: targetUserId,""", """        if (activeRole === 'cadre') {
          const tCode = (selectedUser.code || selectedUser.studentCode || '').trim().toUpperCase();
          const targetUserId = tCode ? `tcode_${tCode}` : realAuthUserId;
          const rawId = tCode || realAuthUserId;
          const response = await fetch('/api/support-tickets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
            userId: rawId,""")

# Replace activeRole === 'parent'
content = content.replace("""        } else if (activeRole === 'parent') {
          const pCode = (selectedUser.parentCode || selectedUser.code || '').trim().toUpperCase();
          const targetUserId = pCode ? `pcode_${pCode}` : realAuthUserId;
          const response = await fetch('/api/support-tickets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
            userId: targetUserId,""", """        } else if (activeRole === 'parent') {
          const pCode = (selectedUser.parentCode || selectedUser.code || '').trim().toUpperCase();
          const targetUserId = pCode ? `pcode_${pCode}` : realAuthUserId;
          const rawId = pCode || realAuthUserId;
          const response = await fetch('/api/support-tickets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
            userId: rawId,""")

# Replace else (student)
content = content.replace("""        } else {
          const sCode = (selectedUser.studentCode || selectedUser.code || '').trim().toUpperCase();
          const targetUserId = sCode ? `scode_${sCode}` : realAuthUserId;
          const response = await fetch('/api/support-tickets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
            userId: targetUserId,""", """        } else {
          const sCode = (selectedUser.studentCode || selectedUser.code || '').trim().toUpperCase();
          const targetUserId = sCode ? `scode_${sCode}` : realAuthUserId;
          const rawId = sCode || realAuthUserId;
          const response = await fetch('/api/support-tickets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
            userId: rawId,""")

with open(filepath, 'w') as f:
    f.write(content)
print("Replaced targetUserId with rawId for support-tickets")
