# Fajitas

[![Build Status](https://travis-ci.org/titouanc/fajitas.svg?branch=master)](https://travis-ci.org/titouanc/fajitas)

A WebGL escape-time fractals renderer with a math-to-shader compiler.
It currently supports:

* Modifiable iterations count (numpad `+` and `-`)
* Navigation using mouse clicks and wheel
* Shareable urls that include the fractal equation, and the current position and zoom level for reproductible views
* Changing colors on the fly
* Math expression for recursion compiled to shader. Supporting
    * Bound variables: `Zn` (current value) and `C` (initial value)
    * Add, Sub, Mul, Div, Exp for complex numbers
    * Operation precedence with parenthesis
    * Absolute values

**[Live demo](http://ititou.be/)**

![screenshot](screenshots/screenshot.png)
![screenshot2](screenshots/screenshot2.png)

## Build

    $ npm install
    $ make

## Run

Simply open `index.html` with your favorite *(recent)* web browser.

## Why ?

This is mostly a toy project intended to gain experience on WebGL and
compilation of pure functions to GPU programs. Also, fractals are **cool**, and
I want to be able to share nice parts of them.
