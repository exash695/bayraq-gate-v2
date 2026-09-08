const fs = require('fs');
let code = fs.readFileSync('src/components/AccessLogsSection.tsx', 'utf8');

// 1. Add installmentPlan to Props
code = code.replace(
  '  showToast: (message: string, type?: \'success\' | \'error\' | \'info\') => void;\n}',
  '  showToast: (message: string, type?: \'success\' | \'error\' | \'info\') => void;\n  installmentPlan?: any[];\n}'
);

// 2. Add to destructuring
code = code.replace(
  'export const AccessLogsSection: React.FC<AccessLogsSectionProps> = ({ gradesByStage, students, showToast }) => {',
  'export const AccessLogsSection: React.FC<AccessLogsSectionProps> = ({ gradesByStage, students, showToast, installmentPlan }) => {'
);

// 3. Replace uniqueInstallmentNotes logic
const targetNotes = `  // Find all unique installment notes globally for the filters
  const uniqueInstallmentNotes = useMemo(() => {
    const notesSet = new Set<string>();
    allStampedTransactions.forEach(t => {
      if (t.note) {
        notesSet.add(t.note);
      }
    });
    return Array.from(notesSet).filter(Boolean);
  }, [allStampedTransactions]);`;

const replacementNotes = `  // Use provided installment plan for filters, fallback to unique notes if none
  const filterInstallmentNotes = useMemo(() => {
    if (installmentPlan && installmentPlan.length > 0) {
      return installmentPlan.map(p => p.name || 'قسط').filter(Boolean);
    }
    // Fallback
    const notesSet = new Set<string>();
    allStampedTransactions.forEach(t => {
      if (t.note) {
        notesSet.add(t.note);
      }
    });
    return Array.from(notesSet).filter(Boolean);
  }, [allStampedTransactions, installmentPlan]);`;

code = code.replace(targetNotes, replacementNotes);

// 4. Update the filter logic
const targetFilterLogic = `      // 4. Installment Note Filter
      if (selectedNoteFilter !== 'all') {
        if (log.note !== selectedNoteFilter) {
          return false;
        }
      }`;

const replacementFilterLogic = `      // 4. Installment Note Filter
      if (selectedNoteFilter !== 'all') {
        if (!log.note || !log.note.includes(selectedNoteFilter)) {
          return false;
        }
      }`;

code = code.replace(targetFilterLogic, replacementFilterLogic);

// 5. Update the JSX rendering the options
const targetJSX = `{uniqueInstallmentNotes.map(note => (`;
const replacementJSX = `{filterInstallmentNotes.map(note => (`;

code = code.replace(targetJSX, replacementJSX);

fs.writeFileSync('src/components/AccessLogsSection.tsx', code);
console.log("Patched AccessLogsSection");
