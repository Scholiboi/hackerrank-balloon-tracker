import requests
import json
import pandas as pd
import time

contest_name = ""

cookies = {
    
}

headers = {

}

params = {
    "limit": 300,
    "offset": 0,
}

url = f"https://www.hackerrank.com/rest/contests/{contest_name}/judge_submissions"

while(True):
    response = requests.get(url, headers=headers, cookies=cookies, params=params)
    a = response.json()

    submissions = a['models']
    filtered_submissions = []
    for submission in submissions:
        if submission['status'] != "Accepted":
            continue
        filtered_submission = {
            "id": str(submission['id']),
            "hacker_id": str(submission['hacker_id']),
            "hacker_username": str(submission['hacker_username']),
            "status": str(submission['status']),
            "created_at": str(submission['created_at']),
            "time_from_start": str(submission['time_from_start']),
            "language": str(submission['language']),
            "challenge": str(submission['challenge']['name']),
            "Balloon": 'No'
        }
        filtered_submissions.append(filtered_submission)


    requests.post("http://127.0.0.1:5000/submissions/receive-submissions", json=filtered_submissions)
    time.sleep(10)