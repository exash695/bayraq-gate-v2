const fs = require('fs');
const file = 'src/components/SchoolPlatform/StudentExcellenceTab.tsx';
let content = fs.readFileSync(file, 'utf8');

const replacement = `              {excellenceSubTab === "grades" && !isTeacher && (
                <motion.div
                  key="my_grades_dashboard"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-8"
                >
                  <div className="bg-gradient-to-br from-black/80 to-[#0B1021] border border-white/5 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[100px] rounded-full pointer-events-none" />
                    <div className="relative z-10 space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-white text-xl sm:text-2xl font-black mb-2 flex items-center gap-2">
                            <BarChart3 className="text-amber-400" />
                            سجل التقييم الأكاديمي
                          </h2>
                          <p className="text-white/40 text-xs sm:text-sm max-w-lg">
                            يتيح لك هذا السجل متابعة تقييمك الذاتي في جميع الاختبارات والامتحانات بصورة مباشرة ودقيقة كما يتم رصدها مركزياً.
                          </p>
                        </div>
                      </div>

                      {/* Period Selector */}
                      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 pt-4">
                        {examPeriods.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => setSelectedGradePeriod(p.id)}
                            className={\`px-5 py-2.5 rounded-xl text-[10px] font-black whitespace-nowrap transition-all \${
                              selectedGradePeriod === p.id 
                                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-lg shadow-amber-500/20' 
                                : 'bg-white/5 text-white/30 border border-white/5 hover:bg-white/10 hover:text-white'
                            }\`}
                          >
                            {p.name}
                          </button>
                        ))}
                      </div>

                      {/* Grades Table */}
                      <div className="space-y-3">
                        {(() => {
                          const subjects = getSubjectsForGrade(activeStudent?.grade || '', [], subjectMapping);
                          const grades = activeStudent?.grades?.[selectedGradePeriod] || {};
                          
                          if (Object.keys(grades).length === 0) {
                            return (
                              <div className="text-center py-16 px-6 border-2 border-dashed border-white/5 rounded-[2.5rem] space-y-4">
                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto">
                                  <BarChart3 size={32} className="text-white/10" />
                                </div>
                                <div className="space-y-1">
                                  <p className="text-white font-bold text-sm">لا يوجد نتائج مرصودة</p>
                                  <p className="text-white/20 text-[10px]">لم يتم رفع درجات {examPeriods.find(p => p.id === selectedGradePeriod)?.name} حتى الآن</p>
                                </div>
                              </div>
                            );
                          }

                          return subjects.map((sub, idx) => {
                            const grade = Number(grades[sub.id]) || 0;
                            const isExcellent = grade >= 90;
                            const isGood = grade >= 70 && grade < 90;
                            const isFailed = grade < 50;
                            return (
                              <motion.div
                                key={\`\${sub.id}_\${idx}_grade\`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-[#101935] p-5 rounded-2xl flex items-center justify-between border border-white/5 group hover:border-amber-500/30 transition-all"
                              >
                                <div className="flex items-center gap-3">
                                  <div className={\`w-2 h-2 rounded-full \${isFailed ? 'bg-rose-500' : isExcellent ? 'bg-emerald-500' : 'bg-blue-500'}\`} />
                                  <span className="text-white font-medium group-hover:text-amber-400 transition-colors">{sub.name}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                  <span className={\`text-xl font-black \${isFailed ? 'text-rose-500' : isExcellent ? 'text-emerald-400' : 'text-blue-400'}\`}>
                                    {grade}
                                  </span>
                                  {isExcellent && <Star size={16} className="text-[#FFD600] fill-[#FFD600] animate-pulse" />}
                                </div>
                              </motion.div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>`;

content = content.replace(/              \{\/\* Global comments modal handles comments instead of inline \*\/\}\n                            <\/motion.div>\n                          \)\)\}\n                      <\/div>\n                    \)\}\n                  <\/div>\n                <\/motion.div>\n              \)\}\n            <\/AnimatePresence>/, 
`              {/* Global comments modal handles comments instead of inline */}
                            </motion.div>
                          ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
${replacement}`);

fs.writeFileSync(file, content);
console.log("Patched!");
