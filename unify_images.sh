#!/bin/bash
mkdir -p public/school-logos public/schools

# Remove old files to avoid conflicts
rm -f public/school-logos/school*.jpg public/school-logos/school*.png
rm -f public/schools/school*.jpg public/schools/school*.png

# First batch: Logos (1000087060 to 1000087067)
mv 1000087060.jpg public/school-logos/school1.jpg
mv 1000087061.jpg public/school-logos/school2.jpg
mv 1000087062.jpg public/school-logos/school3.jpg
mv 1000087063.jpg public/school-logos/school4.jpg
mv 1000087064.jpg public/school-logos/school5.jpg
mv 1000087065.jpg public/school-logos/school6.jpg
mv 1000087066.jpg public/school-logos/school7.jpg
mv 1000087067.jpg public/school-logos/school8.jpg

# Second batch: Cards (1000097668 to 1000097678)
mv 1000097668.jpg public/schools/school1.jpg
mv 1000097670.jpg public/schools/school2.jpg
mv 1000097672.jpg public/schools/school3.jpg
mv 1000097673.jpg public/schools/school4.jpg
mv 1000097674.jpg public/schools/school5.jpg
mv 1000097676.jpg public/schools/school6.jpg
mv 1000097677.jpg public/schools/school7.jpg
mv 1000097678.jpg public/schools/school8.jpg

echo "Successfully unified and moved images."
