const fs = require('fs');
const file = 'src/components/StudentLounge.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add icons
content = content.replace(
  "import { X, Send, Image as ImageIcon, Smile, MoreVertical, Coffee, Search, Check, CheckCheck, User, MessageCircle, ArrowRight, Lock } from 'lucide-react';",
  "import { X, Send, Image as ImageIcon, Smile, MoreVertical, Coffee, Search, Check, CheckCheck, User, MessageCircle, ArrowRight, Lock, Paperclip, FileText, Video, Headphones, Loader2 } from 'lucide-react';"
);

// 2. Add file upload states
content = content.replace(
  "const [newMessage, setNewMessage] = useState('');",
  `const [newMessage, setNewMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);`
);

// 3. Fix the gradeMatch logic in Knights tab
content = content.replace(
  `                const gradeMatch = (k: any) => {
                   if (isTeacher || !grade) return true;
                   const kg = k.grade || 'غير محدد';
                   if (kg === 'غير محدد' || kg === 'all') return true;
                   return kg === currentGrade || kg.includes(currentGrade) || currentGrade.includes(kg);
                };`,
  `                const getBaseGrade = (g: string) => g ? g.split('-')[0].split('/')[0].trim() : '';
                const gradeMatch = (k: any) => {
                   if (isTeacher || !grade) return true;
                   const kg = k.grade || 'غير محدد';
                   if (kg === 'غير محدد' || kg === 'all') return true;
                   const currentBase = getBaseGrade(currentGrade);
                   const userBase = getBaseGrade(kg);
                   return currentBase === userBase || kg.includes(currentBase) || currentBase.includes(kg);
                };`
);

// 4. Fix the teachers filtering logic in Teachers tab
content = content.replace(
  `const filteredTeachers = teachersList.filter(t => t.name?.includes(searchQuery) && t.role === 'TEACHER');`,
  `const getBaseGrade = (g: string) => g ? g.split('-')[0].split('/')[0].trim() : '';
                const teacherMatch = (t: any) => {
                   if (isTeacher || !grade || grade === 'غير محدد') return true;
                   const tClasses = Array.isArray(t.classes) ? t.classes : [];
                   const tGrade = t.grade || '';
                   if (tClasses.includes(grade)) return true;
                   if (tGrade === grade) return true;
                   const currentBase = getBaseGrade(grade);
                   return tClasses.some((c: string) => c === currentBase || grade.includes(c)) || tGrade === currentBase || grade.includes(tGrade);
                };
                const filteredTeachers = teachersList.filter(t => t.name?.includes(searchQuery) && t.role === 'TEACHER' && teacherMatch(t));`
);

fs.writeFileSync(file, content);
console.log("Patched grade logic and state");
