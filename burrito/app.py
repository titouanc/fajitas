import json
import random
from flask import Flask, request, abort
from flask.ext.cors import CORS
from models import add_fractal, get_all_fractals
from config import DEBUG

app = Flask("Burrito")
CORS(app)  # Allow Cross-Origin


@app.route(r'/')
def get_random():
    selection = random.choice(get_all_fractals())
    return json.dumps(selection)


@app.route(r'/all')
def get_all():
    return json.dumps(list(get_all_fractals()))


@app.route('/add', methods=['POST'])
def post_fractal():
    name = request.form.get('name', None)
    state = request.form.get('state', None)
    print(locals())
    if name and state:
        add_fractal(name, state)
        return "ok"
    abort(418)

if __name__ == "__main__":
    app.run(debug=DEBUG)
