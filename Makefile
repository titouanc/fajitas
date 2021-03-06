TARGET = app.js index.html

all: $(TARGET)

publish: $(TARGET)
	npm run build-prod
	mkdir -p build
	mv $^ build/
	git stash
	git checkout gh-pages
	mv build/* ./
	git commit -am '[bot] Automatic update'
	git push
	git checkout master
	git stash pop	

clean:
	rm -f $(TARGET)

%.html: %.haml
	haml $< > $@

app.js: src/*
	npm run build

.PHONY: all publish
