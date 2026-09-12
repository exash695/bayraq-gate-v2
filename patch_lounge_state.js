const fs = require('fs');
let content = fs.readFileSync('src/components/StudentLounge.tsx', 'utf8');

// import staffService
if (!content.includes('import { staffService }')) {
    content = content.replace("import { realtimeManager } from '../lib/realtimeManager';", "import { realtimeManager } from '../lib/realtimeManager';\nimport { staffService } from '../services/staffService';");
}

content = content.replace("const [activeTab, setActiveTab] = useState<'chat' | 'knights'>(initialSelectedUser ? 'chat' : 'knights');", 
`const [teachersList, setTeachersList] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'chat' | 'knights' | 'teachers'>(initialSelectedUser ? 'chat' : 'knights');`);

fs.writeFileSync('src/components/StudentLounge.tsx', content);
