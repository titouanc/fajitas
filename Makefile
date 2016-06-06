all: app.js.ok index.html.ok

index.html: index.haml
	haml $< > $@

app.js: src/*
	npm run build

%.ok: %
	scp $< ititou.be:www/
	touch $@
