function getBaseGrade(g) {
    if (!g) return '';
    return g.split('-')[0].split('/')[0].trim();
}
console.log(getBaseGrade("الاول متوسط - أ"));
console.log(getBaseGrade("الثاني متوسط / ج"));
console.log(getBaseGrade("الثالث متوسط"));
