import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getSubjectsForGrade } from '../utils/studentUtils';

export const useSubjectDistributor = () => {
  const [subjectMapping, setSubjectMapping] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'subject_mapping'), 
      (doc) => {
        if (doc.exists()) {
          setSubjectMapping(doc.data());
        }
        setLoading(false);
      },
      (error) => {
        console.error("Subject distributor listener error:", error);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const getSubjects = (grade: string) => {
    return getSubjectsForGrade(grade, [], subjectMapping);
  };

  const getAllSubjects = () => {
    if (!subjectMapping) {
      return ['الفيزياء', 'الرياضيات', 'اللغة الإنجليزية', 'الكيمياء', 'الأحياء', 'اللغة العربية', 'التربية الإسلامية', 'العلوم', 'الاجتماعيات', 'أخرى'];
    }
    const all = new Set<string>();
    Object.values(subjectMapping).forEach((stageSubjects: any) => {
      stageSubjects.forEach((s: any) => all.add(s.name.trim()));
    });
    all.add('أخرى');
    return Array.from(all);
  };

  return { subjectMapping, getSubjects, getAllSubjects, loading };
};
