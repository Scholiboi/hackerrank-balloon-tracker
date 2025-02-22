from flask import Flask, request, jsonify, Blueprint
import pandas as pd
import json
import os
import openpyxl

ss_bp = Blueprint('ss_routes', import_name=__name__, url_prefix='/submissions')

@ss_bp.route('/receive-submissions', methods=['POST'])
def receive_submissions():
    submissions = request.json
    files_dir = "./files"
    submissions_file = os.path.join(files_dir, "submissions.csv")
    if not os.path.exists(files_dir):
        os.makedirs(files_dir)
    if not os.path.exists(submissions_file):
        pd.DataFrame(submissions).to_csv(submissions_file, index=False)
        return jsonify({"message": "Submissions received!"})
    try:
        old_submissions_df = pd.read_csv(submissions_file)
    except Exception as e:
        return jsonify({"message": "Error reading submissions file."}), 500

    # Use the 'id' field to determine new submissions
    existing_ids = set(old_submissions_df["id"].astype(str).tolist())
    new_submissions = [s for s in submissions if str(s.get("id")) not in existing_ids]

    if not new_submissions:
        return jsonify({"message": "No new submissions!"})
    else:
        new_df = pd.DataFrame(new_submissions)
        updated_df = pd.concat([new_df, old_submissions_df], ignore_index=True)
        updated_df.to_csv(submissions_file, index=False)
        return jsonify({"message": f"New submissions received: {len(new_submissions)}"})

@ss_bp.route('/check-balloons', methods=['GET'])
def check_balloons():
    try:
        files_dir = "./files"
        submissions_file = os.path.join(files_dir, "submissions.csv")
        participants_file = os.path.join(files_dir, "participants.csv")
        questions_file = os.path.join(files_dir, "questions.csv")
        # Ensure all required files exist; otherwise, return empty data.
        if not (os.path.exists(submissions_file) and os.path.exists(participants_file) and os.path.exists(questions_file)):
            raise FileNotFoundError("One or more required files are missing.")
        
        submissions_df = pd.read_csv(submissions_file)
        participants_df = pd.read_csv(participants_file)
        questions_df = pd.read_csv(questions_file)
        
        submissions_df = submissions_df[submissions_df['Balloon'] == 'No']
        merged_df = pd.merge(submissions_df, participants_df, on="hacker_username", how="inner")
        merged_df = pd.merge(merged_df, questions_df, on="challenge", how="inner")
        data = merged_df.to_dict(orient="records")
    except Exception as e:
        data = []
    return jsonify(data)
    

@ss_bp.route('/tick-submissions', methods=['POST'])
def tick_submissions():
    try:
        files_dir = "./files"
        submissions_file = os.path.join(files_dir, "submissions.csv")
        submissions_df = pd.read_csv(submissions_file)
        row = request.json
        submission_id = row.get("id")
        if submission_id in submissions_df["id"].values:
            submissions_df.loc[submissions_df["id"] == submission_id, "Balloon"] = "Yes"
            submissions_df.to_csv(submissions_file, index=False)
            return jsonify({"message": "Submission ticked!"})
        else:
            return jsonify({"message": "Submission not found!"})
    except Exception as e:
        return jsonify({"message": "Error processing the request"}), 500

@ss_bp.route('/upload-participants', methods=['POST'])
def upload_participants():
    if 'file' not in request.files:
        return jsonify({"error": "No file part in request"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    # Make sure backend/files exists:
    files_dir = os.path.join('files')
    if not os.path.exists(files_dir):
        os.makedirs(files_dir)

    temp_excel_path = os.path.join(files_dir ,'participants.xlsx')
    file.save(temp_excel_path)

    # Convert the Excel file to CSV
    df = pd.read_excel(temp_excel_path)
    csv_output_path = os.path.join(files_dir, 'participants.csv')
    df.to_csv(csv_output_path, index=False)
    
    return jsonify({"message": "Participants file uploaded and converted!"})

@ss_bp.route('/upload-questions', methods=['POST'])
def upload_questions():
    if 'file' not in request.files:
        return jsonify({"error": "No file part in request"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    # Temporary path to store the uploaded Excel file
    temp_excel_path = os.path.join("files", "questions.xlsx")
    file.save(temp_excel_path)

    # Convert the Excel file to CSV
    df = pd.read_excel(temp_excel_path)
    csv_output_path = os.path.join("files", "questions.csv")
    df.to_csv(csv_output_path, index=False)

    return jsonify({"message": "Questions file uploaded and converted!"})

