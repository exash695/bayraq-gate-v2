
import { INITIAL_PAGES } from './src/data';

const unit1Pages = INITIAL_PAGES.filter(p => p.unit.includes('Unit 1'));
let totalQuestions = 0;
unit1Pages.forEach(p => {
  if (p.questions) {
    totalQuestions += p.questions.length;
  }
});

console.log('Total questions in Unit 1:', totalQuestions);
