import fs from 'fs';

let code = fs.readFileSync('src/App.tsx', 'utf8');

const onVerifyStart = `              onVerify={async (code, isParent) => {
                setIsVerifying(true);`;

const newOnVerify = `              onVerify={async (code, isParent) => {
                setIsVerifying(true);
                try {
                  const user = await customAuth.loginWithCode(code);
                  setIsSchoolVerified(true);
                  if (user.role === 'admin' || user.role === 'teacher') {
                    setPortalType(user.schoolId && user.schoolId.includes('boys') ? 'admin-boys' : 'admin-girls');
                    setVerifiedStudentInfo({ id: user.uid, code: code, name: user.displayName || '', role: user.role });
                  } else if (user.role === 'parent') {
                    setPortalType('parent');
                    setVerifiedStudentInfo({ id: user.uid, parentCode: code, name: user.displayName || '', role: 'parent' });
                  } else if (user.role === 'driver') {
                    setPortalType('driver');
                    setVerifiedStudentInfo({ id: user.uid, code: code, name: user.displayName || '', role: 'driver' });
                  } else {
                    // Student
                    setPortalType(user.schoolId && user.schoolId.includes('boys') ? 'student-boys' : 'student-girls');
                    setVerifiedStudentInfo({ id: user.uid, code: code, name: user.displayName || '', role: 'student', grade: '' });
                  }
                } catch (e: any) {
                  addNotification('خطأ في التحقق', e.message || 'كود الدخول غير صحيح', 'alarm');
                } finally {
                  setIsVerifying(false);
                }
              }}
            />
`;

// use regex to replace the old onVerify block until `            />`
code = code.replace(/onVerify=\{async \(code, isParent\) => \{[\s\S]*?            \/>/, newOnVerify);

fs.writeFileSync('src/App.tsx', code);
console.log('Patched App.tsx onVerify');
