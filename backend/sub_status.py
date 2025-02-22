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
            "id": submission['id'],
            "hacker_id": submission['hacker_id'],
            "hacker_username": submission['hacker_username'],
            "status": submission['status'],
            "created_at": submission['created_at'],
            "time_from_start": submission['time_from_start'],
            "language": submission['language'],
            "challenge": submission['challenge']['name'],
            "Balloon": 'No'
        }
        filtered_submissions.append(filtered_submission)


    requests.post("http://127.0.0.1:5000/submissions/receive-submissions", json=filtered_submissions)
    time.sleep(10)