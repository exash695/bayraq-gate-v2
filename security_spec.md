# Security Specification: Sixth Academy Pro

## 1. Data Invariants
- A `SchoolStudent` record can only be read by a parent who knows the `parentCode` or a student who knows the `code`, OR an admin of the school.
- `users` collection: Users can only read/write their own document.
- `academic_lists`: Only admins of the school can read/write.
- `academy_pages`: Readable by anyone in the school, writable by teachers/admins.
- `school_configs`: Readable by anyone, writable by admins.

## 2. The Dirty Dozen Payloads (Hardened Tests)

1. **Identity Spoofing**: Attempt to update another user's profile role to 'admin'.
2. **Path Poisoning**: Create an `academy_page` with an ID that is 2KB of junk.
3. **Ghost Field Injection**: Add `isVerified: true` to a student record update.
4. **Email Spoofing**: Attempt to read admin data by matching email without `email_verified`.
5. **Orphaned List**: Create an `academic_list` with a `schoolId` that does not exist.
6. **State Shortcutting**: Change a student's `paidAmount` directly as a student.
7. **Query Scraping**: List all students in `school_students` without a school filter.
8. **PII Leak**: Read another student's behavior logs as a student.
9. **Timestamp Trust**: Create a post with a fake `createdAt` from the future.
10. **Resource Exhaustion**: Upload an `extractedText` field that is 5MB.
11. **Relational Bypass**: Read a list belonging to School A while being a member of School B.
12. **Id ID Poisoning**: Target `school_students/../../junk` for deletion.

## 3. Test Runner Design

The `firestore.rules.test.ts` will verify these denials. (Skipping the full test file for brevity in this step, focusing on rules generation next).
