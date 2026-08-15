import re

with open('src/components/Transport/MetroTransitViewer.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add Phone to lucide-react imports
if 'Phone' not in content:
    content = content.replace("from 'lucide-react';", ", Phone } from 'lucide-react';")

# 2. Add Phone button next to the route name
route_name_html = '<h3 className="font-bold text-sm md:text-base text-gray-200" style={{ color: busColor }}>{bus.routeName || bus.name}</h3>'
phone_html = '''<h3 className="font-bold text-sm md:text-base text-gray-200" style={{ color: busColor }}>{bus.routeName || bus.name}</h3>
          {bus.phone && bus.phone !== 'غير محدد' && (
            <a href={`tel:${bus.phone}`} className="mr-2 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors" title="اتصال بالسائق">
              <Phone className="w-4 h-4" />
            </a>
          )}'''
content = content.replace(route_name_html, phone_html)

# 3. Change Chevron trail to be behind the bus and point opposite (using ChevronRight)
chevron_html_old = '''<div className="absolute -left-5 top-1/2 -translate-y-1/2 flex items-center">
                  <ChevronLeft className="w-4 h-4 opacity-70 animate-pulse" style={{ color: busColor, animationDelay: '0ms' }} />
                  <ChevronLeft className="w-4 h-4 -mr-2 opacity-40 animate-pulse" style={{ color: busColor, animationDelay: '150ms' }} />
                </div>'''
chevron_html_new = '''<div className="absolute -right-6 top-1/2 -translate-y-1/2 flex items-center">
                  <ChevronRight className="w-4 h-4 opacity-40 animate-pulse" style={{ color: busColor, animationDelay: '150ms' }} />
                  <ChevronRight className="w-4 h-4 -ml-2 opacity-70 animate-pulse" style={{ color: busColor, animationDelay: '0ms' }} />
                </div>'''
content = content.replace(chevron_html_old, chevron_html_new)
content = content.replace('import { Bus, Clock, Home, MapPin, ChevronLeft, School, ArrowLeft, Phone }', 'import { Bus, Clock, Home, MapPin, ChevronLeft, ChevronRight, School, ArrowLeft, Phone }')

# 4. Make the completed track brighter and remaining track darker
# The active track currently has `boxShadow: `0 0 12px ${busColor}99``
# We can make it 20px
content = content.replace('boxShadow: `0 0 12px ${busColor}99`', 'boxShadow: `0 0 20px ${busColor}`')

# The remaining track is `#1a1f35`
content = content.replace('bg-[#1a1f35]', 'bg-[#0a0f1a] border border-white/5')

with open('src/components/Transport/MetroTransitViewer.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

with open('src/components/Transport/FleetPanel.tsx', 'r', encoding='utf-8') as f:
    content_fleet = f.read()

# Z-index to cover AdminDashboard back button
content_fleet = content_fleet.replace('className="fixed inset-0 z-50 bg-[#040612]', 'className="fixed inset-0 z-[999] bg-[#040612]')

with open('src/components/Transport/FleetPanel.tsx', 'w', encoding='utf-8') as f:
    f.write(content_fleet)

