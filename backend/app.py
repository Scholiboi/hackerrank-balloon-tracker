from flask import Flask, send_from_directory
from flask_cors import CORS
from routes.submissions_route import ss_bp
import os

app = Flask(__name__, static_folder="../frontend", static_url_path="/")
CORS(app)

app.register_blueprint(ss_bp)

@app.route("/")
def serve_index():
    return send_from_directory(app.static_folder, "index.html")

if __name__ == '__main__':
    app.run(debug=True)