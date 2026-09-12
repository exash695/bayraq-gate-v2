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

// 3. Add getBaseGrade and gradeMatch logic inside the component
// The gradeMatch is currently defined inside the render block! Let's check where it is.
