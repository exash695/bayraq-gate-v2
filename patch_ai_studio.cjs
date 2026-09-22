const fs = require('fs');
let content = fs.readFileSync('src/components/dev/AiContentStudioSection.tsx', 'utf8');

const replacementFunctions = `
  // Load questions from PostgreSQL
  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/curriculum-questions?category=all');
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setQuestions(data.map((d: any) => ({
              ...d,
              questionText: d.questionText || d.question || d.text || '',
              timeLimitSec: d.timeLimitSec || d.timeLimit || 60,
              correctOptionIndex: d.correctOptionIndex || 0,
              options: d.options || [],
            })));
            return;
          }
        }
      } catch (e) {
        console.warn('Failed to fetch from postgres:', e);
      } finally {
        setLoading(false);
      }
      setQuestions(DEFAULT_QUESTIONS);
    };
    fetchQuestions();
  }, []);

  const handleSaveQuestion = async (q: CurriculumQuestion) => {
    try {
      if (!editingQuestion) {
        q.id = \`q-\${Date.now()}\`;
      }
      
      const res = await fetch('/api/curriculum-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...q,
          schoolId: 'all',
          question: q.questionText
        })
      });

      if (!res.ok) throw new Error('Failed to save to backend');

      if (editingQuestion) {
        setQuestions(prev => prev.map(item => item.id === q.id ? q : item));
        showToast('تم تحديث السؤال بنجاح في بنك الأسئلة ✓');
      } else {
        setQuestions(prev => [q, ...prev]);
        showToast('تمت إضافة السؤال الجديد إلى بنك المناهج ⚡');
      }
      setIsModalOpen(false);
      setEditingQuestion(null);
    } catch (e: any) {
      console.error('Error saving question:', e);
      // Local state fallback
      if (editingQuestion) {
        setQuestions(prev => prev.map(item => item.id === q.id ? q : item));
      } else {
        setQuestions(prev => [{ ...q, id: \`q-\${Date.now()}\` }, ...prev]);
      }
      setIsModalOpen(false);
      showToast('تم الحفظ محلياً في الجلسة');
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا السؤال من بنك المناهج؟')) return;
    try {
      await fetch(\`/api/curriculum-questions/\${id}\`, { method: 'DELETE' });
    } catch (e) {}
    setQuestions(prev => prev.filter(q => q.id !== id));
    showToast('تم حذف السؤال من البنك');
  };
`;

content = content.replace(/\/\/ Load questions from PostgreSQL with fallback to defaults[\s\S]*?showToast\('تم حذف السؤال من البنك'\);\n  \};/g, replacementFunctions);

// Clean up imports
content = content.replace(/import { collection, getDocs, doc, setDoc, deleteDoc, addDoc, serverTimestamp, query, orderBy } from '@\/src\/lib\/firebase';\n/g, '');
content = content.replace(/import { db } from '\.\.\/\.\.\/lib\/firebase';\n/g, '');

fs.writeFileSync('src/components/dev/AiContentStudioSection.tsx', content);
