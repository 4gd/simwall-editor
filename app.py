import json

from flask import Flask, render_template, jsonify, request, abort
from flask_sqlalchemy import SQLAlchemy


app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///test.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

class Layout(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False, index=True)
    width = db.Column(db.Integer, nullable=False)
    height = db.Column(db.Integer, nullable=False)
    layout = db.Column(db.Text, nullable=False)

    def to_dict(self):
        return {
            "name": self.name,
            "width": self.width,
            "height": self.height,
            "layout": json.loads(self.layout)
        }
    
    def from_dict(self, data):
        for field in ['name', 'width', 'height', 'layout']:
            if field in data:
                setattr(self, field, data[field])

    def __repr__(self):
        return f'<Layout {self.name}>'

@app.route('/')
def index():
    return render_template('index.html.j2')

@app.route('/api/layouts/names', methods=['GET'])
def get_layout_names():
    return jsonify([l.name for l in Layout.query.all()])

@app.route('/api/layouts/<string:name>', methods=['GET'])
def get_layout(name):
    layout = Layout.query.filter_by(name=name).first_or_404()
    return jsonify(layout.to_dict())

@app.route('/api/layouts', methods=['POST'])
def create_layout():
    data = request.get_json() or {}
    if 'name' not in data or 'width' not in data or 'height' not in data or 'layout' not in data:
        return jsonify('Incomplete data'), 400
    if data['name'] == 'names':
        return jsonify('Invalid name'), 400
    if Layout.query.filter_by(name=data['name']).first():
        return jsonify('Name already in use'), 400
    layout = Layout()
    layout.from_dict(data)
    db.session.add(layout)
    db.session.commit()
    return jsonify('New layout created'), 201

@app.route('/api/layouts/<string:name>', methods=['PUT'])
def update_layout(name):
    layout = Layout.query.filter_by(name=name).first_or_404()
    data = request.get_json() or {}
    layout.from_dict(data)
    db.session.commit()
    return jsonify("Layout updated")

@app.route('/api/layouts/<string:name>', methods=['DELETE'])
def delete_layout(name):
    layout = Layout.query.filter_by(name=name).first_or_404()
    db.session.delete(layout)
    db.session.commit()
    return jsonify("Layout deleted")
