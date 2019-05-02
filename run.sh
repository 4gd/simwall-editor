#!/bin/bash

export FLASK_ENV=development
export FLASK_APP=app.py
source venv/bin/activate
flask run --host=0.0.0.0