# Hackerrank Contest Tracker

This project runs a Flask backend that serves your frontend app.

## Setup

1. **Clone the repository**

   Make sure your folder structure looks like this:

   ├── backend  
   │   ├── app.py  
   │   ├── routes  
   │   │   └── submissions_route.py  
   │   ├── files
   │   │    └
   │   ├── sub_status.py
   └── frontend  
       ├── index.html  
       └── script.js, style.css, etc.

2. **Open Backend Folder on CMD**
    cd backend

3. **Create and Activate Virtual Environment**  
   On Windows open a terminal in the `backend` folder and run:

   ```shell
   python -m venv .venv
   .venv\Scripts\activate

4. **Install Dependencies**
    In the same terminal, run the command:

    pip install -r requirements.txt

5. **Run the App**
    Start the Flask server from the `backend` folder and run:

    python app.py

    Then

    On Windows open another terminal in the `backend` folder and run:

    python sub_status.py

    Open your browser and navigate to http://127.0.0.1:5000/
    Your frontend will be served automatically.