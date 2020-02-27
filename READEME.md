# Simwall debug editor

## Installation

```
python3 -m venv venv
. venv/bin/activate
pip install -r requirements.txt
cp .env.default .env
nano .env
flask shell
from app import db
db.create_all()
db.session.commit()
```