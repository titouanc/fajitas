TARGET = app.js index.html

all: $(TARGET)
publish: $(addsuffix .ok,$(TARGET))

index.html: index.haml
	haml $< > $@

app.js: src/*
	npm run build

%.ok: %
	scp $< ititou.be:www/
	touch $@
