#!/bin/bash
rm -f public/schools/*.jpg
rm -f public/school-logos/*.jpg
rm -f public/schools/*.png
rm -f public/school-logos/*.png

# 8 valid numeric files (Bairaq cards)
cp 163244981_1784288497816191.jpg public/schools/school1.jpg
cp 312248662_1784288028624574-1.jpg public/schools/school2.jpg
cp 480730648_1784289672334877.jpg public/schools/school3.jpg
cp 577379273_1784289294820480.jpg public/schools/school4.jpg
cp 62360893_1784288426067707-1.jpg public/schools/school5.jpg
cp 877909421_1784287776533870.jpg public/schools/school6.jpg
cp 897431372_1784288709252889.jpg public/schools/school7.jpg
cp 965090112_1784288251183193.jpg public/schools/school8.jpg

# 8 valid FB files (Logos)
cp FB_IMG_1777986395824.jpg public/school-logos/school1.jpg
cp FB_IMG_1777986423927.jpg public/school-logos/school2.jpg
cp FB_IMG_1777986517770.jpg public/school-logos/school3.jpg
cp FB_IMG_1777986597438.jpg public/school-logos/school4.jpg
cp FB_IMG_1777986628675.jpg public/school-logos/school5.jpg
cp FB_IMG_1777986673277.jpg public/school-logos/school6.jpg
cp FB_IMG_1777986718999.jpg public/school-logos/school7.jpg
cp FB_IMG_1777986794048.jpg public/school-logos/school8.jpg

echo "Done copying images"
