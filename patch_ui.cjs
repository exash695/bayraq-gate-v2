const fs = require('fs');
const file = 'src/components/StudentLounge.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldRender = `                                          <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>`;

const newRender = `                                          {msg.imageUrl && (
                                              <div className="mb-2">
                                                  {msg.imageUrl.match(/\\.(jpeg|jpg|gif|png|webp|svg)$/i) ? (
                                                      <img src={msg.imageUrl} alt="attachment" className="max-w-[200px] sm:max-w-xs rounded-xl border border-white/10" />
                                                  ) : msg.imageUrl.match(/\\.(mp4|webm|ogg)$/i) ? (
                                                      <video src={msg.imageUrl} controls className="max-w-[200px] sm:max-w-xs rounded-xl border border-white/10" />
                                                  ) : msg.imageUrl.match(/\\.(mp3|wav|ogg)$/i) ? (
                                                      <audio src={msg.imageUrl} controls className="max-w-[200px] sm:max-w-[250px]" />
                                                  ) : (
                                                      <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-black/20 p-2 rounded-lg hover:bg-black/30 transition-colors">
                                                          <FileText size={24} className={isMe ? 'text-white' : 'text-blue-400'} />
                                                          <span className="text-xs truncate max-w-[150px]">{msg.imageUrl.split('/').pop() || 'تحميل الملف'}</span>
                                                      </a>
                                                  )}
                                              </div>
                                          )}
                                          {msg.text && msg.text !== 'مرفق' && msg.text !== 'صورة' && msg.text !== 'فيديو' && msg.text !== 'مقطع صوتي' && msg.text !== 'ملف' && (
                                              <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
                                          )}`;

content = content.replace(oldRender, newRender);

const oldForm = `<textarea 
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            dir="auto"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            placeholder="اكتب رسالتك..."
                            className="w-full bg-transparent border-none outline-none text-white text-sm py-2.5 max-h-32 min-h-[40px] resize-none no-scrollbar font-sans"
                            rows={1}
                        />`;

const newForm = `<input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                        <button 
                            type="button" 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="w-10 h-10 rounded-full hover:bg-white/5 text-white/50 hover:text-white flex items-center justify-center transition-all shrink-0 mb-0.5"
                        >
                            {isUploading ? <Loader2 size={20} className="animate-spin" /> : <Paperclip size={20} />}
                        </button>
                        <textarea 
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            dir="auto"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            placeholder="اكتب رسالتك..."
                            className="w-full bg-transparent border-none outline-none text-white text-sm py-2.5 max-h-32 min-h-[40px] resize-none no-scrollbar font-sans"
                            rows={1}
                        />`;

content = content.replace(oldForm, newForm);

fs.writeFileSync(file, content);
console.log("Patched message rendering and form");
