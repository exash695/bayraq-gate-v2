const fs = require('fs');
let code = fs.readFileSync('src/components/FinanceSection.tsx', 'utf8');

// Insert useRef
code = code.replace(
  "const [cashConfirmationInput, setCashConfirmationInput] = useState('');",
  "const [cashConfirmationInput, setCashConfirmationInput] = useState('');\n  const planSaveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);"
);

// Replace savePlanTemplate
const oldSavePlanTemplate = `  const savePlanTemplate = async (plan: any[]) => {
    setInstallmentPlan(plan);
    safeStorage.setItem('academy6_installment_plan_v2', JSON.stringify(plan));
    
    // Also persist to school settings so Parent Portal can see the default plan
    if (selectedSchoolId) {
      try {
        await academicService.updateSchoolSettings(selectedSchoolId, {
          ...schoolSettings,
          installmentPlan: plan
        });
        showToast('تم حفظ خطة الأقساط وتعميمها كخطة افتراضية بنجاح', 'success');
      } catch (error) {
        console.error("Error saving installment plan to DB:", error);
        showToast('تم الحفظ محلياً فقط؛ فشل التحديث في السحابة', 'error');
      }
    }

    logActivity({
      action: 'تعديل مسودة الأقساط',
      details: \`تم تحديث مسودة الأقساط: \${plan.map(p => \`\${p.name}: \${p.amount.toLocaleString()} د.ع\`).join(', ')}\`,
      targetType: 'finance_config'
    });
  };`;

const newSavePlanTemplate = `  const savePlanTemplate = (plan: any[]) => {
    setInstallmentPlan(plan);
    safeStorage.setItem('academy6_installment_plan_v2', JSON.stringify(plan));
    
    // Also persist to school settings so Parent Portal can see the default plan
    if (selectedSchoolId) {
      if (planSaveTimeoutRef.current) {
        clearTimeout(planSaveTimeoutRef.current);
      }
      planSaveTimeoutRef.current = setTimeout(async () => {
        try {
          await academicService.updateSchoolSettings(selectedSchoolId, {
            ...schoolSettings,
            installmentPlan: plan
          });
          // Silently save to avoid annoying the user on every keystroke
        } catch (error) {
          console.error("Error saving installment plan to DB:", error);
        }
      }, 1500); // 1.5 seconds debounce
    }

    logActivity({
      action: 'تعديل مسودة الأقساط',
      details: \`تم تحديث مسودة الأقساط: \${plan.map(p => \`\${p.name}: \${p.amount.toLocaleString()} د.ع\`).join(', ')}\`,
      targetType: 'finance_config'
    });
  };`;

code = code.replace(oldSavePlanTemplate, newSavePlanTemplate);

fs.writeFileSync('src/components/FinanceSection.tsx', code);
console.log("Patched FinanceSection");
