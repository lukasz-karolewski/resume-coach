docker run -ti \
  -v miktex:/miktex/.miktex \
  -v `pwd`:/miktex/work \
  miktex/miktex \
  pdflatex $1

rm *.log
rm *.aux
rm *.out
